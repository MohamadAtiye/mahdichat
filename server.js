'use strict';

const express = require('express');
const socketIO = require('socket.io');
const path = require('path');

const PORT = process.env.PORT || 3000;
const INDEX = path.join(__dirname, 'index.html');

//serve the index.html
const server = express()
  .use((req, res) => res.sendFile(INDEX) )
  .listen(PORT, () => console.log(`Listening on ${ PORT }`));

//create socket server
const io = socketIO(server);

var currentUsers = [];

//handle socket events
io.on('connection', (socket) => {
  console.log('Client connected');
  socket.on('disconnect', () => {
    console.log('Client disconnected');
    if(!socket.nickname)return;
    currentUsers.splice(currentUsers.indexOf(socket.nickname),1);
    updateNicknames();
  });

  socket.on('userjoin', (data,callback)=>{
    if(currentUsers.indexOf(data)!= -1 || data.length < 5 || data.length > 20)
    {
      callback(false);
    }
    else{
      callback(true);
      socket.nickname = data;
      currentUsers.push(socket.nickname);
      updateNicknames();
    }
  });

  socket.on('sendMessage',(data,callback) => {
    console.log("got message");
    if(data.uid == socket.nickname && data.msg.length>0 && data.msg.length<201){
      callback(true);
      socket.broadcast.emit('sendMessage',data);
    }
    else {
      console.log('fake user');
    }
  });
});


function updateNicknames(){
  io.sockets.emit("usernames",currentUsers);
}


setInterval(() => io.emit('time', new Date().toTimeString()), 1000);