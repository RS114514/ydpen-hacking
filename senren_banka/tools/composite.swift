import Foundation
import CoreGraphics
import ImageIO
import UniformTypeIdentifiers

struct LayerInfo {
    let file: String
    let x: Int
    let y: Int
    let w: Int
    let h: Int
}

let stageW = 780
let stageH = 440

func compositeAndCropToStage(layers: [LayerInfo], cropRect: CGRect, outPath: String) {
    let width = 1800
    let height = 2550
    let colorSpace = CGColorSpaceCreateDeviceRGB()
    guard let ctx = CGContext(data: nil, width: width, height: height, bitsPerComponent: 8, bytesPerRow: width * 4, space: colorSpace, bitmapInfo: CGImageAlphaInfo.premultipliedLast.rawValue) else {
        print("Failed to create context")
        return
    }

    for lay in layers {
        let url = URL(fileURLWithPath: lay.file)
        guard let src = CGImageSourceCreateWithURL(url as CFURL, nil),
              let img = CGImageSourceCreateImageAtIndex(src, 0, nil) else {
            continue
        }
        let rect = CGRect(x: lay.x, y: height - lay.y - lay.h, width: lay.w, height: lay.h)
        ctx.draw(img, in: rect)
    }

    guard let fullImg = ctx.makeImage(),
          let cropped = fullImg.cropping(to: cropRect) else {
        print("Failed to crop \(outPath)")
        return
    }

    // 建立 390x220 标准舞台区透明底画布，人物等比居中绘制，确保两侧长发完整舒展
    guard let outCtx = CGContext(data: nil, width: stageW, height: stageH, bitsPerComponent: 8, bytesPerRow: stageW * 4, space: colorSpace, bitmapInfo: CGImageAlphaInfo.premultipliedLast.rawValue) else {
        return
    }
    outCtx.interpolationQuality = .high

    let scale = Double(stageH) / cropRect.height
    let drawW = cropRect.width * scale
    let drawH = Double(stageH)
    let drawX = (Double(stageW) - drawW) / 2.0
    let drawRect = CGRect(x: drawX, y: 0, width: drawW, height: drawH)

    outCtx.draw(cropped, in: drawRect)
    guard let finalImg = outCtx.makeImage() else { return }

    let outUrl = URL(fileURLWithPath: outPath)
    guard let dest = CGImageDestinationCreateWithURL(outUrl as CFURL, UTType.png.identifier as CFString, 1, nil) else { return }
    CGImageDestinationAddImage(dest, finalImg, nil)
    CGImageDestinationFinalize(dest)
}

// Read JSON spec from argument file
let jsonFile = CommandLine.arguments[1]
let data = try! Data(contentsOf: URL(fileURLWithPath: jsonFile))
if let specs = try? JSONSerialization.jsonObject(with: data) as? [[String: Any]] {
    let total = specs.count
    print("Processing \(total) standing sprites with parallel dispatch (390x220 Stage Canvas)...")
    DispatchQueue.concurrentPerform(iterations: total) { i in
        let spec = specs[i]
        let outPath = spec["out"] as! String
        let cropX = spec["cropX"] as! Double
        let cropY = spec["cropY"] as! Double
        let cropW = spec["cropW"] as! Double
        let cropH = spec["cropH"] as! Double
        let rawLayers = spec["layers"] as! [[String: Any]]
        var layers: [LayerInfo] = []
        for l in rawLayers {
            layers.append(LayerInfo(
                file: l["file"] as! String,
                x: l["x"] as! Int,
                y: l["y"] as! Int,
                w: l["w"] as! Int,
                h: l["h"] as! Int
            ))
        }
        compositeAndCropToStage(layers: layers, cropRect: CGRect(x: cropX, y: cropY, width: cropW, height: cropH), outPath: outPath)
    }
    print("Completed \(total) standing sprites composite.")
}
