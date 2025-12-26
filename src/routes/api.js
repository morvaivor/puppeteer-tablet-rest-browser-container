const express = require('express');
const router = express.Router();
const browserManager = require('../lib/BrowserManager');

// Browser control
router.post('/browser/start', async (req, res) => {
    try {
        const result = await browserManager.start();
        res.json(result);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.post('/browser/stop', async (req, res) => {
    try {
        const result = await browserManager.stop();
        res.json(result);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Tab management
router.post('/tabs', async (req, res) => {
    try {
        const result = await browserManager.newTab();
        res.status(201).json(result);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.get('/tabs', (req, res) => {
    try {
        const tabs = browserManager.getTabs();
        res.json({ tabs });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Navigation and screenshots
router.post('/tabs/:id/navigate', async (req, res) => {
    const { id } = req.params;
    const { url } = req.body;
    if (!url) {
        return res.status(400).json({ error: 'URL is required in request body' });
    }
    try {
        const result = await browserManager.navigate(id, url);
        res.json(result);
    } catch (error) {
        res.status(error.message.includes('not found') ? 404 : 500).json({ error: error.message });
    }
});

router.get('/tabs/:id/screenshot', async (req, res) => {
    const { id } = req.params;
    try {
        const buffer = await browserManager.screenshot(id);
        res.set('Content-Type', 'image/png');
        res.send(buffer);
    } catch (error) {
        res.status(error.message.includes('not found') ? 404 : 500).json({ error: error.message });
    }
});

module.exports = router;
