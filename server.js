const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');

const PORT = 5000;

// Path to users data file
const usersFilePath = path.join(__dirname, 'users.json');

// Helper function to read users from file
function readUsers() {
    try {
        if (!fs.existsSync(usersFilePath)) {
            return [];
        }
        const data = fs.readFileSync(usersFilePath, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        console.error('Error reading users file:', error);
        return [];
    }
}

// Helper function to write users to file
function writeUsers(users) {
    try {
        fs.writeFileSync(usersFilePath, JSON.stringify(users, null, 2));
    } catch (error) {
        console.error('Error writing users file:', error);
    }
}

// Parse JSON body
function parseBody(req, callback) {
    let body = '';
    req.on('data', chunk => {
        body += chunk.toString();
    });
    req.on('end', () => {
        try {
            const data = JSON.parse(body);
            callback(null, data);
        } catch (error) {
            callback(error);
        }
    });
}

// Create server
const server = http.createServer((req, res) => {
    // Set CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    // Handle preflight requests
    if (req.method === 'OPTIONS') {
        res.writeHead(200);
        res.end();
        return;
    }

    const parsedUrl = url.parse(req.url, true);
    const pathname = parsedUrl.pathname;

    if (req.method === 'POST' && pathname === '/api/register') {
        parseBody(req, (error, data) => {
            if (error) {
                res.writeHead(400, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ success: false, message: 'Invalid JSON' }));
                return;
            }

            const { username, email, password } = data;

            // Basic validation
            if (!username || !email || !password) {
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({
                    success: false,
                    message: 'All fields are required'
                }));
                return;
            }

            // Check if user already exists
            const users = readUsers();
            const existingUser = users.find(user => user.username === username || user.email === email);

            if (existingUser) {
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({
                    success: false,
                    message: 'Username or email already exists'
                }));
                return;
            }

            // Create new user
            const newUser = {
                id: Date.now().toString(),
                username,
                email,
                password, // In a real app, this should be hashed
                createdAt: new Date().toISOString()
            };

            users.push(newUser);
            writeUsers(users);

            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({
                success: true,
                message: 'Registration successful! Please login.'
            }));
        });
    } else if (req.method === 'POST' && pathname === '/api/login') {
        parseBody(req, (error, data) => {
            if (error) {
                res.writeHead(400, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ success: false, message: 'Invalid JSON' }));
                return;
            }

            const { username, password } = data;

            // Basic validation
            if (!username || !password) {
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({
                    success: false,
                    message: 'Username and password are required'
                }));
                return;
            }

            // Find user
            const users = readUsers();
            const user = users.find(user => user.username === username);

            if (!user) {
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({
                    success: false,
                    message: 'User not found'
                }));
                return;
            }

            // Check password (in a real app, use proper password hashing)
            if (user.password !== password) {
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({
                    success: false,
                    message: 'Invalid password'
                }));
                return;
            }

            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({
                success: true,
                message: 'Login successful! Welcome to the admin panel.',
                user: {
                    id: user.id,
                    username: user.username,
                    email: user.email
                }
            }));
        });
    } else {
        res.writeHead(404, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: false, message: 'Endpoint not found' }));
    }
});

// Start server
server.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});