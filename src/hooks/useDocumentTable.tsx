// 1. 문서 데이터의 타입 정의
export interface Document {
  docNumber: string;
  title: string;
  author: string;
  lastModified: string;
  dueDate: string;
  status: string;
}

// 2. 커스텀 훅 정의
export const useDocumentTable = () => {
  // 3. 테이블 컬럼 구조 정의
  const documentColumns = [
    { key: 'docNumber' as const, header: '문서번호', width: '15%', cellClassName: 'doc-number-cell' },
    { key: 'title' as const, header: '제목', width: '25%', cellClassName: 'title-cell' },
    { key: 'author' as const, header: '기안자', width: '15%', cellClassName: 'author-cell' },
    { key: 'lastModified' as const, header: '최근 수정일', width: '15%', cellClassName: 'date-cell' },
    { key: 'dueDate' as const, header: '결재일', width: '15%', cellClassName: 'date-cell' },
    {
      key: 'status' as const,
      header: '상태',
      width: '15%',
      cellClassName: 'status-cell',
      render: (row: Document) => (
        <div className={`status-badge ${row.status.toLowerCase()}`}>
          <div className="status-text">{row.status}</div>
        </div>
      ),
    },
  ];

  // 4. 테이블에 들어갈 데이터 정의
  const documents: Document[] = [
    {
      docNumber: "DOC-2024-001",
      title: "2024년 1분기 사업계획서",
      author: "이지원",
      lastModified: "2024-03-16",
      dueDate: "2024-03-15",
      status: "진행중",
    },
    {
      docNumber: "DOC-2024-002",
      title: "신규 프로젝트 제안서",
      author: "박서연",
      lastModified: "2024-03-15",
      dueDate: "2024-03-14",
      status: "완료",
    },
    {
      docNumber: "DOC-2024-003",
      title: "인사 발령 품의서",
      author: "김준호",
      lastModified: "2024-03-14",
      dueDate: "2024-03-13",
      status: "반려",
    },
    {
      docNumber: "DOC-2024-005",
      title: "연간 교육 계획서",
      author: "강현우",
      lastModified: "2024-03-12",
      dueDate: "2024-03-11",
      status: "임시저장",
    },
  ];

  // 5. 컴포넌트에서 사용할 수 있도록 컬럼과 데이터 반환
  return { documentColumns, documents };
};
