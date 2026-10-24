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

func compositeAndCrop(layers: [LayerInfo], cropRect: CGRect, outW: Int, outH: Int, outPath: String) {
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
            print("Missing layer: \(lay.file)")
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

    guard let outCtx = CGContext(data: nil, width: outW, height: outH, bitsPerComponent: 8, bytesPerRow: outW * 4, space: colorSpace, bitmapInfo: CGImageAlphaInfo.premultipliedLast.rawValue) else {
        return
    }
    outCtx.interpolationQuality = .high
    outCtx.draw(cropped, in: CGRect(x: 0, y: 0, width: outW, height: outH))
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
    for spec in specs {
        let outPath = spec["out"] as! String
        let cropX = spec["cropX"] as! Double
        let cropY = spec["cropY"] as! Double
        let cropW = spec["cropW"] as! Double
        let cropH = spec["cropH"] as! Double
        let outW = spec["outW"] as! Int
        let outH = spec["outH"] as! Int
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
        compositeAndCrop(layers: layers, cropRect: CGRect(x: cropX, y: cropY, width: cropW, height: cropH), outW: outW, outH: outH, outPath: outPath)
    }
}
