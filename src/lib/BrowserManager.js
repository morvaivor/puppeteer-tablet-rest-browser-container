const puppeteer = require('puppeteer');
const { v4: uuidv4 } = require('uuid');

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
            args: ['--no-sandbox', '--disable-setuid-sandbox']
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

        // Apply a grayscale theme over the entire page
        await page.evaluate(() => {
            const style = document.createElement('style');
            style.id = 'grayscale-style';
            style.innerHTML = `
                html, body, * {
                    filter: grayscale(100%) !important;
                    -webkit-filter: grayscale(100%) !important;
                }
            `;
            document.head.appendChild(style);
        });

        // Small delay to ensure the filter is applied
        await new Promise(resolve => setTimeout(resolve, 500));

        const buffer = await page.screenshot();

        // Remove the style
        await page.evaluate(() => {
            const style = document.getElementById('grayscale-style');
            if (style) style.remove();
        });

        return buffer;
    }
}

module.exports = new BrowserManager();
