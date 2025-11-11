import React, { useEffect, useState } from "react";
import "../styles/pages/Mypage.css";
import { useAppState } from "../hooks/core/useAppState";
import { apiClient } from "../utils/api/apiClient";
import { lastUserManager } from "../utils/auth/lastUserManager";

const Mypage: React.FC = () => {
  const { user } = useAppState();
  const [appScriptName, setAppScriptName] = useState<string>("");
  const [isLoadingName, setIsLoadingName] = useState<boolean>(false);
  const [statusLoading, setStatusLoading] = useState<boolean>(false);
  const [appScriptStatus, setAppScriptStatus] = useState<{
    isApproved?: boolean;
    isAdmin?: boolean;
    studentId?: string;
    userType?: string;
    status?: string;
    message?: string;
  }>({});

  useEffect(() => {
    const fetchName = async () => {
      if (!user?.email) return;
      try {
        setIsLoadingName(true);
        const res = await apiClient.getUserNameByEmail(user.email);
        if (res?.success && 'name' in res && res.name) {
          setAppScriptName(res.name);
        } else if (res?.data?.name) {
          setAppScriptName(res.data.name);
        }

        // getUserNameByEmail가 사용자 전체 행을 반환하므로 여기서 학번/교번도 보강
        const rawUser = ('user' in res && res.user) || res?.data?.user;
        if (rawUser) {
          const sid = rawUser.no_member || rawUser.student_id || rawUser.no || rawUser.staff_no || rawUser.id || "";
          if (sid && !appScriptStatus.studentId) {
            setAppScriptStatus(prev => ({ ...prev, studentId: sid }));
          }
          // user_type / is_admin도 비어있으면 보강
          const role = rawUser.user_type || (rawUser.is_admin === 'O' || rawUser.isAdmin ? 'admin' : undefined);
          if (role && !appScriptStatus.userType && !appScriptStatus.isAdmin) {
            setAppScriptStatus(prev => ({ ...prev, userType: role, isAdmin: prev.isAdmin }));
          }
        }
      } catch (e) {
        // 실패 시 무시하고 구글 계정 이름 사용
      } finally {
        setIsLoadingName(false);
      }
    };
    fetchName();
  }, [user?.email]);

  useEffect(() => {
    const fetchStatus = async () => {
      if (!user?.email) return;
      try {
        setStatusLoading(true);
        const res = await apiClient.checkApprovalStatus(user.email);
        // 두 가지 응답 형태 모두 처리 (래핑/직접)
        if (res?.success && 'data' in res && res.data) {
          const data = res.data;
          const u = data.user || {};
          const sid = u.no_member || u.student_id || u.no || u.staff_no || u.id || "";
          setAppScriptStatus({
            isApproved: u.isApproved,
            isAdmin: u.isAdmin,
            studentId: sid,
            userType: u.user_type,
            status: data.status,
            message: data.message
          });
        } else if ('isApproved' in res && res.isApproved !== undefined) {
          setAppScriptStatus({
            isApproved: res.isApproved,
            isAdmin: res.isAdmin,
            studentId: res.studentId,
            userType: res.userType,
            status: res.approvalStatus,
            message: res.error ? String(res.error) : undefined
          });
        }
      } catch (e) {
        // 상태 조회 실패 시 표시값 유지
      } finally {
        setStatusLoading(false);
      }
    };
    fetchStatus();
  }, [user?.email]);

  const displayName = isLoadingName ? "불러오는 중..." : (appScriptName || user?.name || "");
  const displayEmail = user?.email || "";
  const displayStudentId = statusLoading ? "불러오는 중..." : (appScriptStatus.studentId || "");
  const displayRole = statusLoading
    ? "불러오는 중..."
    : (
        appScriptStatus.userType
          || (appScriptStatus.isAdmin ? "admin" : "")
          || (user?.userType)
          || ""
      );

  // Google 계정 프로필 이미지 가져오기
  const lastUser = user?.email ? lastUserManager.getAll().find(u => u.email === user.email) : null;
  const profilePicture = lastUser?.picture;
  const userInitial = displayName ? displayName.charAt(0).toUpperCase() : '';

  // 추가 정보 포맷팅
  const formatApprovalStatus = (status?: string) => {
    if (!status) return '정보 없음';
    switch (status) {
      case 'approved':
        return '승인됨';
      case 'pending':
        return '대기 중';
      case 'not_registered':
        return '미등록';
      default:
        return status;
    }
  };

  const formatUserType = (userType?: string) => {
    if (!userType) return '';
    const typeMap: Record<string, string> = {
      'student': '학생',
      'std_council': '집행부',
      'supp': '조교',
      'professor': '교수',
      'ad_professor': '겸임교원',
      'admin': '관리자'
    };
    return typeMap[userType] || userType;
  };

  const formatLastLoginTime = (timestamp?: number) => {
    if (!timestamp) return '정보 없음';
    const date = new Date(timestamp);
    return date.toLocaleString('ko-KR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const approvalStatus = appScriptStatus.status || (appScriptStatus.isApproved ? 'approved' : 'pending');
  const isAdmin = appScriptStatus.isAdmin || user?.isAdmin || false;
  const lastLoginTime = lastUser?.lastLoginTime;
  const displayUserType = formatUserType(appScriptStatus.userType || user?.userType);

  return (
    <div className="mypage-container">
      <div className="profile-wrapper">
        <div className="profile-header">
          <div className="avatar-wrapper">
            <div className="avatar" aria-hidden>
              {profilePicture ? (
                <img 
                  src={profilePicture} 
                  alt={displayName} 
                  className="avatar-image"
                />
              ) : (
                <div className="avatar-initial">{userInitial}</div>
              )}
            </div>
          </div>
          <div className="profile-name-section">
            <h2 className="profile-name">{displayName}</h2>
            <p className="profile-email">{displayEmail}</p>
          </div>
        </div>

        <div className="info-sections">
          <div className="info-section">
            <h3 className="section-title">사용자 정보</h3>
            <table className="info-table">
              <tbody>
                <tr className="info-row">
                  <td className="info-label-cell">학번/교번</td>
                  <td className="info-value-cell">{displayStudentId || '정보 없음'}</td>
                </tr>
                <tr className="info-row">
                  <td className="info-label-cell">사용자 유형</td>
                  <td className="info-value-cell">{displayUserType || displayRole || '정보 없음'}</td>
                </tr>
                <tr className="info-row">
                  <td className="info-label-cell">승인 상태</td>
                  <td className="info-value-cell">{formatApprovalStatus(approvalStatus)}</td>
                </tr>
                <tr className="info-row">
                  <td className="info-label-cell">관리자 여부</td>
                  <td className="info-value-cell">{isAdmin ? '관리자' : '일반 사용자'}</td>
                </tr>
                {lastLoginTime && (
                  <tr className="info-row">
                    <td className="info-label-cell">마지막 로그인</td>
                    <td className="info-value-cell">{formatLastLoginTime(lastLoginTime)}</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Mypage;
