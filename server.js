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

var users = {};

//handle socket events
io.on('connection', (socket) => {
  console.log('Client connected');

  socket.on('disconnect', () => {
    console.log('Client disconnected');
    if(!socket.nickname)return;

    io.sockets.emit("userLeft",socket.nickname);
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
      io.sockets.emit("newUserJoined",data);
    }
  });

  socket.on('sendMessage',(data,callback) => {
    console.log("got message");
    data.msg = data.msg.trim();
    if(data.uid == socket.nickname && data.msg.length>0 && data.msg.length<201){
      callback(true);

      //is whisper?
      if(data.target in users){
        data.uid = "(whisper) "+data.uid;
        users[data.target].emit('sendMessage',data);
        console.log("whisper to "+data.uid+" with msg: "+data.msg);
      }
      //else normal message
      else{
        socket.broadcast.emit('sendMessage',data);
      }

      // if(data.msg.charAt(0) === '@'){
      //     //data.msg = data.msg.substring(3).trim();
      //     var ind = data.msg.indexOf(' ');
      //     //check we have whiper name and message
      //     if(ind!=-1){
      //       var name = data.msg.substring(1,ind);
      //       var msg = data.msg.substring(ind+1);
            
      //       //if target user exit
      //       if(name in users){
      //         data.uid = "(w) "+data.uid;
      //         data.msg = msg;
      //         users[name].emit('sendMessage',data);
      //         console.log("whisper to "+name+" with msg: "+msg);
      //       }
      //       else{
      //         callback(false);
      //       }
      //     }
      //     //whisper without message
      //     else{
      //       callback(false);
      //     }
      // }
      // //else normal message
      // else{
      //   socket.broadcast.emit('sendMessage',data);
      // }
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