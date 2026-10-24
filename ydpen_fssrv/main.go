package main

import (
	"archive/zip"
	_ "embed"
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net"
	"net/http"
	"net/url"
	"os"
	"path/filepath"
	"sort"
	"strconv"
	"strings"
	"sync"
	"time"

	"github.com/hirochachacha/go-smb2"
	"golang.org/x/net/webdav"
)

//go:embed web/index.html
var indexHTML []byte

var rootDir string

type FileItem struct {
	Name       string `json:"name"`
	Path       string `json:"path"`
	IsDir      bool   `json:"isDir"`
	Size       int64  `json:"size"`
	SizeStr    string `json:"sizeStr"`
	ModTime    int64  `json:"modTime"`
	ModTimeStr string `json:"modTimeStr"`
}

type ApiResponse struct {
	Ok    bool        `json:"ok"`
	Error string      `json:"error,omitempty"`
	Data  interface{} `json:"data,omitempty"`
	Items []FileItem  `json:"items,omitempty"`
}

func formatBytes(b int64) string {
	if b == 0 {
		return "0 B"
	}
	const unit = 1024
	if b < unit {
		return fmt.Sprintf("%d B", b)
	}
	div, exp := int64(unit), 0
	for n := b / unit; n >= unit; n /= unit {
		div *= unit
		exp++
	}
	units := []string{"KB", "MB", "GB", "TB"}
	return fmt.Sprintf("%.1f %s", float64(b)/float64(div), units[exp])
}

func sendJSON(w http.ResponseWriter, status int, resp ApiResponse) {
	w.Header().Set("Content-Type", "application/json; charset=utf-8")
	w.WriteHeader(status)
	json.NewEncoder(w).Encode(resp)
}

func sendError(w http.ResponseWriter, status int, msg string) {
	sendJSON(w, status, ApiResponse{Ok: false, Error: msg})
}

func sendSuccess(w http.ResponseWriter, data interface{}) {
	sendJSON(w, http.StatusOK, ApiResponse{Ok: true, Data: data})
}

func resolveSafePath(rel string) (string, error) {
	cleanRel := filepath.Clean("/" + rel)
	cleanRel = strings.TrimPrefix(cleanRel, "/")
	fullPath := filepath.Join(rootDir, cleanRel)

	absRoot, err := filepath.Abs(rootDir)
	if err != nil {
		return "", err
	}
	absTarget, err := filepath.Abs(fullPath)
	if err != nil {
		return "", err
	}

	if absTarget != absRoot && !strings.HasPrefix(absTarget, absRoot+string(filepath.Separator)) {
		return "", fmt.Errorf("非法路径访问")
	}
	return absTarget, nil
}

func handleIndex(w http.ResponseWriter, r *http.Request) {
	if r.URL.Path != "/" {
		http.NotFound(w, r)
		return
	}
	w.Header().Set("Content-Type", "text/html; charset=utf-8")
	w.WriteHeader(http.StatusOK)
	w.Write(indexHTML)
}

func handleList(w http.ResponseWriter, r *http.Request) {
	reqPath := r.URL.Query().Get("path")
	targetDir, err := resolveSafePath(reqPath)
	if err != nil {
		sendError(w, http.StatusBadRequest, err.Error())
		return
	}

	entries, err := os.ReadDir(targetDir)
	if err != nil {
		sendError(w, http.StatusInternalServerError, "读取目录失败: "+err.Error())
		return
	}

	absRoot, _ := filepath.Abs(rootDir)
	items := make([]FileItem, 0, len(entries))

	for _, entry := range entries {
		if strings.HasPrefix(entry.Name(), ".nas_") {
			continue
		}
		info, err := entry.Info()
		if err != nil {
			continue
		}
		full := filepath.Join(targetDir, entry.Name())
		rel, err := filepath.Rel(absRoot, full)
		if err != nil {
			rel = entry.Name()
		}
		rel = filepath.ToSlash(rel)

		items = append(items, FileItem{
			Name:       entry.Name(),
			Path:       rel,
			IsDir:      entry.IsDir(),
			Size:       info.Size(),
			SizeStr:    formatBytes(info.Size()),
			ModTime:    info.ModTime().Unix(),
			ModTimeStr: info.ModTime().Format("2006-01-02 15:04"),
		})
	}

	sort.Slice(items, func(i, j int) bool {
		if items[i].IsDir != items[j].IsDir {
			return items[i].IsDir
		}
		return strings.ToLower(items[i].Name) < strings.ToLower(items[j].Name)
	})

	sendJSON(w, http.StatusOK, ApiResponse{Ok: true, Items: items})
}

