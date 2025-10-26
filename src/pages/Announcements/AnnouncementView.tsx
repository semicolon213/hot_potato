
import React from 'react';
import type { Post } from '../../types/app';
import '../../styles/pages/AnnouncementView.css';

interface AnnouncementViewProps {
  post: Post;
  onBack: () => void;
}

const AnnouncementView: React.FC<AnnouncementViewProps> = ({ post, onBack }) => {
  return (
    <div className="announcement-view-container">
      <button onClick={onBack} className="back-button">목록으로</button>
      <div className="announcement-view-header">
        <h1 className="announcement-view-title">{post.title}</h1>
        <div className="announcement-view-meta">
          <span>작성자: {post.author}</span>
          <span>작성일: {post.date}</span>
          <span>조회수: {post.views}</span>
        </div>
      </div>
      <div className="announcement-view-content" dangerouslySetInnerHTML={{ __html: post.content }} />
    </div>
  );
};

export default AnnouncementView;
