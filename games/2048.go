package main

import (
	"bufio"
	"fmt"
	"math/rand"
	"os"
	"strings"
	"time"
)

type Board [4][4]int

var score int

func initBoard() Board {
	var b Board
	rand.Seed(time.Now().UnixNano())
	b.addTile()
	b.addTile()
	return b
}

func (b *Board) addTile() {
	var empty [][2]int
	for r := 0; r < 4; r++ {
		for c := 0; c < 4; c++ {
			if b[r][c] == 0 {
				empty = append(empty, [2]int{r, c})
			}
		}
	}
	if len(empty) == 0 {
		return
	}
	pos := empty[rand.Intn(len(empty))]
	val := 2
	if rand.Float64() < 0.1 {
		val = 4
	}
	b[pos[0]][pos[1]] = val
}

func (b *Board) print() {
	fmt.Print("\033[H\033[2J") // 清屏
	fmt.Printf("\033[1;36m=== 2048 数字方块 (得分: %d) ===\033[0m\n", score)
	fmt.Println("操作: W(上) S(下) A(左) D(右) | Q(退出)")
	fmt.Println("---------------------------------")
	for r := 0; r < 4; r++ {
		for c := 0; c < 4; c++ {
			v := b[r][c]
			if v == 0 {
				fmt.Print("   .  ")
			} else {
				color := 37
				switch v {
				case 2:
					color = 33
				case 4:
					color = 32
				case 8:
					color = 36
				case 16:
					color = 34
				case 32:
					color = 35
				case 64:
					color = 31
				case 128, 256, 512:
					color = 93
				case 1024, 2048:
					color = 91
				}
				fmt.Printf("\033[1;%dm%4d  \033[0m", color, v)
			}
		}
		fmt.Println("\n")
	}
	fmt.Print("请输入移动方向 [w/a/s/d]: ")
}

func slide(row []int) ([]int, int) {
	var res []int
	for _, v := range row {
		if v != 0 {
			res = append(res, v)
		}
	}
	sc := 0
	var merged []int
	for i := 0; i < len(res); i++ {
		if i+1 < len(res) && res[i] == res[i+1] {
			merged = append(merged, res[i]*2)
			sc += res[i] * 2
			i++
		} else {
			merged = append(merged, res[i])
		}
	}
	for len(merged) < 4 {
		merged = append(merged, 0)
	}
	return merged, sc
}

func (b *Board) moveLeft() bool {
	moved := false
	for r := 0; r < 4; r++ {
		row := make([]int, 4)
		for c := 0; c < 4; c++ {
			row[c] = b[r][c]
		}
		newRow, sc := slide(row)
		score += sc
		for c := 0; c < 4; c++ {
			if b[r][c] != newRow[c] {
				moved = true
				b[r][c] = newRow[c]
			}
		}
	}
	return moved
}

func (b *Board) rotate() {
	var n Board
	for r := 0; r < 4; r++ {
		for c := 0; c < 4; c++ {
			n[c][3-r] = b[r][c]
		}
	}
	*b = n
}

func (b *Board) move(dir string) bool {
	switch dir {
	case "a":
		return b.moveLeft()
	case "s":
		b.rotate()
		m := b.moveLeft()
		b.rotate(); b.rotate(); b.rotate()
		return m
	case "d":
		b.rotate(); b.rotate()
		m := b.moveLeft()
		b.rotate(); b.rotate()
		return m
	case "w":
		b.rotate(); b.rotate(); b.rotate()
		m := b.moveLeft()
		b.rotate()
		return m
	}
	return false
}

func (b *Board) canMove() bool {
	for r := 0; r < 4; r++ {
		for c := 0; c < 4; c++ {
			if b[r][c] == 0 {
				return true
			}
			if c+1 < 4 && b[r][c] == b[r][c+1] {
				return true
			}
			if r+1 < 4 && b[r][c] == b[r+1][c] {
				return true
			}
		}
	}
	return false
}

func main() {
	b := initBoard()
	reader := bufio.NewReader(os.Stdin)
	for {
		b.print()
		input, err := reader.ReadString('\n')
		if err != nil {
			break
		}
		cmd := strings.ToLower(strings.TrimSpace(input))
		if cmd == "q" || cmd == "quit" || cmd == "exit" {
			fmt.Println("退出游戏。")
			break
		}
		if cmd == "" {
			continue
		}
		for _, ch := range cmd {
			s := string(ch)
			if s == "w" || s == "a" || s == "s" || s == "d" {
				if b.move(s) {
					b.addTile()
				}
			}
		}
		if !b.canMove() {
			b.print()
			fmt.Println("\n\033[1;31mGame Over! 无法继续移动。\033[0m")
			break
		}
	}
}
