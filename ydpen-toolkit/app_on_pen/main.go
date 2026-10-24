package main

import (
	"bytes"
	_ "embed"
	"encoding/binary"
	"encoding/json"
	"flag"
	"fmt"
	"io"
	"log"
	"net/http"
	"os"
	"os/exec"
	"os/signal"
	"strings"
	"sync"
	"syscall"
	"time"
)

//go:embed web/index.html
var indexHTML []byte

const (
	EV_SYN = 0x00
	EV_KEY = 0x01
	EV_ABS = 0x03

	SYN_REPORT = 0

	ABS_MT_SLOT        = 0x2f
	ABS_MT_TOUCH_MAJOR = 0x30
	ABS_MT_POSITION_X  = 0x35
	ABS_MT_POSITION_Y  = 0x36
	ABS_MT_TRACKING_ID = 0x39

	BTN_TOUCH = 0x14a
	KEY_POWER = 116
)

// inputEvent 对应 Linux 64位系统 (aarch64) 的 struct input_event (24 字节)
type inputEvent struct {
	Sec   int64  // 8 bytes tv_sec
	Usec  int64  // 8 bytes tv_usec
	Type  uint16 // 2 bytes
	Code  uint16 // 2 bytes
	Value int32  // 4 bytes
}

func (e inputEvent) Bytes() []byte {
	buf := new(bytes.Buffer)
	binary.Write(buf, binary.LittleEndian, e.Sec)
	binary.Write(buf, binary.LittleEndian, e.Usec)
	binary.Write(buf, binary.LittleEndian, e.Type)
	binary.Write(buf, binary.LittleEndian, e.Code)
	binary.Write(buf, binary.LittleEndian, e.Value)
	return buf.Bytes()
}

// InputController 负责 Linux evdev 事件写入
type InputController struct {
	touchDevPath string
	powerDevPath string
	touchFd      *os.File
	powerFd      *os.File
	mu           sync.Mutex
	trackingID   int32
	isDown       bool
}

func NewInputController(touchPath, powerPath string) *InputController {
	c := &InputController{
		touchDevPath: touchPath,
		powerDevPath: powerPath,
		trackingID:   100,
	}
	c.initDevices()
	return c
}

func (c *InputController) initDevices() {
	if f, err := os.OpenFile(c.touchDevPath, os.O_WRONLY, 0); err == nil {
		c.touchFd = f
	} else {
		log.Printf("[Touch] 警告: 无法打开触控设备 %s: %v", c.touchDevPath, err)
	}

	if f, err := os.OpenFile(c.powerDevPath, os.O_WRONLY, 0); err == nil {
		c.powerFd = f
	} else {
		log.Printf("[Power] 警告: 无法打开按键设备 %s: %v", c.powerDevPath, err)
	}
}

func (c *InputController) writeEvent(f *os.File, evType, evCode uint16, evValue int32) {
	if f == nil {
		return
	}
	now := time.Now()
	ev := inputEvent{
		Sec:   now.Unix(),
		Usec:  int64(now.Nanosecond() / 1000),
		Type:  evType,
		Code:  evCode,
		Value: evValue,
	}
	f.Write(ev.Bytes())
}

func (c *InputController) syn(f *os.File) {
	c.writeEvent(f, EV_SYN, SYN_REPORT, 0)
}

func clamp(val, min, max int) int {
	if val < min {
		return min
	}
	if val > max {
		return max
	}
	return val
}

// toPhys 将 960x266 宽屏逻辑坐标转为词典笔 480x960 真实物理坐标
func toPhys(lx, ly int) (int, int) {
	px := ly + 107
	py := 959 - lx
	return clamp(px, 0, 480), clamp(py, 0, 959)
}

