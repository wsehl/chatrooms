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

const activeUsers = new Set();
const typingUsers = new Set();

io.on("connection", (socket) => {
  let addedUser = false;

  const sendMessage = ({ message, type = "default" }) => {
    const newMessage = {
      username: socket.username,
      message,
      date: new Date().toISOString(),
      type,
    };
    socket.emit("new message", newMessage);
    socket.broadcast.emit("new message", newMessage);
  };

  socket.on("init", () => {
    const data = {
      activeUsers: [...activeUsers],
    };
    socket.emit("get users", data);
    socket.broadcast.emit("get users", data);
  });

  socket.on("new message", (data) => {
    sendMessage({ message: data });
  });

  socket.on("add user", (username) => {
    if (addedUser) return;
    socket.username = username;
    activeUsers.add(username);
    addedUser = true;
    socket.emit("login", {
      activeUsers: [...activeUsers],
    });
    socket.broadcast.emit("user joined", {
      username: socket.username,
      activeUsers: [...activeUsers],
    });
  });

  const logout = () => {
    if (addedUser) {
      activeUsers.delete(socket.username);
      socket.emit("user left", {
        username: socket.username,
        activeUsers: [...activeUsers],
      });
      socket.broadcast.emit("user left", {
        username: socket.username,
        activeUsers: [...activeUsers],
      });
      addedUser = false;
    }
  };

  socket.on("logout", () => {
    logout();
  });

  socket.on("disconnect", () => {
    logout();
  });

  socket.on("typing", () => {
    typingUsers.add(socket.username);
    socket.broadcast.emit("typing", {
      username: socket.username,
      typingUsers: [...typingUsers],
    });
  });

  socket.on("stop typing", () => {
    typingUsers.delete(socket.username);
    socket.broadcast.emit("stop typing", {
      username: socket.username,
      typingUsers: [...typingUsers],
    });
  });
});
