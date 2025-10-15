import React, { useState, useEffect } from "react";
import "../styles/pages/DocumentManagement.css";
import InfoCard, { type Item as InfoCardItem } from "../components/features/documents/InfoCard";
import DocumentList from "../components/features/documents/DocumentList";
import StatCard from "../components/features/documents/StatCard";
import { useDocumentTable, type Document } from "../hooks/features/documents/useDocumentTable";
import { getSheetIdByName, getSheetData, updateTitleInSheetByDocId } from "../utils/google/googleSheetUtils";
import { getRecentDocuments, addRecentDocument } from "../utils/helpers/localStorageUtils";
import { formatRelativeTime } from "../utils/helpers/timeUtils";
import { useTemplateUI, type Template } from "../hooks/features/templates/useTemplateUI";
import { ENV_CONFIG } from "../config/environment";

interface DocumentManagementProps {
  onPageChange: (pageName: string) => void;
  customTemplates: Template[];
}


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

const DocumentManagement: React.FC<DocumentManagementProps> = ({ onPageChange, customTemplates }) => {
  const { documentColumns } = useDocumentTable();
  const [documents, setDocuments] = useState<FetchedDocument[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [recentDocuments, setRecentDocuments] = useState<InfoCardItem[]>([]);
    const { onUseTemplate, allDefaultTemplates } = useTemplateUI(customTemplates, onPageChange, '', '전체');

  const handleDocClick = (doc: { url?: string }) => {
    if (doc.url) {
      // Find the full document from the main list to add to recents
      const fullDoc = documents.find(d => d.url === doc.url);
      if (fullDoc) {
        addRecentDocument(fullDoc);
      }
      window.open(doc.url, '_blank');
    }
  };

  useEffect(() => {
    const SPREADSHEET_NAME = ENV_CONFIG.HOT_POTATO_DB_SPREADSHEET_NAME;
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

    const loadRecentDocuments = () => {
      const recents = getRecentDocuments();
      const formattedRecents = recents.map(doc => ({
        name: doc.title,
        time: formatRelativeTime(doc.lastAccessed),
        url: doc.url,
      }));
      setRecentDocuments(formattedRecents);
    };

    const loadData = async () => {
        setIsLoading(true);
        await fetchAndSyncDocuments();
        loadRecentDocuments();
        setIsLoading(false);
    }

    loadData();

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        loadData();
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  const frequentlyUsedForms = Array.from(
    [...customTemplates, ...allDefaultTemplates]
      .filter(template => template.favoritesTag)
      .reduce((map, template) => {
        if (!map.has(template.favoritesTag!)) {
          map.set(template.favoritesTag!, {
            name: template.favoritesTag!,
            type: template.type,
            title: template.title,
          });
        }
        return map;
      }, new Map<string, { name: string; type: string; title: string; } >()).values()
  );

    const handleFavoriteClick = (item: { name: string; type: string; title: string; }) => {
        // 커스텀 템플릿 또는 동적 템플릿의 경우 documentId를 찾아서 전달
        const customTemplate = customTemplates.find(t => t.title === item.title);
        const dynamicTemplate = allDefaultTemplates.find(t => t.title === item.title);
        const template = customTemplate || dynamicTemplate;
        const templateType = template?.documentId || item.type;
        
        console.log('📄 즐겨찾기 템플릿 클릭:', { type: item.type, title: item.title, templateType, template });
        
        onUseTemplate(templateType, item.title, 'user');
    };

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
      dueDate: doc.approvalDate,
      status: doc.status,
      url: doc.url,
    }));

  return (
    <div className="content document-management-container">
      <div className="cards-row">
        <InfoCard
          title="최근 문서"
          subtitle="최근에 열람한 문서를 확인하세요"
          icon="icon-file"
          backgroundColor="var(--accent)"
          items={recentDocuments}
          onItemClick={handleDocClick}
        />
        <InfoCard
          title="즐겨찾기"
          subtitle="자주 사용하는 양식을 빠르게 접근하세요"
          icon="icon-star"
          backgroundColor="var(--table-header-bg)"
          items={frequentlyUsedForms}
          onItemClick={(item: any) => handleFavoriteClick(item)}
        />
      </div>

      <DocumentList<Document>
        title="문서함"
        columns={documentColumns}
        data={processedDocuments}
        onPageChange={onPageChange}
        onRowClick={handleDocClick}
        isLoading={isLoading}
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
