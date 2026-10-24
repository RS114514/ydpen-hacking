package main

import (
	"bufio"
	"fmt"
	"math/rand"
	"os"
	"strings"
	"time"
)

type Player struct {
	hp, maxHp int
	atk       int
	gold      int
	potions   int
	level     int
}

func main() {
	rand.Seed(time.Now().UnixNano())
	p := Player{hp: 100, maxHp: 100, atk: 15, gold: 20, potions: 2, level: 1}
	reader := bufio.NewReader(os.Stdin)

	fmt.Print("\033[H\033[2J")
	fmt.Println("\033[1;35m========================================")
	fmt.Println("    ★ 词典笔地牢文字冒险 RPG ★")
	fmt.Println("========================================\033[0m")
	fmt.Println("你手握一柄生锈的剑，踏入了神秘的古代地牢...")

	for {
		if p.hp <= 0 {
			fmt.Println("\n\033[1;31m你倒在了幽暗的走廊中... 游戏结束。\033[0m")
			break
		}
		fmt.Printf("\n[状态] 等级: %d | 生命: %d/%d | 攻击: %d | 金币: %d | 药水: %d\n",
			p.level, p.hp, p.maxHp, p.atk, p.gold, p.potions)
		fmt.Println("操作: 1.继续前进(探索) | 2.饮用治疗药水 | 3.休整营地 | 0.退出冒险")
		fmt.Print("请选择行动: ")

		line, _ := reader.ReadString('\n')
		choice := strings.TrimSpace(line)

		switch choice {
		case "0", "q", "exit":
			fmt.Println("你带着战利品退出了地牢。")
			return
		case "2":
			if p.potions > 0 {
				p.potions--
				heal := 35
				p.hp += heal
				if p.hp > p.maxHp {
					p.hp = p.maxHp
				}
				fmt.Printf("你喝下一瓶红色药水，恢复了 %d 点生命！当前生命: %d/%d\n", heal, p.hp, p.maxHp)
			} else {
				fmt.Println("你背包里没有治疗药水了！")
			}
		case "3":
			fmt.Println("你在火堆旁小憩了片刻...")
			heal := 10
			p.hp += heal
			if p.hp > p.maxHp {
				p.hp = p.maxHp
			}
		case "1":
			event := rand.Intn(100)
			if event < 45 {
				// 遭遇怪物
				mNames := []string{"地牢哥布林", "骷髅弓箭手", "狂暴穴居兽", "远古幽灵"}
				mName := mNames[rand.Intn(len(mNames))]
				mHp := 30 + p.level*10 + rand.Intn(15)
				mAtk := 8 + p.level*3 + rand.Intn(5)
				fmt.Printf("\n\033[1;31m⚠ 前方跳出一只【%s】(生命: %d, 攻击: %d)！\033[0m\n", mName, mHp, mAtk)

				for mHp > 0 && p.hp > 0 {
					dmg := p.atk + rand.Intn(8) - 4
					mHp -= dmg
					fmt.Printf("你挥剑斩击，对【%s】造成了 %d 点伤害！(怪剩余: %d)\n", mName, dmg, mHp)
					if mHp <= 0 {
						break
					}
					mDmg := mAtk + rand.Intn(6) - 3
					p.hp -= mDmg
					fmt.Printf("【%s】对你反击，你受到了 %d 点伤害！\n", mName, mDmg)
				}
				if p.hp > 0 {
					dropGold := 10 + rand.Intn(20)
					p.gold += dropGold
					fmt.Printf("\033[1;32m你击败了【%s】！获得了 %d 枚金币！\033[0m\n", mName, dropGold)
					if rand.Float64() < 0.35 {
						p.potions++
						fmt.Println("怪物身上掉落了一瓶治疗药水！")
					}
				}
			} else if event < 75 {
				// 宝箱事件
				lootGold := 15 + rand.Intn(30)
				p.gold += lootGold
				fmt.Printf("\n\033[1;33m你发现了一个布满灰尘的宝箱！开出了 %d 枚金币！\033[0m\n", lootGold)
				if rand.Float64() < 0.4 {
					p.atk += 3
					fmt.Println("在宝箱底部你还发现了一块锋利的磨刀石！攻击力永久 +3！")
				}
			} else {
				// 神秘祭坛
				fmt.Println("\n\033[1;36m你遇到了一座闪烁微光的神秘古老祭坛。\033[0m")
				fmt.Println("你接受了祭坛的祝福：最大生命值 +20，并提升了 1 级！")
				p.maxHp += 20
				p.hp = p.maxHp
				p.level++
				p.atk += 2
			}
		default:
			fmt.Println("无效指令。")
		}
	}
}
