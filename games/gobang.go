package main

import (
	"bufio"
	"fmt"
	"math/rand"
	"os"
	"strconv"
	"strings"
	"time"
)

const Size = 15

type Board [Size][Size]int

type Move struct {
	r, c int
}

var history []Move

func printBoard(b *Board) {
	fmt.Print("\033[H\033[2J")
	fmt.Println("\033[1;33m=== 词典笔五子棋 (人机对弈) ===\033[0m")
	fmt.Println("提示: 输入 '行 列' (如 '8 8') 落子 | 'u' 悔棋 | 'q' 退出")
	fmt.Print("   ")
	for c := 0; c < Size; c++ {
		fmt.Printf("%2d ", c+1)
	}
	fmt.Println()
	for r := 0; r < Size; r++ {
		fmt.Printf("%2d ", r+1)
		for c := 0; c < Size; c++ {
			switch b[r][c] {
			case 1:
				fmt.Print(" \033[1;37m●\033[0m ") // 玩家黑子
			case 2:
				fmt.Print(" \033[1;31m○\033[0m ") // 电脑白子
			default:
				fmt.Print(" + ")
			}
		}
		fmt.Println()
	}
}

func checkWin(b *Board, r, c, p int) bool {
	dirs := [][2]int{{0, 1}, {1, 0}, {1, 1}, {1, -1}}
	for _, d := range dirs {
		cnt := 1
		for step := 1; step < 5; step++ {
			nr, nc := r+d[0]*step, c+d[1]*step
			if nr >= 0 && nr < Size && nc >= 0 && nc < Size && b[nr][nc] == p {
				cnt++
			} else {
				break
			}
		}
		for step := 1; step < 5; step++ {
			nr, nc := r-d[0]*step, c-d[1]*step
			if nr >= 0 && nr < Size && nc >= 0 && nc < Size && b[nr][nc] == p {
				cnt++
			} else {
				break
			}
		}
		if cnt >= 5 {
			return true
		}
	}
	return false
}

// 简易启发式 AI 评分
func aiMove(b *Board) (int, int) {
	bestScore := -1
	var bestR, bestC int

	for r := 0; r < Size; r++ {
		for c := 0; c < Size; c++ {
			if b[r][c] != 0 {
				continue
			}
			// 算攻击与防守分
			sc := evaluatePos(b, r, c, 2)*2 + evaluatePos(b, r, c, 1)
			if sc > bestScore {
				bestScore = sc
				bestR, bestC = r, c
			}
		}
	}
	if bestScore <= 0 {
		return 7, 7
	}
	return bestR, bestC
}

func evaluatePos(b *Board, r, c, p int) int {
	score := 0
	dirs := [][2]int{{0, 1}, {1, 0}, {1, 1}, {1, -1}}
	for _, d := range dirs {
		cnt := 0
		open := 0
		for step := 1; step < 5; step++ {
			nr, nc := r+d[0]*step, c+d[1]*step
			if nr >= 0 && nr < Size && nc >= 0 && nc < Size {
				if b[nr][nc] == p {
					cnt++
				} else if b[nr][nc] == 0 {
					open++
					break
				} else {
					break
				}
			} else {
				break
			}
		}
		for step := 1; step < 5; step++ {
			nr, nc := r-d[0]*step, c-d[1]*step
			if nr >= 0 && nr < Size && nc >= 0 && nc < Size {
				if b[nr][nc] == p {
					cnt++
				} else if b[nr][nc] == 0 {
					open++
					break
				} else {
					break
				}
			} else {
				break
			}
		}
		if cnt >= 4 {
			score += 10000
		} else if cnt == 3 && open >= 2 {
			score += 1000
		} else if cnt == 2 && open >= 2 {
			score += 100
		} else if cnt == 1 {
			score += 10
		}
	}
	return score
}

func main() {
	rand.Seed(time.Now().UnixNano())
	var b Board
	reader := bufio.NewReader(os.Stdin)

	for {
		printBoard(&b)
		fmt.Print("玩家落子 (输入 行 列): ")
		line, err := reader.ReadString('\n')
		if err != nil {
			break
		}
		cmd := strings.TrimSpace(line)
		if cmd == "q" || cmd == "quit" {
			fmt.Println("游戏退出。")
			break
		}
		if cmd == "u" || cmd == "undo" {
			if len(history) >= 2 {
				m2 := history[len(history)-1]
				m1 := history[len(history)-2]
				b[m2.r][m2.c] = 0
				b[m1.r][m1.c] = 0
				history = history[:len(history)-2]
				fmt.Println("已悔棋！")
				time.Sleep(500 * time.Millisecond)
			}
			continue
		}
		parts := strings.Fields(cmd)
		if len(parts) != 2 {
			continue
		}
		r, err1 := strconv.Atoi(parts[0])
		c, err2 := strconv.Atoi(parts[1])
		if err1 != nil || err2 != nil || r < 1 || r > Size || c < 1 || c > Size || b[r-1][c-1] != 0 {
			fmt.Println("坐标无效或该位置已有子！")
			time.Sleep(800 * time.Millisecond)
			continue
		}
		r--
		c--
		b[r][c] = 1
		history = append(history, Move{r, c})

		if checkWin(&b, r, c, 1) {
			printBoard(&b)
			fmt.Println("\n\033[1;32m恭喜！你赢了！\033[0m")
			break
		}

		// 电脑落子
		ar, ac := aiMove(&b)
		b[ar][ac] = 2
		history = append(history, Move{ar, ac})

		if checkWin(&b, ar, ac, 2) {
			printBoard(&b)
			fmt.Println("\n\033[1;31m电脑获胜！再接再厉。\033[0m")
			break
		}
	}
}
