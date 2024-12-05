const socket = io(); // Establish a connection to the server

document.addEventListener('DOMContentLoaded', () => {
    console.log('JavaScript is working!');
    const userId = getUserId();
    socket.emit('new-user', userId);
});

function getUserId() {
    let userId = localStorage.getItem('userId');
    if (!userId) {
        userId = `User-${Math.floor(Math.random() * 10000)}`; // Generate a random ID
        localStorage.setItem('userId', userId);
    }
    return userId;
}

const userId = getUserId();

if (navigator.geolocation) {
    navigator.geolocation.watchPosition((position) => {
        const { latitude, longitude } = position.coords;
        socket.emit('send-location', { userId, latitude, longitude });
    }, (error) => {
        console.log(error);
    }, {
        enableHighAccuracy: true,
        timeout: 5000,
        maximumAge: 0
    });
}

// Initialize the map with a basic setup
const map = L.map('map').setView([0, 0], 10);

// Add the OpenStreetMap tile layer to the map
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: "Om Shree Vinayak"
}).addTo(map);

// Object to store markers by ID
const markers = {};

// Function to create notifications
function createNotification(message) {
    const notification = document.createElement('div');
    notification.className = 'notification';
    notification.textContent = message;
    document.body.appendChild(notification);
    setTimeout(() => {
        notification.remove();
    }, 3000);
}

// Listen for existing users' locations
socket.on('existing-users', (users) => {
    for (const id in users) {
        const { latitude, longitude } = users[id];
        if (!markers[id]) {
            const label = id; // Use the user ID
            markers[id] = L.marker([latitude, longitude])
                .addTo(map)
                .bindTooltip(label, { permanent: true, direction: "right" })
                .openTooltip();
        } else {
            markers[id].setLatLng([latitude, longitude]);
        }
    }
});

// Listen for user connection notifications
socket.on('user-connected', (id) => {
    if (id === userId) {
        createNotification('You are now live');
    } else {
        createNotification(`${id} is now live`);
    }
});

// Listen for location updates from the server
socket.on('receive-location', (data) => {
    const { id, latitude, longitude } = data;
    if (!markers[id]) {
        const label = id; // Use the user ID
        markers[id] = L.marker([latitude, longitude])
            .addTo(map)
            .bindTooltip(label, { permanent: true, direction: "right" })
            .openTooltip();
    } else {
        markers[id].setLatLng([latitude, longitude]);
    }
    map.setView([latitude, longitude], 17);
});

// Handle user disconnection
socket.on('User-disconnected', (id) => {
    if (markers[id]) {
        map.removeLayer(markers[id]);
        delete markers[id];
        createNotification(`${id} disconnected`);
    }
});
