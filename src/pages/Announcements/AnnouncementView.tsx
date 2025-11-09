import React, { useState, useEffect, useRef } from 'react';
import type { Post, User, AnnouncementAccessRights, AnnouncementUser } from '../../types/app';
import '../../styles/pages/AnnouncementView.css';
import '../../styles/pages/NewAnnouncementPost.css';
import { BiPencil, BiSave, BiX, BiPaperclip } from "react-icons/bi";
import TiptapEditor from '../../components/ui/TiptapEditor';
import { apiClient } from '../../utils/api/apiClient';
import { API_ACTIONS } from '../../config/api';
import { ENV_CONFIG } from '../../config/environment';
import { incrementViewCount } from '../../utils/database/papyrusManager';

const GROUP_TYPES = [
  { value: 'student', label: '학생' },
  { value: 'professor', label: '교수' },
  { value: 'ad_professor', label: '겸임교원' },
  { value: 'supp', label: '조교' },
  { value: 'std_council', label: '집행부' }
];

interface AnnouncementViewProps {
  post: Post;
  user: User | null;
  onBack: () => void;
  onUpdate: (announcementId: string, postData: { title: string; content: string; attachments: File[]; existingAttachments: { name: string, url: string }[] }) => Promise<void>;
  onDelete: (announcementId: string) => Promise<void>;
  onRefresh?: () => void; // 목록 새로고침용
}

