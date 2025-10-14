import React, { useEffect, useRef, useState } from 'react';
import { HiChatBubbleLeftRight, HiXMark } from 'react-icons/hi2';
import '../styles/pages/Chat.css';

interface ChatProps {
  onClick?: () => void;
}

const Chat: React.FC<ChatProps> = ({ onClick }) => {
  const [isChatOpen, setIsChatOpen] = useState(false);
  const webviewRef = useRef<HTMLWebViewElement>(null);

  const chatUrl = 'https://mail.google.com/chat/u/0/?hl=ko';
  const mobileUserAgent =
    'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1';

  const handleChatClick = () => {
    setIsChatOpen(true);
    if (onClick) {
      onClick();
    }
  };

  const handleCloseChat = () => {
    setIsChatOpen(false);
  };

  useEffect(() => {
    if (!isChatOpen) return;
    if (webviewRef.current) {
      try {
        webviewRef.current.setAttribute('useragent', mobileUserAgent);
        webviewRef.current.setAttribute('src', chatUrl);
      } catch (e) {
        console.error(e);
      }
    }
  }, [isChatOpen]);

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
            <div className="chat-body">
              {/* Electron 환경에서 webviewTag 활성 필요 */}
              <webview
                ref={webviewRef}
                src={chatUrl}
                className="chat-webview"
                partition="persist:google-chat"
                allowpopups={true}
              />
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Chat;
