package main

import (
	"bufio"
	"fmt"
	"os"
	"strconv"
	"strings"
)

type Element struct {
	Num    int
	Sym    string
	Name   string
	EnName string
	Weight string
	Config string
	Group  string
}

var table = []Element{
	{1, "H", "氢", "Hydrogen", "1.008", "1s¹", "非金属"},
	{2, "He", "氦", "Helium", "4.0026", "1s²", "稀有气体"},
	{3, "Li", "锂", "Lithium", "6.94", "[He] 2s¹", "碱金属"},
	{4, "Be", "铍", "Beryllium", "9.0122", "[He] 2s²", "碱土金属"},
	{5, "B", "硼", "Boron", "10.81", "[He] 2s² 2p¹", "类金属"},
	{6, "C", "碳", "Carbon", "12.011", "[He] 2s² 2p²", "非金属"},
	{7, "N", "氮", "Nitrogen", "14.007", "[He] 2s² 2p³", "非金属"},
	{8, "O", "氧", "Oxygen", "15.999", "[He] 2s² 2p⁴", "非金属"},
	{9, "F", "氟", "Fluorine", "18.998", "[He] 2s² 2p⁵", "卤素"},
	{10, "Ne", "氖", "Neon", "20.180", "[He] 2s² 2p⁶", "稀有气体"},
	{11, "Na", "钠", "Sodium", "22.990", "[Ne] 3s¹", "碱金属"},
	{12, "Mg", "镁", "Magnesium", "24.305", "[Ne] 3s²", "碱土金属"},
	{13, "Al", "铝", "Aluminium", "26.982", "[Ne] 3s² 3p¹", "贫金属"},
	{14, "Si", "硅", "Silicon", "28.085", "[Ne] 3s² 3p²", "类金属"},
	{15, "P", "磷", "Phosphorus", "30.974", "[Ne] 3s² 3p³", "非金属"},
	{16, "S", "硫", "Sulfur", "32.06", "[Ne] 3s² 3p⁴", "非金属"},
	{17, "Cl", "氯", "Chlorine", "35.45", "[Ne] 3s² 3p⁵", "卤素"},
	{18, "Ar", "氩", "Argon", "39.948", "[Ne] 3s² 3p⁶", "稀有气体"},
	{19, "K", "钾", "Potassium", "39.098", "[Ar] 4s¹", "碱金属"},
	{20, "Ca", "钙", "Calcium", "40.078", "[Ar] 4s²", "碱土金属"},
	{26, "Fe", "铁", "Iron", "55.845", "[Ar] 3d⁶ 4s²", "过渡金属"},
	{29, "Cu", "铜", "Copper", "63.546", "[Ar] 3d¹⁰ 4s¹", "过渡金属"},
	{30, "Zn", "锌", "Zinc", "65.38", "[Ar] 3d¹⁰ 4s²", "过渡金属"},
	{47, "Ag", "银", "Silver", "107.87", "[Kr] 4d¹⁰ 5s¹", "过渡金属"},
	{79, "Au", "金", "Gold", "196.97", "[Xe] 4f¹⁴ 5d¹⁰ 6s¹", "过渡金属"},
	{80, "Hg", "汞", "Mercury", "200.59", "[Xe] 4f¹⁴ 5d¹⁰ 6s²", "过渡金属"},
	{92, "U", "铀", "Uranium", "238.03", "[Rn] 5f³ 6d¹ 7s²", "锕系金属"},
}

func showElem(e Element) {
	fmt.Println("-------------------------------------------")
	fmt.Printf("\033[1;36m原子序数: %d   符号: %s   名称: %s (%s)\033[0m\n", e.Num, e.Sym, e.Name, e.EnName)
	fmt.Printf("相对原子质量: %s\n", e.Weight)
	fmt.Printf("电子排布:     %s\n", e.Config)
	fmt.Printf("元素类别:     %s\n", e.Group)
	fmt.Println("-------------------------------------------")
}

func search(query string) {
	query = strings.TrimSpace(query)
	if query == "" {
		return
	}
	found := false
	num, _ := strconv.Atoi(query)
	for _, e := range table {
		if (num > 0 && e.Num == num) ||
			strings.EqualFold(e.Sym, query) ||
			strings.Contains(e.Name, query) ||
			strings.Contains(strings.ToLower(e.EnName), strings.ToLower(query)) {
			showElem(e)
			found = true
		}
	}
	if !found {
		fmt.Printf("未找到元素: %s (可尝试输入元素符号如 Fe, 或序号如 26, 或名称如 铁)\n", query)
	}
}

func main() {
	if len(os.Args) > 1 {
		search(os.Args[1])
		return
	}
	fmt.Println("\033[1;33m=== 离线化学元素周期表速查 ===\033[0m")
	fmt.Println("输入元素序号(如 26)、符号(如 Fe)或名称(如 铁)查询 | q 退出")
	reader := bufio.NewReader(os.Stdin)
	for {
		fmt.Print("请输入查询关键词: ")
		line, _ := reader.ReadString('\n')
		cmd := strings.TrimSpace(line)
		if cmd == "q" || cmd == "quit" || cmd == "exit" {
			break
		}
		if cmd != "" {
			search(cmd)
		}
	}
}
