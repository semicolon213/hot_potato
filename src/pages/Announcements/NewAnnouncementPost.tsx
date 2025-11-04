import React, { useState, useEffect, useRef } from 'react';
import '../../styles/pages/NewAnnouncementPost.css';
import type { User } from '../../types/app';
import { BiPencil, BiPaperclip, BiSave, BiX } from "react-icons/bi";
import TiptapEditor from '../../components/ui/TiptapEditor';

interface NewAnnouncementPostProps {
    onPageChange: (pageName: string) => void;
    onAddPost: (postData: {
        title: string;
        content: string;
        author: string;
        writer_id: string;
        attachment: File | null;
        isPinned: boolean;
    }) => void;
    user: User | null;
    isAuthenticated: boolean;
}

const NewAnnouncementPost: React.FC<NewAnnouncementPostProps> = ({
                                                                     onPageChange, onAddPost, user, isAuthenticated
                                                                 }) => {
    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [attachment, setAttachment] = useState<File | null>(null);
    const [preview, setPreview] = useState<string | null>(null);
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
            content, // HTML content from TiptapEditor
            author: user?.name || 'Unknown',
            writer_id: user?.studentId || '',
            attachment,
            isPinned,
        });
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            setAttachment(file);
            if (file.type.startsWith('image/')) {
                const reader = new FileReader();
                reader.onloadend = () => {
                    setPreview(reader.result as string);
                };
                reader.readAsDataURL(file);
            } else {
                setPreview(null);
            }
        }
    };

    const triggerFileInput = () => {
        fileInputRef.current?.click();
    };

    const removeAttachment = () => {
        setAttachment(null);
        setPreview(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const handleCancel = () => {
        const hasUnsavedChanges =
            title.trim() !== '' ||
            content.trim() !== '' ||
            attachment !== null;

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
                        <TiptapEditor content={content} onContentChange={setContent} />
                    </div>

                    <div className="form-group">
                        <label><BiPaperclip /> 파일 첨부</label>
                        <div className="attachment-area">
                            <button onClick={triggerFileInput} className="attachment-button">
                                파일 선택
                            </button>
                            <input
                                type="file"
                                ref={fileInputRef}
                                onChange={handleFileChange}
                                style={{ display: 'none' }}
                            />
                            {attachment && (
                                <div className="attachment-item">
                                    <span className="attachment-name">{attachment.name}</span>
                                    <button onClick={removeAttachment} className="remove-attachment-button"><BiX /></button>
                                </div>
                            )}
                            {preview && <img src={preview} alt="첨부파일 미리보기" className="image-preview" />}
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
