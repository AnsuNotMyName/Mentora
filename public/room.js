
    let currentName = sessionStorage.getItem('userName');
    let currentRoom = sessionStorage.getItem('currentRoom');

    const message = document.getElementById('message');
    const sendBtn = document.getElementById('sendBtn');

    message.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            sendMessage();
        }
    })
    sendBtn.addEventListener('click', sendMessage)

    const title = document.getElementById('title')
    title.innerHTML = (`Welcome ${currentName} to room ${currentRoom}`)

    const socket = io();
    socket.emit("joinRoom", { room: currentRoom, username: currentName });

    function sendMessage() {
        socket.emit("message", { message: message.value, room: currentRoom, username: currentName });
    }

    socket.on("message", ({ message, username }) => {
        var chtMsg = document.createElement('p');
        chtMsg.textContent = `${username} : ${message}`;
        document.getElementById('chatBox').appendChild(chtMsg);
        console.log(`user ${username} send message : ${message}`);
    })
    

