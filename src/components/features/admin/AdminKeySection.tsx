import React from 'react';
// 타입 정의
type EmailStatus = 'idle' | 'sending' | 'success' | 'error';

interface AdminKeySectionProps {
  emailToSend: string;
  setEmailToSend: (email: string) => void;
  isLoading: boolean;
  emailStatus: EmailStatus;
  message: string;
  onSendAdminKey: () => void;
}

const AdminKeySection: React.FC<AdminKeySectionProps> = ({
  emailToSend,
  setEmailToSend,
  isLoading,
  emailStatus,
  message,
  onSendAdminKey
}) => {
  return (
    <div className="admin-key-section">
      <h3>관리자 키 이메일 전송</h3>
      <div className="email-send-form">
        <input
          type="email"
          value={emailToSend}
          onChange={(e) => setEmailToSend(e.target.value)}
          placeholder="📧 관리자 키를 받을 이메일 주소를 입력하세요"
          className="email-input"
        />
        <button 
          onClick={onSendAdminKey}
          disabled={isLoading || !emailToSend}
          className={`send-key-btn ${emailStatus === 'sending' ? 'sending' : emailStatus === 'success' ? 'success' : emailStatus === 'error' ? 'error' : ''}`}
        >
          {isLoading ? '⏳ 전송 중...' : emailStatus === 'success' ? '✅ 전송 완료' : '🚀 관리자 키 전송'}
        </button>
      </div>
      {message && (
        <div className={`message ${emailStatus === 'success' ? 'success' : emailStatus === 'error' ? 'error' : ''}`}>
          {message}
        </div>
      )}
    </div>
  );
};

export default AdminKeySection;
