import { useState, useEffect } from 'react';
import socket from '../sockets/socket';

const Chat = ({ roomId, username }) => {

  const [message, setMessage] = useState('');
  const [messageList, setMessageList] = useState([]);

  // send message to server
  const sendMessage = async () => {
    if (message !== "") {
      const data = { roomId, username, message };

      // emit message to backend
      await socket.emit("send_message", data);

      // clear input after sending
      setMessage("");
    }
  };

  useEffect(() => {

    // listen for incoming messages from server
    socket.on("receive_message", (data) => {
      setMessageList((list) => [...list, data]);
    });

    // remove listener on component unmount
    return () => socket.off("receive_message");

  }, []);

  return (
    <div className="chat-window">

      <div className="chat-body">
        {messageList.map((msg, index) => (
          <div key={index} className="message">
            <span className="msg-user">{msg.username}</span>: {msg.message}
            <span className="msg-time">{msg.time}</span>
          </div>
        ))}
      </div>

      <div className="chat-footer">
        <input 
          type="text"
          value={message}
          placeholder="Type message..."
          onChange={(e) => setMessage(e.target.value)}
          onKeyPress={(e) => e.key === "Enter" && sendMessage()}
        />
        <button onClick={sendMessage}>Send</button>
      </div>

    </div>
  );
};

export default Chat;
