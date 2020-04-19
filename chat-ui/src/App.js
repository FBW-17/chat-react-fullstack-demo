import React, { useState, useEffect, useRef } from 'react';
import './App.css';
import io from 'socket.io-client';

// connect to socket IO port depending on environment
let socketIoPort = process.env.NODE_ENV === "production" ? undefined : ':8000'
let socket = io(socketIoPort);

function App() {

  const randomUserName = "Rob-" + Math.round((Math.random()*100))

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
  let [ otherUsers, setOtherUsers ] = useState()
  let [ error, setError ] = useState('');

  // define refs to grab values of input fields easily
  let inputMsg = useRef();
  let inputUser = useRef();
  let inputUserTo = useRef();
  let txtChat = useRef();

  // switch room in state
  const switchRoom = (room) => {
    let user = inputUser.current.value;

    // do not switch to a room we are already in
    if(activeRoom && room.title == activeRoom.title) {
      return
    }

    // switch room
      // leave current room
      // join new room
      // update user list
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

    // get user to information
    let userToId = inputUserTo.current.value
    let userToIndex = inputUserTo.current.selectedIndex
    let userToName = inputUserTo.current.options[userToIndex].text

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

      // direct message? append user-to information
      if(userToId) {
        msgObj = { ...msgObj, userToId, userToName }
      }
      
      console.log(`Sending ${userToId ? "(private)" : ""}: `, msgObj)
      
      socket.emit('message', msgObj);
      setError('');
      
      inputMsg.current.value = ""
    }
  };

  // add received message to chat history of given room
  const addMessageToHistory = (objMsg) => {

    // update chat history by creating a copy of state, updating it & re-assign it
    let roomsCopy = [ ...rooms ];

    // find room message was sent to
    let roomFound = roomsCopy.find((currentRoom) => currentRoom.title == objMsg.room);

    // add message to chat history array of given room
    if (roomFound) {
      roomFound.history.push(objMsg);
      setRooms(roomsCopy);
    }
  };

  const formatMessage = (objMsg) => {
    let msgFormatted = objMsg.user // start message with sender username

    // format direct messages with info who sent message to whom
    if(objMsg.direct) {
      let userMe = inputUser.current.value
      msgFormatted += " (private to " +
        (userMe === objMsg.userToName ? "you" : objMsg.userToName) + ")"
    }
    msgFormatted += ": " + objMsg.msg
    return msgFormatted
  }

  const updateOtherUserList = () => {
    if(!activeRoom) return

    let userMe = inputUser.current.value

    let otherRoomUsers = activeRoom.users.filter(user => user.name != userMe)
    // append message to everyone
    otherRoomUsers.unshift({name: "To everyone", socketId: ""})
    console.log("Other users: ", otherRoomUsers)
    setOtherUsers(otherRoomUsers)
  }

  // whenever users join or leave => update the user list in room
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
    if(!activeRoom) return
    console.log("Leaving room: ", activeRoom.title)
    socket.emit("leaveRoom", { room: activeRoom.title, user: inputUser.current.value})
    setActiveRoom()
  }

  const clearRoom = () => {
    if(!activeRoom) return
    console.log("Clearing room: ", activeRoom.title)
    socket.emit("clearRoom", activeRoom.title)
  }

  useEffect(() => { 
    console.log("Rooms changed: ", rooms)
    // update the direct message select box
    updateOtherUserList()
  }, [rooms])

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

      addMessageToHistory(objMsg);
      // scroll to last message (end of textarea)
      txtChat.current.scrollTop = txtChat.current.scrollHeight;
    });

    socket.on("userList", ({room, users}) => { 
      console.log("Users updated: ", room, users)

      // if user list is empty => room was cleared => leave room here!
      if(users && users.length === 0) {
        leaveRoom()
      }
      else {
        updateUserListOfRoom(room, users)
      }
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
                activeRoom ?
                activeRoom.history.map((objMsg) => formatMessage(objMsg)).join('\n')
                : ""
              }
            />
            <div className="chat-message">
              <input placeholder="Username..." 
                autoComplete="off" 
                type="text" 
                id="user" defaultValue={randomUserName}
                ref={inputUser} />
              {activeRoom && (
                <>
                <select ref={inputUserTo} onChange={(e) => (e)}>
                  {otherUsers && otherUsers.map(otherUser => (
                    <option value={otherUser.socketId} >{otherUser.name}</option>
                  ))}
                </select>
                <input
                  placeholder="Write your message here..."
                  autoComplete="off"
                  type="text"
                  id="message"
                  ref={inputMsg}
                />
                <button onClick={sendMessage}>Send</button>
                </>
              )}
              </div>
          </div>
          <div className="chat-users">
            <div className="chat-users-title">Users</div>
            <ul>
              {activeRoom && activeRoom.users.map((user) => (
                <li key={user.name}>{user.name}</li>
              ))}
            </ul>
            {activeRoom && (
            <div className="chat-users-kickout">
              <button onClick={clearRoom} >Kick out all users</button>
            </div>
            )}
          </div>
        </div>
      </main>
      <div className="errors">{error}</div>
      <footer>&copy; My Chat Copyright</footer>
    </div>
  );
}

export default App;