const AnnouncementView: React.FC<AnnouncementViewProps> = ({ post, user, onBack, onUpdate, onDelete, onRefresh }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedTitle, setEditedTitle] = useState(post.title);
  const [editedContent, setEditedContent] = useState('');
  const [existingAttachments, setExistingAttachments] = useState<{name: string, url: string}[]>([]);
  const [newAttachments, setNewAttachments] = useState<File[]>([]);
  const [isPinned, setIsPinned] = useState(post.fix_notice === 'O' || post.fix_notice === '-');
  const [users, setUsers] = useState<AnnouncementUser[]>([]);
  const [selectedIndividualUsers, setSelectedIndividualUsers] = useState<string[]>([]);
  const [selectedGroups, setSelectedGroups] = useState<string[]>([]);
  const [showPermissionSettings, setShowPermissionSettings] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [mainContent, setMainContent] = useState('');
  const [attachmentHtml, setAttachmentHtml] = useState<string | null>(null);
  const hasIncrementedViewRef = useRef<string | null>(null); // post.id를 저장하여 중복 방지

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
    // 고정 공지 상태 초기화 (승인됨 또는 요청 중인 경우만 체크)
    setIsPinned(post.fix_notice === 'O' || post.fix_notice === '-');
    
    // 권한 설정 초기화
    if (post.access_rights) {
      try {
        const accessRights = JSON.parse(post.access_rights);
        setSelectedIndividualUsers(accessRights.individual || []);
        setSelectedGroups(accessRights.groups || []);
      } catch (error) {
        console.error('권한 설정 파싱 오류:', error);
        setSelectedIndividualUsers([]);
        setSelectedGroups([]);
      }
    } else {
      setSelectedIndividualUsers([]);
      setSelectedGroups([]);
    }
  }, [post]);

  // 조회수 증가는 별도의 useEffect로 분리 (한 번만 실행)
  useEffect(() => {
    if (hasIncrementedViewRef.current !== post.id && !isEditing && post.id) {
      hasIncrementedViewRef.current = post.id;
      incrementViewCount(post.id).catch(error => {
        console.error('조회수 증가 실패:', error);
        hasIncrementedViewRef.current = null; // 실패 시 다시 시도할 수 있도록
      });
    }
  }, [post.id, isEditing]); // post.id와 isEditing만 dependency로 사용

  // 사용자 목록 로드
  useEffect(() => {
    if (isEditing) {
      const loadUsers = async () => {
        try {
          const response = await apiClient.request(API_ACTIONS.GET_ANNOUNCEMENT_USER_LIST, {});
          if (response.success && response.data && Array.isArray(response.data.users)) {
            setUsers(response.data.users);
          } else {
            // fallback: getAllUsers 사용
            const fallbackResponse = await apiClient.getAllUsers();
            if (fallbackResponse.success && fallbackResponse.users && Array.isArray(fallbackResponse.users)) {
              const userList = fallbackResponse.users
                .filter((u: any) => u.isApproved || u.Approval === 'O')
                .map((u: any) => ({
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
    }
  }, [isEditing]);

  const isAuthor = String(user?.studentId) === post.writer_id;

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleSave = () => {
    // 권한 설정 구성
    const accessRights: AnnouncementAccessRights = {};
    if (selectedIndividualUsers.length > 0) {
      accessRights.individual = selectedIndividualUsers;
    }
    if (selectedGroups.length > 0) {
      accessRights.groups = selectedGroups;
    }

    onUpdate(post.id, { 
      title: editedTitle, 
      content: editedContent,
      attachments: newAttachments,
      existingAttachments: existingAttachments,
      isPinned: isPinned,
      accessRights: Object.keys(accessRights).length > 0 ? accessRights : undefined
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
    setIsPinned(post.fix_notice === 'O' || post.fix_notice === '-');
    
    // 권한 설정 초기화
    if (post.access_rights) {
      try {
        const accessRights = JSON.parse(post.access_rights);
        setSelectedIndividualUsers(accessRights.individual || []);
        setSelectedGroups(accessRights.groups || []);
      } catch (error) {
        setSelectedIndividualUsers([]);
        setSelectedGroups([]);
      }
    } else {
      setSelectedIndividualUsers([]);
      setSelectedGroups([]);
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

  // 고정 공지 재요청
  const handleRequestPinnedAnnouncement = async () => {
    if (!user || !user.studentId) {
      alert('사용자 정보가 없습니다.');
      return;
    }

    if (!window.confirm('고정 공지 승인을 다시 요청하시겠습니까?')) {
      return;
    }

    try {
      const response = await apiClient.request(API_ACTIONS.REQUEST_PINNED_ANNOUNCEMENT, {
        spreadsheetName: ENV_CONFIG.ANNOUNCEMENT_SPREADSHEET_NAME,
        announcementId: post.id,
        userId: user.studentId
      });

      if (response.success) {
        alert('고정 공지 승인 요청이 완료되었습니다.');
        if (onRefresh) {
          onRefresh();
        }
      } else {
        alert('고정 공지 승인 요청에 실패했습니다: ' + (response.message || '알 수 없는 오류'));
      }
    } catch (error) {
      console.error('고정 공지 재요청 오류:', error);
      alert('고정 공지 승인 요청 중 오류가 발생했습니다.');
    }
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
                  {/* 고정 공지사항이 아닐 때만 체크박스 표시 */}
                  {post.fix_notice !== 'O' && (
                    <div className="pin-announcement">
                        <input
                            type="checkbox"
                            id="pin-checkbox-edit"
                            checked={isPinned}
                            onChange={(e) => setIsPinned(e.target.checked)}
                        />
                        <label htmlFor="pin-checkbox-edit">고정 공지사항</label>
                    </div>
                  )}
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
            <span>작성자: {user?.name || '인증 확인 중...'}</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="announcements-container">
      <div className="post-view-header">
        <h1 className="announcements-title">
          {post.isPinned && <span style={{ color: '#ff6b6b', marginRight: '8px' }}>📌 [고정]</span>}
          {post.title}
        </h1>
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
        {post.fix_notice === 'X' && isAuthor && (
          <span style={{ color: '#ff6b6b', marginLeft: '10px' }}>
            [고정 공지 거절됨]
            <button 
              onClick={handleRequestPinnedAnnouncement}
              style={{ 
                marginLeft: '10px', 
                padding: '4px 8px', 
                fontSize: '12px',
                cursor: 'pointer',
                border: '1px solid #ff6b6b',
                borderRadius: '4px',
                background: 'white',
                color: '#ff6b6b'
              }}
            >
              재요청
            </button>
          </span>
        )}
        {post.fix_notice === '-' && isAuthor && (
          <span style={{ color: '#ffa500', marginLeft: '10px' }}>[고정 공지 승인 대기 중]</span>
        )}
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