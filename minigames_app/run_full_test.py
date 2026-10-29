import time
import sys
import os
sys.path.append('/Users/fuzihao/.gemini/antigravity/scratch/ydpen/minigames_app')
from test_helper import tap, capture, back_to_hub, set_page, open_card

print("=== 开始小游戏全量真机功能测试 ===")

# 0. 验证尺寸缩放按钮 (在井字棋页面测试)
print("[0/17] 测试缩放功能循环...")
for scale_target in ['1.25x', '0.9x', '1.0x', '1.15x']:
    tap(640, 14)
    time.sleep(0.3)
capture("test_00_scale_cycled")

# 1. 测试井字棋交互
print("[1/17] 井字棋对弈测试...")
# 点击重新开始 (x=335, y=185)
tap(335, 185)
time.sleep(0.4)
# 点击中心格子 (row 1, col 1: x=130, y=130)
tap(130, 130)
time.sleep(0.5)
capture("test_01_tictactoe_played")

# 返回大厅
back_to_hub()
set_page(1)
capture("test_00_hub_page1")

# 2. 扫雷
print("[2/17] 扫雷测试...")
open_card(1)
time.sleep(0.5)
# 点击模式切换 (挖雷/标旗) (x=350, y=150)
tap(350, 150)
time.sleep(0.3)
# 标记格子 (x=45, y=75)
tap(45, 75)
time.sleep(0.3)
# 切回翻开模式
tap(350, 150)
time.sleep(0.3)
# 翻开中间安全区域 (x=105, y=135)
tap(105, 135)
time.sleep(0.5)
capture("test_02_minesweeper_played")
back_to_hub()

# 3. 像素飞鸟
print("[3/17] 像素飞鸟测试...")
open_card(2)
time.sleep(0.5)
# 点击飞跳
tap(280, 130)
time.sleep(0.3)
tap(280, 130)
time.sleep(0.5)
capture("test_03_flappy_flying")
back_to_hub()

# 4. 合成大西瓜
print("[4/17] 合成大西瓜测试...")
open_card(3)
time.sleep(0.5)
# 点击顶部投放水果 (x=150, y=30)
tap(150, 30)
time.sleep(0.5)
tap(200, 30)
time.sleep(0.5)
capture("test_04_watermelon_drop")
back_to_hub()

# 5. 消消乐
print("[5/17] 趣味消消乐测试...")
open_card(5)
time.sleep(0.5)
# 点击选中宝石并交换
tap(100, 100)
time.sleep(0.3)
tap(130, 100)
time.sleep(0.5)
capture("test_05_match3_swap")
back_to_hub()

# 6. 黄金矿工
print("[6/17] 黄金矿工测试...")
open_card(6)
time.sleep(0.5)
# 点击右侧发射飞爪按钮
tap(420, 150)
time.sleep(1.0)
capture("test_06_miner_hook")
back_to_hub()

# 7. 极速跑酷
print("[7/17] 极速跑酷测试...")
open_card(7)
time.sleep(0.5)
# 点击跳跃
tap(420, 170)
time.sleep(0.4)
capture("test_07_runner_jump")
back_to_hub()

# 8. 俄罗斯方块
print("[8/17] 俄罗斯方块测试...")
open_card(8)
time.sleep(0.5)
# 点击旋转 (x=450, y=80)
tap(450, 80)
time.sleep(0.3)
# 点击左移
tap(390, 140)
time.sleep(0.3)
# 点击快速下落
tap(450, 190)
time.sleep(0.5)
capture("test_08_tetris_drop")
back_to_hub()

print("第 1 页 8 款游戏测试完成，开始切换第 2 页！")
set_page(2)
capture("test_00_hub_page2")

# 9. 经典贪吃蛇
print("[9/17] 经典贪吃蛇测试...")
open_card(1)
time.sleep(0.5)
# 点击方向键向下 (x=450, y=180)
tap(450, 180)
time.sleep(0.5)
capture("test_09_snake_move")
back_to_hub()

# 10. 跳一跳
print("[10/17] 跳一跳测试...")
open_card(2)
time.sleep(0.5)
# 按下蓄力
tap(280, 130, d=300)
time.sleep(0.8)
capture("test_10_jump_jumped")
back_to_hub()

# 11. 三国华容道
print("[11/17] 三国华容道测试...")
open_card(3)
time.sleep(0.5)
# 轻触下方滑块移动到空位
tap(100, 180)
time.sleep(0.5)
capture("test_11_klotski_move")
back_to_hub()

# 12. 经典推箱子
print("[12/17] 经典推箱子测试...")
open_card(4)
time.sleep(0.5)
# 按方向右键推动
tap(480, 140)
time.sleep(0.5)
capture("test_12_sokoban_pushed")
back_to_hub()

# 13. 五子棋
print("[13/17] 五子棋人机对战测试...")
open_card(5)
time.sleep(0.5)
# 落子天元 (棋盘中心附近 x=135, y=135)
tap(135, 135)
time.sleep(0.8)
capture("test_13_gomoku_ai_reply")
back_to_hub()

# 14. 谷歌小恐龙
print("[14/17] 谷歌小恐龙测试...")
open_card(6)
time.sleep(0.5)
# 点击跳跃躲避障碍
tap(280, 130)
time.sleep(0.5)
capture("test_14_dino_jump")
back_to_hub()

# 15. 马里奥冲关
print("[15/17] 马里奥冲关测试...")
open_card(7)
time.sleep(0.5)
# 点击右行
tap(380, 180)
time.sleep(0.3)
# 点击跳跃
tap(480, 180)
time.sleep(0.5)
capture("test_15_mario_action")
back_to_hub()

# 16. 鹈鹕骑单车
print("[16/17] 鹈鹕骑单车测试...")
open_card(8)
time.sleep(0.5)
# 点击踩脚踏板踏步
tap(450, 180)
time.sleep(0.4)
tap(450, 180)
time.sleep(0.5)
capture("test_16_pelican_pedal")
back_to_hub()

print("=== 全部 16 款小游戏与缩放系统真机自动化测试完毕 ===")