func (c *InputController) Down(lx, ly int) {
	c.mu.Lock()
	defer c.mu.Unlock()

	px, py := toPhys(lx, ly)
	c.trackingID++
	if c.trackingID > 60000 {
		c.trackingID = 100
	}

	c.writeEvent(c.touchFd, EV_ABS, ABS_MT_SLOT, 0)
	c.writeEvent(c.touchFd, EV_ABS, ABS_MT_TRACKING_ID, c.trackingID)
	c.writeEvent(c.touchFd, EV_ABS, ABS_MT_POSITION_X, int32(px))
	c.writeEvent(c.touchFd, EV_ABS, ABS_MT_POSITION_Y, int32(py))
	c.writeEvent(c.touchFd, EV_ABS, ABS_MT_TOUCH_MAJOR, 8)
	c.writeEvent(c.touchFd, EV_KEY, BTN_TOUCH, 1)
	c.syn(c.touchFd)
	c.isDown = true
}

func (c *InputController) Move(lx, ly int) {
	c.mu.Lock()
	defer c.mu.Unlock()

	if !c.isDown {
		return
	}
	px, py := toPhys(lx, ly)
	c.writeEvent(c.touchFd, EV_ABS, ABS_MT_POSITION_X, int32(px))
	c.writeEvent(c.touchFd, EV_ABS, ABS_MT_POSITION_Y, int32(py))
	c.syn(c.touchFd)
}

func (c *InputController) Up() {
	c.mu.Lock()
	defer c.mu.Unlock()

	if !c.isDown {
		return
	}
	c.writeEvent(c.touchFd, EV_ABS, ABS_MT_TRACKING_ID, -1)
	c.writeEvent(c.touchFd, EV_KEY, BTN_TOUCH, 0)
	c.syn(c.touchFd)
	c.isDown = false
}

func (c *InputController) Tap(lx, ly int, durMs int) {
	if durMs <= 0 {
		durMs = 60
	}
	c.Down(lx, ly)
	time.Sleep(time.Duration(durMs) * time.Millisecond)
	c.Up()
}

func (c *InputController) Swipe(lx1, ly1, lx2, ly2 int, durMs int) {
	if durMs < 20 {
		durMs = 20
	}
	steps := durMs / 10
	if steps < 4 {
		steps = 4
	}
	stepDur := time.Duration(durMs*1000/steps) * time.Microsecond

	c.Down(lx1, ly1)
	for i := 1; i <= steps; i++ {
		cx := lx1 + (lx2-lx1)*i/steps
		cy := ly1 + (ly2-ly1)*i/steps
		time.Sleep(stepDur)
		c.Move(cx, cy)
	}
	time.Sleep(20 * time.Millisecond)
	c.Up()
}

func (c *InputController) Key(name string) {
	c.mu.Lock()
	defer c.mu.Unlock()

	name = strings.ToLower(name)
	switch name {
	case "power":
		if c.powerFd != nil {
			c.writeEvent(c.powerFd, EV_KEY, KEY_POWER, 1)
			c.syn(c.powerFd)
			time.Sleep(60 * time.Millisecond)
			c.writeEvent(c.powerFd, EV_KEY, KEY_POWER, 0)
			c.syn(c.powerFd)
		}
	case "back":
		// 返回手势：左边缘轻微右滑
		go c.Swipe(15, 133, 400, 133, 220)
	case "home":
		// 返回主页手势：全屏长滑
		go c.Swipe(15, 133, 620, 133, 260)
	}
}

func (c *InputController) Close() {
	c.mu.Lock()
	defer c.mu.Unlock()
	if c.touchFd != nil {
		c.touchFd.Close()
	}
	if c.powerFd != nil {
		c.powerFd.Close()
	}
}

// StreamBroadcaster 负责管理 ffmpeg 管道捕获与 MJPEG 客户端广播
type StreamBroadcaster struct {
	fps         int
	running     bool
	mu          sync.RWMutex
	latestFrame []byte
	cond        *sync.Cond
	calcFps     float64
}

func NewStreamBroadcaster(fps int) *StreamBroadcaster {
	sb := &StreamBroadcaster{
		fps: fps,
	}
	sb.cond = sync.NewCond(&sb.mu)
	return sb
}

func (sb *StreamBroadcaster) Start() {
	sb.running = true
	go sb.captureLoop()
}

func (sb *StreamBroadcaster) Stop() {
	sb.running = false
	sb.cond.Broadcast()
}

func (sb *StreamBroadcaster) GetLatestFrame() []byte {
	sb.mu.RLock()
	defer sb.mu.RUnlock()
	return sb.latestFrame
}

