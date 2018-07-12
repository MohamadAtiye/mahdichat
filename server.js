'use strict';

const express = require('express');
const socketIO = require('socket.io');
const path = require('path');

const PORT = process.env.PORT || 3000;
const INDEX = path.join(__dirname, 'index.html');
const MAINCSS = path.join(__dirname, 'main.css');

//serve the index.html
const server = express()
  // .use((req, res) => res.sendFile(INDEX))
  .get('/main.css', (req, res) => res.sendFile(MAINCSS))
  .get('/', (req, res) => res.sendFile(INDEX))
  .listen(PORT, () => console.log(`Listening on ${ PORT }`));


//for sqlite db
var sqlite3 = require('sqlite3').verbose()

function registerChat(from,to,content){
      // open the database
      let db = new sqlite3.Database('./chatLog.db', sqlite3.OPEN_READWRITE, (err) => {
        if (err) {
          console.error(err.message);
          return;
        }
            /////INSERT INTO TABLE
        db.run("INSERT INTO chatLogs (cl_time,cl_from,cl_to,cl_content) VALUES (?,?,?,?)",
            [Date.now(),from,to,content]);

        db.close((err) => {
          if (err) {
            console.error(err.message);
          }
          //console.log('Close the database connection.');
        });

        console.log("chatlog: ", from,to,content);
      });
}









//create socket server
const io = socketIO(server);

var users = {};

//handle socket events
io.on('connection', (socket) => {
  console.log('Client connected');

  socket.on('disconnect', () => {
    
    if(!socket.nickname){
      console.log('Client disconnected');
      return;
    }

    io.sockets.emit("userLeft",socket.nickname);
    console.log("userLeft ",socket.nickname);

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
      console.log("newUserJoined ",data);
    }
  });

  socket.on('sendMessage',(data,callback) => {
    data.msg = data.msg.trim();
    if(data.uid == socket.nickname && data.msg.length>0 && data.msg.length<201){
      callback(true);

      var sender = data.uid;
      //is whisper?
      if(data.target in users){
        data.uid = "(whisper) "+data.uid;
        users[data.target].emit('sendMessage',data);
      }
      //else normal message
      else{
        socket.broadcast.emit('sendMessage',data);
        data.target = null;
      }


      registerChat(sender,data.target,data.msg);

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