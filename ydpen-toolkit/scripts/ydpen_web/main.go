package main

import (
	"encoding/json"
	"flag"
	"fmt"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"
)

type TouchRequest struct {
	Type string `json:"type"`
	X    int    `json:"x"`
	Y    int    `json:"y"`
	X1   int    `json:"x1"`
	Y1   int    `json:"y1"`
	X2   int    `json:"x2"`
	Y2   int    `json:"y2"`
	Dur  int    `json:"dur"`
}

type KeyRequest struct {
	Key string `json:"key"`
}

type BrightnessRequest struct {
	Val int `json:"val"`
}

func main() {
	port := flag.Int("port", 8088, "HTTP Web 服务端口 (默认: 8088)")
	fps := flag.Int("fps", 15, "抓屏帧率 (默认: 15)")
	q := flag.Int("q", 5, "MJPEG 图像质量 2-31, 越小质量越高 (默认: 5)")
	rootDir := flag.String("dir", "/userdisk/Favorite", "文件互传共享根目录 (默认: /userdisk/Favorite)")
	flag.Parse()

	fmt.Println("=========================================================")
	fmt.Println("      🖊️ 有道词典笔笔端原生投屏与远程控制服务 (ydpen-web)")
	fmt.Println("=========================================================")

	input := NewInputController()
	defer input.Close()

	// 启动时自动拉起背光
	_ = input.WakeScreen()

	streamer := NewScreenStreamer(*fps, *q)
	defer streamer.Stop()

	fsHandler := NewFSHandler(*rootDir)

	mux := http.NewServeMux()

	// 首页
	mux.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {
		if r.URL.Path != "/" {
			http.NotFound(w, r)
			return
		}
		w.Header().Set("Content-Type", "text/html; charset=utf-8")
		_, _ = w.Write([]byte(IndexHTML))
	})

	// 视频流 (MJPEG)
	mux.HandleFunc("/stream", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "multipart/x-mixed-replace; boundary=frame")
		w.Header().Set("Cache-Control", "no-cache, no-store, must-revalidate")
		w.Header().Set("Pragma", "no-cache")
		w.Header().Set("Expires", "0")
		w.Header().Set("Access-Control-Allow-Origin", "*")

		ch, unsub := streamer.Subscribe()
		defer unsub()

		flusher, hasFlusher := w.(http.Flusher)
		notify := r.Context().Done()

		for {
			select {
			case <-notify:
				return
			case frame, ok := <-ch:
				if !ok {
					return
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
				if hasFlusher {
					flusher.Flush()
				}
			}
		}
	})

	// 状态 API
	mux.HandleFunc("/api/status", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json; charset=utf-8")
		w.Header().Set("Access-Control-Allow-Origin", "*")
		st := CollectStatus(streamer, input)
		_ = json.NewEncoder(w).Encode(st)
	})

	// 单帧截屏下载
	mux.HandleFunc("/api/screenshot", func(w http.ResponseWriter, r *http.Request) {
		frame := streamer.GetLatestFrame()
		if len(frame) == 0 {
			http.Error(w, "无法获取截屏画面", http.StatusServiceUnavailable)
			return
		}
		w.Header().Set("Content-Type", "image/jpeg")
		w.Header().Set("Content-Disposition", fmt.Sprintf("attachment; filename=\"ydpen_screenshot_%d.jpg\"", time.Now().Unix()))
		w.Header().Set("Access-Control-Allow-Origin", "*")
		_, _ = w.Write(frame)
	})

	// 触控输入 API
	mux.HandleFunc("/api/touch", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Access-Control-Allow-Origin", "*")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type")
		if r.Method == http.MethodOptions {
			w.WriteHeader(http.StatusOK)
			return
		}
		if r.Method != http.MethodPost {
			http.Error(w, "仅支持 POST", http.StatusMethodNotAllowed)
			return
		}

		var req TouchRequest
		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			http.Error(w, err.Error(), http.StatusBadRequest)
			return
		}

		switch req.Type {
		case "down":
			input.Down(req.X, req.Y)
		case "move":
			input.Move(req.X, req.Y)
		case "up":
			input.Up()
		case "tap":
			input.Tap(req.X, req.Y, req.Dur)
		case "swipe":
			input.Swipe(req.X1, req.Y1, req.X2, req.Y2, req.Dur)
		}

		w.Header().Set("Content-Type", "application/json")
		_, _ = w.Write([]byte(`{"status":"ok"}`))
	})

	// 按键控制 API
	mux.HandleFunc("/api/key", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Access-Control-Allow-Origin", "*")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type")
		if r.Method == http.MethodOptions {
			w.WriteHeader(http.StatusOK)
			return
		}
		if r.Method != http.MethodPost {
			http.Error(w, "仅支持 POST", http.StatusMethodNotAllowed)
			return
		}

		var req KeyRequest
		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			http.Error(w, err.Error(), http.StatusBadRequest)
			return
		}

		input.Key(req.Key)
		w.Header().Set("Content-Type", "application/json")
		_, _ = w.Write([]byte(`{"status":"ok"}`))
	})

	// 屏幕亮度设置
	mux.HandleFunc("/api/brightness", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Access-Control-Allow-Origin", "*")
		var req BrightnessRequest
		if err := json.NewDecoder(r.Body).Decode(&req); err == nil {
			_ = input.SetBrightness(req.Val)
		}
		w.Header().Set("Content-Type", "application/json")
		_, _ = w.Write([]byte(`{"status":"ok"}`))
	})

	// 文件互传 API
	mux.HandleFunc("/api/fs/list", fsHandler.HandleList)
	mux.HandleFunc("/api/fs/upload", fsHandler.HandleUpload)
	mux.HandleFunc("/api/fs/mkdir", fsHandler.HandleMkdir)
	mux.HandleFunc("/api/fs/delete", fsHandler.HandleDelete)
	mux.HandleFunc("/files/", fsHandler.HandleDownload)

	server := &http.Server{
		Addr:    fmt.Sprintf("0.0.0.0:%d", *port),
		Handler: mux,
	}

	primaryIP := GetPrimaryIP()
	fmt.Printf("[启动成功] Web 服务正在运行中...\n")
	fmt.Printf("[访问地址] http://%s:%d/\n", primaryIP, *port)
	fmt.Printf("[共享目录] %s\n", *rootDir)
	fmt.Println("按 Ctrl+C 可停止服务。")

	// 信号处理
	sigChan := make(chan os.Signal, 1)
	signal.Notify(sigChan, os.Interrupt, syscall.SIGTERM)

	go func() {
		if err := server.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			fmt.Printf("[错误] HTTP 启动失败: %v\n", err)
			os.Exit(1)
		}
	}()

	<-sigChan
	fmt.Println("\n正在安全关闭服务...")
	_ = server.Close()
	fmt.Println("服务已退出。")
}
