const express = require('express');
const http = require('http');
const socketIo = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

// Serve static files from the "public" directory
app.use(express.static('public'));

// Keep track of active chat rooms and users
const activeRooms = {};

io.on('connection', (socket) => {
  console.log('A user connected:', socket.id);

  socket.on('joinRoom', (room) => {
    socket.join(room);

    if (!activeRooms[room]) {
      activeRooms[room] = [];
    }

    activeRooms[room].push(socket.id);
    io.to(room).emit('userList', activeRooms[room]);
  });

  socket.on('sendMessage', (data) => {
    io.to(data.room).emit('message', {
      user: socket.id,
      message: data.message,
    });
  });

  socket.on('disconnect', () => {
    for (const room in activeRooms) {
      const index = activeRooms[room].indexOf(socket.id);
      if (index !== -1) {
        activeRooms[room].splice(index, 1);
        io.to(room).emit('userList', activeRooms[room]);
        break;
      }
    }
    console.log('A user disconnected:', socket.id);
  });
});

const PORT = process.env.PORT || 3000;

server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
