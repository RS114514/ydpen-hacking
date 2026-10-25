import Foundation
import CoreGraphics
import ImageIO
import UniformTypeIdentifiers

let targetW = 960
let targetH = 540

let projectDir = "/Users/fuzihao/.gemini/antigravity/scratch/ydpen/senren_banka"
let chapterAllPath = "\(projectDir)/app/data/chapter_all.js"
let sourceDir = "/Volumes/500GB/千恋万花_移植资源库/assets_ready/bg/bgimage"
let outDir = "\(projectDir)/assets/bg_hd"

try? FileManager.default.createDirectory(atPath: outDir, withIntermediateDirectories: true, attributes: nil)

guard let chapterText = try? String(contentsOfFile: chapterAllPath, encoding: .utf8) else {
    print("Cannot read chapter_all.js")
    exit(1)
}

// 提取所有引用的背景名
let regex = try! NSRegularExpression(pattern: "\\[\\s*\\d+\\s*,\\s*\"[^\"]*\"\\s*,\\s*\"[^\"]*\"\\s*,\\s*(?:\"[^\"]*\"|null)\\s*,\\s*\"([^\"]+)\"", options: [])
let matches = regex.matches(in: chapterText, options: [], range: NSRange(location: 0, length: chapterText.utf16.count))
var bgs = Set<String>()
for m in matches {
    if let r = Range(m.range(at: 1), in: chapterText) {
        let name = String(chapterText[r])
        if name != "画面_黒" && name != "画面_白" {
            bgs.insert(name)
        }
    }
}

print("发现 \(bgs.count) 个剧本背景需要高清化处理。")

let sourceFiles = (try? FileManager.default.contentsOfDirectory(atPath: sourceDir)) ?? []
var sourceMap: [String: String] = [:]
for f in sourceFiles {
    if f.hasPrefix("._") { continue }
    let nfc = f.precomposedStringWithCanonicalMapping
    let base = (nfc as NSString).deletingPathExtension.lowercased()
    sourceMap[base] = "\(sourceDir)/\(f)"
}

let colorSpace = CGColorSpaceCreateDeviceRGB()
var count = 0

for bgName in bgs.sorted() {
    let nfcName = bgName.precomposedStringWithCanonicalMapping
    let key = nfcName.lowercased()
    var srcPath = sourceMap[key]
    if srcPath == nil {
        for (k, v) in sourceMap {
            if k.contains(key) || key.contains(k) {
                srcPath = v
                break
            }
        }
    }

    guard let foundPath = srcPath else {
        print("未找到源图: \(bgName)")
        continue
    }

    let srcUrl = URL(fileURLWithPath: foundPath)
    guard let src = CGImageSourceCreateWithURL(srcUrl as CFURL, nil),
          let origImg = CGImageSourceCreateImageAtIndex(src, 0, nil) else {
        print("解码失败: \(foundPath)")
        continue
    }

    guard let ctx = CGContext(data: nil,
                              width: targetW,
                              height: targetH,
                              bitsPerComponent: 8,
                              bytesPerRow: targetW * 4,
                              space: colorSpace,
                              bitmapInfo: CGImageAlphaInfo.premultipliedLast.rawValue) else {
        continue
    }
    ctx.interpolationQuality = .high

    let rect = CGRect(x: 0, y: 0, width: targetW, height: targetH)
    ctx.draw(origImg, in: rect)

    guard let resizedImg = ctx.makeImage() else { continue }

    let outPath = "\(outDir)/\(bgName).png"
    let outUrl = URL(fileURLWithPath: outPath)
    guard let dest = CGImageDestinationCreateWithURL(outUrl as CFURL, UTType.png.identifier as CFString, 1, nil) else {
        continue
    }
    CGImageDestinationAddImage(dest, resizedImg, nil)
    CGImageDestinationFinalize(dest)

    count += 1
    let attrs = try? FileManager.default.attributesOfItem(atPath: outPath)
    let sz = (attrs?[.size] as? Int) ?? 0
    print("[\(count)/\(bgs.count)] 高清生成: \(bgName).png (\(sz / 1024) KB) [\(origImg.width)x\(origImg.height) -> \(targetW)x\(targetH)]")
}

print("=== 48 张高清背景图批量生成完毕！===")
