// 1. 문서 데이터의 타입 정의 (새로운 필드 구조)
export interface Document {
  documentNumber: string; // 문서고유번호
  title: string; // 문서이름
  creator: string; // 생성자
  lastModified: string; // 수정시간
  documentType: 'shared' | 'personal'; // 공유문서/개인문서 구분
  url: string;
  tag?: string; // 문서 태그 추가
}

// 2. 커스텀 훅 정의
export const useDocumentTable = () => {
  // 3. 테이블 컬럼 구조 정의 (새로운 필드)
  const documentColumns = [
    { key: 'documentNumber' as const, header: '문서고유번호', width: '18%', cellClassName: 'doc-number-cell' },
    { key: 'title' as const, header: '문서이름', width: '28%', cellClassName: 'title-cell' },
    { key: 'creator' as const, header: '생성자', width: '15%', cellClassName: 'creator-cell' },
    { key: 'lastModified' as const, header: '수정시간', width: '18%', cellClassName: 'date-cell' },
    { 
      key: 'tag' as const, 
      header: '태그', 
      width: '13%', 
      cellClassName: 'tag-cell',
      render: (row: Document) => (
        row.tag ? (
          <span className="tag-badge">{row.tag}</span>
        ) : null
      )
    },
    {
      key: 'documentType' as const,
      header: '유형',
      width: '8%',
      cellClassName: 'type-cell',
      render: (row: Document) => (
        <div className={`type-badge ${row.documentType}`}>
          <div className="type-text">{row.documentType === 'shared' ? '공유' : '개인'}</div>
        </div>
      ),
    },
  ];

  // 4. 테이블에 들어갈 데이터 정의 (샘플 데이터)
  const documents: Document[] = [
    {
      documentNumber: "20240316-DOC-SHARED-001",
      title: "2024년 1분기 사업계획서",
      creator: "이지원",
      lastModified: "2024-03-16 14:30",
      documentType: "shared",
      url: "",
    },
    {
      documentNumber: "20240315-SHEET-PERSONAL-002",
      title: "개인 업무 정리표",
      creator: "박서연",
      lastModified: "2024-03-15 09:15",
      documentType: "personal",
      url: "",
    },
    {
      documentNumber: "20240314-DOC-SHARED-003",
      title: "인사 발령 품의서",
      creator: "김준호",
      lastModified: "2024-03-14 16:45",
      documentType: "shared",
      url: "",
    },
    {
      documentNumber: "20240312-DOC-PERSONAL-004",
      title: "개인 학습 노트",
      creator: "강현우",
      lastModified: "2024-03-12 11:20",
      documentType: "personal",
      url: "",
    },
  ];

  // 5. 컴포넌트에서 사용할 수 있도록 컬럼과 데이터 반환
  return { documentColumns, documents };
};
