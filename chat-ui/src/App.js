import React, { useState, useEffect, useRef } from 'react';
import './App.css';
import io from 'socket.io-client';

let socket = io(process.env.NODE_ENV === "production" ? undefined : ':8000');

function App() {
  // state: rooms with histories
  let [ rooms, setRooms ] = useState([
    {
      title: 'Room 1',
      history: [
        { msg: 'Hello Irina', user: 'Rob' }, 
        { msg: 'Hey Rob', user: 'Irina' } ],
      users: [ 'Rob', 'Irina' ]
    },
    {
      title: 'Room 2',
      history: [ { msg: 'Hello to issue channel', user: 'Admin' } ],
      users: [ 'Admin' ]
    }
  ]);
  let [ activeRoom, setActiveRoom ] = useState();
  let [ error, setError ] = useState('');

  // define refs to grab values of input fields easily
  let inputMsg = useRef();
  let inputUser = useRef();
  let txtChat = useRef();

  // switch room in state
  const switchRoom = (room) => {
    let user = inputUser.current.value;

    // do not switch to a room we are already in
    if(activeRoom && room.title == activeRoom.title) {
      return
    }

    if (user) {

      if(activeRoom) {
        leaveRoom()
      }

      setActiveRoom(room);
      console.log(`Switched room to ${room.title}`);

      // join room in backend too
      socket.emit('joinRoom', { room: room.title, user });
      setError('');
    } 
    else {
      console.log('Please provide a user name before joining');
      setError('Please provide a user name before joining');
    }
  };

  // send message to currently active room
  const sendMessage = () => {
    let msg = inputMsg.current.value;
    let user = inputUser.current.value;

    if (!activeRoom) {
      console.log('Please join a room first - and state a username');
      setError('Please join a room first - and state a username');
    } 
    else if (!(msg && user)) {
      console.log('Please provide username & message');
      setError('Please provide username & message');
    } 
    else {
      let msgObj = { msg, user, room: activeRoom.title }
      console.log("Sending: ", msgObj)
      socket.emit('message', msgObj);
      setError('');
      inputMsg.current.value = ""
    }
  };

  // add received message to chat history of given room
  const addMessageToHistory = ({ msg, user, room }) => {

    console.log('Attaching message to room: ', room);

    // update chat history by creating a copy of state, updating it & re-assign it
    let roomsCopy = [ ...rooms ];

    // find room
    let roomFound = roomsCopy.find((currentRoom) => currentRoom.title == room);

    // add message to chat history array of given room
    if (roomFound) {
      roomFound.history.push({ msg, user, room });
      setRooms(roomsCopy);
    }
  };

  const updateUserListOfRoom = (room, users) => {
    let roomsCopy = [...rooms]
    let roomFound = roomsCopy.find((currentRoom) => currentRoom.title == room);
    if(roomFound) {
      roomFound.users = users
    }
    console.log("Updated users:", roomFound.users)
    setRooms(roomsCopy)
  }

  const removeUserFromRoom = (room, username) => {
    let roomsCopy = [...rooms]
    let roomFound = roomsCopy.find((currentRoom) => currentRoom.title == room);
    if(roomFound) {
      roomFound.users = roomFound.users.filter(user => user.name != username)
    }
    console.log("Updated users after removal:", roomFound.users)
    setRooms(roomsCopy)
  }

  const leaveRoom = () => {
    socket.emit("leaveRoom", { room: activeRoom.title, user: inputUser.current.value})
    setActiveRoom()
  }

  useEffect(() => console.log("Rooms changed: ", rooms), [rooms])

  // define socket.io event listener
  // AFTER first render ("componentDidMount")
  useEffect(() => {

    // receive rooms
    socket.on("getRooms", (rooms) => {
      // console.log("Rooms:", rooms)
      setRooms(rooms)
    })

    // request rooms
    socket.emit("getRooms")

    return () => {
      leaveRoom()
    }

  }, []);

  // after a room was chosen => listen for messages in this room
  useEffect(() => {

    console.log("Active Room changed: ", activeRoom)

    // clear message event listeners & recreate them
    let arrListeners = ['message', 'userList', 'removeUser']
    arrListeners.forEach(listenerName => {
      if(socket.hasListeners(listenerName)) {
          socket.removeEventListener(listenerName)
      }
    })

    // on message receipt: add to state
    socket.on('message', (objMsg) => {
      console.log('Yay! Message received: ', objMsg);

      if (objMsg.user && objMsg.msg) {
        addMessageToHistory(objMsg);
        // scroll to last message (end of textarea)
        txtChat.current.scrollTop = txtChat.current.scrollHeight;
      }
    });

    // socket.on("addUser", ({room, user}) => { 
    //   console.log("AddUser: ", room, user)
    //   addUserToRoom(room, user)
    // })
    socket.on("userList", ({room, users}) => { 
      console.log("Users updated: ", room, users)
      updateUserListOfRoom(room, users)
    })
    socket.on("removeUser", ({room, user}) => {
      console.log("removeUser: ", room, user)
      removeUserFromRoom(room, user)
    })

  }, [activeRoom])
  

  // UI rendering
  return (
    <div className="App">
      <header className="App-header">
        <p>Chat-App</p>
      </header>
      <main>
        <div className="chat">
          <div className="chat-rooms">
            <div className="chat-rooms-title">Rooms</div>
            <ul>
              {rooms.map((room) => (
                <li className={activeRoom && room.title == activeRoom.title ? "active-room-li" : ""} key={room.title} onClick={(e) => switchRoom(room)}>
                  {room.title}
                </li>
              ))}
            </ul>
            {activeRoom && (
            <div>
              <button onClick={leaveRoom} >{`Leave ${activeRoom.title}`}</button>
            </div>
            )}
          </div>
          <div className="chat-history">
            <div className="active-room-title">{activeRoom ? activeRoom.title : '(no room active)'}</div>
            <textarea
              autoComplete="off"
              placeholder="Chat messages..."
              readOnly
              ref={txtChat}
              value={
                activeRoom &&
                activeRoom.history.map((entry) => `${entry.user}: ${entry.msg}`).join('\n')
              }
            />
            <div className="chat-message">
              <input placeholder="Username..." 
                autoComplete="off" 
                type="text" 
                id="user" defaultValue="Rob" 
                ref={inputUser} />
              <input
                placeholder="Write your message here..."
                autoComplete="off"
                type="text"
                id="message"
                ref={inputMsg}
              />
              <button onClick={sendMessage}>Send</button>
            </div>
          </div>
          <div className="chat-users">
            <div className="chat-users-title">Users</div>
            <ul>
              {activeRoom && activeRoom.users.map((user) => (
                <li key={user.name}>{user.name}</li>
              ))}
            </ul>
          </div>
        </div>
      </main>
      <div className="errors">{error}</div>
      <footer>&copy; My Chat Copyright</footer>
    </div>
  );
}

export default App;
