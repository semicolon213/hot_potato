import React, { useState, useEffect, useRef } from 'react';
import '../../styles/pages/NewAnnouncementPost.css';
import type { User, AnnouncementAccessRights, AnnouncementUser } from '../../types/app';
import { BiPencil, BiPaperclip, BiSave, BiX } from "react-icons/bi";
import TiptapEditor from '../../components/ui/TiptapEditor';
import { apiClient } from '../../utils/api/apiClient';
import type { UsersListResponse } from '../../types/api/apiResponses';
import { API_ACTIONS } from '../../config/api';

interface NewAnnouncementPostProps {
    onPageChange: (pageName: string) => void;
    onAddPost: (postData: {
        title: string;
        content: string;
        author: string;
        writer_id: string;
        attachments: File[];
        accessRights?: AnnouncementAccessRights;
        isPinned: boolean;
        userType?: string;
    }) => void;
    user: User | null;
    isAuthenticated: boolean;
}

const GROUP_TYPES = [
    { value: 'student', label: '학생' },
    { value: 'professor', label: '교수' },
    { value: 'ad_professor', label: '겸임교원' },
    { value: 'supp', label: '조교' },
    { value: 'std_council', label: '집행부' }
];

const NewAnnouncementPost: React.FC<NewAnnouncementPostProps> = ({
                                                                     onPageChange, onAddPost, user, isAuthenticated
                                                                 }) => {
    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [authorName, setAuthorName] = useState(''); // 작성자 이름 상태 추가
    const [attachments, setAttachments] = useState<File[]>([]);
    const [isPinned, setIsPinned] = useState(false);
    const [users, setUsers] = useState<AnnouncementUser[]>([]);
    const [selectedIndividualUsers, setSelectedIndividualUsers] = useState<string[]>([]);
    const [selectedGroups, setSelectedGroups] = useState<string[]>([]);
    const [showPermissionSettings, setShowPermissionSettings] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (!isAuthenticated) {
            alert('Google 인증이 필요합니다.');
            onPageChange('announcements');
        }
    }, [isAuthenticated, onPageChange]);

    // 작성자 이름 로드
    useEffect(() => {
        if (user?.email) {
            // 초기값으로 Google 계정 이름 설정
            setAuthorName(user.name || '');
            
            // DB에서 실제 이름 조회
            apiClient.getUserNameByEmail(user.email)
                .then(res => {
                    if (res.success && res.name) {
                        setAuthorName(res.name);
                    } else if (res.data?.name) {
                        setAuthorName(res.data.name);
                    }
                })
                .catch(error => {
                    console.error('작성자 이름 조회 실패:', error);
                    // 실패 시 초기값(user.name)이 유지됨
                });
        }
    }, [user?.email, user?.name]);

    // 사용자 목록 로드
    useEffect(() => {
        const loadUsers = async () => {
            try {
                const response = await apiClient.request(API_ACTIONS.GET_ANNOUNCEMENT_USER_LIST, {});
                if (response.success && response.data && Array.isArray(response.data.users)) {
                    setUsers(response.data.users);
                } else {
                    // fallback: getAllUsers 사용
                    const fallbackResponse = await apiClient.getAllUsers();
                    if (fallbackResponse.success && fallbackResponse.users && Array.isArray(fallbackResponse.users)) {
                        const usersResponse = fallbackResponse as UsersListResponse;
                        const userList = usersResponse.users
                            .filter((u) => u.isApproved || u.Approval === 'O')
                            .map((u) => ({
                                id: u.studentId || u.no_member || '',
                                name: u.name || u.name_member || '',
                                user_type: u.userType || u.user_type || 'student',
                                email: u.email || ''
                            }));
                        setUsers(userList);
                    }
                }
            } catch (error) {
                console.error('사용자 목록 로드 오류:', error);
            }
        };
        loadUsers();
    }, []);

    const handleSavePost = async () => {
        if (!title.trim() || !content.trim()) {
            alert('제목과 내용을 모두 입력해주세요.');
            return;
        }

        // 권한 설정 구성
        const accessRights: AnnouncementAccessRights = {};
        if (selectedIndividualUsers.length > 0) {
            accessRights.individual = selectedIndividualUsers;
        }
        if (selectedGroups.length > 0) {
            accessRights.groups = selectedGroups;
        }

        try {
            await onAddPost({
                title,
                content, // HTML content from TiptapEditor
                author: authorName || user?.name || 'Unknown',
                writer_id: user?.studentId || '',
                attachments: attachments,
                accessRights: Object.keys(accessRights).length > 0 ? accessRights : undefined,
                isPinned,
                userType: user?.userType || 'student',
            });
            // onAddPost가 완료되면 자동으로 목록으로 이동됨 (App.tsx의 handleAddAnnouncement에서 처리)
        } catch (error) {
            console.error('공지사항 저장 오류:', error);
            // 에러는 App.tsx에서 처리되므로 여기서는 추가 처리 불필요
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            setAttachments(prev => [...prev, ...Array.from(e.target.files)]);
        }
    };

    const triggerFileInput = () => {
        fileInputRef.current?.click();
    };

    const removeAttachment = (index: number) => {
        setAttachments(prev => prev.filter((_, i) => i !== index));
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const handleCancel = () => {
        const hasUnsavedChanges =
            title.trim() !== '' ||
            content.trim() !== '' ||
            attachments.length > 0;

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
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                            <button onClick={triggerFileInput} className="attachment-button">
                                파일 선택
                            </button>
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
                        <input
                            type="file"
                            multiple
                            ref={fileInputRef}
                            onChange={handleFileChange}
                            style={{ display: 'none' }}
                        />
                        <div className="attachment-list">
                            {attachments.map((file, index) => (
                                <div key={index} className="attachment-item">
                                    <span className="attachment-name">{file.name}</span>
                                    <button onClick={() => removeAttachment(index)} className="remove-attachment-button"><BiX /></button>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="form-group">
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                            <label>권한 설정</label>
                            <button 
                                type="button"
                                onClick={() => setShowPermissionSettings(!showPermissionSettings)}
                                style={{ 
                                    padding: '5px 10px', 
                                    fontSize: '14px',
                                    cursor: 'pointer',
                                    border: '1px solid #ccc',
                                    borderRadius: '4px',
                                    background: showPermissionSettings ? '#f0f0f0' : 'white'
                                }}
                            >
                                {showPermissionSettings ? '접기' : '권한 설정'}
                            </button>
                        </div>
                        
                        {showPermissionSettings && (
                            <div style={{ 
                                border: '1px solid #ddd', 
                                borderRadius: '8px', 
                                padding: '15px', 
                                marginTop: '10px',
                                background: '#f9f9f9'
                            }}>
                                <div style={{ marginBottom: '15px' }}>
                                    <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>
                                        그룹 권한
                                    </label>
                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                                        {GROUP_TYPES.map(group => (
                                            <label key={group.value} style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                                                <input
                                                    type="checkbox"
                                                    checked={selectedGroups.includes(group.value)}
                                                    onChange={(e) => {
                                                        if (e.target.checked) {
                                                            setSelectedGroups([...selectedGroups, group.value]);
                                                        } else {
                                                            setSelectedGroups(selectedGroups.filter(g => g !== group.value));
                                                        }
                                                    }}
                                                    style={{ marginRight: '5px' }}
                                                />
                                                {group.label}
                                            </label>
                                        ))}
                                    </div>
                                </div>

                                <div>
                                    <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>
                                        개별 사용자 권한
                                    </label>
                                    <div style={{ 
                                        maxHeight: '200px', 
                                        overflowY: 'auto', 
                                        border: '1px solid #ddd', 
                                        borderRadius: '4px', 
                                        padding: '10px',
                                        background: 'white'
                                    }}>
                                        {users.length === 0 ? (
                                            <div style={{ padding: '10px', textAlign: 'center', color: '#666' }}>
                                                사용자 목록을 불러오는 중...
                                            </div>
                                        ) : (
                                            users.map(userItem => (
                                                <label 
                                                    key={userItem.id} 
                                                    style={{ 
                                                        display: 'flex', 
                                                        alignItems: 'center', 
                                                        padding: '5px',
                                                        cursor: 'pointer'
                                                    }}
                                                >
                                                    <input
                                                        type="checkbox"
                                                        checked={selectedIndividualUsers.includes(userItem.id)}
                                                        onChange={(e) => {
                                                            if (e.target.checked) {
                                                                setSelectedIndividualUsers([...selectedIndividualUsers, userItem.id]);
                                                            } else {
                                                                setSelectedIndividualUsers(selectedIndividualUsers.filter(id => id !== userItem.id));
                                                            }
                                                        }}
                                                        style={{ marginRight: '8px' }}
                                                    />
                                                    <span>{userItem.name} ({userItem.user_type})</span>
                                                </label>
                                            ))
                                        )}
                                    </div>
                                    <div style={{ marginTop: '8px', fontSize: '12px', color: '#666' }}>
                                        {selectedIndividualUsers.length > 0 && (
                                            <div>선택된 사용자: {selectedIndividualUsers.length}명</div>
                                        )}
                                        {selectedGroups.length === 0 && selectedIndividualUsers.length === 0 && (
                                            <div style={{ color: '#999', fontStyle: 'italic' }}>
                                                권한을 설정하지 않으면 모든 승인된 사용자에게 공개됩니다.
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                <div className="card-footer">
                    <span>작성자: {authorName || '이름 로딩 중...'}</span>
                </div>
            </div>
        </div>
    );
};

export default NewAnnouncementPost;