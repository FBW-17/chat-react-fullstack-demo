# Chat Demo project

This app is a demo of a chat fullstack application using React for the UI
and Socket.io / Express on the backend. 

## Run it 

You can run the chat app quickly by cloning this repo, step into the repo folder and execute:

```
npm install
npm start
```

That's it. The app will use concurrently to start React & the backend in parallel in one terminal window.

You can test the chat with yourself by opening the url "localhost:3000" once more in a second tab (shortcut in Chrome: right-click on the browser tab -> duplicate). Then you step with two users into the same room and start messaging.

The app offers two chat rooms, switching rooms and sending messages to all room members. 

You can add more rooms by adding rooms to the "rooms" state in App.js.

## About the app

Both frontend and backend just run LOCALLY (no central servers, etc)

The App uses these libraries to create the socket connection:
* backend: socket.io package to setup a socket.io server 
* frontend: socket.io-client package to connect from React

The app is dedicated to show the **integration of frontend and backend only** and therefore has a simplied setup. 

All relevant frontend code you find in: `chat-ui/src/App.js`

All relevant backend code you find in: `server.js`.

## Limitations

We have the following limitations:

* state: plain state management with useState (neither ContextAPI nor Redux)
* no database in the backend

So these parts you - probably - need to add in your real project.

Especially for the backend part you need to consider:
* Allow just logged in users to participate in chat? (then you need to send tokens with your messages, e.g. JWT)
* Store rooms, room users and chat history in database?

Tipp: If you just need direct messaging between users (1:1 chats) you can use direct messaging to a socket ID instead of rooms. Every user has a unique socket ID (accessible in the backend by socket.id). If you know the socketID of another user, you can send messages to them in the backend by using: `io.to(<socketId>).emit("message", "some message")`. To get the socket id of a user you want to send a message to, you can store the socket id of a user - once he connects to socket.io - in the users model (e.g. userSchema({...fields..., socketId: "socket-id-of-the-user"})). Then you can make this ID available to other users, e.g. via a backend route /user to get information of another user (but not the password please :)).

## How to add JWT authentication

You can add middleware to socket.io just like in express with use (so io.use())

See an example in the [first answer to this StackOverflow question](https://stackoverflow.com/questions/36788831/authenticating-socket-io-connections-using-jwt) on how to add a JWT middleware in the backend and how to send a token along in the frontend.

All information related to socket.io you can lookup in the official socket.io documentation where you find plently of code snippets.

Happy chatting :)