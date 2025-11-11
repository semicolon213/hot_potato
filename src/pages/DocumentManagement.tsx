import React, { useState, useEffect } from "react";
import "../styles/pages/DocumentManagement.css";
import InfoCard, { type Item as InfoCardItem } from "../components/features/documents/InfoCard";
import DocumentList from "../components/features/documents/DocumentList";
import StatCard from "../components/features/documents/StatCard";
import { useDocumentTable, type Document } from "../hooks/features/documents/useDocumentTable";
import { getSheetIdByName, getSheetData, updateTitleInSheetByDocId } from "../utils/google/googleSheetUtils";
import { getRecentDocuments, addRecentDocument } from "../utils/helpers/localStorageUtils";
import { generateDocumentNumber } from "../utils/helpers/documentNumberGenerator";
import { loadAllDocuments } from "../utils/helpers/loadDocumentsFromDrive";
import { formatRelativeTime } from "../utils/helpers/timeUtils";
import { useTemplateUI, type Template } from "../hooks/features/templates/useTemplateUI";
import { ENV_CONFIG } from "../config/environment";
import { fetchFavorites } from "../utils/database/personalFavoriteManager";
import { apiClient } from "../utils/api/apiClient";
import WorkflowRequestModal from "../components/features/workflow/WorkflowRequestModal";
import type { DocumentMap } from "../types/documents";
import type { DocumentInfo } from "../types/documents";
import type { WorkflowRequestResponse } from "../types/api/apiResponses";

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
  documentType?: 'shared' | 'personal'; // 문서 유형 추가
  creator?: string; // 생성자 추가
  tag?: string; // 문서 태그 추가
}