func (sb *StreamBroadcaster) GetFPS() float64 {
	sb.mu.RLock()
	defer sb.mu.RUnlock()
	return sb.calcFps
}

func (sb *StreamBroadcaster) captureLoop() {
	for sb.running {
		// 每次启动前先点亮屏幕背光
		_ = os.WriteFile("/sys/class/backlight/backlight/brightness", []byte("200\n"), 0644)

		ffmpegPath := "/bin/ffmpeg"
		if _, err := os.Stat(ffmpegPath); err != nil {
			if p, err := exec.LookPath("ffmpeg"); err == nil {
				ffmpegPath = p
			}
		}

		args := []string{
			"-nostdin",
			"-framerate", fmt.Sprintf("%d", sb.fps),
			"-device", "/dev/dri/card0",
			"-f", "kmsgrab",
			"-i", "-",
			"-vf", "hwdownload,format=bgr0,crop=266:960:107:0,transpose=1",
			"-r", fmt.Sprintf("%d", sb.fps),
			"-q:v", "5",
			"-f", "mjpeg",
			"pipe:1",
		}

		cmd := exec.Command(ffmpegPath, args...)
		stdout, err := cmd.StdoutPipe()
		if err != nil {
			log.Printf("[Stream] 启动 ffmpeg 管道失败: %v", err)
			time.Sleep(1 * time.Second)
			continue
		}

		if err := cmd.Start(); err != nil {
			log.Printf("[Stream] 执行 ffmpeg 失败: %v", err)
			time.Sleep(1 * time.Second)
			continue
		}

		log.Printf("[Stream] ffmpeg 硬件截屏流水线已启动 (PID: %d)", cmd.Process.Pid)

		buf := make([]byte, 32768)
		frameBuf := make([]byte, 0, 1024*1024)
		lastTime := time.Now()
		frameCount := 0

		for sb.running {
			n, err := stdout.Read(buf)
			if n > 0 {
				frameBuf = append(frameBuf, buf[:n]...)

				for {
					soi := bytes.Index(frameBuf, []byte("\xff\xd8"))
					if soi == -1 {
						frameBuf = frameBuf[:0]
						break
					}
					eoi := bytes.Index(frameBuf[soi:], []byte("\xff\xd9"))
					if eoi == -1 {
						if soi > 0 {
							frameBuf = append([]byte{}, frameBuf[soi:]...)
						}
						break
					}
					fullEoi := soi + eoi + 2
					frame := append([]byte{}, frameBuf[soi:fullEoi]...)
					frameBuf = append([]byte{}, frameBuf[fullEoi:]...)

					sb.mu.Lock()
					sb.latestFrame = frame
					frameCount++
					now := time.Now()
					if now.Sub(lastTime) >= 1*time.Second {
						sb.calcFps = float64(frameCount) / now.Sub(lastTime).Seconds()
						frameCount = 0
						lastTime = now
					}
					sb.cond.Broadcast()
					sb.mu.Unlock()
				}
			}

			if err != nil {
				if err != io.EOF {
					log.Printf("[Stream] 读取流出错: %v", err)
				}
				break
			}
		}

		_ = cmd.Process.Kill()
		_ = cmd.Wait()
		log.Printf("[Stream] ffmpeg 退出，0.8秒后自动拉起...")
		time.Sleep(800 * time.Millisecond)
	}
}

