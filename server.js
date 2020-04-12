var app = require('express')();

// app.listen returns an instance of HTTP Server
var port = process.env.PORT || 8000
var server = app.listen(port, () => console.log("started " + port));
// we need to pass an HTTP server (not an express app!) to socket.io
// it will then attach its own routes to that server
var io = require('socket.io')(server);

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/index.html');
});

app.get('/testy', (req, res) => {
  res.send('Workz!');
});

/**
 * Planning:
 * 
 * We should be able to join a room and switch rooms.
 * To keep it easy we keep the chat history just locally
 * 
 * Step one - test interplay of React & Socket.io server:
 * - on every message sent - broadcast it to everybody
 * - check if we receive it in react
 * 
 * On page entry
 *  - Fetch list of rooms that I am allowed to see
 * 
 * On room click
 *  - Join the room
 *  - Send broadcast to everyone in the room (= the admin in this case)
 * 
 * On message send
 *  - Broadcast message to everyone in the room (= the admin in this case)
 * 
 * Incoming messages & textarea(s)
 *  - Idea: Keep chat rooms in state (array)
 *  - On click: Switch active (visible) room
 *  - On receive: Attach message to room.history
 *  - Bind activeRoom.history to the textarea
 *  - Bind activeRoom to the clicked room
 *  - That's it!
 * 
 * Just one room? Join that room directly
 * (=> last mini challenge here!)
 * 
 */


// setup connection and events
io.on('connection', (socket) => {

  console.log("Somebody connected! ", socket.id)

  // listen to incoming messages
  // and broadcast it to a room / user
  socket.on('message', (objMsg) => {

    let {room, user, userToId, msg} = objMsg

    console.log(objMsg)

    if(!(msg && user)) {
      console.log("[ERROR]: Either username or message was not provided")
      return
    }

    if(room) {
      console.log(`Room ${room} ${user}: ${msg} `)
    }
    else if(userToId) {
      console.log(`${user} to ${userToId}: ${msg} `)
    }
    else {
      console.log(`Anonymous Message received: ${msg}`)
    }
    
    // broadcast ALL - send message to everybody INCLUDING me
    
    let response = { user, msg, room, private: false }

    if(room) {
      // io.emit("message", response)
      io.to(room).emit("message", response)
    }
    // send private to single socket (=user)
    else if(userToId) {
      io.to(userToId).emit("message", { ... response, private: true })
    }
    // send just back to client who called
    else {
      //io.emit("message", { ... response, private: true })
      socket.emit("message", { ...response, private: true })
    }

  });

    // send a message to a dedicated user
  // socket.on("private", ({user, userToId, msg}) => {
  //   console.log(`[Private] User ${user}: ${msg}`)
  //   // this sends something back just to the calling client
  //   // socket.emit("private", `[Private] User ${user}: ${msg}`)

  //   io.to(userToId).emit(`[Private] ${user}: ${msg}`)
  // })

    // EVENT to join current user to a room
  socket.on("joinRoom", ({room, user}) => {

    // leave current room that is assigned
    // socket.leaveAll()

    socket.join(room)

    console.log(`User ${user} joined room ${room}, ID ${socket.id}`)

    // inform users in the room that a new user joined
    io.to(room).emit("message", `User ${user} joined room ${room}`)
  })

});
