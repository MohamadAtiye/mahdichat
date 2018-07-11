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
var users = {};

//handle socket events
io.on('connection', (socket) => {
  console.log('Client connected');

  socket.on('disconnect', () => {
    console.log('Client disconnected');
    if(!socket.nickname)return;
    delete users[socket.nickname];
    updateNicknames();
  });

  socket.on('userjoin', (data,callback)=>{
    if( data in users || data.length < 5 || data.length > 20)
    {
      callback(false);
    }
    else{
      callback(true);
      socket.nickname = data;
      users[socket.nickname] = socket;
      updateNicknames();
    }
  });

  socket.on('sendMessage',(data,callback) => {
    console.log("got message");
    data.msg = data.msg.trim();
    if(data.uid == socket.nickname && data.msg.length>0 && data.msg.length<201){
      callback(true);
      if(data.msg.substring(0,3) === '/w '){
          data.msg = data.msg.substring(3).trim();
          console.log("whisper");
      }
      else{
        socket.broadcast.emit('sendMessage',data);
      }
    }
    else {
      console.log('fake user');
    }
  });
});


function updateNicknames(){
  io.sockets.emit("usernames",Object.keys(users));
}


setInterval(() => io.emit('time', new Date().toTimeString()), 1000);