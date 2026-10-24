#include <fstream>
#include <memory>
#include <stdexcept>
#include <vector>
#include <cstdio>
#include "BadMagicException.h"
#include "TlgConverter.h"
#include "AbstractTlgReader.h"
#include "Tlg0Reader.h"
#include "Tlg5Reader.h"
#include "Tlg6Reader.h"

const Image TlgConverter::read(std::string path) const
{
	std::ifstream ifs(path, std::ifstream::in | std::ifstream::binary);
	if (!ifs)
		throw std::runtime_error("Can't open " + path + " for reading");

	try
	{
		auto reader = AbstractTlgReader::choose_reader(ifs);
		auto ret = reader->read(path);
		ifs.close();
		return ret;
	}
	catch (std::exception const &e)
	{
		ifs.close();
		throw;
	}
}

// 写入 32-bit BMP 或 raw RGBA（支持包含透明度的直接转换）
void TlgConverter::save(const Image image, std::string path) const
{
	uint32_t width = image.width;
	uint32_t height = image.height;
	size_t total = (size_t)width * (size_t)height;

	if (path.size() >= 5 && path.substr(path.size() - 5) == ".rgba") {
		FILE *fp = fopen(path.c_str(), "wb");
		if (fp == nullptr)
			throw std::runtime_error("Could not open " + path + " for writing");
		std::vector<uint8_t> rgba(total * 4);
		for (size_t i = 0; i < total; ++i) {
			uint32_t px = image.pixels[i];
			rgba[i * 4 + 0] = px & 0xFF;         // R
			rgba[i * 4 + 1] = (px >> 8) & 0xFF;  // G
			rgba[i * 4 + 2] = (px >> 16) & 0xFF; // B
			rgba[i * 4 + 3] = (px >> 24) & 0xFF; // A
		}
		fwrite(rgba.data(), 1, total * 4, fp);
		fclose(fp);
		printf("%u %u\n", width, height);
		return;
	}

	FILE *fp = fopen(path.c_str(), "wb");
	if (fp == nullptr)
		throw std::runtime_error("Could not open " + path + " for writing");

	uint32_t width = image.width;
	uint32_t height = image.height;
	uint32_t row_size = width * 4;
	uint32_t image_size = row_size * height;
	uint32_t file_size = 54 + image_size;

	uint8_t header[54] = {
		'B', 'M',
		(uint8_t)(file_size & 0xFF), (uint8_t)((file_size >> 8) & 0xFF), (uint8_t)((file_size >> 16) & 0xFF), (uint8_t)((file_size >> 24) & 0xFF),
		0, 0, 0, 0,
		54, 0, 0, 0, // offset to pixel data
		40, 0, 0, 0, // DIB header size
		(uint8_t)(width & 0xFF), (uint8_t)((width >> 8) & 0xFF), (uint8_t)((width >> 16) & 0xFF), (uint8_t)((width >> 24) & 0xFF),
		// 负高度表示自顶向下扫描
		(uint8_t)((-((int32_t)height)) & 0xFF), (uint8_t)(((-((int32_t)height)) >> 8) & 0xFF),
		(uint8_t)(((-((int32_t)height)) >> 16) & 0xFF), (uint8_t)(((-((int32_t)height)) >> 24) & 0xFF),
		1, 0,        // planes = 1
		32, 0,       // bpp = 32 (BGRA)
		0, 0, 0, 0,  // compression = BI_RGB
		(uint8_t)(image_size & 0xFF), (uint8_t)((image_size >> 8) & 0xFF), (uint8_t)((image_size >> 16) & 0xFF), (uint8_t)((image_size >> 24) & 0xFF),
		0, 0, 0, 0,  // x pixels per meter
		0, 0, 0, 0,  // y pixels per meter
		0, 0, 0, 0,  // colors in color table
		0, 0, 0, 0   // important color count
	};

	fwrite(header, 1, 54, fp);
	size_t total = (size_t)width * (size_t)height;
	std::vector<uint32_t> bgra(total);
	for (size_t i = 0; i < total; ++i) {
		uint32_t px = image.pixels[i];
		// RGBA (little-endian: 0xAABBGGRR) -> BGRA (0xAARRGGBB)
		uint32_t r = px & 0xFF;
		uint32_t g = (px >> 8) & 0xFF;
		uint32_t b = (px >> 16) & 0xFF;
		uint32_t a = (px >> 24) & 0xFF;
		bgra[i] = (a << 24) | (r << 16) | (g << 8) | b;
	}
	fwrite(bgra.data(), 4, total, fp);
	fclose(fp);
}
