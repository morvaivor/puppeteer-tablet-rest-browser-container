const express = require('express');
const path = require('path');
const apiRoutes = require('./routes/api');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

// Serve static frontend
app.use(express.static(path.join(__dirname, '../public')));

// API Routes
app.use('/api', apiRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ error: 'Something went wrong!' });
});

app.listen(PORT, () => {
    console.log(`Tablette REST Controller running on http://localhost:${PORT}`);
    console.log(`- Start browser: POST http://localhost:${PORT}/api/browser/start`);
    console.log(`- Stop browser: POST http://localhost:${PORT}/api/browser/stop`);
    console.log(`- Create tab: POST http://localhost:${PORT}/api/tabs`);
    console.log(`- List tabs: GET http://localhost:${PORT}/api/tabs`);
});
