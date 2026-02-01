import { useState, useEffect, useRef } from 'react';
import socket from '../sockets/socket';

const Chat = ({ roomId, username }) => {
  const [message, setMessage] = useState('');
  const [messageList, setMessageList] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const chatBodyRef = useRef(null);
  const [typingUser, setTypingUser] = useState(null);
  const typingTimeoutRef = useRef(null);

  // auto-scroll to the bottom of the chat when new messages arrive or chat is opened
  useEffect(() => {
    if (chatBodyRef.current) {
      chatBodyRef.current.scrollTop = chatBodyRef.current.scrollHeight;
    }
  }, [messageList, isOpen]);

  // reset unread messages counter when the chat window is opened
  useEffect(() => {
    if (isOpen) {
      setUnreadCount(0);
    }
  }, [isOpen]);

  // send message to server
  const sendMessage = async () => {
    if (message.trim() !== "") {
      const data = { roomId, username, message };

      // emit message to backend
      await socket.emit("send_message", data);

      // clear input after sending
      setMessage("");
    }
  };

  useEffect(() => {
    // listen for incoming messages from server
    const handleMessage = (data) => {
      setMessageList((list) => [...list, data]);
      
      // increment counter only if: chat is closed, sender is not current user, and it's not a system notification
      if (!isOpen && data.username !== username && !data.isSystem) {
        setUnreadCount((prev) => prev + 1);
      }
    };

    // handler for receiving the full chat history upon joining the room
    const handleHistory = (history) => {
      setMessageList(history);
    };

    const handleTyping = (data) => {
      setTypingUser(data.username);
      
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);

      typingTimeoutRef.current = setTimeout(() => {
        setTypingUser(null);
      }, 3000);
    };

    socket.on("receive_message", handleMessage);
    socket.on("chat_history", handleHistory);
    socket.on("display_typing", handleTyping);

    // remove listeners on component unmount
    return () => {
      socket.off("receive_message", handleMessage);
      socket.off("chat_history", handleHistory);
      socket.off("display_typing", handleTyping);
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    };
  }, [roomId, isOpen, username]);

  return (
    <div className={`floating-chat ${isOpen ? 'open' : ''}`}>
      {/* toggle button shown when chat is closed */}
      {!isOpen && (
        <button className="chat-toggle-btn" onClick={() => setIsOpen(true)}>
          💬
          {/* display badge if there are unread messages */}
          {unreadCount > 0 && (
            <span className="unread-badge">{unreadCount}</span>
          )}
        </button>
      )}

      {isOpen && (
        <div className="chat-window">
          <div className="chat-header">
            <span>BattleField Chat</span>
            <button className="close-chat-btn" onClick={() => setIsOpen(false)}>✖</button>
          </div>
          
          <div className="chat-body" ref={chatBodyRef}>
            {messageList.map((msg, index) => (
              <div key={index} className={`message ${msg.isSystem ? 'system-msg' : ''}`}>
                {!msg.isSystem ? (
                  <>
                    <span className="msg-user"><strong>{msg.username}</strong></span>: {msg.message}
                  </>
                ) : (
                  <span className="system-text">{msg.message}</span>
                )}
                <span className="msg-time">{msg.time}</span>
              </div>
            ))}
          </div>

          {typingUser && (
            <div className="typing-indicator">
              <span className="dots">✎</span> {typingUser} is typing...
            </div>
          )}

          <div className="chat-footer">
            <input 
              type="text"
              value={message}
              placeholder="Type message..."
              onChange={(e) => {
                setMessage(e.target.value);
                if (e.target.value.trim() !== "") {
                  socket.emit("typing", { roomId, username });
                }
              }}
              onKeyDown={(e) => e.key === "Enter" && sendMessage()}
            />
            <button onClick={sendMessage}>Send</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Chat;