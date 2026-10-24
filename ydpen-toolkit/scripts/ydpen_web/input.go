package main

import (
	"encoding/binary"
	"fmt"
	"os"
	"strconv"
	"strings"
	"sync"
	"time"
)

const (
	TouchDev   = "/dev/input/event1"
	PowerDev   = "/dev/input/event0"
	Brightness = "/sys/class/backlight/backlight/brightness"

	EvSyn = 0x00
	SynReport = 0x00

	EvKey    = 0x01
	KeyPower = 116
	BtnTouch = 0x14a

	EvAbs           = 0x03
	AbsMtSlot       = 0x2f
	AbsMtTouchMajor = 0x30
	AbsMtPositionX  = 0x35
	AbsMtPositionY  = 0x36
	AbsMtTrackingId = 0x39

	AppOffset = 107
)

type inputEvent struct {
	Sec   int64
	Usec  int64
	Type  uint16
	Code  uint16
	Value int32
}

type InputController struct {
	mu       sync.Mutex
	touchFd  *os.File
	powerFd  *os.File
	trackID  int32
	isDown   bool
}

func NewInputController() *InputController {
	c := &InputController{
		trackID: 100,
	}
	c.initDevices()
	return c
}

func (c *InputController) initDevices() {
	if f, err := os.OpenFile(TouchDev, os.O_RDWR, 0); err == nil {
		c.touchFd = f
	} else {
		fmt.Printf("[Input] 警告: 无法打开触控设备 %s: %v\n", TouchDev, err)
	}

	if f, err := os.OpenFile(PowerDev, os.O_RDWR, 0); err == nil {
		c.powerFd = f
	} else {
		fmt.Printf("[Input] 警告: 无法打开按键设备 %s: %v\n", PowerDev, err)
	}
}

func (c *InputController) emit(f *os.File, evType, code uint16, val int32) {
	if f == nil {
		return
	}
	now := time.Now()
	ev := inputEvent{
		Sec:   now.Unix(),
		Usec:  int64(now.Nanosecond() / 1000),
		Type:  evType,
		Code:  code,
		Value: val,
	}
	_ = binary.Write(f, binary.LittleEndian, &ev)
}

func (c *InputController) syn(f *os.File) {
	c.emit(f, EvSyn, SynReport, 0)
}

func (c *InputController) toPhys(lx, ly int) (int, int) {
	px := ly + AppOffset
	py := 959 - lx
	if px < 0 {
		px = 0
	}
	if px > 480 {
		px = 480
	}
	if py < 0 {
		py = 0
	}
	if py > 959 {
		py = 959
	}
	return px, py
}

func (c *InputController) Down(lx, ly int) {
	c.mu.Lock()
	defer c.mu.Unlock()

	px, py := c.toPhys(lx, ly)
	c.trackID++
	if c.trackID > 60000 {
		c.trackID = 100
	}

	c.emit(c.touchFd, EvAbs, AbsMtSlot, 0)
	c.emit(c.touchFd, EvAbs, AbsMtTrackingId, c.trackID)
	c.emit(c.touchFd, EvAbs, AbsMtPositionX, int32(px))
	c.emit(c.touchFd, EvAbs, AbsMtPositionY, int32(py))
	c.emit(c.touchFd, EvAbs, AbsMtTouchMajor, 8)
	c.emit(c.touchFd, EvKey, BtnTouch, 1)
	c.syn(c.touchFd)
	c.isDown = true
}

func (c *InputController) Move(lx, ly int) {
	c.mu.Lock()
	defer c.mu.Unlock()

	if !c.isDown {
		px, py := c.toPhys(lx, ly)
		c.trackID++
		if c.trackID > 60000 {
			c.trackID = 100
		}
		c.emit(c.touchFd, EvAbs, AbsMtSlot, 0)
		c.emit(c.touchFd, EvAbs, AbsMtTrackingId, c.trackID)
		c.emit(c.touchFd, EvAbs, AbsMtPositionX, int32(px))
		c.emit(c.touchFd, EvAbs, AbsMtPositionY, int32(py))
		c.emit(c.touchFd, EvAbs, AbsMtTouchMajor, 8)
		c.emit(c.touchFd, EvKey, BtnTouch, 1)
		c.syn(c.touchFd)
		c.isDown = true
		return
	}

	px, py := c.toPhys(lx, ly)
	c.emit(c.touchFd, EvAbs, AbsMtPositionX, int32(px))
	c.emit(c.touchFd, EvAbs, AbsMtPositionY, int32(py))
	c.syn(c.touchFd)
}

