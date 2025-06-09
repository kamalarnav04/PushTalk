const express = require('express');
const path = require('path');

const app = express();
const PORT = 3000;

// Serve static files
app.use(express.static(path.join(__dirname, '../public')));

// Test route
app.get('/test', (req, res) => {
    res.send('Server is working!');
});

app.listen(PORT, () => {
    console.log(`Test server running on http://localhost:${PORT}`);
    console.log('Test endpoint: http://localhost:' + PORT + '/test');
});
