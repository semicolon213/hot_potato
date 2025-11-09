import React, { useEffect, useState } from "react";
import "../styles/pages/Mypage.css";
import { useAppState } from "../hooks/core/useAppState";
import { apiClient } from "../utils/api/apiClient";
import type { UserNameResponse, UsersListResponse } from "../types/api/apiResponses";

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
        const userNameRes = res as Partial<UserNameResponse>;
        if (res?.success && userNameRes.name) {
          setAppScriptName(userNameRes.name);
        } else if (res?.success && res.data && typeof res.data === 'object' && 'name' in res.data) {
          setAppScriptName((res.data as { name: string }).name);
        }

        // getUserNameByEmail가 사용자 전체 행을 반환하므로 여기서 학번/교번도 보강
        const userData = res.data as Partial<UsersListResponse['users'][0]>;
        const rawUser = userData || (res.data && typeof res.data === 'object' && 'user' in res.data ? (res.data as { user: unknown }).user : undefined);
        if (rawUser && typeof rawUser === 'object') {
          const userObj = rawUser as Record<string, unknown>;
          const sid = (userObj.no_member || userObj.student_id || userObj.no || userObj.staff_no || userObj.id || "") as string;
          if (sid && !appScriptStatus.studentId) {
            setAppScriptStatus(prev => ({ ...prev, studentId: sid }));
          }
          // user_type / is_admin도 비어있으면 보강
          const role = (userObj.user_type || ((userObj.is_admin === 'O' || userObj.isAdmin) ? 'admin' : undefined)) as string | undefined;
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
        if (res?.success && res.data && typeof res.data === 'object') {
          const data = res.data as Record<string, unknown>;
          const u = (data.user || {}) as Record<string, unknown>;
          const sid = (u.no_member || u.student_id || u.no || u.staff_no || u.id || "") as string;
          setAppScriptStatus({
            isApproved: u.isApproved as boolean | undefined,
            isAdmin: u.isAdmin as boolean | undefined,
            studentId: sid,
            userType: u.user_type as string | undefined,
            status: data.status as string | undefined,
            message: data.message as string | undefined
          });
        } else if (res && typeof res === 'object' && 'isApproved' in res) {
          const directRes = res as Record<string, unknown>;
          setAppScriptStatus({
            isApproved: directRes.isApproved as boolean | undefined,
            isAdmin: directRes.isAdmin as boolean | undefined,
            studentId: directRes.studentId as string | undefined,
            userType: directRes.userType as string | undefined,
            status: directRes.approvalStatus as string | undefined,
            message: directRes.error ? String(directRes.error) : undefined
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
          || (user && typeof user === 'object' && 'userType' in user ? (user as { userType?: string }).userType : undefined)
          || ""
      );

  return (
    <div className="mypage-container">
      <section className="mypage-header" aria-hidden>
        <h1>마이페이지</h1>
      </section>

      <section className="profile-section">
        <div className="avatar-card">
          <div className="avatar" aria-hidden></div>
          <button className="btn btn-primary upload-btn" type="button">프로필 이미지 변경</button>
        </div>
        <div className="profile-info-card">
          <div className="info-row">
            <label>이름</label>
            <input className="form-input" type="text" placeholder="이름" value={displayName} readOnly />
          </div>
          <div className="info-row">
            <label>이메일</label>
            <input className="form-input" type="email" placeholder="이메일" value={displayEmail} disabled />
          </div>
          <div className="info-row">
            <label>학번/교번</label>
            <input className="form-input" type="text" placeholder="학번/교번" value={displayStudentId} readOnly />
          </div>
          <div className="info-row">
            <label>역할</label>
            <input className="form-input" type="text" placeholder="역할" value={displayRole} readOnly />
          </div>
        </div>
      </section>

      {/* 계정 보안(비밀번호 변경) 섹션 제거 */}

      {/* 알림 등 환경 설정 섹션 제거 */}
    </div>
  );
};

export default Mypage;