func handleMkdir(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		sendError(w, http.StatusMethodNotAllowed, "只支持 POST 请求")
		return
	}

	var req struct {
		Path string `json:"path"`
		Name string `json:"name"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		sendError(w, http.StatusBadRequest, "解析参数失败: "+err.Error())
		return
	}

	name := strings.TrimSpace(req.Name)
	if name == "" || strings.ContainsAny(name, "/\\") || name == "." || name == ".." {
		sendError(w, http.StatusBadRequest, "目录名无效")
		return
	}

	parentDir, err := resolveSafePath(req.Path)
	if err != nil {
		sendError(w, http.StatusBadRequest, err.Error())
		return
	}

	newDir := filepath.Join(parentDir, name)
	if _, err := os.Stat(newDir); err == nil {
		sendError(w, http.StatusConflict, "同名文件夹或文件已存在")
		return
	}

	if err := os.MkdirAll(newDir, 0755); err != nil {
		sendError(w, http.StatusInternalServerError, "创建目录失败: "+err.Error())
		return
	}

	sendSuccess(w, nil)
}

func handleDelete(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		sendError(w, http.StatusMethodNotAllowed, "只支持 POST 请求")
		return
	}

	var req struct {
		Paths []string `json:"paths"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		sendError(w, http.StatusBadRequest, "解析参数失败: "+err.Error())
		return
	}

	absRoot, _ := filepath.Abs(rootDir)
	var errMsgs []string

	for _, p := range req.Paths {
		target, err := resolveSafePath(p)
		if err != nil {
			errMsgs = append(errMsgs, err.Error())
			continue
		}
		if target == absRoot {
			errMsgs = append(errMsgs, "禁止删除根目录")
			continue
		}
		if err := os.RemoveAll(target); err != nil {
			errMsgs = append(errMsgs, fmt.Sprintf("删除 %s 失败: %v", filepath.Base(target), err))
		}
	}

	if len(errMsgs) > 0 {
		sendError(w, http.StatusInternalServerError, strings.Join(errMsgs, "; "))
		return
	}

	sendSuccess(w, nil)
}

func handleRename(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		sendError(w, http.StatusMethodNotAllowed, "只支持 POST 请求")
		return
	}

	var req struct {
		Path    string `json:"path"`
		NewName string `json:"newName"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		sendError(w, http.StatusBadRequest, "解析参数失败: "+err.Error())
		return
	}

	newName := strings.TrimSpace(req.NewName)
	if newName == "" || strings.ContainsAny(newName, "/\\") || newName == "." || newName == ".." {
		sendError(w, http.StatusBadRequest, "新文件名无效")
		return
	}

	sourcePath, err := resolveSafePath(req.Path)
	if err != nil {
		sendError(w, http.StatusBadRequest, err.Error())
		return
	}

	absRoot, _ := filepath.Abs(rootDir)
	if sourcePath == absRoot {
		sendError(w, http.StatusBadRequest, "禁止重命名根目录")
		return
	}

	parentDir := filepath.Dir(sourcePath)
	destPath := filepath.Join(parentDir, newName)

	if _, err := os.Stat(destPath); err == nil {
		sendError(w, http.StatusConflict, "同名文件已存在")
		return
	}

	if err := os.Rename(sourcePath, destPath); err != nil {
		sendError(w, http.StatusInternalServerError, "重命名失败: "+err.Error())
		return
	}

	sendSuccess(w, nil)
}

func handleMove(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		sendError(w, http.StatusMethodNotAllowed, "只支持 POST 请求")
		return
	}

	var req struct {
		Src []string `json:"src"`
		Dst string   `json:"dst"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		sendError(w, http.StatusBadRequest, "解析参数失败: "+err.Error())
		return
	}

	dstDir, err := resolveSafePath(req.Dst)
	if err != nil {
		sendError(w, http.StatusBadRequest, "目标路径非法: "+err.Error())
		return
	}

	dstInfo, err := os.Stat(dstDir)
	if err != nil || !dstInfo.IsDir() {
		sendError(w, http.StatusBadRequest, "目标路径不是有效文件夹")
		return
	}

	var errMsgs []string
	for _, src := range req.Src {
		srcPath, err := resolveSafePath(src)
		if err != nil {
			errMsgs = append(errMsgs, err.Error())
			continue
		}
		base := filepath.Base(srcPath)
		target := filepath.Join(dstDir, base)

		if srcPath == target {
			continue
		}
		if strings.HasPrefix(target, srcPath+string(filepath.Separator)) {
			errMsgs = append(errMsgs, fmt.Sprintf("无法将目录 %s 移动到其子目录中", base))
			continue
		}

		if err := moveOrCopyDelete(srcPath, target); err != nil {
			errMsgs = append(errMsgs, fmt.Sprintf("移动 %s 失败: %v", base, err))
		}
	}

	if len(errMsgs) > 0 {
		sendError(w, http.StatusInternalServerError, strings.Join(errMsgs, "; "))
		return
	}
	sendSuccess(w, nil)
}

