const express = require('express');
const validator = require("express-validator")
const { User, Room } = require('./models/index')
const jwt = require("jsonwebtoken")
const app = express()
const port = process.env.PORT || 8000

const jwtSecret = process.env.JWT_SECRET || 'holy-chat-secret'
const jwtExpiry = process.env.JWT_EXPIRY || '4h'

// app.listen returns an instance of HTTP Server
const server = app.listen(port, () => console.log("Server started on port:" + port));
// we need to pass an HTTP server (not an express app!) to socket.io
// it will then attach its own routes to that server
const io = require('socket.io')(server);


// if we are in production - load react app on homepage
if(process.env.NODE_ENV === "production") {
  app.use(express.static(__dirname + '/chat-ui/build'));
}
// in development - load test route
else {
  app.get('/', (req, res) => {
    res.send('Hello from Socket.io API!');
  });
}

const verifyToken = (req, res, next) => {

  let token = req.headers.Authorization

  try {
    let decodedUser = jwt.verify(token, jwtSecret)
    req.user = decodedUser
    next()
  }
  catch(err) {
    next(err)
  }
}

app.get('/secret', verifyToken, (req, res) => {
  res.send("Hello, this route is token protected")
})

app.post("/signup", (req, res) => {

  let { email, password, name } = req.body

  User.find().or([{name}, {email}])
  .then(userFound => {
    if(userFound) {
      res.send( {error: "User with that name or email already exists"} )
    }
    User.create({email, password, name})
    .then(user => {
      let token = jwt.sign({ id: user.id, name: user.name, email: user.email}, jwtSecret, {expiresIn: jwtExpiry})
      res.send({ token })
    })
  })
})

app.post("/login", (req, res) => {
  
  let { email, password, name } = req.body

  User.find().or([{name}, {email}])
  .then(user => {
    if(!user) {
      res.send({error: "User does not exist"})
    }
    else if(user.password != password) {
      res.send({error: "Password does not match"})
    }
    else {
      let token = jwt.sign({ id: user.id, name: user.name, email: user.email}, jwtSecret, {expiresIn: jwtExpiry})
      res.send({ token })
    }
  })

})


// TODO: Make route protected to admin user
app.get("/rooms", (req, res) => {
  Room.find().then(rooms => res.send(rooms))
})

app.get("/rooms/clear", (req, res) => {
  Room.deleteMany({}).then(
    res.send("Deleted all rooms")
  )
})

// seed in 
app.get("/rooms/seed", (req, res) => {

  Room.countDocuments().then(amount => {

    // seed in rooms if there arent any
    if(amount == 0) {
      Room.create([
         {title: "General", users: [], history: []},
         {title: "Issues", users: [], history: []},
      ]).then(rooms =>  res.send(rooms))
    }
    else {
      res.send("Rooms already created")
    }

  })

})


// setup connection and events
io.on('connection', (socket) => {

  console.log("Somebody connected! ", socket.id)

  // listen to incoming messages and broadcast them to a room 
  // or send to user directly
  socket.on('message', (objMsg) => {

    let {room, user, userToId, userToName, msg} = objMsg

    // log the message we received
    console.log(objMsg)

    if(!(msg && user)) {
      console.log("[ERROR]: Either username or message was not provided")
      return
    }

    // broadcast message to a party (either room or to one person only)
    let response = { user, msg, userToName, room, direct: false }

    // send private to single socket (=user)
    if(userToId) {
      console.log(`${user} to ${userToId}: ${msg} `)
      // send message to dedicated user
      io.to(userToId).emit("message", { ... response, direct: true })
      // send message to sending user too
      io.to(socket.id).emit("message", { ... response, direct: true })
    }
    // broadcast to all members of given room
    else if(room) {
      console.log(`Room ${room} ${user}: ${msg} `)
      io.to(room).emit("message", response)
    }
    // send just back to the client who called
    else {
      console.log(`Anonymous Message received: ${msg}`)
      socket.emit("message", { ...response, direct: true })
    }

  });


  // fetch room titles and users
  socket.on("getRooms", (username) => {
    Room.find().select(["title", "users"]).lean()
    .then(rooms => {
      
      // add empty history
      rooms = rooms.map(room => {
        if(!room.history)
          room.history = []
        return room
      })
      
      // send rooms back
      io.emit("getRooms", rooms)
    })
  })


  /**
   * join current user to a room
   * 
   * => create the room in database if does not exist (mark room as private if created)
   * => add the user to the room
   */
  socket.on("joinRoom", ({room, user}) => {

    // find room
    Room.findOne({title: room})
    .then(roomDoc => {

      if(!roomDoc) {
        return
      }

      let newUser = {name: user, socketId: socket.id}

      // reject joining if a user with that name is already in the chat
      let userFound = roomDoc.users.find(currUser => currUser.name == user)
      if(!userFound) {       
        // add user + his socket-id to room in database
        roomDoc.users.push(newUser)  
      }
      // update socket-id of user
      else {
        userFound.socketId = socket.id
      }

      roomDoc.save().then((roomDocUpdated) => {

        console.log(`Joining ${user} to ${room}`, roomDocUpdated)

        // join user to a room
        socket.join(room)
        // => this causes that whenever we broadcast messages
        // to a room only users who registered to that room will receive the message
    
        // inform room users that a new user joined
        let response = {
          user: "Admin",
          msg: `User ${user} joined room ${room}`,
          room,
          direct: false
        }
        console.log(response)
        io.to(room).emit("message", response)
        // send current list of room users
        io.to(room).emit("userList", {room, users: roomDocUpdated.users})
      })

    })

  })

  socket.on("leaveRoom", ({room, user}) => {

    console.log("Leaving room called: ", room, user)

    Room.findOne({title: room})
    .then(roomDoc => {

      if(!roomDoc) {
        return
      }

      // remove user from room userlist entirely
      roomDoc.users = roomDoc.users.filter(currUser => currUser.name != user)
      console.log("Cleaned room: ", roomDoc)

      // let the user leave the room
      roomDoc.save(roomDocUpdated => {

        // inform room users that a user left the room
        let response = {
          user: "Admin",
          msg: `User ${user} left the room ${room}`,
          room,
          direct: false
        }
        console.log(response)
        io.to(room).emit("message", response)
        io.to(room).emit("removeUser", { room, user })

        // remove the user
        socket.leave(room)
      })

    })
  })

  socket.on("clearRoom", (room) => {
    Room.findOne({title: room}).then(roomFound => {
      roomFound.users = []
      roomFound.save().then((roomUpdated) => {
        console.log(`Cleared all users in room ${room}`)
        // inform users final about clearing :)
        io.to(room).emit("userList", {room, users: []})

      })
    })
  })

  // events end here

// io CONNNECTION ends here
});
