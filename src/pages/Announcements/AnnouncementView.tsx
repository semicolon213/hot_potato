
import React from 'react';
import type { Post } from '../../types/app';
import '../../styles/pages/AnnouncementView.css';

interface AnnouncementViewProps {
  post: Post;
  onBack: () => void;
}

const AnnouncementView: React.FC<AnnouncementViewProps> = ({ post, onBack }) => {
  const attachmentRegex = /<p>첨부파일:.*?<\/p>/;
  const attachmentMatch = post.content.match(attachmentRegex);
  
  const attachmentHtml = attachmentMatch ? attachmentMatch[0] : null;
  const mainContent = post.content.replace(attachmentRegex, '').trim();

  return (
    <div className="announcements-container">
      <div className="post-view-header">
        <h1 className="announcements-title">{post.title}</h1>
      </div>
      <div className="post-view-meta-details">
        <span>작성자: {post.author}</span>
        <span>작성일: {post.date}</span>
        <span>조회수: {post.views}</span>
      </div>

      {attachmentHtml && (
        <div className="post-view-attachment" dangerouslySetInnerHTML={{ __html: attachmentHtml }} />
      )}

      <div className="post-view-body" dangerouslySetInnerHTML={{ __html: mainContent }} />
      <div className="post-view-footer">
        <button onClick={onBack} className="back-to-list-button">목록으로</button>
      </div>
    </div>
  );
};

export default AnnouncementView;
