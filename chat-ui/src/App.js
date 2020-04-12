import React, { useState, useEffect, useRef } from 'react';
import './App.css';
import io from 'socket.io-client';

let socket = io(':8000');

function App() {
  // state: rooms with histories
  let [ rooms, setRooms ] = useState([
    {
      title: 'Public',
      history: [ { msg: 'Hello Irina', user: 'Rob' }, { msg: 'Hey Rob', user: 'Irina' } ],
      users: [ 'Rob', 'Irina' ]
    },
    {
      title: 'Issues',
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

    if (user) {
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
      socket.emit('message', { msg, user, room: activeRoom.title });
      setError('');
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

  // define socket.io event listener
  // AFTER first render ("componentDidMount")
  useEffect(() => {

    // on message receipt: add to state
    socket.on('message', (objMsg) => {
      console.log('Yay! Message received: ', objMsg);
      if (objMsg.user && objMsg.msg) {
        addMessageToHistory(objMsg);
        // scroll to last message (end of textarea)
        txtChat.current.scrollTop = txtChat.current.scrollHeight;
      }
    });
  }, []);

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
                <li key={room.title} onClick={(e) => switchRoom(room)}>
                  {room.title}
                </li>
              ))}
            </ul>
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
              <input placeholder="Username..." autoComplete="off" type="text" id="user" ref={inputUser} />
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
        </div>
      </main>
      <div className="errors">{error}</div>
      <footer>&copy; My Chat Copyright</footer>
    </div>
  );
}

export default App;
