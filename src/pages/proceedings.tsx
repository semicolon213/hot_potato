import React, { useState } from "react";
import { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType, Table, TableRow, TableCell, WidthType } from 'docx';
import { saveAs } from 'file-saver';
import { gapiInit, appendRow } from 'papyrus-db';
import "./proceedings.css";

const Proceedings: React.FC = () => {
  const [formData, setFormData] = useState({
    title: "",
    dateTime: "",
    location: "",
    author: "",
    creationDate: "",
    attendees: "",
    agenda: "",
    content: "",
    decisions: "",
    futureSchedule: "",
    notes: "",
  });

  const [settings, setSettings] = useState({
    autoDocNumber: true,
    autoApproval: false,
    roleAccess: true,
    tags: "",
    approvalDeadline: "",
    usePassword: true,
    password: "",
  });

  const [isGoogleAuthenticated, setIsGoogleAuthenticated] = useState(false);

  const handleFormChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prevData) => ({ ...prevData, [name]: value }));
  };

  const handleSettingsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setSettings((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleGoogleAuth = async () => {
    try {
      const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
      if (!clientId) {
        alert("Google Client ID가 .env 파일에 설정되지 않았습니다.");
        return;
      }
      await gapiInit(clientId);

      // Get user's name after successful authentication
      const gapi = (window as any).gapi;
      const profile = gapi.auth2.getAuthInstance().currentUser.get().getBasicProfile();
      const authorName = profile.getName();

      setFormData((prevData) => ({ ...prevData, author: authorName }));
      alert('Google 인증 성공!');
      setIsGoogleAuthenticated(true);
    } catch (e) {
      alert('Google 인증 실패: ' + (e as Error).message);
      setIsGoogleAuthenticated(false);
    }
  };

  const handleExport = () => {
    console.log("회의록 저장 및 내보내기:", { formData, settings });

    const {
      title,
      dateTime,
      location,
      author,
      creationDate,
      attendees,
      agenda,
      content,
      decisions,
      futureSchedule,
      notes,
    } = formData;

    const doc = new Document({
      sections: [
        {
          properties: {},
          children: [
            new Paragraph({
              text: "회의록",
              heading: HeadingLevel.HEADING_1,
              alignment: AlignmentType.CENTER,
            }),
            new Paragraph({}),
            new Table({
              rows: [
                new TableRow({
                  children: [
                    new TableCell({ children: [new Paragraph("일 시")] }),
                    new TableCell({ children: [new Paragraph(dateTime)] }),
                    new TableCell({ children: [new Paragraph("장 소")] }),
                    new TableCell({ children: [new Paragraph(location)] }),
                  ],
                }),
                new TableRow({
                  children: [
                    new TableCell({ children: [new Paragraph("작성자")] }),
                    new TableCell({ children: [new Paragraph(author)] }),
                    new TableCell({ children: [new Paragraph("작성일")] }),
                    new TableCell({ children: [new Paragraph(creationDate)] }),
                  ],
                }),
                new TableRow({
                  children: [
                    new TableCell({ children: [new Paragraph("참석자")] }),
                    new TableCell({
                      children: [new Paragraph(attendees)],
                      columnSpan: 3,
                    }),
                  ],
                }),
                new TableRow({
                  children: [
                    new TableCell({ children: [new Paragraph("안 건")] }),
                    new TableCell({
                      children: [new Paragraph(agenda)],
                      columnSpan: 3,
                    }),
                  ],
                }),
              ],
              width: {
                size: 100,
                type: WidthType.PERCENTAGE,
              },
            }),
            new Paragraph({}),
            new Paragraph({ text: "2. 회의 내용", heading: HeadingLevel.HEADING_2 }),
            new Table({
              rows: [
                new TableRow({
                  children: [
                    new TableCell({ children: [new Paragraph("회의 내용")] }),
                    new TableCell({
                      children: content.split('\n').map((line) => new Paragraph({ children: [new TextRun(line)] })),
                    }),
                  ],
                }),
                new TableRow({
                  children: [
                    new TableCell({ children: [new Paragraph("결정 사항")] }),
                    new TableCell({
                      children: decisions.split('\n').map((line) => new Paragraph({ children: [new TextRun(line)] })),
                    }),
                  ],
                }),
                new TableRow({
                  children: [
                    new TableCell({ children: [new Paragraph("향후 일정")] }),
                    new TableCell({
                      children: futureSchedule.split('\n').map((line) => new Paragraph({ children: [new TextRun(line)] })),
                    }),
                  ],
                }),
                new TableRow({
                  children: [
                    new TableCell({ children: [new Paragraph("특이 사항")] }),
                    new TableCell({
                      children: notes.split('\n').map((line) => new Paragraph({ children: [new TextRun(line)] })),
                    }),
                  ],
                }),
              ],
              width: {
                size: 100,
                type: WidthType.PERCENTAGE,
              },
            }),
          ],
        },
      ],
    });

    Packer.toBlob(doc).then(async (blob) => {
      const fileName = title ? `${title}.docx` : "회의록.docx";
      saveAs(blob, fileName);

      try {
        const fileInfo = {
          'no_file': 'doc-' + new Date().getTime(),
          'name_file': fileName,
          'priv_file': settings.roleAccess ? '역할 기반 접근' : '공개',
          'writer_file': author,
          'path_file': `/내문서/회의록/${fileName}`,
          'class_file': 'docx',
        };

        const sheetId = '1DJP6g5obxAkev0QpXyzit_t6qfuW4OCa63EEA4O-0no';
        const sheetName = 'file';

        await appendRow(sheetId, sheetName, fileInfo);

        console.log('File information successfully exported to Google Sheet.');
        alert('파일이 저장되고 정보가 Google Sheet에 기록되었습니다.');

      } catch (error) {
        console.error('Google Sheet export error:', error);
        alert('Google Sheet에 파일 정보를 저장하는 중 오류가 발생했습니다. papyrus-db가 설치되어 있는지, 그리고 사용법이 올바른지 확인해주세요.');
      }
    });
  };

  const handleSave = () => {
    // 저장 기능 구현
    alert("저장되었습니다.");
  };

  return (
    <div className="proceedings-layout">
      <div className="form-wrapper">
        <div className="proceedings-container">
          <div className="proceedings-header">
            <h1 className="proceedings-title">회의록</h1>
            <button className="auth-button" onClick={handleGoogleAuth}>
              Google 인증
            </button>
            <button 
              className="save-export-button" 
              onClick={handleSave} 
              disabled={!isGoogleAuthenticated}
              title={!isGoogleAuthenticated ? "Google 인증이 필요합니다." : ""}
            >
              저장
            </button>
            <button 
              className="save-export-button" 
              onClick={handleExport} 
              disabled={!isGoogleAuthenticated}
              title={!isGoogleAuthenticated ? "Google 인증이 필요합니다." : ""}
            >
              내보내기
            </button>
          </div>
          <div className="proceedings-section">
            <h2 className="section-title">1. 회의 개요</h2>
            <table className="proceedings-table">
              <tbody>
                <tr>
                  <td className="table-label">제 목</td>
                  <td colSpan={3} className="table-value">
                    <input
                      type="text"
                      name="title"
                      value={formData.title}
                      onChange={handleFormChange}
                      className="table-input"
                      placeholder="파일 이름으로 사용됩니다"
                    />
                  </td>
                </tr>
                <tr>
                  <td className="table-label">일 시</td>
                  <td className="table-value">
                    <input
                      type="text"
                      name="dateTime"
                      value={formData.dateTime}
                      onChange={handleFormChange}
                      className="table-input"
                    />
                  </td>
                  <td className="table-label">장 소</td>
                  <td className="table-value">
                    <input
                      type="text"
                      name="location"
                      value={formData.location}
                      onChange={handleFormChange}
                      className="table-input"
                    />
                  </td>
                </tr>
                <tr>
                  <td className="table-label">작성자</td>
                  <td className="table-value">
                    <input
                      type="text"
                      name="author"
                      value={formData.author}
                      onChange={handleFormChange}
                      className="table-input"
                    />
                  </td>
                  <td className="table-label">작성일</td>
                  <td className="table-value">
                    <input
                      type="date"
                      name="creationDate"
                      value={formData.creationDate}
                      onChange={handleFormChange}
                      className="table-input"
                    />
                  </td>
                </tr>
                <tr>
                  <td className="table-label">참석자</td>
                  <td colSpan={3} className="table-value">
                    <input
                      type="text"
                      name="attendees"
                      value={formData.attendees}
                      onChange={handleFormChange}
                      className="table-input"
                    />
                  </td>
                </tr>
                <tr>
                  <td className="table-label">안 건</td>
                  <td colSpan={3} className="table-value">
                    <input
                      type="text"
                      name="agenda"
                      value={formData.agenda}
                      onChange={handleFormChange}
                      className="table-input"
                    />
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          <div className="proceedings-section">
            <h2 className="section-title">2. 회의 내용</h2>
            <table className="proceedings-table content-table">
              <tbody>
                <tr>
                  <td className="table-label content-label">회의 내용</td>
                  <td className="table-value content-value">
                    <textarea
                      name="content"
                      value={formData.content}
                      onChange={handleFormChange}
                      className="table-textarea"
                    />
                  </td>
                </tr>
                <tr>
                  <td className="table-label content-label">결정 사항</td>
                  <td className="table-value content-value">
                    <textarea
                      name="decisions"
                      value={formData.decisions}
                      onChange={handleFormChange}
                      className="table-textarea"
                    />
                  </td>
                </tr>
                <tr>
                  <td className="table-label content-label">향후 일정</td>
                  <td className="table-value content-value">
                    <textarea
                      name="futureSchedule"
                      value={formData.futureSchedule}
                      onChange={handleFormChange}
                      className="table-textarea"
                    />
                  </td>
                </tr>
                <tr>
                  <td className="table-label content-label">특이 사항</td>
                  <td className="table-value content-value">
                    <textarea
                      name="notes"
                      value={formData.notes}
                      onChange={handleFormChange}
                      className="table-textarea"
                    />
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div className="settings-panel">
        <h2 className="settings-title">상세설정</h2>
        
        <div className="setting-item">
          <div className="setting-label">
            <h3>문서 번호 자동 생성</h3>
            <p>저장 시 문서 번호를 자동으로 생성합니다.</p>
          </div>
          <div className="toggle-switch">
            <input type="checkbox" id="autoDocNumber" name="autoDocNumber" checked={settings.autoDocNumber} onChange={handleSettingsChange} />
            <label htmlFor="autoDocNumber"></label>
          </div>
        </div>

        <div className="setting-item">
          <div className="setting-label">
            <h3>문서 검토 및 승인 과정 자동화</h3>
            <p>미리 정의된 승인 라인을 따릅니다.</p>
          </div>
          <div className="toggle-switch">
            <input type="checkbox" id="autoApproval" name="autoApproval" checked={settings.autoApproval} onChange={handleSettingsChange} />
            <label htmlFor="autoApproval"></label>
          </div>
        </div>

        <div className="setting-item">
          <div className="setting-label">
            <h3>역할별 문서 접근 권한 설정</h3>
            <p>문서의 접근 권한을 설정합니다.</p>
          </div>
          <div className="toggle-switch">
            <input type="checkbox" id="roleAccess" name="roleAccess" checked={settings.roleAccess} onChange={handleSettingsChange} />
            <label htmlFor="roleAccess"></label>
          </div>
        </div>

        <div className="setting-item-column">
          <div className="setting-label">
            <h3>태그 기반 문서 검색</h3>
            <p>쉼표(,)로 구분하여 태그를 입력하세요.</p>
          </div>
          <input type="text" name="tags" value={settings.tags} onChange={handleSettingsChange} className="setting-input" placeholder="예: 주간회의, 프로젝트A" />
        </div>

        <div className="setting-item-column">
          <div className="setting-label">
            <h3>승인요청 및 마감일 설정</h3>
            <p>문서의 승인 마감일을 설정합니다.</p>
          </div>
          <input type="date" name="approvalDeadline" value={settings.approvalDeadline} onChange={handleSettingsChange} className="setting-input" />
        </div>

        <div className="setting-item">
          <div className="setting-label">
            <h3>문서 암호화</h3>
            <p>문서 열람 시 암호가 필요합니다.</p>
          </div>
          <div className="toggle-switch">
            <input type="checkbox" id="usePassword" name="usePassword" checked={settings.usePassword} onChange={handleSettingsChange} />
            <label htmlFor="usePassword"></label>
          </div>
        </div>

        {settings.usePassword && (
          <div className="setting-item-column" style={{marginTop: '10px'}}>
             <div className="setting-label">
                <h3>암호 입력</h3>
                <p>사용할 암호를 입력하세요.</p>
            </div>
            <input type="password" name="password" value={settings.password} onChange={handleSettingsChange} className="setting-input" placeholder="암호 입력" />
          </div>
        )}
      </div>
    </div>
  );
};

export default Proceedings;