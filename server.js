'use strict';

const express = require('express');
const socketIO = require('socket.io');
const path = require('path');

const PORT = process.env.PORT || 3000;
const INDEX = path.join(__dirname, 'index.html');
const MAINCSS = path.join(__dirname, 'main.css');
const jqueryjs = path.join(__dirname, 'jquery.min.js');

  /////////////////////
  //-- http server --//
  /////////////////////
const server = express()
  // .use((req, res) => res.sendFile(INDEX))
  .get('/main.css', (req, res) => res.sendFile(MAINCSS))
  .get('/jquery.min.js', (req, res) => res.sendFile(jqueryjs))
  .get('/', (req, res) => res.sendFile(INDEX))
  .listen(PORT, () => console.log(`Listening on ${ PORT }`));


  ////////////////////
  //-- sqlite3 db --//
  ////////////////////
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


function getLastChat(uid, callback){
  let db = new sqlite3.Database('./chatLog.db', sqlite3.OPEN_READWRITE, (err) => {
    if (err) {
      console.error(err.message);
      return;
    }

    // let sql = 'Select * from chatLogs WHERE cl_to = "'+ uid +'" OR cl_from = "'+ uid +'"  OR cl_to IS NULL  ORDER BY cl_time DESC limit 20;'
    let sql = 'Select * from chatLogs WHERE cl_to IS NULL  ORDER BY cl_time DESC limit 20;'
    db.all(sql, [], (err, rows) => {
      if (err) {
        throw err;
      }

      if(callback) callback(rows);
    });

    db.close((err) => {
      if (err) {
        console.error(err.message);
      }
    });

  });
}

const fs = require('fs');
function initDatafile(){
  fs.unlink('chatLog.db', (err) => {
    if (err) console.log(err.message);
    else console.log('####successfully deleted /tmp/hello');

    // open the database
    let db = new sqlite3.Database('./chatLog.db', (err) => {
      if (err) {
        console.error(err.message);
      }
      console.log('####created to the chatLog database.');

      /////CREATE TABLE
      db.run("CREATE TABLE `chatlogs` (      `cl_id`	INTEGER PRIMARY KEY AUTOINCREMENT,      `cl_time`	INTEGER,   `cl_from`	TEXT,      `cl_to`	TEXT,      `cl_content`	TEXT    );");
      console.log('####created table chatlogs');
    });

  });
}

initDatafile();





//create socket server
const io = socketIO(server);

var users = {};
var reservedNames = {
  "midoking":"kingmido"
}

//handle socket events
io.on('connection', (socket) => {
  console.log( socket.id +' Client connected');

  socket.on('disconnect', () => {
    
    if(!socket.nickname){
      console.log( socket.id +' Client disconnected');
      return;
    }

    io.sockets.emit("userLeft",socket.nickname);
    console.log(socket.id +", userLeft " +socket.nickname);
    
    delete users[socket.nickname];
    
    updateNicknames();
    return;
  });

  socket.on('userjoin', (data,callback)=>{
    data = sanitizeHTML(data);

    if(data.length < 5 || data.length > 20)
    {
      //callback(false);
      callback({"res":false,"msg":"wrong name size, should be between 5 and 20 caharacters"});
      return;
    }
    else if( data in users){
      callback({"res":false,"msg":"Name already taken, please use another one"});
      return;
    }
    else if(data in reservedNames){
      callback({"res":false,"msg":"This name is reserved for special members"});
      return;
    }
    else{

      if(data == "midokingmahdi123"){
        data = "midoking";
      }

      socket.nickname = data;
      users[socket.nickname] = socket;

      getLastChat(data,function(oldChat){
        callback({"res":true,"uid":data,"msg":"REGISTERED","payload":oldChat});
        updateNicknames();
      });

      socket.broadcast.emit("newUserJoined",data);
      console.log("newUserJoined ",data);
    }
  });

  socket.on('messageSent',(data,callback) => {
    data.msg = sanitizeHTML(data.msg);

    if(data.uid == socket.nickname && data.msg.length>0 && data.msg.length<201){
      callback(true);

      var sender = data.uid;
      //is whisper?
      if(data.target in users){
        users[data.target].emit('messageReceived',data);
      }
      //else normal message
      else{
        socket.broadcast.emit('messageReceived',data);
        data.target = null;
      }
      registerChat(sender,data.target,data.msg);
    }
    else {
      callback(false);
      console.log('fake user');
    }
  });

}); //--> END OF ON CONNECT

function updateNicknames(){
  io.sockets.emit("usernames",Object.keys(users));
}
function sanitizeHTML(input){
  input = input.trim();
  input =  input.replace("<","&lt;");
  input =  input.replace(">","&gt;");
  input =  input.replace('"',"&quot;");
  input =  input.replace("'","&#039;");
  return input;
}


setInterval(() => io.emit('time', new Date().toTimeString()), 1000);