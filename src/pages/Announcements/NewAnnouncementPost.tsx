import React, { useState, useEffect } from 'react';
import './NewAnnouncementPost.css';
import type { Post, User } from '../../App'; // Import Post and User interfaces from App.tsx

interface NewAnnouncementPostProps {
  onPageChange: (pageName: string) => void;
  onAddPost: (postData: Omit<Post, 'id' | 'date' | 'views' | 'likes'>) => void;
  user: User | null;
  isAuthenticated: boolean;
}

const NewAnnouncementPost: React.FC<NewAnnouncementPostProps> = ({ onPageChange, onAddPost, user, isAuthenticated }) => {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');

  useEffect(() => {
    if (!isAuthenticated) {
      alert('Google 인증이 필요합니다.');
      onPageChange('announcements');
    }
  }, [isAuthenticated, onPageChange]);

  const handleSavePost = () => {
    if (!title.trim() || !content.trim()) {
      alert('제목과 내용을 모두 입력해주세요.');
      return;
    }

    onAddPost({
      title,
      contentPreview: content,
      author: user?.name || 'Unknown',
    });
  };

  return (
    <div className="new-post-container">
      <div className="new-post-header">
        <h1>새 공지 작성</h1>
        <div className="header-buttons">
            <button onClick={() => onPageChange('announcements')} className="cancel-button">취소</button>
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
      </div>
    </div>
  );
};

export default NewAnnouncementPost;