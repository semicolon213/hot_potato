import React, { useState } from 'react';
import { HiChatBubbleLeftRight, HiXMark } from 'react-icons/hi2';
import './Chat.css';

interface ChatProps {
  onClick?: () => void;
}

const Chat: React.FC<ChatProps> = ({ onClick }) => {
  const [isChatOpen, setIsChatOpen] = useState(false);

  const handleChatClick = () => {
    setIsChatOpen(true);
    if (onClick) {
      onClick();
    }
  };

  const handleCloseChat = () => {
    setIsChatOpen(false);
  };

  return (
    <>
      <button 
        className="chat-floating-button" 
        onClick={handleChatClick}
        aria-label="채팅"
      >
        <HiChatBubbleLeftRight />
      </button>
      
      {isChatOpen && (
        <div className="chat-window-overlay">
          <div className="chat-window">
            <div className="chat-header">
              <button className="chat-close-btn" onClick={handleCloseChat} aria-label="닫기">
                <HiXMark />
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Chat;
