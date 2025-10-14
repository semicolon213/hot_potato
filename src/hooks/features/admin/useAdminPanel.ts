import { useState, useEffect } from 'react';
import { useAuthStore } from '../auth/useAuthStore';
// 타입 정의
interface AdminUser {
  id: string;
  email: string;
  studentId: string;
  name: string;
  isAdmin: boolean;
  isApproved: boolean;
  requestDate: string;
  approvalDate?: string | null;
}

type EmailStatus = 'idle' | 'sending' | 'success' | 'error';
import { fetchPendingUsers, sendAdminKeyEmail, approveUser, rejectUser } from '../../../utils/api/adminApi';
import { sendEmailWithGmailAPI } from '../../../utils/api/gmailApi';
import type { ApiResponse } from '../../../config/api';

export const useAdminPanel = () => {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [emailToSend, setEmailToSend] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [emailStatus, setEmailStatus] = useState<EmailStatus>('idle');
  
  const { user, setUser } = useAuthStore();

  // 사용자 목록 가져오기
  const loadUsers = async () => {
    try {
      setIsLoading(true);
      const result = await fetchPendingUsers() as ApiResponse<{ users: AdminUser[] }>;
      
      if (result.success && Array.isArray(result.users)) {
        console.log('=== 사용자 목록 받음 ===');
        console.log('사용자 수:', result.users.length);
        console.log('사용자 목록:', result.users.map((user: AdminUser) => ({
          id: user.id,
          studentId: user.studentId,
          name: user.name,
          email: user.email,
          isApproved: user.isApproved
        })));
        setUsers(result.users);
      } else {
        setUsers([]);
        setMessage('사용자 목록을 가져오는데 실패했습니다.');
      }
    } catch (error) {
      console.error('사용자 목록 조회 실패:', error);
      setUsers([]);
      setMessage('사용자 목록을 가져오는데 실패했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  // 사용자 승인
  const handleApproveUser = async (userId: string) => {
    try {
      setIsLoading(true);
      setMessage('');
      
      console.log('=== 승인 요청 데이터 ===');
      console.log('userId:', userId);
      
      const result = await approveUser(userId);
      
      if (result.success) {
        setMessage('사용자가 승인되었습니다.');
        
        // 승인된 사용자가 현재 로그인한 사용자인지 확인
        const approvedUser = users.find(u => u.id === userId);
        if (approvedUser && approvedUser.email === user?.email) {
          // 현재 로그인한 사용자가 승인된 경우 상태 업데이트
          const updatedUser = {
            ...user,
            isApproved: true,
            isAdmin: approvedUser.isAdmin
          };
          setUser(updatedUser);
          localStorage.setItem('user', JSON.stringify(updatedUser));
        }
        
        // 목록 새로고침
        loadUsers();
      } else {
        setMessage(result.error || '사용자 승인에 실패했습니다.');
      }
      
    } catch (error) {
      console.error('사용자 승인 실패:', error);
      setMessage('사용자 승인에 실패했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  // 사용자 거부
  const handleRejectUser = async (userId: string) => {
    try {
      setIsLoading(true);
      setMessage('');
      
      console.log('=== 거부 요청 데이터 ===');
      console.log('userId:', userId);
      
      const result = await rejectUser(userId);
      
      if (result.success) {
        setMessage('사용자가 거부되었습니다.');
        // 목록 새로고침
        loadUsers();
      } else {
        setMessage(result.error || '사용자 거부에 실패했습니다.');
      }
      
    } catch (error) {
      console.error('사용자 거부 실패:', error);
      setMessage('사용자 거부에 실패했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  // 관리자 키 이메일 전송
  const handleSendAdminKey = async () => {
    try {
      setIsLoading(true);
      setMessage('');
      setEmailStatus('sending');
      
      if (!emailToSend) {
        setMessage('이메일을 입력해주세요.');
        setEmailStatus('error');
        return;
      }

      // useAuthStore에서 액세스 토큰 가져오기
      let adminAccessToken;
      try {
        // 1순위: useAuthStore의 user.googleAccessToken
        if (user?.googleAccessToken) {
          console.log('useAuthStore에서 토큰 발견:', user.googleAccessToken.substring(0, 20) + '...');
          adminAccessToken = user.googleAccessToken;
        } 
        // 2순위: localStorage에서 토큰 확인
        else {
          const storedToken = localStorage.getItem('googleAccessToken');
          if (storedToken) {
            console.log('localStorage에서 토큰 발견:', storedToken.substring(0, 20) + '...');
            adminAccessToken = storedToken;
          } else {
            // 3순위: gapi client에서 직접 가져오기 (Auth2 대신)
            const gapi = (window as any).gapi;
            if (!gapi || !gapi.client) {
              throw new Error('Google API가 초기화되지 않았습니다.');
            }
            
            // gapi client에서 토큰 가져오기
            const token = gapi.client.getToken();
            console.log('gapi.client.getToken() 결과:', token);
            
            if (!token || !token.access_token) {
              console.error('토큰 상태:', {
                token: token,
                hasAccessToken: !!(token && token.access_token),
                tokenType: typeof token
              });
              throw new Error('액세스 토큰을 가져올 수 없습니다. 다시 로그인해주세요.');
            }
            
            adminAccessToken = token.access_token;
            console.log('액세스 토큰 길이:', adminAccessToken.length);
            console.log('토큰 만료 시간:', token.expires_at ? new Date(token.expires_at) : '알 수 없음');
          }
        }
      } catch (tokenError) {
        console.error('토큰 가져오기 실패:', tokenError);
        setMessage('Google 인증이 필요합니다. 다시 로그인해주세요.');
        setEmailStatus('error');
        return;
      }
      
      // 백엔드에서 복호화된 키와 이메일 템플릿 가져오기
      const result = await sendAdminKeyEmail(emailToSend, adminAccessToken) as ApiResponse<{
        adminKey: string;
        encryptedKey: string;
        layersUsed: number;
        emailTemplate: {
          to: string;
          subject: string;
          html: string;
        };
      }>;
      
      console.log('백엔드 응답:', result);
      console.log('관리자 키 길이:', result.adminKey?.length);
      console.log('관리자 키 전체:', result.adminKey);
      console.log('암호화된 키:', result.encryptedKey);
      console.log('사용된 레이어:', result.layersUsed);
      
      if (result.success) {
        console.log('이메일 템플릿:', result.emailTemplate);
        
        // 이메일 템플릿을 사용하여 Gmail API로 이메일 전송
        try {
          if (result.emailTemplate) {
            await sendEmailWithGmailAPI(result.emailTemplate);
          } else {
            throw new Error('이메일 템플릿이 없습니다.');
          }
          setMessage('관리자 키가 이메일로 전송되었습니다!');
          setEmailToSend('');
          setEmailStatus('success');
        } catch (gmailError) {
          console.error('Gmail API 전송 실패:', gmailError);
          setMessage('Gmail API 전송에 실패했습니다: ' + (gmailError as Error).message);
          setEmailStatus('error');
        }
      } else {
        setMessage('이메일 전송에 실패했습니다: ' + (result as any).error);
        setEmailStatus('error');
      }
      
    } catch (error) {
      console.error('이메일 전송 오류:', error);
      setMessage('이메일 전송 중 오류가 발생했습니다.');
      setEmailStatus('error');
    } finally {
      setIsLoading(false);
    }
  };

  // 초기화
  useEffect(() => {
    loadUsers();
  }, []);

  // 메시지 자동 사라짐
  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => {
        setMessage('');
        setEmailStatus('idle');
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [message]);

  // 이메일 전송 성공 후 상태 초기화
  useEffect(() => {
    if (emailStatus === 'success') {
      const timer = setTimeout(() => {
        setEmailStatus('idle');
        setMessage('');
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [emailStatus]);

  return {
    users,
    emailToSend,
    setEmailToSend,
    isLoading,
    message,
    emailStatus,
    handleApproveUser,
    handleRejectUser,
    handleSendAdminKey,
    loadUsers
  };
};
