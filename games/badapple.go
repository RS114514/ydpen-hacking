package main

import (
	"fmt"
	"time"
)

var frames = []string{
`
   .---.
  /     \     Bad Apple!
 ( () () )   字符动画演播
  \  _  /    词典笔 ASCII Demo
   '-.-'
`,
`
    .--.
   /    \
  |  ..  |    =======>
   \ -- /
    '--'
`,
`
       /\
      /  \       ♫ 流れてく時の中ででも
     /    \      気だるさがほらグルグル廻って
    (  ><  )
     \ -- /
      '--'
`,
`
   \  /
  __\/__
  \    /        私から動くことが怖くて
   |  |         戸惑う隙間も作れなくて
  /    \
`,
`
    .---.
   /  o  \       変わっていく世界の中で
  (   O   )      私だけが取り残されて
   \  -  /
    '---'
`,
`
     *  .  *
   .  *  .  *   ♪ Bad Apple!! 字符动画演示完毕
     *  .  *    (可随心播放字符画与帧动画)
`}

func main() {
	fmt.Print("\033[H\033[2J")
	for i := 0; i < len(frames); i++ {
		fmt.Print("\033[H\033[2J")
		fmt.Printf("\033[1;36m[Bad Apple!! ASCII 演示 - 帧 %d/%d]\033[0m\n", i+1, len(frames))
		fmt.Println(frames[i])
		time.Sleep(1200 * time.Millisecond)
	}
	fmt.Println("\n播放结束。")
}
