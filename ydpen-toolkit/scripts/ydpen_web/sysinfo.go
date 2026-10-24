package main

import (
	"fmt"
	"net"
	"os"
	"strconv"
	"strings"
	"time"
)

type SystemStatus struct {
	Model          string   `json:"model"`
	Kernel         string   `json:"kernel"`
	IP             string   `json:"ip"`
	AllIPs         []string `json:"all_ips"`
	Battery        int      `json:"battery"`
	BatteryStatus  string   `json:"battery_status"`
	Brightness     int      `json:"brightness"`
	FPS            float64  `json:"fps"`
	Streaming      bool     `json:"streaming"`
	UptimeSec      int64    `json:"uptime_sec"`
	MemTotalKB     int64    `json:"mem_total_kb"`
	MemAvailKB     int64    `json:"mem_avail_kb"`
	ScreenWidth    int      `json:"screen_width"`
	ScreenHeight   int      `json:"screen_height"`
	Time           string   `json:"time"`
}

func GetPrimaryIP() string {
	// 优先找 wlan0
	if iface, err := net.InterfaceByName("wlan0"); err == nil {
		if addrs, err := iface.Addrs(); err == nil {
			for _, a := range addrs {
				if ipnet, ok := a.(*net.IPNet); ok && !ipnet.IP.IsLoopback() {
					if ip := ipnet.IP.To4(); ip != nil {
						return ip.String()
					}
				}
			}
		}
	}

	// 否则找第一个非回环 IPv4
	addrs, err := net.InterfaceAddrs()
	if err == nil {
		for _, a := range addrs {
			if ipnet, ok := a.(*net.IPNet); ok && !ipnet.IP.IsLoopback() {
				if ip := ipnet.IP.To4(); ip != nil {
					return ip.String()
				}
			}
		}
	}
	return "127.0.0.1"
}

func GetAllIPs() []string {
	var list []string
	addrs, err := net.InterfaceAddrs()
	if err == nil {
		for _, a := range addrs {
			if ipnet, ok := a.(*net.IPNet); ok && !ipnet.IP.IsLoopback() {
				if ip := ipnet.IP.To4(); ip != nil {
					list = append(list, ip.String())
				}
			}
		}
	}
	return list
}

func GetBatteryInfo() (int, string) {
	capBytes, err := os.ReadFile("/sys/class/power_supply/battery/capacity")
	capVal := 100
	if err == nil {
		if v, err := strconv.Atoi(strings.TrimSpace(string(capBytes))); err == nil {
			capVal = v
		}
	}

	statusBytes, err := os.ReadFile("/sys/class/power_supply/battery/status")
	statusStr := "Normal"
	if err == nil {
		statusStr = strings.TrimSpace(string(statusBytes))
	}
	return capVal, statusStr
}

func GetMemInfo() (int64, int64) {
	data, err := os.ReadFile("/proc/meminfo")
	if err != nil {
		return 0, 0
	}
	var total, avail int64
	lines := strings.Split(string(data), "\n")
	for _, l := range lines {
		parts := strings.Fields(l)
		if len(parts) >= 2 {
			switch parts[0] {
			case "MemTotal:":
				total, _ = strconv.ParseInt(parts[1], 10, 64)
			case "MemAvailable:":
				avail, _ = strconv.ParseInt(parts[1], 10, 64)
			}
		}
	}
	return total, avail
}

func GetUptimeSec() int64 {
	data, err := os.ReadFile("/proc/uptime")
	if err != nil {
		return 0
	}
	parts := strings.Fields(string(data))
	if len(parts) > 0 {
		if f, err := strconv.ParseFloat(parts[0], 64); err == nil {
			return int64(f)
		}
	}
	return 0
}

func CollectStatus(streamer *ScreenStreamer, input *InputController) SystemStatus {
	bat, batStatus := GetBatteryInfo()
	totMem, availMem := GetMemInfo()

	return SystemStatus{
		Model:         "有道词典笔 X6 Pro (RK3562)",
		Kernel:        "PenOS 4.x / Linux 5.10 aarch64",
		IP:            GetPrimaryIP(),
		AllIPs:        GetAllIPs(),
		Battery:       bat,
		BatteryStatus: batStatus,
		Brightness:    input.GetBrightness(),
		FPS:           streamer.GetFPS(),
		Streaming:     streamer.IsRunning(),
		UptimeSec:     GetUptimeSec(),
		MemTotalKB:    totMem,
		MemAvailKB:    availMem,
		ScreenWidth:   960,
		ScreenHeight:  266,
		Time:          time.Now().Format("2006-01-02 15:04:05"),
	}
}

func FormatBytes(b int64) string {
	const unit = 1024
	if b < unit {
		return fmt.Sprintf("%d B", b)
	}
	div, exp := int64(unit), 0
	for n := b / unit; n >= unit; n /= unit {
		div *= unit
		exp++
	}
	return fmt.Sprintf("%.1f %cB", float64(b)/float64(div), "KMGTPE"[exp])
}