func (c *InputController) Up() {
	c.mu.Lock()
	defer c.mu.Unlock()

	if !c.isDown {
		return
	}
	c.emit(c.touchFd, EvAbs, AbsMtTrackingId, -1)
	c.emit(c.touchFd, EvKey, BtnTouch, 0)
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
	px1, py1 := c.toPhys(lx1, ly1)
	px2, py2 := c.toPhys(lx2, ly2)

	steps := durMs / 10
	if steps < 3 {
		steps = 3
	}
	stepDur := time.Duration(durMs) * time.Millisecond / time.Duration(steps)

	c.mu.Lock()
	c.trackID++
	if c.trackID > 60000 {
		c.trackID = 100
	}

	c.emit(c.touchFd, EvAbs, AbsMtSlot, 0)
	c.emit(c.touchFd, EvAbs, AbsMtTrackingId, c.trackID)
	c.emit(c.touchFd, EvAbs, AbsMtPositionX, int32(px1))
	c.emit(c.touchFd, EvAbs, AbsMtPositionY, int32(py1))
	c.emit(c.touchFd, EvAbs, AbsMtTouchMajor, 8)
	c.emit(c.touchFd, EvKey, BtnTouch, 1)
	c.syn(c.touchFd)
	c.mu.Unlock()

	for i := 1; i <= steps; i++ {
		cx := px1 + (px2-px1)*i/steps
		cy := py1 + (py2-py1)*i/steps
		c.mu.Lock()
		c.emit(c.touchFd, EvAbs, AbsMtPositionX, int32(cx))
		c.emit(c.touchFd, EvAbs, AbsMtPositionY, int32(cy))
		c.syn(c.touchFd)
		c.mu.Unlock()
		time.Sleep(stepDur)
	}

	c.mu.Lock()
	c.emit(c.touchFd, EvAbs, AbsMtTrackingId, -1)
	c.emit(c.touchFd, EvKey, BtnTouch, 0)
	c.syn(c.touchFd)
	c.isDown = false
	c.mu.Unlock()
}

func (c *InputController) Key(name string) {
	lower := strings.ToLower(name)
	switch lower {
	case "power":
		c.mu.Lock()
		if c.powerFd != nil {
			c.emit(c.powerFd, EvKey, KeyPower, 1)
			c.syn(c.powerFd)
			time.Sleep(60 * time.Millisecond)
			c.emit(c.powerFd, EvKey, KeyPower, 0)
			c.syn(c.powerFd)
		}
		c.mu.Unlock()
		_ = c.WakeScreen()
	case "back":
		// 返回手势：从屏幕左边缘向右滑
		c.Swipe(15, 133, 450, 133, 200)
	case "home":
		// 返回主屏幕手势：从屏幕左边缘向右长滑
		c.Swipe(15, 133, 620, 133, 260)
	case "wake":
		_ = c.WakeScreen()
	}
}

func (c *InputController) WakeScreen() error {
	return c.SetBrightness(200)
}

func (c *InputController) SetBrightness(val int) error {
	if val < 0 {
		val = 0
	}
	if val > 255 {
		val = 255
	}
	return os.WriteFile(Brightness, []byte(strconv.Itoa(val)+"\n"), 0644)
}

func (c *InputController) GetBrightness() int {
	data, err := os.ReadFile(Brightness)
	if err != nil {
		return 200
	}
	val, err := strconv.Atoi(strings.TrimSpace(string(data)))
	if err != nil {
		return 200
	}
	return val
}

func (c *InputController) Close() {
	c.mu.Lock()
	defer c.mu.Unlock()
	if c.touchFd != nil {
		c.touchFd.Close()
		c.touchFd = nil
	}
	if c.powerFd != nil {
		c.powerFd.Close()
		c.powerFd = nil
	}
}