func main() {
	port := flag.Int("p", 8088, "Web 服务监听端口 (默认: 8088)")
	fps := flag.Int("fps", 15, "抓屏目标帧率 (默认: 15)")
	touchDev := flag.String("touch", "/dev/input/event1", "触控输入设备路径")
	powerDev := flag.String("power", "/dev/input/event0", "电源按键设备路径")
	flag.Parse()

	log.Printf("=========================================================")
	log.Printf("       🖊️ 有道词典笔原生端一体化投屏与远程控制服务")
	log.Printf("=========================================================")

	input := NewInputController(*touchDev, *powerDev)
	defer input.Close()

	broadcaster := NewStreamBroadcaster(*fps)
	broadcaster.Start()
	defer broadcaster.Stop()

	http.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {
		if r.URL.Path != "/" && r.URL.Path != "/index.html" {
			http.NotFound(w, r)
			return
		}
		w.Header().Set("Content-Type", "text/html; charset=utf-8")
		w.Header().Set("Cache-Control", "no-cache")
		w.Write(indexHTML)
	})

	http.HandleFunc("/stream", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "multipart/x-mixed-replace; boundary=frame")
		w.Header().Set("Cache-Control", "no-cache, no-store, must-revalidate")
		w.Header().Set("Pragma", "no-cache")
		w.Header().Set("Expires", "0")

		flusher, ok := w.(http.Flusher)
		if !ok {
			http.Error(w, "Streaming not supported", http.StatusInternalServerError)
			return
		}

		broadcaster.mu.Lock()
		defer broadcaster.mu.Unlock()

		for broadcaster.running {
			broadcaster.cond.Wait()
			frame := broadcaster.latestFrame
			if len(frame) == 0 {
				continue
			}

			header := fmt.Sprintf("--frame\r\nContent-Type: image/jpeg\r\nContent-Length: %d\r\n\r\n", len(frame))
			if _, err := w.Write([]byte(header)); err != nil {
				return
			}
			if _, err := w.Write(frame); err != nil {
				return
			}
			if _, err := w.Write([]byte("\r\n")); err != nil {
				return
			}
			flusher.Flush()
		}
	})

	http.HandleFunc("/api/status", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		status := map[string]interface{}{
			"connected": true,
			"fps":       broadcaster.GetFPS(),
			"width":     960,
			"height":    266,
		}
		json.NewEncoder(w).Encode(status)
	})

	http.HandleFunc("/api/screenshot", func(w http.ResponseWriter, r *http.Request) {
		frame := broadcaster.GetLatestFrame()
		if len(frame) == 0 {
			http.Error(w, "No frame available", http.StatusServiceUnavailable)
			return
		}
		w.Header().Set("Content-Type", "image/jpeg")
		w.Header().Set("Content-Disposition", `attachment; filename="ydpen_screenshot.jpg"`)
		w.Write(frame)
	})

	http.HandleFunc("/api/touch", func(w http.ResponseWriter, r *http.Request) {
		if r.Method != http.MethodPost {
			http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
			return
		}
		var req struct {
			Type string `json:"type"`
			X    int    `json:"x"`
			Y    int    `json:"y"`
			X1   int    `json:"x1"`
			Y1   int    `json:"y1"`
			X2   int    `json:"x2"`
			Y2   int    `json:"y2"`
			Dur  int    `json:"dur"`
			Key  string `json:"key"`
		}
		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			http.Error(w, err.Error(), http.StatusBadRequest)
			return
		}

		switch req.Type {
		case "tap":
			input.Tap(req.X, req.Y, req.Dur)
		case "down":
			input.Down(req.X, req.Y)
		case "move":
			input.Move(req.X, req.Y)
		case "up":
			input.Up()
		case "swipe":
			input.Swipe(req.X1, req.Y1, req.X2, req.Y2, req.Dur)
		case "key":
			input.Key(req.Key)
		}

		w.Header().Set("Content-Type", "application/json")
		w.Write([]byte(`{"status":"ok"}`))
	})

	addr := fmt.Sprintf("0.0.0.0:%d", *port)
	server := &http.Server{
		Addr: addr,
	}

	sigChan := make(chan os.Signal, 1)
	signal.Notify(sigChan, syscall.SIGINT, syscall.SIGTERM)

	go func() {
		log.Printf("[Server] 原生 Web 服务已在词典笔上就绪: http://%s", addr)
		log.Printf("[Server] 电脑端在同一 Wi-Fi 下直接浏览器打开 http://<词典笔IP>:%d 即可操作！", *port)
		if err := server.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			log.Fatalf("[Server] 服务启动失败: %v", err)
		}
	}()

	<-sigChan
	log.Printf("\n[CleanUp] 正在安全停止笔端服务...")
	broadcaster.Stop()
	server.Close()
	log.Printf("[CleanUp] 服务已退出。")
}
