import express from "express";
import http from "http";
// import { WebSocketServer } from "ws";
import { Server } from "socket.io";
import { instrument } from "@socket.io/admin-ui";

const app = express();

app.set("view engine", "pug");
app.set("views", __dirname + "/views");
app.use("/public", express.static(__dirname + "/public"));

app.get("/", (_, res) => res.render("home"));
app.get("/*", (_, res) => res.redirect("/"));

const handleListen = () =>
  console.log(`✅ Listening on https://localhost:3000 🚀`);

const httpServer = http.createServer(app);

const socketIO_server = new Server(httpServer, {
  cors: {
    origin: ["https://admin.socket.io"],
    credentials: true,
  },
});

instrument(socketIO_server, {
  auth: false,
});

// giving public rooms
function publicRooms() {
  const sids = socketIO_server.sockets.adapter.sids;
  const rooms = socketIO_server.sockets.adapter.rooms;
  const publicRooms = [];
  console.log(rooms);
  rooms.forEach((value, key) => {
    if (sids.get(key) === undefined) {
      publicRooms.push(key);
    }
  });
  return publicRooms;
}

// Counting Users in a specific room
function countUser(roomName) {
  return socketIO_server.sockets.adapter.rooms.get(roomName)?.size;
}

socketIO_server.on("connection", (socket) => {
  socket["nickname"] = "Anonymous";
  socketIO_server.sockets.emit("room_change", publicRooms());
  // socket event middleware
  socket.onAny((event) => {
    console.log(`Socket Event : ${event}`);
    console.log(socketIO_server.sockets.adapter);
  });

  // Entering the room event
  socket.on("enter_room", (roomName, nickname, done) => {
    socket["nickname"] = nickname;
    socket.join(roomName);
    socket.to(roomName).emit("welcome", socket.nickname, countUser(roomName));
    done(countUser(roomName));
    socketIO_server.sockets.emit("room_change", publicRooms());
  });

  // leaving the room event
  socket.on("disconnecting", () => {
    socket.rooms.forEach((room) =>
      socket.to(room).emit("bye", socket.nickname, countUser(room) - 1)
    );
  });

  // when disconnected from the room event
  socket.on("disconnect", () => {
    socketIO_server.sockets.emit("room_change", publicRooms());
  });

  // seding new message to room member
  socket.on("new_message", (msg, roomName, done) => {
    socket.to(roomName).emit("new_message", `${socket.nickname}: ${msg}`);
    done();
  });

  // setting a nickname
  socket.on("nickname", (nickname) => {
    socket["nickname"] = nickname;
  });
});

/*

< This is the old way of making real-time features >

const wss = new WebSocketServer({ server });
const sockets = [];

wss.on("connection", (socket) => {
  sockets.push(socket);
  socket["nickname"] = "Anonymous";
  console.log("✅ Connected to Browser!");

  socket.on("close", () => console.log("❎ Disconnected from the Browser"));

  socket.on("message", (message) => {
    const parsedMsg = JSON.parse(message);

    switch (parsedMsg.type) {
      case "new_message":
        // when user write message
        sockets.forEach((aSocket) =>
          aSocket.send(`${socket.nickname} : ${parsedMsg.payload}`)
        );
        break;
      case "nickname":
        // when user write nickname
        socket["nickname"] = parsedMsg.payload;
        break;
    }
  });
});
*/

httpServer.listen(3000, handleListen);
