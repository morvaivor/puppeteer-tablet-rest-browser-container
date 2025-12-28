const puppeteer = require('puppeteer');

(async () => {
    console.log('Starting GPU verification...');
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
        const buffer = await page.screenshot();
        console.log('Screenshot buffer size:', buffer.length);
        console.log('First two bytes (Header):', buffer.toString('ascii', 0, 2));

        if (buffer.toString('ascii', 0, 2) === 'BM') {
            console.log('Verification SUCCESS: Output is a BMP file.');
        } else {
            console.log('Verification FAILED: Output is NOT a BMP file.');
        }

        // Note: screenshot path doesn't apply to the buffer returned by the API usually,
        // but here we are using puppeteer directly in the script for verification.
        // We'll manually save the buffer to verify.
        const fs = require('fs');
        fs.writeFileSync('gpu-status.bmp', buffer);
        console.log('Screenshot saved as gpu-status.bmp');
    } catch (err) {
        console.error('Error during verification:', err);
    } finally {
        await browser.close();
    }
})();
