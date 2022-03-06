const socket = io();
const welcome = document.getElementById("welcome");
const enterForm = welcome.querySelector("form");
const room = document.getElementById("room");
const chat = document.querySelector("#chat");
const h1 = document.getElementById("h1");

room.hidden = true;

let roomName;
let zoomName;

// adding message function
function addMessage(message) {
  const ul = room.querySelector("ul");
  const li = document.createElement("li");
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
}

// sending message to all members of the room
function handleMessageSubmit(event) {
  event.preventDefault();
  const input = room.querySelector("#message input");
  const value = input.value;
  const btn = room.querySelector("#message input[type=submit]");
  btn.style.backgroundColor = "rgb(6, 199, 85)";
  btn.style.color = "black";
  setTimeout(() => {
    btn.style.backgroundColor = "rgb(32, 32, 32)";
    btn.style.color = "white";
  }, 150);
  socket.emit("new_message", input.value, roomName, () => {
    addMessage(`You: ${value}`);
  });
  input.value = "";
}

// Change a nickname for room chat
function handleNicknameSubmit(event) {
  event.preventDefault();
  const input = room.querySelector("#name input");
  const btn = room.querySelector("#name input[type=submit]");
  socket.emit("nickname", input.value);
  btn.style.backgroundColor = "white";
  btn.style.color = "black";
  setTimeout(() => {
    btn.style.backgroundColor = "rgb(32, 32, 32)";
    btn.style.color = "white";
  }, 150);
}

// when user joined the room, showing them the room
function showRoom(newCount) {
  welcome.hidden = true;
  room.hidden = false;
  const h3 = room.querySelector("h3");
  h3.innerText = `Room ${roomName} (${newCount})`;
  const msgForm = room.querySelector("#message");
  const nameForm = room.querySelector("#name");
  msgForm.addEventListener("submit", handleMessageSubmit);
  nameForm.addEventListener("submit", handleNicknameSubmit);
}

function handleSubmit(event) {
  event.preventDefault();
  const roomNameInput = enterForm.querySelector("#roomName");
  const nickNameInput = enterForm.querySelector("#name");
  socket.emit("enter_room", roomNameInput.value, nickNameInput.value, showRoom);
  roomName = roomNameInput.value;
  roomNameInput.value = "";
  const changeNameInput = room.querySelector("#name input");
  changeNameInput.value = nickNameInput.value;
}

enterForm.addEventListener("submit", handleSubmit);

// when someone joined the room, notifying it
socket.on("welcome", (user, newCount) => {
  const h3 = room.querySelector("h3");
  h3.innerText = `Room ${roomName} (${newCount})`;
  addMessage(`<info> ${user} arrived!`);
});

// when someone left the room, notifying it
socket.on("bye", (user, newCount) => {
  const h3 = room.querySelector("h3");
  h3.innerText = `Room ${roomName} (${newCount})`;
  addMessage(`<info> ${user} left the room!`);
});

// listen new_message event & make new message shown to screen
socket.on("new_message", (msg) => {
  addMessage(msg);
});

// showing current rooms
socket.on("room_change", (rooms) => {
  const roomList = welcome.querySelector("ul");
  roomList.innerHTML = "";
  if (rooms.length === 0) {
    roomList.innerHTML = "";
    return;
  }
  rooms.forEach((room) => {
    const li = document.createElement("li");
    li.className = "roomLis";
    li.innerText = room;
    li.addEventListener("click", autoInsert);
    roomList.append(li);
  });
});

function autoInsert(event) {
  enterForm.querySelector("#roomName").value = event.target.innerText;
}
