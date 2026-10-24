package main

import (
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"os"
	"path/filepath"
	"strings"
	"time"
)

type FileItem struct {
	Name    string `json:"name"`
	Path    string `json:"path"`
	IsDir   bool   `json:"is_dir"`
	Size    int64  `json:"size"`
	SizeStr string `json:"size_str"`
	ModTime string `json:"mod_time"`
}

type FSHandler struct {
	rootDir string
}

func NewFSHandler(rootDir string) *FSHandler {
	if rootDir == "" {
		rootDir = "/userdisk/Favorite"
	}
	_ = os.MkdirAll(rootDir, 0755)
	return &FSHandler{rootDir: filepath.Clean(rootDir)}
}

func (h *FSHandler) safePath(rel string) (string, error) {
	rel = filepath.Clean("/" + rel)
	rel = strings.TrimPrefix(rel, "/")
	target := filepath.Join(h.rootDir, rel)
	if !strings.HasPrefix(target, h.rootDir) {
		return "", fmt.Errorf("非法路径访问")
	}
	return target, nil
}

func (h *FSHandler) HandleList(w http.ResponseWriter, r *http.Request) {
	rel := r.URL.Query().Get("path")
	fullPath, err := h.safePath(rel)
	if err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	entries, err := os.ReadDir(fullPath)
	if err != nil {
		http.Error(w, fmt.Sprintf("无法读取目录: %v", err), http.StatusInternalServerError)
		return
	}

	var dirs []FileItem
	var files []FileItem

	for _, entry := range entries {
		info, err := entry.Info()
		if err != nil {
			continue
		}
		itemPath := filepath.Join(rel, entry.Name())
		item := FileItem{
			Name:    entry.Name(),
			Path:    itemPath,
			IsDir:   entry.IsDir(),
			Size:    info.Size(),
			SizeStr: FormatBytes(info.Size()),
			ModTime: info.ModTime().Format("2006-01-02 15:04"),
		}
		if entry.IsDir() {
			item.SizeStr = "-"
			dirs = append(dirs, item)
		} else {
			files = append(files, item)
		}
	}

	// 目录在前，文件在后
	result := append(dirs, files...)
	resp := map[string]interface{}{
		"ok":      true,
		"root":    h.rootDir,
		"cur":     rel,
		"entries": result,
	}

	w.Header().Set("Content-Type", "application/json; charset=utf-8")
	_ = json.NewEncoder(w).Encode(resp)
}

func (h *FSHandler) HandleUpload(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "仅支持 POST", http.StatusMethodNotAllowed)
		return
	}

	rel := r.URL.Query().Get("path")
	targetDir, err := h.safePath(rel)
	if err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}
	_ = os.MkdirAll(targetDir, 0755)

	// 最大 1GB 上传支持
	err = r.ParseMultipartForm(32 << 20)
	if err != nil {
		http.Error(w, fmt.Sprintf("解析表单失败: %v", err), http.StatusBadRequest)
		return
	}

	files := r.MultipartForm.File["files"]
	uploadedCount := 0

	for _, fh := range files {
		file, err := fh.Open()
		if err != nil {
			continue
		}

		baseName := filepath.Base(fh.Filename)
		destPath := filepath.Join(targetDir, baseName)

		// 重名自动避免覆盖
		if _, err := os.Stat(destPath); err == nil {
			ext := filepath.Ext(baseName)
			nameOnly := strings.TrimSuffix(baseName, ext)
			destPath = filepath.Join(targetDir, fmt.Sprintf("%s_%d%s", nameOnly, time.Now().Unix(), ext))
		}

		outFile, err := os.Create(destPath)
		if err != nil {
			file.Close()
			continue
		}

		_, err = io.Copy(outFile, file)
		outFile.Close()
		file.Close()
		if err == nil {
			uploadedCount++
		}
	}

	w.Header().Set("Content-Type", "application/json; charset=utf-8")
	_ = json.NewEncoder(w).Encode(map[string]interface{}{
		"ok":    true,
		"count": uploadedCount,
	})
}

func (h *FSHandler) HandleMkdir(w http.ResponseWriter, r *http.Request) {
	rel := r.URL.Query().Get("path")
	name := strings.TrimSpace(r.URL.Query().Get("name"))
	if name == "" {
		http.Error(w, "文件夹名不能为空", http.StatusBadRequest)
		return
	}

	targetDir, err := h.safePath(filepath.Join(rel, name))
	if err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	err = os.MkdirAll(targetDir, 0755)
	w.Header().Set("Content-Type", "application/json; charset=utf-8")
	_ = json.NewEncoder(w).Encode(map[string]interface{}{
		"ok":  err == nil,
		"msg": fmt.Sprintf("%v", err),
	})
}

func (h *FSHandler) HandleDelete(w http.ResponseWriter, r *http.Request) {
	rel := r.URL.Query().Get("path")
	targetPath, err := h.safePath(rel)
	if err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	err = os.RemoveAll(targetPath)
	w.Header().Set("Content-Type", "application/json; charset=utf-8")
	_ = json.NewEncoder(w).Encode(map[string]interface{}{
		"ok":  err == nil,
		"msg": fmt.Sprintf("%v", err),
	})
}

func (h *FSHandler) HandleDownload(w http.ResponseWriter, r *http.Request) {
	rel := strings.TrimPrefix(r.URL.Path, "/files/")
	targetPath, err := h.safePath(rel)
	if err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	info, err := os.Stat(targetPath)
	if err != nil || info.IsDir() {
		http.NotFound(w, r)
		return
	}

	w.Header().Set("Access-Control-Allow-Origin", "*")
	http.ServeFile(w, r, targetPath)
}
