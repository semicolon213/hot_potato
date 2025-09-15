// 타입 정의
interface EmailTemplate {
  to: string;
  subject: string;
  html: string;
}

// Gmail API를 사용한 이메일 전송 함수
export const sendEmailWithGmailAPI = async (emailTemplate: EmailTemplate): Promise<void> => {
  try {
    console.log('Gmail API로 이메일 전송 시작');
    console.log('emailTemplate:', emailTemplate);
    
    // emailTemplate 유효성 검사
    if (!emailTemplate) {
      throw new Error('이메일 템플릿이 없습니다.');
    }
    
    if (!emailTemplate.to) {
      throw new Error('이메일 수신자 주소가 없습니다.');
    }
    
    if (!emailTemplate.subject) {
      throw new Error('이메일 제목이 없습니다.');
    }
    
    if (!emailTemplate.html) {
      throw new Error('이메일 내용이 없습니다.');
    }
    
    console.log('이메일 정보:', {
      to: emailTemplate.to,
      subject: emailTemplate.subject,
      htmlLength: emailTemplate.html.length
    });
    
    // Gmail API가 초기화되었는지 확인
    if (!window.gapi || !window.gapi.client || !(window.gapi.client as any).gmail || !(window.gapi.client as any).gmail.users) {
      console.error('Gmail API 초기화 상태:', {
        gapi: !!window.gapi,
        client: !!(window.gapi && window.gapi.client),
        gmail: !!(window.gapi && window.gapi.client && (window.gapi.client as any).gmail),
        gmailUsers: !!(window.gapi && window.gapi.client && (window.gapi.client as any).gmail && (window.gapi.client as any).gmail.users)
      });
      throw new Error('Gmail API가 초기화되지 않았습니다. 페이지를 새로고침해주세요.');
    }
    
    // Gmail API를 사용하여 이메일 전송
    const gmail = (window.gapi.client as any).gmail;
    
    // 이메일 메시지 구성 (RFC 2822 형식)
    const message = [
      `To: ${emailTemplate.to}`,
      `Subject: =?UTF-8?B?${btoa(unescape(encodeURIComponent(emailTemplate.subject)))}?=`,
      'Content-Type: text/html; charset=utf-8',
      'MIME-Version: 1.0',
      '',
      emailTemplate.html
    ].join('\r\n');
    
    // Base64 URL-safe 인코딩 (Gmail API 형식) - UTF-8 처리
    const encodedMessage = btoa(unescape(encodeURIComponent(message)))
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=/g, '');
    
    console.log('인코딩된 메시지 길이:', encodedMessage.length);
    
    // Gmail API로 이메일 전송
    const request = gmail.users.messages.send({
      userId: 'me',
      resource: {
        raw: encodedMessage
      }
    });
    
    const response = await request;
    console.log('Gmail API 이메일 전송 완료:', response);
    
  } catch (error) {
    console.error('Gmail API 이메일 전송 실패:', error);
    throw error;
  }
};