func handleCopy(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		sendError(w, http.StatusMethodNotAllowed, "只支持 POST 请求")
		return
	}

	var req struct {
		Src []string `json:"src"`
		Dst string   `json:"dst"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		sendError(w, http.StatusBadRequest, "解析参数失败: "+err.Error())
		return
	}

	dstDir, err := resolveSafePath(req.Dst)
	if err != nil {
		sendError(w, http.StatusBadRequest, "目标路径非法: "+err.Error())
		return
	}

	dstInfo, err := os.Stat(dstDir)
	if err != nil || !dstInfo.IsDir() {
		sendError(w, http.StatusBadRequest, "目标路径不是有效文件夹")
		return
	}

	var errMsgs []string
	for _, src := range req.Src {
		srcPath, err := resolveSafePath(src)
		if err != nil {
			errMsgs = append(errMsgs, err.Error())
			continue
		}
		base := filepath.Base(srcPath)
		target := filepath.Join(dstDir, base)

		if srcPath == target {
			target = generateCopyName(dstDir, base)
		}

		if err := copyRecursive(srcPath, target); err != nil {
			errMsgs = append(errMsgs, fmt.Sprintf("复制 %s 失败: %v", base, err))
		}
	}

	if len(errMsgs) > 0 {
		sendError(w, http.StatusInternalServerError, strings.Join(errMsgs, "; "))
		return
	}
	sendSuccess(w, nil)
}

func generateCopyName(dir, base string) string {
	ext := filepath.Ext(base)
	nameWithoutExt := strings.TrimSuffix(base, ext)
	for i := 1; ; i++ {
		newName := fmt.Sprintf("%s - 副本(%d)%s", nameWithoutExt, i, ext)
		target := filepath.Join(dir, newName)
		if _, err := os.Stat(target); os.IsNotExist(err) {
			return target
		}
	}
}

func moveOrCopyDelete(src, dst string) error {
	if err := os.Rename(src, dst); err == nil {
		return nil
	}
	if err := copyRecursive(src, dst); err != nil {
		return err
	}
	return os.RemoveAll(src)
}

func copyRecursive(src, dst string) error {
	info, err := os.Stat(src)
	if err != nil {
		return err
	}

	if info.IsDir() {
		if err := os.MkdirAll(dst, info.Mode()); err != nil {
			return err
		}
		entries, err := os.ReadDir(src)
		if err != nil {
			return err
		}
		for _, entry := range entries {
			s := filepath.Join(src, entry.Name())
			d := filepath.Join(dst, entry.Name())
			if err := copyRecursive(s, d); err != nil {
				return err
			}
		}
		return nil
	}

	sFile, err := os.Open(src)
	if err != nil {
		return err
	}
	defer sFile.Close()

	dFile, err := os.OpenFile(dst, os.O_CREATE|os.O_WRONLY|os.O_TRUNC, info.Mode())
	if err != nil {
		return err
	}
	defer dFile.Close()

	_, err = io.Copy(dFile, sFile)
	return err
}

func handleUpload(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		sendError(w, http.StatusMethodNotAllowed, "只支持 POST 请求")
		return
	}

	targetDirRel := r.URL.Query().Get("path")
	targetDir, err := resolveSafePath(targetDirRel)
	if err != nil {
		sendError(w, http.StatusBadRequest, err.Error())
		return
	}

	mr, err := r.MultipartReader()
	if err != nil {
		sendError(w, http.StatusBadRequest, "无法解析上传数据: "+err.Error())
		return
	}

	for {
		part, err := mr.NextPart()
		if err == io.EOF {
			break
		}
		if err != nil {
			sendError(w, http.StatusBadRequest, "读取分段失败: "+err.Error())
			return
		}

		filename := part.FileName()
		if filename == "" {
			continue
		}

		filename = filepath.Base(filename)
		if filename == "." || filename == ".." {
			continue
		}

		savePath := filepath.Join(targetDir, filename)
		out, err := os.OpenFile(savePath, os.O_CREATE|os.O_WRONLY|os.O_TRUNC, 0644)
		if err != nil {
			part.Close()
			sendError(w, http.StatusInternalServerError, "创建文件失败: "+err.Error())
			return
		}

		_, copyErr := io.Copy(out, part)
		out.Close()
		part.Close()

		if copyErr != nil {
			sendError(w, http.StatusInternalServerError, "写入文件内容失败: "+copyErr.Error())
			return
		}
	}

	sendSuccess(w, nil)
}

func handleFiles(w http.ResponseWriter, r *http.Request) {
	prefix := "/files/"
	if !strings.HasPrefix(r.URL.Path, prefix) {
		http.NotFound(w, r)
		return
	}

	rel := strings.TrimPrefix(r.URL.Path, prefix)
	targetPath, err := resolveSafePath(rel)
	if err != nil {
		http.Error(w, "禁止访问", http.StatusForbidden)
		return
	}

	info, err := os.Stat(targetPath)
	if err != nil {
		if os.IsNotExist(err) {
			http.NotFound(w, r)
		} else {
			http.Error(w, err.Error(), http.StatusInternalServerError)
		}
		return
	}

	if info.IsDir() {
		http.Error(w, "无法直接下载目录，请使用打包下载", http.StatusBadRequest)
		return
	}

	filename := filepath.Base(targetPath)
	encodedName := url.PathEscape(filename)
	w.Header().Set("Content-Disposition", fmt.Sprintf("attachment; filename=\"%s\"; filename*=UTF-8''%s", filename, encodedName))
	http.ServeFile(w, r, targetPath)
}

// -----------------------------------------------------------------------------
// 打包下载、压缩与解压模块
// -----------------------------------------------------------------------------

func addPathToZip(zw *zip.Writer, absPath, relInZip string) error {
	info, err := os.Stat(absPath)
	if err != nil {
		return err
	}

	header, err := zip.FileInfoHeader(info)
	if err != nil {
		return err
	}

	header.Name = filepath.ToSlash(relInZip)
	if info.IsDir() {
		header.Name += "/"
	} else {
		header.Method = zip.Deflate
	}

	writer, err := zw.CreateHeader(header)
	if err != nil {
		return err
	}

	if info.IsDir() {
		entries, err := os.ReadDir(absPath)
		if err != nil {
			return err
		}
		for _, e := range entries {
			subAbs := filepath.Join(absPath, e.Name())
			subRel := filepath.Join(relInZip, e.Name())
			if err := addPathToZip(zw, subAbs, subRel); err != nil {
				return err
			}
		}
		return nil
	}

	file, err := os.Open(absPath)
	if err != nil {
		return err
	}
	defer file.Close()

	_, err = io.Copy(writer, file)
	return err
}

func handleArchiveDownload(w http.ResponseWriter, r *http.Request) {
	var paths []string
	if r.Method == http.MethodPost {
		var req struct {
			Paths []string `json:"paths"`
		}
		if err := json.NewDecoder(r.Body).Decode(&req); err == nil {
			paths = req.Paths
		}
	}
	if len(paths) == 0 {
		qPath := r.URL.Query().Get("path")
		if qPath != "" {
			paths = []string{qPath}
		}
	}

	if len(paths) == 0 {
		http.Error(w, "未指定下载路径", http.StatusBadRequest)
		return
	}

	zipName := "archive.zip"
	if len(paths) == 1 {
		zipName = filepath.Base(paths[0]) + ".zip"
	}

	encodedName := url.PathEscape(zipName)
	w.Header().Set("Content-Type", "application/zip")
	w.Header().Set("Content-Disposition", fmt.Sprintf("attachment; filename=\"%s\"; filename*=UTF-8''%s", zipName, encodedName))

	zw := zip.NewWriter(w)
	defer zw.Close()

	for _, p := range paths {
		absPath, err := resolveSafePath(p)
		if err != nil {
			continue
		}
		baseName := filepath.Base(absPath)
		if err := addPathToZip(zw, absPath, baseName); err != nil {
			log.Printf("[zip] 打包写入错误: %v", err)
		}
	}
}

func handleArchiveCompress(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		sendError(w, http.StatusMethodNotAllowed, "只支持 POST 请求")
		return
	}

	var req struct {
		Src     []string `json:"src"`
		Dst     string   `json:"dst"`
		ZipName string   `json:"zipName"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		sendError(w, http.StatusBadRequest, "解析参数失败: "+err.Error())
		return
	}

	zipName := strings.TrimSpace(req.ZipName)
	if zipName == "" {
		zipName = "archive.zip"
	}
	if !strings.HasSuffix(strings.ToLower(zipName), ".zip") {
		zipName += ".zip"
	}

	dstDir, err := resolveSafePath(req.Dst)
	if err != nil {
		sendError(w, http.StatusBadRequest, "目标路径非法: "+err.Error())
		return
	}

	targetZipPath := filepath.Join(dstDir, zipName)
	if _, err := os.Stat(targetZipPath); err == nil {
		sendError(w, http.StatusConflict, "同名压缩包已存在")
		return
	}

	zipFile, err := os.Create(targetZipPath)
	if err != nil {
		sendError(w, http.StatusInternalServerError, "创建压缩文件失败: "+err.Error())
		return
	}
	defer zipFile.Close()

	zw := zip.NewWriter(zipFile)
	var errMsgs []string

	for _, src := range req.Src {
		srcPath, err := resolveSafePath(src)
		if err != nil {
			errMsgs = append(errMsgs, err.Error())
			continue
		}
		base := filepath.Base(srcPath)
		if err := addPathToZip(zw, srcPath, base); err != nil {
			errMsgs = append(errMsgs, fmt.Sprintf("打包 %s 失败: %v", base, err))
		}
	}

	if err := zw.Close(); err != nil {
		sendError(w, http.StatusInternalServerError, "关闭压缩流失败: "+err.Error())
		return
	}

	if len(errMsgs) > 0 {
		sendError(w, http.StatusInternalServerError, strings.Join(errMsgs, "; "))
		return
	}

	sendSuccess(w, map[string]string{"zipFile": zipName})
}

