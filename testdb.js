var sqlite3 = require('sqlite3').verbose()
//var db = new sqlite3.Database(':memory:')


// let db = new sqlite3.Database(':memory:', (err) => {
//     if (err) {
//       return console.error(err.message);
//     }
//     console.log('Connected to the in-memory SQlite database.');
// });
// db.close((err) => {
//     if (err) {
//         return console.error(err.message);
//     }
//     console.log('Close the database connection.');
// });



// db.serialize(function () {
//   db.run('CREATE TABLE lorem (info TEXT)')
//   var stmt = db.prepare('INSERT INTO lorem VALUES (?)')

//   for (var i = 0; i < 10; i++) {
//     stmt.run('Ipsum ' + i)
//   }

//   stmt.finalize()

//   db.each('SELECT rowid AS id, info FROM lorem', function (err, row) {
//     console.log(row.id + ': ' + row.info)
//   })
// })

// db.close()


// open the database
let db = new sqlite3.Database('./chatLog.db', (err) => {
    if (err) {
      console.error(err.message);
      return;
    }
    console.log('Connected to the chinook database.');


    /////CREATE TABLE
    // db.run("CREATE TABLE `chatLogs` (`cl_id`	INTEGER PRIMARY KEY AUTOINCREMENT,`cl_time`	INTEGER,`cl_from` TEXT,`cl_to`	TEXT,`cl_content` TEXT)");

    db.run("CREATE TABLE `testLog` (      `cl_id`	INTEGER PRIMARY KEY AUTOINCREMENT,      `cl_time`	INTEGER,   `cl_from`	TEXT,      `cl_to`	TEXT,      `cl_content`	TEXT    );");


// CREATE TABLE `testLog` (
// 	`cl_id`	INTEGER PRIMARY KEY AUTOINCREMENT,
// 	`cl_time`	INTEGER,
// 	`cl_from`	TEXT,
// 	`cl_to`	TEXT,
// 	`cl_content`	TEXT
// );


    /////INSERT INTO TABLE
    // db.run("INSERT INTO chatLogs (cl_time,cl_from,cl_to,cl_content) VALUES (?,?,?,?)",
    //     [Date.now(),"mahdi",null,"someMessage text"]);
});
   



// CREATE TABLE `testLog` (
// 	`cl_id`	INTEGER PRIMARY KEY AUTOINCREMENT,
// 	`cl_time`	INTEGER,
// 	`cl_from`	TEXT,
// 	`cl_to`	TEXT,
// 	`cl_content`	TEXT
// );



   

//finish and close
  db.close((err) => {
    if (err) {
      console.error(err.message);
    }
    console.log('Close the database connection.');
  });