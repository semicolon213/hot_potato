import React, { useState, useEffect } from 'react';
import { gapiInit } from 'papyrus-db';
import './NewBoardPost.css';
import type { Post } from '../../App'; // Import Post interface from App.tsx

interface NewBoardPostProps {
  onPageChange: (pageName: string) => void;
  onAddPost: (postData: Omit<Post, 'id' | 'date' | 'views' | 'likes'>) => void;
}

const NewBoardPost: React.FC<NewBoardPostProps> = ({ onPageChange, onAddPost }) => {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [author, setAuthor] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    // Get user's name from Google Auth
    const checkAuth = async () => {
        try {
            await gapiInit(import.meta.env.VITE_GOOGLE_CLIENT_ID);
            const gapi = (window as any).gapi;
            const authInstance = gapi.auth2.getAuthInstance();
            if (authInstance.isSignedIn.get()) {
                const profile = authInstance.currentUser.get().getBasicProfile();
                setAuthor(profile.getName());
                setIsAuthenticated(true);
            } else {
                // If not signed in, redirect to board to authenticate
                alert('Google 인증이 필요합니다.');
                onPageChange('board');
            }
        } catch (error) {
            alert('Google 인증 초기화에 실패했습니다.');
            onPageChange('board');
        }
    };
    checkAuth();
  }, [onPageChange]);

  const handleSavePost = () => {
    if (!title.trim() || !content.trim()) {
      alert('제목과 내용을 모두 입력해주세요.');
      return;
    }

    onAddPost({
      title,
      contentPreview: content,
      author,
    });
  };

  return (
    <div className="new-post-container">
      <div className="new-post-header">
        <h1>새 글 작성</h1>
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
            <span>작성자: {author || '인증 확인 중...'}</span>
        </div>
        <textarea
          placeholder="내용을 입력하세요"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          className="content-textarea"
        ></textarea>
        {/* File upload is removed for simplicity as its data was not being used */}
      </div>
    </div>
  );
};

export default NewBoardPost;