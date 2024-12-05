const express = require('express');
const app = express();
const port = 3000;
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');

const server = http.createServer(app);
const io = socketIo(server);

let userCounter = 0; // Initialize user counter
const userLocations = {}; // Store user locations

// Set EJS as the view engine
app.set('view engine', 'ejs');

// Serve static files from the 'public' directory
app.use(express.static(path.join(__dirname, 'public')));

// Socket.io event listener
io.on("connection", function (socket) {
    // Handle receiving location from client and broadcasting to all clients
    socket.on("send-location", function (data) {
        const { userId, latitude, longitude } = data;
        userLocations[userId] = { latitude, longitude }; // Update user location
        io.emit("receive-location", { id: userId, latitude, longitude });
    });

    // Handle new user connection
    socket.on("new-user", function (userId) {
        userCounter++;
        socket.userId = userId;
        io.emit("user-connected", userId);
        socket.emit("existing-users", userLocations);
        console.log(`${userId} connected`);
    });

    // Handle user disconnection
    socket.on("disconnect", () => {
        const userId = socket.userId;
        if (userId) {
            delete userLocations[userId]; // Remove user location
            console.log(`${userId} disconnected`);
            io.emit("User-disconnected", userId);
        }
    });
});

// Render the index.ejs file
app.get('/', (req, res) => {
    res.setHeader('Content-Type', 'text/html');
    res.render('index');
});

// Start the server
server.listen(port, () => {
    console.log(`Server is running on ${port}`);
});
