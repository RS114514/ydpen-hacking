package main

import (
	"bufio"
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"os"
	"strings"
	"time"
)

const ConfPath = "/userdisk/ai.conf"

type Config struct {
	ApiKey  string `json:"api_key"`
	BaseUrl string `json:"base_url"`
	Model   string `json:"model"`
}

func loadConfig() Config {
	c := Config{
		BaseUrl: "https://api.deepseek.com/chat/completions",
		Model:   "deepseek-chat",
	}
	data, err := os.ReadFile(ConfPath)
	if err == nil {
		lines := strings.Split(string(data), "\n")
		for _, l := range lines {
			l = strings.TrimSpace(l)
			if strings.HasPrefix(l, "#") || l == "" {
				continue
			}
			parts := strings.SplitN(l, "=", 2)
			if len(parts) == 2 {
				k, v := strings.TrimSpace(parts[0]), strings.TrimSpace(parts[1])
				switch k {
				case "API_KEY":
					c.ApiKey = v
				case "BASE_URL":
					c.BaseUrl = v
				case "MODEL":
					c.Model = v
				}
			}
		}
	}
	return c
}

type Message struct {
	Role    string `json:"role"`
	Content string `json:"content"`
}

type RequestBody struct {
	Model    string    `json:"model"`
	Messages []Message `json:"messages"`
	Stream   bool      `json:"stream"`
}

type StreamDelta struct {
	Content string `json:"content"`
}

type StreamChoice struct {
	Delta StreamDelta `json:"delta"`
}

type StreamResponse struct {
	Choices []StreamChoice `json:"choices"`
}

func ask(cfg Config, history *[]Message, question string) error {
	*history = append(*history, Message{Role: "user", Content: question})
	reqBody := RequestBody{
		Model:    cfg.Model,
		Messages: *history,
		Stream:   true,
	}
	bs, _ := json.Marshal(reqBody)

	req, err := http.NewRequest("POST", cfg.BaseUrl, bytes.NewReader(bs))
	if err != nil {
		return err
	}
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Authorization", "Bearer "+cfg.ApiKey)

	client := &http.Client{Timeout: 60 * time.Second}
	resp, err := client.Do(req)
	if err != nil {
		return err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		b, _ := io.ReadAll(resp.Body)
		return fmt.Errorf("HTTP %d: %s", resp.StatusCode, string(b))
	}

	reader := bufio.NewReader(resp.Body)
	var fullReply strings.Builder
	fmt.Print("\033[1;32mAI: \033[0m")
	for {
		line, err := reader.ReadString('\n')
		if err != nil {
			break
		}
		line = strings.TrimSpace(line)
		if strings.HasPrefix(line, "data: ") {
			data := strings.TrimPrefix(line, "data: ")
			if data == "[DONE]" {
				break
			}
			var sr StreamResponse
			if err := json.Unmarshal([]byte(data), &sr); err == nil && len(sr.Choices) > 0 {
				txt := sr.Choices[0].Delta.Content
				fmt.Print(txt)
				fullReply.WriteString(txt)
			}
		}
	}
	fmt.Println()
	*history = append(*history, Message{Role: "assistant", Content: fullReply.String()})
	return nil
}

func main() {
	cfg := loadConfig()
	if cfg.ApiKey == "" {
		fmt.Println("\033[1;33m=== 词典笔大模型 AI 对话助手 ===\033[0m")
		fmt.Println("提示: 尚未配置 API Key。请在 /userdisk/ai.conf 中填写配置，例如:")
		fmt.Println("  API_KEY=sk-xxxx")
		fmt.Println("  MODEL=deepseek-chat")
		fmt.Println("  BASE_URL=https://api.deepseek.com/chat/completions")
		fmt.Println("支持任何 OpenAI 兼容格式接口 (DeepSeek、Kimi、通义千问、OpenAI 等)。")
		if len(os.Args) > 1 {
			fmt.Println("\n未配置 API Key，无法发送查询。")
		}
		return
	}

	var history []Message
	history = append(history, Message{
		Role:    "system",
		Content: "你是运行在有道词典笔上的便携AI助手。词典笔屏幕较小，请保持回答简明清晰，重点突出。",
	})

	if len(os.Args) > 1 {
		q := strings.Join(os.Args[1:], " ")
		fmt.Printf("提问: %s\n", q)
		if err := ask(cfg, &history, q); err != nil {
			fmt.Printf("请求出错: %v\n", err)
		}
		return
	}

	fmt.Println("\033[1;36m=== 词典笔 AI 深度对话助手 (输入 q 退出) ===\033[0m")
	reader := bufio.NewReader(os.Stdin)
	for {
		fmt.Print("\n\033[1;34m你: \033[0m")
		line, _ := reader.ReadString('\n')
		q := strings.TrimSpace(line)
		if q == "q" || q == "quit" || q == "exit" {
			fmt.Println("退出对话。")
			break
		}
		if q == "" {
			continue
		}
		if err := ask(cfg, &history, q); err != nil {
			fmt.Printf("请求出错: %v\n", err)
		}
	}
}
