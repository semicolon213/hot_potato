import React, { useState, useEffect } from "react";
import InfoCard from "../components/document/InfoCard";
import DocumentList from "../components/document/DocumentList";
import StatCard from "../components/document/StatCard";
import { useDocumentTable, type Document } from "../hooks/useDocumentTable";
import { getSheetIdByName, getSheetData, updateTitleInSheetByDocId } from "../utils/googleSheetUtils";

interface DocumentManagementProps {
  onPageChange: (pageName: string) => void;
}

// Docbox.tsx와 호환되는 문서 인터페이스
interface FetchedDocument {
  id: string;
  title: string;
  author: string;
  lastModified: string;
  url: string;
  documentNumber: string;
  approvalDate: string;
  status: string;
  originalIndex: number;
}

const DocumentManagement: React.FC<DocumentManagementProps> = ({ onPageChange }) => {
  const { documentColumns } = useDocumentTable();
  const [documents, setDocuments] = useState<FetchedDocument[]>([]);

  useEffect(() => {
    const SPREADSHEET_NAME = 'hot_potato_DB';
    const DOC_SHEET_NAME = 'documents';

    const fetchAndSyncDocuments = async () => {
      const sheetId = await getSheetIdByName(SPREADSHEET_NAME);
      if (!sheetId) return;

      const data = await getSheetData(sheetId, DOC_SHEET_NAME, 'A:I');
      if (!data || data.length <= 1) {
        setDocuments([]);
        return;
      }

      const header = data[0];
      const initialDocs: FetchedDocument[] = data.slice(1).map((row, index) => {
        const doc: any = {};
        header.forEach((key, hIndex) => {
          doc[key] = row[hIndex];
        });
        return {
          id: doc.document_id,
          title: doc.title,
          author: doc.author,
          lastModified: doc.last_modified,
          url: doc.url,
          documentNumber: doc.document_number,
          approvalDate: doc.approval_date,
          status: doc.status,
          originalIndex: index,
        };
      }).filter(doc => doc.id);

      const gapi = (window as any).gapi;
      if (!gapi?.client?.drive || initialDocs.length === 0) {
        setDocuments(initialDocs);
        return;
      }

      const batch = gapi.client.newBatch();
      initialDocs.forEach(doc => {
        batch.add(gapi.client.drive.files.get({ fileId: doc.id, fields: 'name' }), { id: doc.id });
      });

      try {
        const batchResponse = await batch;
        const driveResults = batchResponse.result;
        const syncedDocs = [...initialDocs];

        Object.keys(driveResults).forEach(docId => {
          const response = driveResults[docId];
          if (!response || !response.result) {
            return;
          }
          
          const latestTitle = response.result.name;
          const docIndex = syncedDocs.findIndex(d => d.id === docId);

          if (docIndex !== -1 && latestTitle && latestTitle !== syncedDocs[docIndex].title) {
            syncedDocs[docIndex].title = latestTitle;
            updateTitleInSheetByDocId(sheetId, DOC_SHEET_NAME, docId, latestTitle);
          }
        });

        setDocuments(syncedDocs);

      } catch (error) {
        console.error("Error during title sync on load:", error);
        setDocuments(initialDocs);
      }
    };

    fetchAndSyncDocuments();
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        fetchAndSyncDocuments();
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  const recentDocumentsForCards = [
    { name: "2024년 예산 계획안", time: "1일전" },
    { name: "3월 회의록", time: "2시간 전" },
    { name: "인사 발령 안내", time: "어제" },
  ];

  const frequentlyUsedForms = [
    { name: "보고서" },
    { name: "기획안" },
    { name: "회의록" },
  ];

  const statCards = [
    {
      count: 12,
      title: "수신 문서함",
      backgroundColor: "var(--primary)",
      textColor: "white",
    },
    {
      count: 8,
      title: "발신 문서함",
      backgroundColor: "var(--secondary)",
      textColor: "white",
    },
    {
      count: 3,
      title: "내 문서함",
      backgroundColor: "rgb(243, 238, 234)",
      textColor: "#333",
    },
  ];

  // 데이터를 DocumentList가 기대하는 형태로 변환하고 정렬 후 4개만 선택
  const processedDocuments = documents
    .sort((a, b) => {
      const dateA = new Date(a.lastModified.replace(/\./g, '-').slice(0, -1));
      const dateB = new Date(b.lastModified.replace(/\./g, '-').slice(0, -1));
      const dateDiff = dateB.getTime() - dateA.getTime();
      if (dateDiff !== 0) return dateDiff;
      return b.originalIndex - a.originalIndex;
    })
    .slice(0, 4)
    .map(doc => ({
      docNumber: doc.documentNumber,
      title: doc.title,
      author: doc.author,
      lastModified: doc.lastModified,
      dueDate: doc.approvalDate, // 기한일을 결재일로 매핑
      status: doc.status,
    }));

  return (
    <div className="content">
      <div className="cards-row">
        <InfoCard
          title="최근 문서"
          subtitle="최근에 열람한 문서를 확인하세요"
          icon="icon-file"
          backgroundColor="var(--accent)"
          items={recentDocumentsForCards}
        />
        <InfoCard
          title="자주 찾는 양식"
          subtitle="자주 사용하는 양식을 빠르게 접근하세요"
          icon="icon-star"
          backgroundColor="var(--table-header-bg)"
          items={frequentlyUsedForms}
        />
      </div>

      <DocumentList<Document>
        title="문서함"
        columns={documentColumns}
        data={processedDocuments}
        onPageChange={onPageChange}
      />

      <div className="stats-container">
        {statCards.map((card, index) => (
          <StatCard
            key={index}
            count={card.count}
            title={card.title}
            backgroundColor={card.backgroundColor}
            textColor={card.textColor}
          />
        ))}
      </div>
    </div>
  );
};

export default DocumentManagement;
