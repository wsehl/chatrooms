import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";

const app = express();
app.enable("trust proxy");

const server = createServer(app);
const PORT = process.env.PORT || 8081;

const io = new Server(server, {
  path: "/socket/",
});

server.listen(PORT, () => {
  console.log("Server listening at port %d", PORT);
});

io.on("connection", (socket) => {
  // ...
});
