import React, { useState, useEffect, useRef } from 'react';
import type { Post, User } from '../../types/app';
import '../../styles/pages/AnnouncementView.css';
import '../../styles/pages/NewAnnouncementPost.css';
import { BiPencil, BiSave, BiX, BiPaperclip } from "react-icons/bi";
import TiptapEditor from '../../components/ui/TiptapEditor';

interface AnnouncementViewProps {
  post: Post;
  user: User | null;
  onBack: () => void;
  onUpdate: (announcementId: string, postData: { title: string; content: string; attachment?: File | null; isPinned?: boolean; }) => Promise<void>;
  onDelete: (announcementId: string) => Promise<void>;
}

const AnnouncementView: React.FC<AnnouncementViewProps> = ({ post, user, onBack, onUpdate, onDelete }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedTitle, setEditedTitle] = useState(post.title);
  const [editedContent, setEditedContent] = useState('');
  const [newAttachment, setNewAttachment] = useState<File | null>(null);
  const [isPinned, setIsPinned] = useState(post.isPinned || false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [mainContent, setMainContent] = useState('');
  const [attachmentHtml, setAttachmentHtml] = useState<string | null>(null);
  const [attachmentName, setAttachmentName] = useState<string | null>(null);

  useEffect(() => {
    const attachmentRegex = /<p>첨부파일:.*?<\/p>/g; // Use global flag
    const main = post.content.replace(attachmentRegex, '').trim();
    setMainContent(main);
    setEditedContent(main);

    const attachmentMatches = post.content.match(attachmentRegex);
    const html = attachmentMatches ? attachmentMatches.join('') : null;
    setAttachmentHtml(html);

    if (attachmentMatches) {
      const names = attachmentMatches.map(match => {
        const nameMatch = match.match(/>(.*?)</);
        return nameMatch ? nameMatch[1] : '파일';
      });
      // For now, just join the names for display in edit mode. This will be improved later.
      setAttachmentName(names.join(', '));
    } else {
      setAttachmentName(null);
    }
    setNewAttachment(null);
  }, [post.content]);

  const isAuthor = String(user?.studentId) === post.writer_id;

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleSave = () => {
    let contentToSave = editedContent;
    // If there is no new attachment, but there was an old one, re-attach the old html
    if (!newAttachment && attachmentHtml) {
      contentToSave = `${editedContent}\n\n${attachmentHtml}`;
    }

    onUpdate(post.id, { 
      title: editedTitle, 
      content: contentToSave, 
      attachment: newAttachment, 
      isPinned: isPinned 
    });
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditedTitle(post.title);
    setEditedContent(mainContent);
    setNewAttachment(null);
    setIsEditing(false);
  };

  const handleDelete = () => {
    if (window.confirm('정말로 이 공지사항을 삭제하시겠습니까?')) {
      onDelete(post.id);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setNewAttachment(e.target.files[0]);
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  const removeAttachment = () => {
    setNewAttachment(null);
    setAttachmentName(null);
    setAttachmentHtml(null);
    if(fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }

  if (isEditing) {
    return (
      <div className="new-announcement-page">
        <div className="new-announcement-card">
          <div className="card-header">
            <h2><BiPencil /> 공지사항 수정</h2>
            <div className="header-actions">
              <button onClick={handleCancel} className="action-button cancel-button">
                <BiX /> 취소
              </button>
              <button onClick={handleSave} className="action-button save-button">
                <BiSave /> 저장
              </button>
            </div>
          </div>

          <div className="card-body">
            <div className="form-group">
              <label htmlFor="title-input">제목</label>
              <input
                id="title-input"
                type="text"
                placeholder="제목을 입력하세요"
                value={editedTitle}
                onChange={(e) => setEditedTitle(e.target.value)}
                className="title-input"
              />
            </div>

            <div className="form-group">
              <label htmlFor="content-textarea">내용</label>
              <TiptapEditor content={editedContent} onContentChange={setEditedContent} />
            </div>

            <div className="form-group">
              <label><BiPaperclip /> 파일 첨부</label>
              <div className="attachment-area">
                <div className="attachment-controls">
                  <button onClick={triggerFileInput} className="attachment-button">
                    파일 선택
                  </button>
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    style={{ display: 'none' }}
                  />
                  {(newAttachment || attachmentName) &&
                    <div className='attachment-info'>
                      <span className="attachment-name">{newAttachment?.name || attachmentName}</span>
                      <button onClick={removeAttachment} className='remove-attachment-button'><BiX/></button>
                    </div>
                  }
                </div>
                <div className="pin-announcement">
                    <input
                        type="checkbox"
                        id="pin-checkbox"
                        checked={isPinned}
                        onChange={(e) => setIsPinned(e.target.checked)}
                    />
                    <label htmlFor="pin-checkbox">고정 공지사항</label>
                </div>
              </div>
            </div>
          </div>

          <div className="card-footer">
            <span>작성자: {user?.name || '인증 확인 중...'}</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="announcements-container">
      <div className="post-view-header">
        <h1 className="announcements-title">{post.title}</h1>
        {isAuthor && (
          <div className="post-view-actions">
            <button onClick={handleEdit} className="edit-button">수정</button>
            <button onClick={handleDelete} className="delete-button">삭제</button>
          </div>
        )}
      </div>
      <div className="post-view-meta-details">
        <span>작성자: {post.author}</span>
        <span>작성일: {post.date}</span>
        <span>조회수: {post.views}</span>
      </div>

      {attachmentHtml && (
        <div className="post-view-attachment" dangerouslySetInnerHTML={{ __html: attachmentHtml }} />
      )}

      <div className="post-view-body" dangerouslySetInnerHTML={{ __html: mainContent.replace(/\n/g, '<br />') }} />
      <div className="post-view-footer">
        <button onClick={onBack} className="back-to-list-button">목록으로</button>
      </div>
    </div>
  );
};

export default AnnouncementView;