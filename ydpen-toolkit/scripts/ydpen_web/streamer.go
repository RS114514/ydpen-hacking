package main

import (
	"bytes"
	"fmt"
	"io"
	"os"
	"os/exec"
	"sync"
	"time"
)

type ScreenStreamer struct {
	mu          sync.Mutex
	subMu       sync.RWMutex
	running     bool
	ffmpegCmd   *exec.Cmd
	latestFrame []byte
	frameCount  int64
	fps         float64
	fpsCount    int
	lastFpsCalc time.Time
	subscribers map[chan []byte]struct{}
	stopTimer   *time.Timer

	fpsSetting int
	qSetting   int
}

func NewScreenStreamer(fps, quality int) *ScreenStreamer {
	if fps <= 0 {
		fps = 15
	}
	if quality <= 0 {
		quality = 5
	}
	return &ScreenStreamer{
		subscribers: make(map[chan []byte]struct{}),
		fpsSetting:  fps,
		qSetting:    quality,
		lastFpsCalc: time.Now(),
	}
}

func (s *ScreenStreamer) Subscribe() (chan []byte, func()) {
	ch := make(chan []byte, 3)

	s.subMu.Lock()
	s.subscribers[ch] = struct{}{}
	count := len(s.subscribers)
	s.subMu.Unlock()

	s.mu.Lock()
	if s.stopTimer != nil {
		s.stopTimer.Stop()
		s.stopTimer = nil
	}
	if !s.running && count > 0 {
		s.startProcessLocked()
	}
	s.mu.Unlock()

	unsubscribe := func() {
		s.subMu.Lock()
		delete(s.subscribers, ch)
		close(ch)
		remaining := len(s.subscribers)
		s.subMu.Unlock()

		s.mu.Lock()
		defer s.mu.Unlock()
		if remaining == 0 && s.running {
			if s.stopTimer != nil {
				s.stopTimer.Stop()
			}
			s.stopTimer = time.AfterFunc(5*time.Second, func() {
				s.mu.Lock()
				defer s.mu.Unlock()
				s.subMu.RLock()
				curRem := len(s.subscribers)
				s.subMu.RUnlock()
				if curRem == 0 && s.running {
					s.stopProcessLocked()
				}
			})
		}
	}

	return ch, unsubscribe
}

func (s *ScreenStreamer) startProcessLocked() {
	if s.running {
		return
	}
	s.running = true
	go s.workerLoop()
}

func (s *ScreenStreamer) stopProcessLocked() {
	if !s.running {
		return
	}
	s.running = false
	if s.ffmpegCmd != nil && s.ffmpegCmd.Process != nil {
		_ = s.ffmpegCmd.Process.Kill()
	}
}

func (s *ScreenStreamer) workerLoop() {
	for {
		s.mu.Lock()
		if !s.running {
			s.mu.Unlock()
			break
		}
		s.mu.Unlock()

		// 确保清理旧的 ffmpeg 进程
		_ = exec.Command("pkill", "-9", "-f", "ffmpeg").Run()
		time.Sleep(200 * time.Millisecond)

		args := []string{
			"-nostdin",
			"-framerate", fmt.Sprintf("%d", s.fpsSetting),
			"-device", "/dev/dri/card0",
			"-f", "kmsgrab",
			"-i", "-",
			"-vf", "hwdownload,format=bgr0,crop=266:960:107:0,transpose=1",
			"-r", fmt.Sprintf("%d", s.fpsSetting),
			"-q:v", fmt.Sprintf("%d", s.qSetting),
			"-f", "mjpeg",
			"pipe:1",
		}

		cmd := exec.Command("ffmpeg", args...)
		cmd.Stderr = os.Stderr // 打印 ffmpeg 错误便于调试
		stdout, err := cmd.StdoutPipe()
		if err != nil {
			fmt.Printf("[Streamer] ffmpeg StdoutPipe 错误: %v\n", err)
			time.Sleep(1 * time.Second)
			continue
		}

		if err := cmd.Start(); err != nil {
			fmt.Printf("[Streamer] 启动 ffmpeg 失败: %v\n", err)
			time.Sleep(1 * time.Second)
			continue
		}

		s.mu.Lock()
		s.ffmpegCmd = cmd
		s.mu.Unlock()

		fmt.Printf("[Streamer] KMS 硬件抓屏已启动 (FPS=%d, Q=%d)\n", s.fpsSetting, s.qSetting)
		s.readMjpegStream(stdout)

		_ = cmd.Wait()
		s.mu.Lock()
		s.ffmpegCmd = nil
		s.mu.Unlock()

		s.mu.Lock()
		stillRunning := s.running
		s.mu.Unlock()
		if !stillRunning {
			break
		}
		time.Sleep(500 * time.Millisecond)
	}
	fmt.Printf("[Streamer] 抓屏进程已安全停止 (待机节能模式)\n")
}

func (s *ScreenStreamer) readMjpegStream(r io.Reader) {
	buf := make([]byte, 0, 1024*1024)
	chunk := make([]byte, 32768)

	soi := []byte{0xff, 0xd8}
	eoi := []byte{0xff, 0xd9}

	for {
		s.mu.Lock()
		active := s.running
		s.mu.Unlock()
		if !active {
			break
		}

		n, err := r.Read(chunk)
		if n > 0 {
			buf = append(buf, chunk[:n]...)

			for {
				startIdx := bytes.Index(buf, soi)
				if startIdx == -1 {
					buf = buf[:0]
					break
				}
				endIdx := bytes.Index(buf[startIdx:], eoi)
				if endIdx == -1 {
					if startIdx > 0 {
						buf = append([]byte(nil), buf[startIdx:]...)
					}
					break
				}

				realEnd := startIdx + endIdx + 2
				frame := make([]byte, realEnd-startIdx)
				copy(frame, buf[startIdx:realEnd])
				buf = buf[realEnd:]

				s.onNewFrame(frame)
			}
		}

		if err != nil {
			break
		}
	}
}

func (s *ScreenStreamer) onNewFrame(frame []byte) {
	s.mu.Lock()
	s.latestFrame = frame
	s.frameCount++
	s.fpsCount++
	now := time.Now()
	dur := now.Sub(s.lastFpsCalc)
	if dur >= time.Second {
		s.fps = float64(s.fpsCount) / dur.Seconds()
		s.fpsCount = 0
		s.lastFpsCalc = now
	}
	s.mu.Unlock()

	s.subMu.RLock()
	for ch := range s.subscribers {
		select {
		case ch <- frame:
		default:
		}
	}
	s.subMu.RUnlock()
}

func (s *ScreenStreamer) GetLatestFrame() []byte {
	s.mu.Lock()
	frame := s.latestFrame
	isRunning := s.running
	s.mu.Unlock()

	if len(frame) > 0 {
		return frame
	}

	// 如果当前没有运行，订阅一个瞬间捕获
	if !isRunning {
		ch, unsub := s.Subscribe()
		defer unsub()
		select {
		case f := <-ch:
			return f
		case <-time.After(2 * time.Second):
			return nil
		}
	}
	return nil
}

func (s *ScreenStreamer) GetFPS() float64 {
	s.mu.Lock()
	defer s.mu.Unlock()
	return s.fps
}

func (s *ScreenStreamer) IsRunning() bool {
	s.mu.Lock()
	defer s.mu.Unlock()
	return s.running
}

func (s *ScreenStreamer) Stop() {
	s.mu.Lock()
	defer s.mu.Unlock()
	s.stopProcessLocked()
}
