# Chat Demo project

This app is a demo of a chat fullstack application using React for the UI
and Socket.io / Express on the backend.

Live Demo on GitHub Pages: [https://fbw-17.github.io/chat-react-fullstack-demo/](https://fbw-17.github.io/chat-react-fullstack-demo/)

Live Demo on Heroku: [https://robchat-fullstack.herokuapp.com](https://robchat-fullstack.herokuapp.com)
(caution: Heroku is typically slow on first page load)

The app was deployed to Heroku following the process outlined in this video:<br />
[MERN Stack Fullstack Deployment Heroku](https://www.youtube.com/watch?v=5PaUiPyBDJY)


## Run it yourself

You can run the chat app quickly by cloning this repo, step into the repo folder and execute:

```
npm install
npm start
```

It will create a database "chat_db" in your local Mongo-DB.

If you want to store the DB e.g. on Atlas instead, you need to create an .env file in the main directory and store there the connection string to your MongoDB-Database using the key "MONGODB_URI"

That's it. The app will use concurrently to start React & the backend in parallel in one terminal window.

You can test the chat with yourself by opening the url "localhost:3000" once more in a second tab (shortcut in Chrome: right-click on the browser tab -> duplicate). Then you step with two users into the same room and start messaging.

The app offers two chat rooms, switching rooms and sending messages to all room members. 

## About the app

Both frontend and backend just run LOCALLY (no central servers, etc)

The App uses these libraries to create the socket connection:
* backend: socket.io package to setup a socket.io server
* frontend: socket.io-client package to connect from React

The backend will create a database "chat-db" in your local mongodb when starting up.

The app is dedicated to show the **integration of frontend and backend only** and therefore has a simplied setup.

All relevant frontend code you find in: `chat-ui/src/App.js`

All relevant backend code you find in: `server.js`.

## Limitations

We have the following limitations:

* state: plain state management with useState (neither ContextAPI nor Redux)
* no authentication when sending chat messages

Especially for the backend part you need to consider:
* Allow just logged in users to participate in chat? (then you need to send tokens with your messages, e.g. JWT)

## How to add JWT authentication

You can add middleware to socket.io just like in express with the "use" keyword (so we just need to use `io.use()` instead if `app.use()`)

See an example in the [first answer to this StackOverflow question](https://stackoverflow.com/questions/36788831/authenticating-socket-io-connections-using-jwt) on how to add a JWT middleware in the backend and how to send a token along in the frontend.

All information related to socket.io you can lookup in the official socket.io documentation where you find plently of code snippets.

Happy chatting :)