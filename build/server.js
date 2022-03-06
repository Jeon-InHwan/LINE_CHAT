"use strict";

var _express = _interopRequireDefault(require("express"));

var _http = _interopRequireDefault(require("http"));

var _socket = require("socket.io");

var _adminUi = require("@socket.io/admin-ui");

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

// import { WebSocketServer } from "ws";
var PORT = process.env.PORT || 3000;
var app = (0, _express["default"])();
app.set("view engine", "pug");
app.set("views", process.cwd() + "/src/views");
app.use("/public", _express["default"]["static"](process.cwd() + "/src/public"));
app.get("/", function (_, res) {
  return res.render("home");
});
app.get("/*", function (_, res) {
  return res.redirect("/");
});

var handleListen = function handleListen() {
  return console.log("\u2705 Listening on https://localhost:".concat(PORT, " \uD83D\uDE80"));
};

var httpServer = _http["default"].createServer(app);

var socketIO_server = new _socket.Server(httpServer, {
  cors: {
    origin: ["https://admin.socket.io"],
    credentials: true
  }
});
(0, _adminUi.instrument)(socketIO_server, {
  auth: false
}); // giving public rooms

function publicRooms() {
  var sids = socketIO_server.sockets.adapter.sids;
  var rooms = socketIO_server.sockets.adapter.rooms;
  var publicRooms = [];
  console.log(rooms);
  rooms.forEach(function (value, key) {
    if (sids.get(key) === undefined) {
      publicRooms.push(key);
    }
  });
  return publicRooms;
} // Counting Users in a specific room


function countUser(roomName) {
  var _socketIO_server$sock;

  return (_socketIO_server$sock = socketIO_server.sockets.adapter.rooms.get(roomName)) === null || _socketIO_server$sock === void 0 ? void 0 : _socketIO_server$sock.size;
}

socketIO_server.on("connection", function (socket) {
  socket["nickname"] = "Anonymous";
  socketIO_server.sockets.emit("room_change", publicRooms()); // socket event middleware

  socket.onAny(function (event) {
    console.log("Socket Event : ".concat(event));
    console.log(socketIO_server.sockets.adapter);
  }); // Entering the room event

  socket.on("enter_room", function (roomName, nickname, done) {
    socket["nickname"] = nickname;
    socket.join(roomName);
    socket.to(roomName).emit("welcome", socket.nickname, countUser(roomName));
    done(countUser(roomName));
    socketIO_server.sockets.emit("room_change", publicRooms());
  }); // leaving the room event

  socket.on("disconnecting", function () {
    socket.rooms.forEach(function (room) {
      return socket.to(room).emit("bye", socket.nickname, countUser(room) - 1);
    });
  }); // when disconnected from the room event

  socket.on("disconnect", function () {
    socketIO_server.sockets.emit("room_change", publicRooms());
  }); // seding new message to room member

  socket.on("new_message", function (msg, roomName, done) {
    socket.to(roomName).emit("new_message", "".concat(socket.nickname, ": ").concat(msg));
    done();
  }); // setting a nickname

  socket.on("nickname", function (nickname) {
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

httpServer.listen(PORT, handleListen);