"use strict";

var socket = io();
var welcome = document.getElementById("welcome");
var enterForm = welcome.querySelector("form");
var room = document.getElementById("room");
var chat = document.querySelector("#chat");
var h1 = document.getElementById("h1");
room.hidden = true;
var roomName;
var zoomName; // adding message function

function addMessage(message) {
  var ul = room.querySelector("ul");
  var li = document.createElement("li");
  li.innerText = message;

  if (li.innerText.startsWith("You")) {
    li.className = "myMsg";
  } else if (li.innerText.startsWith("<info>")) {
    li.className = "info";
  } else {
    li.className = "receivedMsg";
  }

  ul.appendChild(li);
  ul.scrollTop = ul.scrollHeight;
} // sending message to all members of the room


function handleMessageSubmit(event) {
  event.preventDefault();
  var input = room.querySelector("#message input");
  var value = input.value;
  var btn = room.querySelector("#message input[type=submit]");
  btn.style.backgroundColor = "rgb(6, 199, 85)";
  btn.style.color = "black";
  setTimeout(function () {
    btn.style.backgroundColor = "rgb(32, 32, 32)";
    btn.style.color = "white";
  }, 150);
  socket.emit("new_message", input.value, roomName, function () {
    addMessage("You: ".concat(value));
  });
  input.value = "";
} // Change a nickname for room chat


function handleNicknameSubmit(event) {
  event.preventDefault();
  var input = room.querySelector("#name input");
  var btn = room.querySelector("#name input[type=submit]");
  socket.emit("nickname", input.value);
  btn.style.backgroundColor = "white";
  btn.style.color = "black";
  setTimeout(function () {
    btn.style.backgroundColor = "rgb(32, 32, 32)";
    btn.style.color = "white";
  }, 150);
} // when user joined the room, showing them the room


function showRoom(newCount) {
  welcome.hidden = true;
  room.hidden = false;
  var h3 = room.querySelector("h3");
  h3.innerText = "Room ".concat(roomName, " (").concat(newCount, ")");
  var msgForm = room.querySelector("#message");
  var nameForm = room.querySelector("#name");
  msgForm.addEventListener("submit", handleMessageSubmit);
  nameForm.addEventListener("submit", handleNicknameSubmit);
}

function handleSubmit(event) {
  event.preventDefault();
  var roomNameInput = enterForm.querySelector("#roomName");
  var nickNameInput = enterForm.querySelector("#name");
  socket.emit("enter_room", roomNameInput.value, nickNameInput.value, showRoom);
  roomName = roomNameInput.value;
  roomNameInput.value = "";
  var changeNameInput = room.querySelector("#name input");
  changeNameInput.value = nickNameInput.value;
}

enterForm.addEventListener("submit", handleSubmit); // when someone joined the room, notifying it

socket.on("welcome", function (user, newCount) {
  var h3 = room.querySelector("h3");
  h3.innerText = "Room ".concat(roomName, " (").concat(newCount, ")");
  addMessage("<info> ".concat(user, " arrived!"));
}); // when someone left the room, notifying it

socket.on("bye", function (user, newCount) {
  var h3 = room.querySelector("h3");
  h3.innerText = "Room ".concat(roomName, " (").concat(newCount, ")");
  addMessage("<info> ".concat(user, " left the room!"));
}); // listen new_message event & make new message shown to screen

socket.on("new_message", function (msg) {
  addMessage(msg);
}); // showing current rooms

socket.on("room_change", function (rooms) {
  var roomList = welcome.querySelector("ul");
  roomList.innerHTML = "";

  if (rooms.length === 0) {
    roomList.innerHTML = "";
    return;
  }

  rooms.forEach(function (room) {
    var li = document.createElement("li");
    li.className = "roomLis";
    li.innerText = room;
    li.addEventListener("click", autoInsert);
    roomList.append(li);
  });
});

function autoInsert(event) {
  enterForm.querySelector("#roomName").value = event.target.innerText;
}