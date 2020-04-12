var app = require('express')();

// app.listen returns an instance of HTTP Server
var port = process.env.PORT || 8000
var server = app.listen(port, () => console.log("started " + port));
// we need to pass an HTTP server (not an express app!) to socket.io
// it will then attach its own routes to that server
var io = require('socket.io')(server);

app.get('/', (req, res) => {
  res.send('Hello from Socket.io API!');
});



// setup connection and events
io.on('connection', (socket) => {

  console.log("Somebody connected! ", socket.id)

  // listen to incoming messages
  // and broadcast it to a room / user
  socket.on('message', (objMsg) => {

    let {room, user, userToId, msg} = objMsg

    // log the message we received
    console.log(objMsg)

    if(!(msg && user)) {
      console.log("[ERROR]: Either username or message was not provided")
      return
    }

    // print some info for debugging in server terminal
    if(room) {
      console.log(`Room ${room} ${user}: ${msg} `)
    }
    else if(userToId) {
      console.log(`${user} to ${userToId}: ${msg} `)
    }
    else {
      console.log(`Anonymous Message received: ${msg}`)
    }
    

    // broadcast message to a party (either room or to one person only)
    let response = { user, msg, room, private: false }

    // broadcast to all members of given room
    if(room) {
      io.to(room).emit("message", response)
    }
    // send private to single socket (=user)
    else if(userToId) {
      io.to(userToId).emit("message", { ... response, private: true })
    }
    // send just back to the client who called
    else {
      socket.emit("message", { ...response, private: true })
    }

  });

    // EVENT to join current user to a room
  socket.on("joinRoom", ({room, user}) => {

    // join user to a room
    socket.join(room)
    // => this causes that whenever we broadcast messages
    // to a room only users who registered to that room will receive the message

    // inform room users that a new user joined
    io.to(room).emit("message", {
      user: "Admin",
      msg: `User ${user} joined room ${room}`,
      room,
      private: false
    })
  })

});
