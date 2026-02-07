const express = require('express');
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = 2000;
const DATA_FILE = path.join(__dirname, 'todos.json');

app.use(bodyParser.json());
app.use(express.static('public'));

// Helper to read data
const readData = () => {
    if (!fs.existsSync(DATA_FILE)) {
        return [];
    }
    const data = fs.readFileSync(DATA_FILE);
    return JSON.parse(data);
};

// Helper to write data
const writeData = (data) => {
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
};

// Get todos
app.get('/api/todos', (req, res) => {
    res.json(readData());
});

// Save todos (full sync for simplicity)
app.post('/api/todos', (req, res) => {
    const todos = req.body;
    writeData(todos);
    res.status(200).send('Saved');
});

// Chat file path
const CHAT_FILE = path.join(__dirname, 'chat.json');

// Helper to read chat data
const readChatData = () => {
    if (!fs.existsSync(CHAT_FILE)) {
        return [];
    }
    const data = fs.readFileSync(CHAT_FILE);
    return JSON.parse(data);
};

// Helper to write chat data
const writeChatData = (data) => {
    fs.writeFileSync(CHAT_FILE, JSON.stringify(data, null, 2));
};

// Get chat messages
app.get('/api/chat', (req, res) => {
    res.json(readChatData());
});

// Post a new chat message
app.post('/api/chat', (req, res) => {
    const newMessage = req.body;
    const messages = readChatData();
    messages.push({
        ...newMessage,
        timestamp: new Date().toISOString()
    });
    writeChatData(messages);
    res.status(200).send('Message sent');
});

app.listen(PORT, () => {
    console.log(`Server is running heavily on http://localhost:${PORT}`);
});
