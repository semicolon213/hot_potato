import React, { useState, useEffect } from 'react';
import '../../styles/pages/NewBoardPost.css';
import type { Post, User } from '../../types/app';

interface NewBoardPostProps {
  onPageChange: (pageName: string) => void;
  onAddPost: (postData: { title: string; content: string; author: string; writer_id: string; }) => void;
  user: User | null;
  isAuthenticated: boolean;
}

const NewBoardPost: React.FC<NewBoardPostProps> = ({ onPageChange, onAddPost, user, isAuthenticated }) => {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const { notification, showNotification, hideNotification } = useNotification();

  useEffect(() => {
    if (!isAuthenticated) {
      showNotification('Google 인증이 필요합니다.', 'warning');
      onPageChange('board');
    }
  }, [isAuthenticated, onPageChange, showNotification]);

  const handleSavePost = () => {
    if (!title.trim() || !content.trim()) {
      showNotification('제목과 내용을 모두 입력해주세요.', 'warning');
      return;
    }

    onAddPost({
      title,
      content: content,
      author: user?.name || 'Unknown',
      writer_id: user?.email || ''
    });
  };

  return (
    <div className="new-post-container">
      <div className="new-post-header">
        <div className="header-buttons">
            <button onClick={() => onPageChange('board')} className="cancel-button">취소</button>
            <button onClick={handleSavePost} className="save-button" disabled={!isAuthenticated}>
                저장
            </button>
        </div>
      </div>
      <div className="new-post-form">
        <input
          type="text"
          placeholder="제목을 입력하세요"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="title-input"
        />
        <div className="author-info">
            <span>작성자: {user?.name || '인증 확인 중...'}</span>
        </div>
        <textarea
          placeholder="내용을 입력하세요"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          className="content-textarea"
        ></textarea>
        {/* File upload is removed for simplicity as its data was not being used */}
      </div>

      <NotificationModal
        isOpen={notification.isOpen}
        message={notification.message}
        type={notification.type}
        onClose={hideNotification}
        duration={notification.duration}
      />
    </div>
  );
};

export default NewBoardPost;
