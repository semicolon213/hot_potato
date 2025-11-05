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
  onUpdate: (announcementId: string, postData: { title: string; content: string; attachments: File[]; existingAttachments: { name: string, url: string }[] }) => Promise<void>;
  onDelete: (announcementId: string) => Promise<void>;
}

const AnnouncementView: React.FC<AnnouncementViewProps> = ({ post, user, onBack, onUpdate, onDelete }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedTitle, setEditedTitle] = useState(post.title);
  const [editedContent, setEditedContent] = useState('');
  const [existingAttachments, setExistingAttachments] = useState<{name: string, url: string}[]>([]);
  const [newAttachments, setNewAttachments] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [mainContent, setMainContent] = useState('');
  const [attachmentHtml, setAttachmentHtml] = useState<string | null>(null);

  useEffect(() => {
    const attachmentRegex = /<p>첨부파일:.*?<\/p>/gs;
    const contentWithoutAttachments = post.content.replace(attachmentRegex, '').trim();
    setMainContent(contentWithoutAttachments);
    setEditedContent(contentWithoutAttachments);

    if (post.file_notice) {
        try {
            const files = JSON.parse(post.file_notice);
            setExistingAttachments(files);
        } catch (error) {
            console.error("Error parsing file_notice JSON:", error);
            setExistingAttachments([]);
        }
    } else {
        setExistingAttachments([]);
    }

    const attachmentMatches = post.content.match(attachmentRegex);
    const html = attachmentMatches ? attachmentMatches.join('') : null;
    setAttachmentHtml(html);

    setNewAttachments([]);
  }, [post]);

  const isAuthor = String(user?.studentId) === post.writer_id;

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleSave = () => {
    onUpdate(post.id, { 
      title: editedTitle, 
      content: editedContent,
      attachments: newAttachments,
      existingAttachments: existingAttachments
    });
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditedTitle(post.title);
    setEditedContent(mainContent);
    setNewAttachments([]);
    if (post.file_notice) {
        try {
            setExistingAttachments(JSON.parse(post.file_notice));
        } catch (e) {
            setExistingAttachments([]);
        }
    } else {
        setExistingAttachments([]);
    }
    setIsEditing(false);
  };

  const handleDelete = () => {
    if (window.confirm('정말로 이 공지사항을 삭제하시겠습니까?')) {
      onDelete(post.id);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setNewAttachments(prev => [...prev, ...Array.from(e.target.files)]);
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  const removeExistingAttachment = (index: number) => {
    setExistingAttachments(prev => prev.filter((_, i) => i !== index));
  };

  const removeNewAttachment = (index: number) => {
    setNewAttachments(prev => prev.filter((_, i) => i !== index));
  };

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
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                  <button onClick={triggerFileInput} className="attachment-button">
                      파일 선택
                  </button>
              </div>
              <input
                  type="file"
                  multiple
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  style={{ display: 'none' }}
              />
              <div className="attachment-list">
                  {existingAttachments.map((file, index) => (
                      <div key={`existing-${index}`} className="attachment-item">
                          <span className="attachment-name">{file.name}</span>
                          <button onClick={() => removeExistingAttachment(index)} className="remove-attachment-button"><BiX /></button>
                      </div>
                  ))}
                  {newAttachments.map((file, index) => (
                      <div key={`new-${index}`} className="attachment-item">
                          <span className="attachment-name">{file.name}</span>
                          <button onClick={() => removeNewAttachment(index)} className="remove-attachment-button"><BiX /></button>
                      </div>
                  ))}
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