func handleArchiveExtract(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		sendError(w, http.StatusMethodNotAllowed, "只支持 POST 请求")
		return
	}

	var req struct {
		ZipPath string `json:"zipPath"`
		Dst     string `json:"dst"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		sendError(w, http.StatusBadRequest, "解析参数失败: "+err.Error())
		return
	}

	absZipPath, err := resolveSafePath(req.ZipPath)
	if err != nil {
		sendError(w, http.StatusBadRequest, "压缩文件路径非法: "+err.Error())
		return
	}

	dstDir, err := resolveSafePath(req.Dst)
	if err != nil {
		sendError(w, http.StatusBadRequest, "目标路径非法: "+err.Error())
		return
	}

	rZip, err := zip.OpenReader(absZipPath)
	if err != nil {
		sendError(w, http.StatusBadRequest, "无法打开 ZIP 文件: "+err.Error())
		return
	}
	defer rZip.Close()

	for _, f := range rZip.File {
		cleanName := filepath.Clean("/" + f.Name)
		targetPath := filepath.Join(dstDir, cleanName)
		if !strings.HasPrefix(targetPath, dstDir) {
			sendError(w, http.StatusBadRequest, "ZIP 包含非法越界路径: "+f.Name)
			return
		}

		if f.FileInfo().IsDir() {
			os.MkdirAll(targetPath, f.Mode())
			continue
		}

		if err := os.MkdirAll(filepath.Dir(targetPath), 0755); err != nil {
			sendError(w, http.StatusInternalServerError, "创建子目录失败: "+err.Error())
			return
		}

		outFile, err := os.OpenFile(targetPath, os.O_WRONLY|os.O_CREATE|os.O_TRUNC, f.Mode())
		if err != nil {
			sendError(w, http.StatusInternalServerError, "创建解压文件失败: "+err.Error())
			return
		}

		rc, err := f.Open()
		if err != nil {
			outFile.Close()
			sendError(w, http.StatusInternalServerError, "读取压缩项失败: "+err.Error())
			return
		}

		_, err = io.Copy(outFile, rc)
		outFile.Close()
		rc.Close()

		if err != nil {
			sendError(w, http.StatusInternalServerError, "解压写入失败: "+err.Error())
			return
		}
	}

	sendSuccess(w, nil)
}

// -----------------------------------------------------------------------------
// NAS SMB 客户端与离线下载引擎
// -----------------------------------------------------------------------------

type NasConfig struct {
	Host     string `json:"host"`
	Share    string `json:"share"`
	User     string `json:"user"`
	Password string `json:"password"`
}

type NasTask struct {
	ID          string    `json:"id"`
	Type        string    `json:"type"` // "smb" or "http"
	SmbHost     string    `json:"smbHost,omitempty"`
	SmbShare    string    `json:"smbShare,omitempty"`
	SmbUser     string    `json:"smbUser,omitempty"`
	SmbPass     string    `json:"smbPass,omitempty"`
	RemotePath  string    `json:"remotePath"`
	FileName    string    `json:"fileName"`
	TargetDir   string    `json:"targetDir"`
	TotalBytes  int64     `json:"totalBytes"`
	LoadedBytes int64     `json:"loadedBytes"`
	Status      string    `json:"status"` // queued, downloading, paused, completed, failed, canceled
	Speed       int64     `json:"speed"`
	LastError   string    `json:"lastError,omitempty"`
	CreatedAt   time.Time `json:"createdAt"`
	cancelFn    func()    `json:"-"`
}

type NasManager struct {
	mu         sync.Mutex
	config     NasConfig
	tasks      []*NasTask
	cfgFile    string
	tasksFile  string
	wakeChan   chan struct{}
}

var globalNasMgr *NasManager

func newNasManager(cfgFile, tasksFile string) *NasManager {
	mgr := &NasManager{
		cfgFile:   cfgFile,
		tasksFile: tasksFile,
		wakeChan:  make(chan struct{}, 1),
	}
	mgr.loadConfig()
	mgr.loadTasks()
	go mgr.workerLoop()
	return mgr
}

func (m *NasManager) loadConfig() {
	m.mu.Lock()
	defer m.mu.Unlock()
	data, err := os.ReadFile(m.cfgFile)
	if err == nil {
		_ = json.Unmarshal(data, &m.config)
	}
}

func (m *NasManager) saveConfig() {
	m.mu.Lock()
	defer m.mu.Unlock()
	data, _ := json.MarshalIndent(m.config, "", "  ")
	_ = os.WriteFile(m.cfgFile, data, 0644)
}

func (m *NasManager) loadTasks() {
	m.mu.Lock()
	defer m.mu.Unlock()
	data, err := os.ReadFile(m.tasksFile)
	if err != nil {
		return
	}
	var list []*NasTask
	if err := json.Unmarshal(data, &list); err == nil {
		for _, t := range list {
			if t.Status == "downloading" {
				t.Status = "queued"
			}
		}
		m.tasks = list
	}
}

func (m *NasManager) saveTasks() {
	m.mu.Lock()
	defer m.mu.Unlock()
	data, err := json.MarshalIndent(m.tasks, "", "  ")
	if err != nil {
		return
	}
	_ = os.WriteFile(m.tasksFile, data, 0644)
}

// connectSmb 辅助建立 SMB 会话
func (m *NasManager) connectSmb(cfg NasConfig) (*smb2.Session, *smb2.Share, error) {
	host := cfg.Host
	if !strings.Contains(host, ":") {
		host += ":445"
	}

	conn, err := net.DialTimeout("tcp", host, 5*time.Second)
	if err != nil {
		return nil, nil, fmt.Errorf("连接 NAS 失败: %v", err)
	}

	d := &smb2.Dialer{
		Initiator: &smb2.NTLMInitiator{
			User:     cfg.User,
			Password: cfg.Password,
			Domain:   "",
		},
	}

	s, err := d.Dial(conn)
	if err != nil {
		conn.Close()
		return nil, nil, fmt.Errorf("NAS 鉴权登录失败: %v", err)
	}

	share, err := s.Mount(cfg.Share)
	if err != nil {
		s.Logoff()
		conn.Close()
		return nil, nil, fmt.Errorf("挂载共享文件夹 [%s] 失败: %v", cfg.Share, err)
	}

	return s, share, nil
}

func (m *NasManager) AddSmbTask(cfg NasConfig, remotePath, targetDir, customName string) (*NasTask, error) {
	fileName := customName
	if fileName == "" {
		fileName = filepath.Base(filepath.ToSlash(remotePath))
	}

	absTargetDir, err := resolveSafePath(targetDir)
	if err != nil {
		return nil, err
	}
	_ = os.MkdirAll(absTargetDir, 0755)

	task := &NasTask{
		ID:          fmt.Sprintf("nas_smb_%d_%d", time.Now().UnixNano(), len(m.tasks)+1),
		Type:        "smb",
		SmbHost:     cfg.Host,
		SmbShare:    cfg.Share,
		SmbUser:     cfg.User,
		SmbPass:     cfg.Password,
		RemotePath:  remotePath,
		FileName:    fileName,
		TargetDir:   targetDir,
		Status:      "queued",
		TotalBytes:  0,
		LoadedBytes: 0,
		CreatedAt:   time.Now(),
	}

	m.mu.Lock()
	m.tasks = append([]*NasTask{task}, m.tasks...)
	m.mu.Unlock()

	m.saveTasks()

	select {
	case m.wakeChan <- struct{}{}:
	default:
	}

	return task, nil
}

func (m *NasManager) GetTasks() []*NasTask {
	m.mu.Lock()
	defer m.mu.Unlock()
	res := make([]*NasTask, len(m.tasks))
	copy(res, m.tasks)
	return res
}

func (m *NasManager) CtrlTask(id, action string) error {
	m.mu.Lock()
	var found *NasTask
	for _, t := range m.tasks {
		if t.ID == id {
			found = t
			break
		}
	}
	m.mu.Unlock()

	if found == nil {
		return fmt.Errorf("任务不存在")
	}

	switch action {
	case "pause":
		if found.Status == "downloading" || found.Status == "queued" {
			found.Status = "paused"
			if found.cancelFn != nil {
				found.cancelFn()
			}
		}
	case "resume":
		if found.Status == "paused" || found.Status == "failed" {
			found.Status = "queued"
			found.LastError = ""
			select {
			case m.wakeChan <- struct{}{}:
			default:
			}
		}
	case "cancel":
		found.Status = "canceled"
		if found.cancelFn != nil {
			found.cancelFn()
		}
	case "delete":
		m.mu.Lock()
		newList := make([]*NasTask, 0, len(m.tasks))
		for _, t := range m.tasks {
			if t.ID == id {
				if t.cancelFn != nil {
					t.cancelFn()
				}
				continue
			}
			newList = append(newList, t)
		}
		m.tasks = newList
		m.mu.Unlock()
	}

	m.saveTasks()
	return nil
}

func (m *NasManager) workerLoop() {
	for {
		m.mu.Lock()
		var nextTask *NasTask
		for _, t := range m.tasks {
			if t.Status == "queued" {
				nextTask = t
				break
			}
		}
		m.mu.Unlock()

		if nextTask == nil {
			time.Sleep(1 * time.Second)
			continue
		}

		if nextTask.Type == "smb" {
			m.executeSmbDownload(nextTask)
		}
		m.saveTasks()
	}
}

func (m *NasManager) executeSmbDownload(task *NasTask) {
	task.Status = "downloading"
	m.saveTasks()

	cfg := NasConfig{
		Host:     task.SmbHost,
		Share:    task.SmbShare,
		User:     task.SmbUser,
		Password: task.SmbPass,
	}

	s, share, err := m.connectSmb(cfg)
	if err != nil {
		task.Status = "failed"
		task.LastError = err.Error()
		return
	}
	defer s.Logoff()
	defer share.Umount()

	cleanRemote := filepath.FromSlash(task.RemotePath)
	cleanRemote = strings.TrimPrefix(cleanRemote, "\\")

	stat, err := share.Stat(cleanRemote)
	if err != nil {
		task.Status = "failed"
		task.LastError = "无法读取远程文件属性: " + err.Error()
		return
	}
	task.TotalBytes = stat.Size()

	absTargetDir, err := resolveSafePath(task.TargetDir)
	if err != nil {
		task.Status = "failed"
		task.LastError = err.Error()
		return
	}

	finalPath := filepath.Join(absTargetDir, task.FileName)
	partPath := finalPath + ".part"

	var existingSize int64 = 0
	if fi, err := os.Stat(partPath); err == nil {
		existingSize = fi.Size()
	}

	remFile, err := share.Open(cleanRemote)
	if err != nil {
		task.Status = "failed"
		task.LastError = "打开远程文件失败: " + err.Error()
		return
	}
	defer remFile.Close()

	if existingSize > 0 {
		_, err := remFile.Seek(existingSize, io.SeekStart)
		if err != nil {
			existingSize = 0
		}
	}
	task.LoadedBytes = existingSize

	fileFlags := os.O_CREATE | os.O_WRONLY
	if existingSize > 0 {
		fileFlags |= os.O_APPEND
	} else {
		fileFlags |= os.O_TRUNC
	}

	localFile, err := os.OpenFile(partPath, fileFlags, 0644)
	if err != nil {
		task.Status = "failed"
		task.LastError = "创建本地临时文件失败: " + err.Error()
		return
	}
	defer localFile.Close()

	buf := make([]byte, 64*1024)
	lastTime := time.Now()
	var lastBytes int64 = task.LoadedBytes

	for {
		if task.Status == "paused" || task.Status == "canceled" {
			return
		}

		n, readErr := remFile.Read(buf)
		if n > 0 {
			_, writeErr := localFile.Write(buf[:n])
			if writeErr != nil {
				task.Status = "failed"
				task.LastError = "写入文件错误: " + writeErr.Error()
				return
			}
			task.LoadedBytes += int64(n)

			now := time.Now()
			elapsed := now.Sub(lastTime).Seconds()
			if elapsed >= 1.0 {
				task.Speed = int64(float64(task.LoadedBytes-lastBytes) / elapsed)
				lastBytes = task.LoadedBytes
				lastTime = now
				m.saveTasks()
			}
		}

		if readErr != nil {
			if readErr == io.EOF {
				break
			}
			task.Status = "failed"
			task.LastError = "读取中断: " + readErr.Error()
			return
		}
	}

	localFile.Close()
	_ = os.Rename(partPath, finalPath)
	task.Status = "completed"
	task.Speed = 0
	m.saveTasks()
}

// -----------------------------------------------------------------------------
// NAS SMB HTTP 路由实现
// -----------------------------------------------------------------------------

func handleNasConfig(w http.ResponseWriter, r *http.Request) {
	if r.Method == http.MethodGet {
		globalNasMgr.mu.Lock()
		cfg := globalNasMgr.config
		globalNasMgr.mu.Unlock()
		sendSuccess(w, cfg)
		return
	}
	if r.Method == http.MethodPost {
		var cfg NasConfig
		if err := json.NewDecoder(r.Body).Decode(&cfg); err != nil {
			sendError(w, http.StatusBadRequest, "解析参数失败: "+err.Error())
			return
		}
		globalNasMgr.mu.Lock()
		globalNasMgr.config = cfg
		globalNasMgr.mu.Unlock()
		globalNasMgr.saveConfig()
		sendSuccess(w, cfg)
		return
	}
	sendError(w, http.StatusMethodNotAllowed, "方法不支持")
}

func handleNasSmbList(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		sendError(w, http.StatusMethodNotAllowed, "只支持 POST 请求")
		return
	}

	var req struct {
		Config NasConfig `json:"config"`
		Path   string    `json:"path"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		sendError(w, http.StatusBadRequest, "解析参数失败: "+err.Error())
		return
	}

	cfg := req.Config
	if cfg.Host == "" {
		globalNasMgr.mu.Lock()
		cfg = globalNasMgr.config
		globalNasMgr.mu.Unlock()
	}

	if cfg.Host == "" || cfg.Share == "" {
		sendError(w, http.StatusBadRequest, "未配置 NAS 地址或共享文件夹名称")
		return
	}

	s, share, err := globalNasMgr.connectSmb(cfg)
	if err != nil {
		sendError(w, http.StatusBadGateway, err.Error())
		return
	}
	defer s.Logoff()
	defer share.Umount()

	subPath := filepath.FromSlash(req.Path)
	subPath = strings.TrimPrefix(subPath, "\\")
	if subPath == "" {
		subPath = "."
	}

	entries, err := share.ReadDir(subPath)
	if err != nil {
		sendError(w, http.StatusInternalServerError, "读取 NAS 目录失败: "+err.Error())
		return
	}

	items := make([]FileItem, 0, len(entries))
	for _, e := range entries {
		name := e.Name()
		if name == "." || name == ".." {
			continue
		}
		relInShare := filepath.ToSlash(filepath.Join(req.Path, name))
		items = append(items, FileItem{
			Name:       name,
			Path:       relInShare,
			IsDir:      e.IsDir(),
			Size:       e.Size(),
			SizeStr:    formatBytes(e.Size()),
			ModTime:    e.ModTime().Unix(),
			ModTimeStr: e.ModTime().Format("2006-01-02 15:04"),
		})
	}

	sort.Slice(items, func(i, j int) bool {
		if items[i].IsDir != items[j].IsDir {
			return items[i].IsDir
		}
		return strings.ToLower(items[i].Name) < strings.ToLower(items[j].Name)
	})

	sendJSON(w, http.StatusOK, ApiResponse{
		Ok:    true,
		Data:  map[string]interface{}{"currentPath": req.Path},
		Items: items,
	})
}

