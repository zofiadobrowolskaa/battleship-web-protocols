import { useState, useEffect, useRef } from 'react';
import mqttClient from '../api/mqtt';

const GlobalChat = ({ username }) => {
  const [message, setMessage] = useState('');
  const [messageList, setMessageList] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const chatBodyRef = useRef(null);

  // auto-scroll to the bottom of the chat when new messages arrive or chat is opened
  useEffect(() => {
    if (chatBodyRef.current) {
      chatBodyRef.current.scrollTop = chatBodyRef.current.scrollHeight;
    }
  }, [messageList, isOpen]);

  // reset the unread messages counter to zero whenever the chat window is opened
  useEffect(() => {
    if (isOpen) setUnreadCount(0);
  }, [isOpen]);

  // handle sending messages via MQTT
  const sendMessage = () => {
    if (message.trim() !== "") {
      const payload = {
        username,
        message: message.trim(),
        time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
      };
      
      // publish the message payload to the global chat topic
      mqttClient.publish('battleship/global/chat', JSON.stringify(payload));
      setMessage(""); // clear input field after sending
    }
  };

  // set up MQTT listeners and subscription on component mount
  useEffect(() => {
    const handleMqttMessage = (topic, messageBuffer) => {
      // process messages specifically from the global chat topic
      if (topic === 'battleship/global/chat') {
        const data = JSON.parse(messageBuffer.toString());
        
        // update message history and maintain only the last 50 entries to optimize performance
        setMessageList((list) => [...list, data].slice(-50));

        // increment unread counter if the chat is closed and the message is from another user
        if (!isOpen && data.username !== username) {
          setUnreadCount((prev) => prev + 1);
        }
      }
    };

    // attach the MQTT message listener and subscribe to the relevant topic
    mqttClient.on('message', handleMqttMessage);
    mqttClient.subscribe('battleship/global/chat');

    // cleanup: unsubscribe from the topic and remove the listener when the component unmounts
    return () => {
      mqttClient.unsubscribe('battleship/global/chat');
      mqttClient.removeListener('message', handleMqttMessage);
    };
  }, [isOpen, username]);

  return (
    // component wrapper with conditional class for opening/closing and positioning
    <div className={`floating-chat global-chat ${isOpen ? 'open' : ''}`}>
      
      {!isOpen && (
        <button className="chat-toggle-btn global-btn" onClick={() => setIsOpen(true)}>
          💬

          {unreadCount > 0 && <span className="unread-badge">{unreadCount}</span>}
        </button>
      )}

      {isOpen && (
        <div className="chat-window global-window">
          <div className="chat-header global-header">
            <span>Global Lobby 🌍 </span>
            <button className="close-chat-btn" onClick={() => setIsOpen(false)}>✖</button>
          </div>
          
          {/* message display area with auto-scroll reference */}
          <div className="chat-body" ref={chatBodyRef}>
            {messageList.map((msg, index) => (
              <div key={index} className="message">
                <span className="msg-user"><strong>{msg.username}</strong></span>: {msg.message}
                <span className="msg-time">{msg.time}</span>
              </div>
            ))}
            {messageList.length === 0 && <p className="system-text">No global messages yet...</p>}
          </div>

          <div className="chat-footer">
            <input 
              type="text"
              value={message}
              placeholder="Chat with everyone..."
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && sendMessage()} // Send on Enter key press
            />
            <button onClick={sendMessage}>Send</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default GlobalChat;