
import React, { useState, useEffect, useRef } from 'react';
import '../../styles/pages/NewAnnouncementPost.css';
import type { Post, User } from '../../types/app';
import { BiPencil, BiPaperclip, BiSave, BiX } from "react-icons/bi";

interface NewAnnouncementPostProps {
  onPageChange: (pageName: string) => void;
  onAddPost: (postData: { title: string; content: string; author: string; writer_id: string; attachments: File[]; }) => void;
  user: User | null;
  isAuthenticated: boolean;
}

const NewAnnouncementPost: React.FC<NewAnnouncementPostProps> = ({ onPageChange, onAddPost, user, isAuthenticated }) => {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [attachments, setAttachments] = useState<File[]>([]);
  const [isPinned, setIsPinned] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
      content: content,
      author: user?.name || 'Unknown',
      writer_id: user?.studentId || '',
      attachments: attachments
    });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setAttachments(prev => [...prev, ...Array.from(e.target.files as FileList)]);
    }
  };

  const removeAttachment = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  }

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  const handleCancel = () => {
    const hasUnsavedChanges = title.trim() !== '' || content.trim() !== '' || attachments.length > 0;
    if (hasUnsavedChanges) {
      if (window.confirm('작성 중인 내용이 있습니다. 정말로 취소하시겠습니까?')) {
        onPageChange('announcements');
      }
    } else {
      onPageChange('announcements');
    }
  };

  return (
    <div className="new-announcement-page">
      <div className="new-announcement-card">
        <div className="card-header">
          <h2><BiPencil /> 새 공지사항 작성</h2>
          <div className="header-actions">
            <button onClick={handleCancel} className="action-button cancel-button">
              <BiX /> 취소
            </button>
            <button onClick={handleSavePost} className="action-button save-button" disabled={!isAuthenticated}>
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
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="title-input"
            />
          </div>

          <div className="form-group">
            <label htmlFor="content-textarea">내용</label>
            <textarea
              id="content-textarea"
              placeholder="내용을 입력하세요"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="content-textarea"
            ></textarea>
          </div>

          <div className="form-group">
            <label><BiPaperclip /> 파일 첨부</label>
            <div className="attachment-area">
              <div>
                <div className="attachment-controls">
                  <button onClick={triggerFileInput} className="attachment-button">
                    파일 선택
                  </button>
                  <input
                    type="file"
                    multiple
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    style={{ display: 'none' }}
                  />
                </div>
                <div className="attachment-list">
                  {attachments.map((file, index) => (
                    <div key={index} className="attachment-item">
                      <span className="attachment-name">{file.name}</span>
                      <button onClick={() => removeAttachment(index)} className="remove-attachment-button"><BiX/></button>
                    </div>
                  ))}
                </div>
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
};

export default NewAnnouncementPost;