func handleNasSmbDownload(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		sendError(w, http.StatusMethodNotAllowed, "只支持 POST 请求")
		return
	}

	var req struct {
		Config    NasConfig `json:"config"`
		Items     []string  `json:"items"`     // 远程 SMB 路径列表
		TargetDir string    `json:"targetDir"` // 词典笔本地目标目录
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		sendError(w, http.StatusBadRequest, "解析参数失败: "+err.Error())
		return
	}

	cfg := req.Config
	if cfg.Host == "" {
		globalNasMgr.mu.Lock()
		cfg = globalNasMgr.config
		globalNasMgr.mu.Unlock()
	}

	if cfg.Host == "" || cfg.Share == "" {
		sendError(w, http.StatusBadRequest, "未指定有效的 NAS 配置")
		return
	}

	addedCount := 0
	for _, itemPath := range req.Items {
		_, err := globalNasMgr.AddSmbTask(cfg, itemPath, req.TargetDir, "")
		if err == nil {
			addedCount++
		}
	}

	sendSuccess(w, map[string]int{"added": addedCount})
}

func handleNasTasks(w http.ResponseWriter, r *http.Request) {
	tasks := globalNasMgr.GetTasks()
	sendJSON(w, http.StatusOK, ApiResponse{Ok: true, Data: tasks})
}

