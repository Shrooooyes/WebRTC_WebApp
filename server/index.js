const express = require("express");
const fs = require("fs");
const https = require("https");
const { Server } = require("socket.io");
const cors = require("cors");
const dotenv = require("dotenv");
dotenv.config();

const app = express();
app.use(cors());

const PUBLIC_IP = process.env.PUBLIC_IP;

const server = https.createServer(
  {
    key: fs.readFileSync(`./${PUBLIC_IP}+2-key.pem`),
    cert: fs.readFileSync(`./${PUBLIC_IP}+2.pem`),
  },
  app
);

const io = new Server(server, {
  cors: { origin: "*" },
});

const rooms = {};

io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

  socket.on("join-room", (roomId) => {
    socket.join(roomId);

    if (!rooms[roomId]) rooms[roomId] = new Set();
    rooms[roomId].add(socket.id);

    socket.emit(
      "all-users",
      [...rooms[roomId]].filter((id) => id !== socket.id)
    );

    socket.to(roomId).emit("user-joined", socket.id);
  });

  socket.on("offer", ({ target, sdp }) => {
    io.to(target).emit("offer", {
      sender: socket.id,
      sdp,
    });
  });

  socket.on("answer", ({ target, sdp }) => {
    io.to(target).emit("answer", {
      sender: socket.id,
      sdp,
    });
  });

  socket.on("ice-candidate", ({ target, candidate }) => {
    io.to(target).emit("ice-candidate", {
      sender: socket.id,
      candidate,
    });
  });

  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id);

    for (const roomId in rooms) {
      if (rooms[roomId].has(socket.id)) {
        rooms[roomId].delete(socket.id);
        socket.to(roomId).emit("user-left", socket.id);

        if (rooms[roomId].size === 0) {
          delete rooms[roomId];
        }
      }
    }
  });
});

server.listen(5000, () => {
  console.log("Server running on port 5000");
});