const DocumentManagement: React.FC<DocumentManagementProps> = ({ onPageChange, customTemplates }) => {
  const { documentColumns } = useDocumentTable();
  const [documents, setDocuments] = useState<FetchedDocument[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [recentDocuments, setRecentDocuments] = useState<InfoCardItem[]>([]);
  const [favoriteTemplates, setFavoriteTemplates] = useState<InfoCardItem[]>([]);
  const { onUseTemplate, allDefaultTemplates, personalTemplates } = useTemplateUI(customTemplates, onPageChange, '', '전체');

  // 결재 관련 통계 상태
  const [receivedCount, setReceivedCount] = useState<number>(0); // 수신 문서함 (내가 결재해야 하는 것)
  const [sentCount, setSentCount] = useState<number>(0); // 발신 문서함 (내가 올린 결재)
  const [myDocumentsCount, setMyDocumentsCount] = useState<number>(0); // 내 문서함 (내가 만든 문서)

  // 결재 요청 모달 상태
  const [isWorkflowModalOpen, setIsWorkflowModalOpen] = useState<boolean>(false);
  const [selectedDocument, setSelectedDocument] = useState<{ id?: string; title?: string; documentType?: 'shared' | 'personal' } | null>(null);

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

  // 즐겨찾기한 템플릿들 로드
  useEffect(() => {
    const loadFavoriteTemplates = async () => {
      try {
        console.log('⭐ 즐겨찾기 템플릿 로드 시작');
        const favorites = await fetchFavorites();
        console.log('⭐ 즐겨찾기 목록:', favorites);

        // 모든 템플릿에서 즐겨찾기된 것들 찾기 (기본 템플릿 + 개인 템플릿)
        const allTemplates = [...customTemplates, ...allDefaultTemplates, ...personalTemplates];
        const favoriteItems: InfoCardItem[] = [];

        for (const favorite of favorites) {
          const template = allTemplates.find(t => t.title === favorite.favorite);
          if (template) {
            // 깔끔한 표시: 템플릿명만 표시하고 추가 정보는 별도 필드로
            favoriteItems.push({
              name: template.title,
              type: template.type,
              title: template.title,
              tag: template.tag,
              isPersonal: favorite.type === '개인',
              originalName: template.title,
              typeLabel: favorite.type === '개인' ? '개인' : '공용'
            });
          }
        }

        console.log('⭐ 즐겨찾기 템플릿 아이템:', favoriteItems);
        setFavoriteTemplates(favoriteItems);
      } catch (error) {
        console.error('❌ 즐겨찾기 템플릿 로드 오류:', error);
      }
    };

    loadFavoriteTemplates();
  }, [customTemplates, allDefaultTemplates, personalTemplates]);

  useEffect(() => {
    const SPREADSHEET_NAME = ENV_CONFIG.HOT_POTATO_DB_SPREADSHEET_NAME;
    const DOC_SHEET_NAME = 'documents';

    const fetchAndSyncDocuments = async () => {
      try {
        // Google Drive에서 직접 문서 로드
        const driveDocs = await loadAllDocuments();

        if (driveDocs.length > 0) {
          // Drive에서 로드한 문서를 FetchedDocument 형식으로 변환
          const convertedDocs: FetchedDocument[] = driveDocs.map((doc, index) => ({
            id: doc.id,
            title: doc.title,
            author: doc.creator || '알 수 없음',
            lastModified: doc.lastModified,
            url: doc.url,
            documentNumber: doc.documentNumber,
            approvalDate: '',
            status: 'active',
            originalIndex: index,
            documentType: doc.documentType || 'shared',
            creator: doc.creator,
            tag: doc.tag
          }));

          setDocuments(convertedDocs);
          return;
        }
      } catch (error) {
        console.error('Drive 문서 로드 오류:', error);
      }

      // 기존 스프레드시트 방식 (폴백)
      const sheetId = await getSheetIdByName(SPREADSHEET_NAME);
      if (!sheetId) {
        setDocuments([]);
        return;
      }

      const data = await getSheetData(sheetId, DOC_SHEET_NAME, 'A:I');
      if (!data || data.length <= 1) {
        setDocuments([]);
        return;
      }

      const header = data[0];
      const initialDocs: FetchedDocument[] = data.slice(1).map((row, index) => {
        const doc: DocumentMap = {};
        header.forEach((key, hIndex) => {
          doc[key] = row[hIndex];
        });
        return {
          id: doc.document_id,
          title: doc.title,
          author: doc.author,
          lastModified: doc.last_modified,
          url: doc.url,
          documentNumber: doc.document_number || generateDocumentNumber('application/vnd.google-apps.document', 'shared'),
          approvalDate: doc.approval_date,
          status: doc.status,
          originalIndex: index,
          documentType: 'shared' as const,
        };
      }).filter(doc => doc.id);

      const gapi = window.gapi;
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
        try {
          await fetchAndSyncDocuments();
          loadRecentDocuments();
        } catch (error) {
          console.error('Document loading error:', error);
        } finally {
          setIsLoading(false);
        }
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

  // 즐겨찾기한 템플릿들을 사용 (frequentlyUsedForms 대신 favoriteTemplates 사용)

    const handleFavoriteClick = (item: { name: string; type: string; title: string; originalName?: string; }) => {
        // 원본 템플릿 이름 사용 (item.title이 원본 이름)
        const templateName = item.title;

        // 모든 템플릿에서 찾기 (커스텀, 동적, 개인 템플릿)
        const customTemplate = customTemplates.find(t => t.title === templateName);
        const dynamicTemplate = allDefaultTemplates.find(t => t.title === templateName);
        const personalTemplate = personalTemplates.find(t => t.title === templateName);
        const template = customTemplate || dynamicTemplate || personalTemplate;
        const templateType = template?.documentId || item.type;

        console.log('📄 즐겨찾기 템플릿 클릭:', {
            type: item.type,
            title: templateName,
            templateType,
            template,
            isPersonal: !!personalTemplate
        });

        onUseTemplate(templateType, templateName, 'user');
    };

  // 결재 통계 로드
  useEffect(() => {
    const loadWorkflowStats = async () => {
      try {
        const userInfo = typeof window !== 'undefined' ? JSON.parse(localStorage.getItem('user') || '{}') : {};
        const userEmail = userInfo.email;

        if (!userEmail) {
          console.warn('사용자 이메일이 없어 결재 통계를 로드할 수 없습니다.');
          return;
        }

        // 수신 문서함: 내가 결재해야 하는 문서 (대기 중인 결재)
        const pendingResponse = await apiClient.getMyPendingWorkflows({
          userEmail,
          status: '검토중' // 검토중 상태만 카운트
        });
        if (pendingResponse.success && pendingResponse.data) {
          setReceivedCount(pendingResponse.data.length);
        }

        // 발신 문서함: 내가 올린 결재 문서
        const requestedResponse = await apiClient.getMyRequestedWorkflows(userEmail);
        if (requestedResponse.success && requestedResponse.data) {
          setSentCount(requestedResponse.data.length);
        }
      } catch (error) {
        console.error('❌ 결재 통계 로드 오류:', error);
      }
    };

    loadWorkflowStats();
  }, []);

  // 내 문서함 개수 계산 (내가 만든 문서)
  useEffect(() => {
    const userInfo = typeof window !== 'undefined' ? JSON.parse(localStorage.getItem('user') || '{}') : {};
    const userEmail = userInfo.email;

    if (userEmail && documents.length > 0) {
      const myDocs = documents.filter(doc => {
        const creatorEmail = doc.creator || doc.author;
        return creatorEmail === userEmail || creatorEmail?.includes(userEmail);
      });
      setMyDocumentsCount(myDocs.length);
    }
  }, [documents]);

  const statCards = [
    {
      count: receivedCount,
      title: "수신 문서함",
      backgroundColor: "#b3d9ff", // 파스텔 파란색
      textColor: "#000000",
    },
    {
      count: sentCount,
      title: "발신 문서함",
      backgroundColor: "#b3e5d1", // 파스텔 초록색
      textColor: "#000000",
    },
    {
      count: myDocumentsCount,
      title: "내 문서함",
      backgroundColor: "#fff3cd", // 파스텔 노란색
      textColor: "#000000",
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
    .slice(0, 5) // 최근 수정 5개만 표시
    .map(doc => ({
      documentNumber: doc.documentNumber,
      title: doc.title,
      creator: doc.creator || doc.author, // 생성자 우선 사용
      lastModified: doc.lastModified,
      documentType: doc.documentType || 'shared' as const,
      url: doc.url,
      tag: doc.tag, // 태그 추가
    }));

  // 최근 문서를 Document 형태로 변환
  const recentDocumentsAsDocuments: Document[] = recentDocuments.map((item, index) => ({
    documentNumber: `RECENT-${index + 1}`,
    title: item.name,
    creator: '',
    lastModified: item.time || '',
    documentType: 'shared' as const,
    url: item.url || '',
    tag: item.tag || '',
  }));

  // 즐겨찾기를 Document 형태로 변환
  const favoriteTemplatesAsDocuments: Document[] = favoriteTemplates.map((item, index) => ({
    documentNumber: `FAV-${index + 1}`,
    title: item.name,
    creator: '',
    lastModified: '',
    documentType: 'shared' as const,
    url: item.url || '',
    tag: item.tag || '',
  }));

  // 이름만 표시하는 간단한 컬럼 정의
  const simpleColumns = [
    {
      key: 'title',
      header: '',
      render: (row: Document) => row.title,
    },
  ];

  return (
    <div className="document-management-container">
      <div className="cards-row">
        <DocumentList<Document>
          title="최근 문서"
          columns={simpleColumns}
          data={recentDocumentsAsDocuments}
          onPageChange={onPageChange}
          onRowClick={handleDocClick}
          isLoading={false}
          showViewAll={false}
          showTableHeader={false}
        />
        <DocumentList<Document>
          title="즐겨찾기"
          columns={simpleColumns}
          data={favoriteTemplatesAsDocuments}
          onPageChange={onPageChange}
          onRowClick={(doc) => {
            const item = favoriteTemplates.find(fav => fav.name === doc.title);
            if (item) {
              handleFavoriteClick(item as any);
            }
          }}
          isLoading={false}
          showViewAll={false}
          showTableHeader={false}
        />
      </div>

      <DocumentList<Document>
        title="문서함"
        columns={documentColumns}
        data={processedDocuments}
        onPageChange={onPageChange}
        onRowClick={handleDocClick}
        isLoading={isLoading}
        headerContent={
          <button
            className="btn-workflow-request"
            onClick={() => {
              setSelectedDocument(null);
              setIsWorkflowModalOpen(true);
            }}
            title="결재 요청"
          >
            📋 결재 요청
          </button>
        }
      />

      <WorkflowRequestModal
        isOpen={isWorkflowModalOpen}
        onClose={() => {
          setIsWorkflowModalOpen(false);
          setSelectedDocument(null);
        }}
        documentId={selectedDocument?.id}
        documentTitle={selectedDocument?.title}
        isPersonalDocument={selectedDocument?.documentType === 'personal'}
        onSuccess={(response: WorkflowRequestResponse) => {
          console.log('✅ 결재 요청 성공:', response);
          // 통계 갱신
          const userInfo = typeof window !== 'undefined' ? JSON.parse(localStorage.getItem('user') || '{}') : {};
          if (userInfo.email) {
            apiClient.getMyRequestedWorkflows(userInfo.email).then(res => {
              if (res.success && res.data) {
                setSentCount(res.data.length);
              }
            });
          }
        }}
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
