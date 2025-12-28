const puppeteer = require('puppeteer');
const { v4: uuidv4 } = require('uuid');
const Jimp = require('jimp');

class BrowserManager {
    constructor() {
        this.browser = null;
        this.tabs = new Map();
    }

    async start() {
        if (this.browser) {
            return { message: 'Browser is already running' };
        }
        this.browser = await puppeteer.launch({
            headless: true, // Should be true for a server, but can be false for debugging
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--ignore-gpu-blocklist',
                '--enable-gpu-rasterization',
                '--enable-zero-copy',
                '--disable-software-rasterizer'
            ]
        });
        return { message: 'Browser started' };
    }

    async stop() {
        if (!this.browser) {
            return { message: 'Browser is not running' };
        }
        await this.browser.close();
        this.browser = null;
        this.tabs.clear();
        return { message: 'Browser stopped' };
    }

    async newTab() {
        if (!this.browser) {
            throw new Error('Browser is not running');
        }
        const page = await this.browser.newPage();
        await page.setViewport({ width: 800, height: 480 });
        const id = uuidv4();
        this.tabs.set(id, page);
        return { id };
    }

    getTabs() {
        return Array.from(this.tabs.keys());
    }

    async navigate(id, url) {
        const page = this.tabs.get(id);
        if (!page) {
            throw new Error(`Tab with ID ${id} not found`);
        }
        await page.goto(url, { waitUntil: 'networkidle2' });
        return { message: `Navigated to ${url}` };
    }

    async screenshot(id) {
        const page = this.tabs.get(id);
        if (!page) {
            throw new Error(`Tab with ID ${id} not found`);
        }

        const pngBuffer = await page.screenshot();
        return await this.convertTo1BitBMP(pngBuffer);
    }

    async convertTo1BitBMP(buffer) {
        const image = await Jimp.read(buffer);
        const { width, height } = image.bitmap;

        // 1. Process image: grayscale and threshold
        image.grayscale().threshold({ max: 128 });

        // 2. Prepare BMP 1-bit data
        // Rows are padded to 4-byte boundaries
        const rowSize = Math.floor((width + 31) / 32) * 4;
        const pixelDataSize = rowSize * height;
        const fileSize = 14 + 40 + 8 + pixelDataSize;

        const bmpBuffer = Buffer.alloc(fileSize);

        // File Header (14 bytes)
        bmpBuffer.write('BM', 0);
        bmpBuffer.writeUInt32LE(fileSize, 2);
        bmpBuffer.writeUInt32LE(14 + 40 + 8, 10); // Offset to pixel data

        // Info Header (40 bytes)
        bmpBuffer.writeUInt32LE(40, 14);
        bmpBuffer.writeInt32LE(width, 18);
        bmpBuffer.writeInt32LE(height, 22); // Positive height = bottom-up
        bmpBuffer.writeUInt16LE(1, 26); // Planes
        bmpBuffer.writeUInt16LE(1, 28); // BitCount (1-bit)
        bmpBuffer.writeUInt32LE(0, 30); // Compression (None)
        bmpBuffer.writeUInt32LE(pixelDataSize, 34);

        // Color Table (8 bytes for 2 colors: Black and White)
        // Black (Index 0)
        bmpBuffer.writeUInt32LE(0x00000000, 54);
        // White (Index 1)
        bmpBuffer.writeUInt32LE(0x00FFFFFF, 58);

        // Pixel Data (Bottom-up)
        for (let y = 0; y < height; y++) {
            const rowOffset = 14 + 40 + 8 + (height - 1 - y) * rowSize;
            for (let x = 0; x < width; x++) {
                const idx = (y * width + x) * 4;
                const r = image.bitmap.data[idx];
                // Since it's thresholded, R=G=B=0 or 255
                if (r > 0) {
                    const byteIdx = rowOffset + Math.floor(x / 8);
                    const bitIdx = 7 - (x % 8);
                    bmpBuffer[byteIdx] |= (1 << bitIdx);
                }
            }
        }

        return bmpBuffer;
    }
}

module.exports = new BrowserManager();
