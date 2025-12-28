const puppeteer = require('puppeteer');
const Jimp = require('jimp');

async function convertTo1BitBMP(buffer) {
    const image = await Jimp.read(buffer);
    const { width, height } = image.bitmap;
    image.grayscale().threshold({ max: 128 });

    const rowSize = Math.floor((width + 31) / 32) * 4;
    const pixelDataSize = rowSize * height;
    const fileSize = 14 + 40 + 8 + pixelDataSize;
    const bmpBuffer = Buffer.alloc(fileSize);

    bmpBuffer.write('BM', 0);
    bmpBuffer.writeUInt32LE(fileSize, 2);
    bmpBuffer.writeUInt32LE(14 + 40 + 8, 10);

    bmpBuffer.writeUInt32LE(40, 14);
    bmpBuffer.writeInt32LE(width, 18);
    bmpBuffer.writeInt32LE(height, 22);
    bmpBuffer.writeUInt16LE(1, 26);
    bmpBuffer.writeUInt16LE(1, 28);
    bmpBuffer.writeUInt32LE(0, 30);
    bmpBuffer.writeUInt32LE(pixelDataSize, 34);

    bmpBuffer.writeUInt32LE(0x00000000, 54);
    bmpBuffer.writeUInt32LE(0x00FFFFFF, 58);

    for (let y = 0; y < height; y++) {
        const rowOffset = 14 + 40 + 8 + (height - 1 - y) * rowSize;
        for (let x = 0; x < width; x++) {
            const idx = (y * width + x) * 4;
            const r = image.bitmap.data[idx];
            if (r > 0) {
                const byteIdx = rowOffset + Math.floor(x / 8);
                const bitIdx = 7 - (x % 8);
                bmpBuffer[byteIdx] |= (1 << bitIdx);
            }
        }
    }
    return bmpBuffer;
}

(async () => {
    console.log('Starting GPU & Format verification...');
    const browser = await puppeteer.launch({
        args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--ignore-gpu-blocklist',
            '--enable-gpu-rasterization',
            '--enable-zero-copy',
            '--disable-software-rasterizer'
        ],
        executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || '/usr/bin/google-chrome-stable'
    });

    const page = await browser.newPage();
    try {
        await page.goto('chrome://gpu', { waitUntil: 'networkidle2' });

        // Take standard PNG screenshot
        const pngBuffer = await page.screenshot();
        console.log('Native PNG size:', pngBuffer.length);

        // Convert to BMP using the project logic
        const bmpBuffer = await convertTo1BitBMP(pngBuffer);
        console.log('Converted BMP size:', bmpBuffer.length);
        console.log('First two bytes (Header):', bmpBuffer.toString('ascii', 0, 2));

        if (bmpBuffer.toString('ascii', 0, 2) === 'BM') {
            console.log('Verification SUCCESS: Output is a BMP file.');
        } else {
            console.log('Verification FAILED: Output is NOT a BMP file.');
        }

        const fs = require('fs');
        fs.writeFileSync('gpu-status.bmp', bmpBuffer);
        console.log('Screenshot saved as gpu-status.bmp');
    } catch (err) {
        console.error('Error during verification:', err);
    } finally {
        await browser.close();
    }
})();
