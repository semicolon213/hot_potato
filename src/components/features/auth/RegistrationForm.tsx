import React from 'react';
// 타입 정의
interface LoginFormData {
  email: string;
  name: string;
  studentId: string;
  isAdmin: boolean;
  adminKey: string;
}

interface RegistrationFormProps {
  formData: LoginFormData;
  isLoading: boolean;
  error: string;
  onFormDataChange: (field: keyof LoginFormData, value: string | boolean) => void;
  onVerifyAdminKey: () => void;
  onRegister: () => void;
  onClearError: () => void;
}

const RegistrationForm: React.FC<RegistrationFormProps> = ({
  formData,
  isLoading,
  error,
  onFormDataChange,
  onVerifyAdminKey,
  onRegister,
  onClearError
}) => {
  return (
    <div className="registration-container">
      <div className="registration-card">
        <div className="registration-header">
          <img src="/src/assets/image/potato.png" alt="Hot Potato Logo" className="logo" />
          <h1>회원가입</h1>
          <p>정보를 입력하여 가입을 완료하세요</p>
        </div>

        <div className="registration-form">
          <div className="form-group">
            <label htmlFor="email">이메일</label>
            <input
              type="email"
              id="email"
              value={formData.email}
              onChange={(e) => onFormDataChange('email', e.target.value)}
              disabled
              className="form-input disabled"
            />
          </div>

          <div className="form-group">
            <label htmlFor="name">이름</label>
            <input
              type="text"
              id="name"
              value={formData.name}
              onChange={(e) => onFormDataChange('name', e.target.value)}
              disabled
              className="form-input disabled"
            />
          </div>

          <div className="form-group">
            <label htmlFor="studentId">학번/교번 *</label>
            <input
              type="text"
              id="studentId"
              value={formData.studentId}
              onChange={(e) => onFormDataChange('studentId', e.target.value)}
              placeholder="학번 또는 교번을 입력하세요"
              className="form-input"
            />
          </div>

          <div className="form-group">
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={formData.isAdmin}
                onChange={(e) => onFormDataChange('isAdmin', e.target.checked)}
                className="checkbox-input"
              />
              <span className="checkbox-text">관리자로 가입하기</span>
            </label>
          </div>

          {formData.isAdmin && (
            <div className="admin-key-section">
              <div className="form-group">
                <label htmlFor="adminKey">관리자 키 *</label>
                <div className="admin-key-input-group">
                  <input
                    type="password"
                    id="adminKey"
                    value={formData.adminKey}
                    onChange={(e) => onFormDataChange('adminKey', e.target.value)}
                    placeholder="관리자 키를 입력하세요"
                    className="form-input"
                  />
                  <button
                    type="button"
                    onClick={onVerifyAdminKey}
                    disabled={isLoading || !formData.adminKey.trim()}
                    className="verify-btn"
                  >
                    인증
                  </button>
                </div>
              </div>
            </div>
          )}

          {error && (
            <div className="error-message" onClick={onClearError}>
              {error}
            </div>
          )}

          <button
            type="button"
            onClick={onRegister}
            disabled={isLoading || !formData.studentId.trim() || (formData.isAdmin && !formData.adminKey.trim())}
            className="register-btn"
          >
            {isLoading ? (
              <>
                <div className="spinner"></div>
                가입 중...
              </>
            ) : (
              '가입하기'
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default RegistrationForm;
