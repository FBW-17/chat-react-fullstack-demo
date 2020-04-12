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

## About the app

Both frontend and backend just run LOCALLY (no central servers, etc)

The App uses these libraries to create the socket connection:
* socket.io package to setup a socket.io server in the backend
* socket.io-client package to connect from React

The app is dedicated to show the integration of frontend and backend only and therefore has a simplied setup. 

So it has these limitations:
* plain state management with useState (neither ContextAPI nor Redux)
* no database in the backend

So these parts you need to add in your real project.

Especially for the backend part you need to consider:
* Allow just logged in users to participate in chat?
* Store rooms, room users and chat history in database?

<b>Tipp: You can store the active chat room of a user directly in the user model</b>.

If you want users to join multiple chat rooms in parallel, you can store the rooms as array in the user model (=> field definition: chatRooms: [String])

All information related to socket.io you can lookup in the official socket.io documentation where you find plently of code snippets.

Happy chatting :)