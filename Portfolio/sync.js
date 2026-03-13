const http = require('http');
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');

const PORT = 3000;
const IMAGE_DIR = path.join(__dirname, 'assets', 'images');

const server = http.createServer((req, res) => {
    // Enable CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-File-Name');

    if (req.method === 'OPTIONS') {
        res.writeHead(204);
        res.end();
        return;
    }

    if (req.method === 'POST' && req.url === '/upload') {
        const fileName = req.headers['x-file-name'];
        if (!fileName) {
            res.writeHead(400);
            res.end('Missing filename');
            return;
        }

        const filePath = path.join(IMAGE_DIR, fileName);
        const fileStream = fs.createWriteStream(filePath);

        req.pipe(fileStream);

        req.on('end', () => {
            console.log(`Successfully saved: ${fileName}`);
            
            // Auto Sync to GitHub
            exec('git add . && git commit -m "Auto-upload from Portfolio" && git push', (err) => {
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ 
                    status: 'success', 
                    path: fileName,
                    sync: err ? 'Local Only (GitHub hidden)' : 'Synced to GitHub'
                }));
            });
        });

        fileStream.on('error', (err) => {
            res.writeHead(500);
            res.end(`Error: ${err.message}`);
        });
    } else {
        res.writeHead(404);
        res.end();
    }
});

server.listen(PORT, () => {
    console.log('--------------------------------------------------');
    console.log(`Portfolio Sync Server is running on port ${PORT}`);
    console.log(`Images will be saved to: ${IMAGE_DIR}`);
    console.log('Keep this window open to upload from your website.');
    console.log('--------------------------------------------------');
});
