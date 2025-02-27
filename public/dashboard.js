

const socket = io();

let currentName = '';
let currentRoom = '';

document.getElementById("nwRoom").addEventListener("click", function () {
    document.getElementById("nwPopup").classList.add("show");
    document.querySelector(".overlay").classList.add("show");
});

document.getElementById("close").addEventListener("click", function () {
    document.getElementById("nwPopup").classList.remove("show");
    document.querySelector(".overlay").classList.remove("show");
});

const alert = document.getElementById('error-tell')

sessionStorage.removeItem('currentRoom');
//currentName = sessionStorage.getItem('userName');
currentRoom = sessionStorage.getItem('currentRoom');
currentName = sessionStorage.getItem('userName');



/*
socket.emit('rqName');
socket.on('rqName', (username) => {
    sessionStorage.setItem('userName', '<%= username %>');
    currentName = sessionStorage.getItem('userName');
    console.log(`already get name from server : ${currentName}`);
});
*/


let newroom = document.getElementById("newRoom");
const roomname = document.getElementById("addroomname");

let addroomname = roomname.value;
let room_list_client = [];

socket.emit('imName', currentName);

function refresh() {
    socket.emit("rq_room");
}

//keyevent
function createRoom() {
    var roomNameValue = roomname.value.trim();
    if (roomNameValue === "") {
        alert.innerHTML = "Please enter a room name";
        return;
    }
    alert.innerHTML = "";
    socket.emit("newroom", roomname.value)
}

roomname.addEventListener("keydown", function (e) {
    if (e.key === "Enter") {
        createRoom();
        document.getElementById("nwPopup").classList.remove("show");
        document.querySelector(".overlay").classList.remove("show");
    }
});

newroom.addEventListener("click", () => { createRoom() });
function refresh() {
    socket.emit("rq_room", currentName);
}

function room_join(room_join) {
    sessionStorage.setItem('currentRoom', room_join);
    currentRoom = sessionStorage.getItem('currentRoom');
    socket.emit("joinRoom", { room: room_join, username: currentName });
    console.log('user', currentName, 'joined room', room_join)
    window.location = '/room/';
    //create element that show room slelect

}

socket.on("room_list", (room_list) => {
    const room_box = document.getElementById("room-box");
    //for loop to create new room in client
    for (let i = 0; i < room_list.length; i++) {
        //get room from list by postition
        let verynewroom = room_list[i];
        console.log(verynewroom, 'is in', room_list);
        //create new room
        const list = document.createElement("li");
        const button = document.createElement("button");
        function new_roomf() {
            if (verynewroom !== room_list_client[i]) {
                button.id = verynewroom;
                button.textContent = verynewroom;
                button.addEventListener("click", function () {
                    room_join(verynewroom);
                });
                //display room
                list.appendChild(button);
                room_box.appendChild(list);
                room_list_client.push(verynewroom);
            }
            else {
                console.log('room', verynewroom[i], 'already exists');
            }
        }
        new_roomf();
    }
});

socket.on("rq_room", (room_list) => {
    console.log("room is sended");
    console.log(room_list_client);
    const room_box = document.getElementById("room-box");
    //for loop to create new room in client
    for (let i = 0; i < room_list.length; i++) {
        //get room from list by postition
        let verynewroom = room_list[i];
        //create new room
        const list = document.createElement("li");
        const button = document.createElement("button");
        if (verynewroom !== room_list_client[i]) {
            button.id = verynewroom;
            button.textContent = verynewroom;
            button.formMethod = "POST";
            button.formAction = "/dashboard";

            //display room
            list.appendChild(button);
            room_box.appendChild(list);
            room_list_client.push(verynewroom);
            //setattribute for button
            document.getElementById(verynewroom).setAttribute("onclick", `room_join('${verynewroom}')`);
        }
        else {
            console.log('room', verynewroom, 'already exists');
        }
    }
});

refresh();