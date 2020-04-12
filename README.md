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

Tipp: You can store the active chat room of a user directly in the user model.

If you want users to join multiple chat rooms in parallel, you can store the rooms as array in the user model (=> field definition: chatRooms: [String])

All information related to socket.io you can lookup in the official socket.io documentation where you find plently of code snippets.

Happy chatting :)