func handleNasCtrl(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		sendError(w, http.StatusMethodNotAllowed, "只支持 POST 请求")
		return
	}

	var req struct {
		ID     string `json:"id"`
		Action string `json:"action"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		sendError(w, http.StatusBadRequest, "解析参数失败: "+err.Error())
		return
	}

	if err := globalNasMgr.CtrlTask(req.ID, req.Action); err != nil {
		sendError(w, http.StatusBadRequest, err.Error())
		return
	}

	sendSuccess(w, nil)
}

// -----------------------------------------------------------------------------
// 主服务入口
// -----------------------------------------------------------------------------

func main() {
	port := "8080"
	rootDir = "/userdisk/Favorite"

	args := os.Args[1:]
	if len(args) >= 1 {
		if _, err := strconv.Atoi(args[0]); err == nil {
			port = args[0]
		} else {
			rootDir = args[0]
		}
	}
	if len(args) >= 2 {
		rootDir = args[1]
	}

	if err := os.MkdirAll(rootDir, 0755); err != nil {
		log.Printf("[fssrv] 警告: 无法确保根目录存在 %s: %v", rootDir, err)
	}

	cfgFile := filepath.Join(rootDir, ".nas_config.json")
	tasksFile := filepath.Join(rootDir, ".nas_tasks.json")
	globalNasMgr = newNasManager(cfgFile, tasksFile)

	mux := http.NewServeMux()
	mux.HandleFunc("/", handleIndex)
	mux.HandleFunc("/api/list", handleList)
	mux.HandleFunc("/api/mkdir", handleMkdir)
	mux.HandleFunc("/api/delete", handleDelete)
	mux.HandleFunc("/api/rename", handleRename)
	mux.HandleFunc("/api/move", handleMove)
	mux.HandleFunc("/api/copy", handleCopy)
	mux.HandleFunc("/api/upload", handleUpload)
	mux.HandleFunc("/files/", handleFiles)

	// 打包下载与压缩解压
	mux.HandleFunc("/api/archive/download", handleArchiveDownload)
	mux.HandleFunc("/api/archive/compress", handleArchiveCompress)
	mux.HandleFunc("/api/archive/extract", handleArchiveExtract)

	// NAS SMB 连接与任务管理
	mux.HandleFunc("/api/nas/config", handleNasConfig)
	mux.HandleFunc("/api/nas/smb/list", handleNasSmbList)
	mux.HandleFunc("/api/nas/smb/download", handleNasSmbDownload)
	mux.HandleFunc("/api/nas/tasks", handleNasTasks)
	mux.HandleFunc("/api/nas/task/ctrl", handleNasCtrl)

	// WebDAV 网络驱动器挂载服务
	webdavHandler := &webdav.Handler{
		Prefix:     "/webdav/",
		FileSystem: webdav.Dir(rootDir),
		LockSystem: webdav.NewMemLS(),
	}
	mux.HandleFunc("/webdav/", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Access-Control-Allow-Origin", "*")
		w.Header().Set("Access-Control-Allow-Methods", "PROPFIND, PROPPATCH, MKCOL, GET, PUT, DELETE, COPY, MOVE, LOCK, UNLOCK, OPTIONS, HEAD")
		w.Header().Set("Access-Control-Allow-Headers", "Depth, Content-Type, Authorization, Timeout, X-Requested-With")
		if r.Method == http.MethodOptions {
			w.Header().Set("DAV", "1, 2")
			w.Header().Set("Allow", "PROPFIND, PROPPATCH, MKCOL, GET, PUT, DELETE, COPY, MOVE, LOCK, UNLOCK, OPTIONS, HEAD")
			w.WriteHeader(http.StatusOK)
			return
		}
		webdavHandler.ServeHTTP(w, r)
	})

	addr := "0.0.0.0:" + port
	log.Printf("[fssrv] 启动增强型文件互传与挂载服务，监听 %s，共享根目录: %s", addr, rootDir)

	server := &http.Server{
		Addr:         addr,
		Handler:      mux,
		ReadTimeout:  600 * time.Second,
		WriteTimeout: 600 * time.Second,
	}

	if err := server.ListenAndServe(); err != nil {
		log.Fatalf("[fssrv] 服务异常退出: %v", err)
	}
}
