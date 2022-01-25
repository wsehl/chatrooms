const PORT = process.env.PORT || 8081;
const CLIENT_URL = process.env.CLIENT_URL || "http://localhost:3000";

const server = require("http").createServer();
const io = require("socket.io")(server, {
  path: "/socket/",
  cors: {
    origin: CLIENT_URL,
    methods: ["GET", "POST"],
  },
});

server.listen(PORT, () => {
  console.log("Server listening at port %d", PORT);
});

const {
  userJoin,
  getCurrentUser,
  userLeave,
  getRoomUsers,
  getTypingUsers,
} = require("./utils/users");

io.on("connection", (socket) => {
  socket.on("joinRoom", ({ username, room }) => {
    const user = userJoin(socket.id, username, room);
    socket.join(user.room);
    socket.emit("message", {
      message: "Welcome to chatroom!",
      type: "system",
      date: new Date().toISOString(),
    });
    socket.emit("login");
    socket.broadcast.to(user.room).emit("message", {
      message: `${user.username} has joined the chat`,
      type: "system",
      date: new Date().toISOString(),
    });
    io.to(user.room).emit("roomUsers", {
      room: user.room,
      users: getRoomUsers(user.room),
    });
  });

  socket.on("chatMessage", (msg) => {
    const user = getCurrentUser(socket.id);
    if (user) {
      io.to(user.room).emit("message", {
        username: user.username,
        message: msg,
        type: "default",
        date: new Date().toISOString(),
      });
    }
  });

  socket.on("change room", (room) => {
    const user = getCurrentUser(socket.id);
    if (user) {
      user.room = room;
      socket.join(room);
      io.to(user.room).emit("message", {
        message: `${user.username} has changed the room`,
        type: "system",
        date: new Date().toISOString(),
      });
      io.to(user.room).emit("roomUsers", {
        room: user.room,
        users: getRoomUsers(user.room),
      });
    }
  });

  socket.on("disconnect", () => {
    const user = userLeave(socket.id);
    if (user) {
      io.to(user.room).emit("message", {
        message: `${user.username} has left the chat`,
        type: "system",
        date: new Date().toISOString(),
      });
      io.to(user.room).emit("roomUsers", {
        room: user.room,
        users: getRoomUsers(user.room),
      });
    }
  });

  socket.on("typing", () => {
    const user = getCurrentUser(socket.id);
    if (user) {
      user.typing = true;
      io.to(user.room).emit("typing", {
        typingUsers: getTypingUsers(),
      });
    }
  });

  socket.on("stop typing", () => {
    const user = getCurrentUser(socket.id);
    if (user) {
      user.typing = false;
      io.to(user.room).emit("stop typing", {
        typingUsers: getTypingUsers(),
      });
    }
  });
});
