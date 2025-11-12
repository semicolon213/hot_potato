import React, { useState, useEffect, useMemo } from "react";
import "../styles/pages/DocumentManagement.css";
import InfoCard, { type Item as InfoCardItem } from "../components/features/documents/InfoCard";
import DocumentList from "../components/features/documents/DocumentList";
import StatCard from "../components/features/documents/StatCard";
import { useDocumentTable, type Document } from "../hooks/features/documents/useDocumentTable";
import { getSheetIdByName, getSheetData, updateTitleInSheetByDocId } from "../utils/google/googleSheetUtils";
import { getRecentDocuments, addRecentDocument } from "../utils/helpers/localStorageUtils";
import { generateDocumentNumber } from "../utils/helpers/documentNumberGenerator";
import { loadAllDocuments } from "../utils/helpers/loadDocumentsFromDrive";
import { formatRelativeTime, formatDateToYYYYMMDD } from "../utils/helpers/timeUtils";
import { useTemplateUI, type Template } from "../hooks/features/templates/useTemplateUI";
import { ENV_CONFIG } from "../config/environment";
import { fetchFavorites } from "../utils/database/personalFavoriteManager";
import { apiClient } from "../utils/api/apiClient";
import WorkflowRequestModal from "../components/features/workflow/WorkflowRequestModal";
import { uploadSharedDocument, uploadPersonalDocument } from "../utils/google/documentUploader";
import { fetchTags as fetchPersonalTags } from "../utils/database/personalTagManager";
import EmailAutocomplete from "../components/ui/common/EmailAutocomplete";
import type { DocumentMap } from "../types/documents";
import type { DocumentInfo } from "../types/documents";
import type { WorkflowRequestResponse } from "../types/api/apiResponses";
import RightArrowIcon from "../assets/Icons/right_black.svg";
import TableColumnFilter, { type SortDirection, type FilterOption } from "../components/ui/common/TableColumnFilter";

interface DocumentManagementProps {
  onPageChange: (pageName: string) => void;
  customTemplates: Template[];
  searchTerm?: string;
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

// Helper function to generate pagination numbers
const getPaginationNumbers = (currentPage: number, totalPages: number) => {
  const pageNeighbours = 2;
  const totalNumbers = (pageNeighbours * 2) + 1;
  const totalBlocks = totalNumbers + 2;

  if (totalPages <= totalBlocks) {
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }

  const startPage = Math.max(2, currentPage - pageNeighbours);
  const endPage = Math.min(totalPages - 1, currentPage + pageNeighbours);
  let pages: (string | number)[] = Array.from({ length: (endPage - startPage) + 1 }, (_, i) => startPage + i);

  const hasLeftSpill = startPage > 2;
  const hasRightSpill = (totalPages - endPage) > 1;
  const spillOffset = totalNumbers - (pages.length + 1);

  switch (true) {
    case (hasLeftSpill && !hasRightSpill):
      const extraPages = Array.from({ length: spillOffset }, (_, i) => startPage - 1 - i).reverse();
      pages = ['...', ...extraPages, ...pages];
      break;
    case (!hasLeftSpill && hasRightSpill):
      const extraPages_ = Array.from({ length: spillOffset }, (_, i) => endPage + 1 + i);
      pages = [...pages, ...extraPages_, '...'];
      break;
    case (hasLeftSpill && hasRightSpill):
    default:
      pages = ['...', ...pages, '...'];
      break;
  }

  return [1, ...pages, totalPages];
};

const DocumentManagement: React.FC<DocumentManagementProps> = ({ onPageChange, customTemplates, searchTerm: propSearchTerm = '' }) => {
  const { documentColumns } = useDocumentTable();
  const [documents, setDocuments] = useState<FetchedDocument[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [recentDocuments, setRecentDocuments] = useState<InfoCardItem[]>([]);
  const [favoriteTemplates, setFavoriteTemplates] = useState<InfoCardItem[]>([]);
  const { onUseTemplate, allDefaultTemplates, personalTemplates } = useTemplateUI(customTemplates, onPageChange, '', '전체');
  
  // 검색 및 페이지네이션 상태
  const [currentPage, setCurrentPage] = useState(1);
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' } | null>(null);
  const documentsPerPage = 10;

  // 필터 상태
  const [filterConfigs, setFilterConfigs] = useState<Record<string, {
    sortDirection: SortDirection;
    selectedFilters: (string | number)[];
  }>>({});
  const [openFilterColumn, setOpenFilterColumn] = useState<string | null>(null);
  const [filterPopupPosition, setFilterPopupPosition] = useState<{ top: number; left: number }>({ top: 0, left: 0 });

  // 문서 업로드 모달 상태
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadFileName, setUploadFileName] = useState('');
  const [uploadTag, setUploadTag] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [permissionType, setPermissionType] = useState<'private' | 'shared'>('shared');
  const [selectedGroups, setSelectedGroups] = useState<string[]>([]);
  const [individualEmails, setIndividualEmails] = useState<string[]>(['']);
  const [staticTags, setStaticTags] = useState<string[]>([]);
  const [personalTags, setPersonalTags] = useState<string[]>([]);
  const [isLoadingTags, setIsLoadingTags] = useState(false);
  const [selectedDocs, setSelectedDocs] = useState<string[]>([]);

  // 결재 관련 통계 상태
  const [receivedCount, setReceivedCount] = useState<number>(0); // 수신 문서함 (내가 결재해야 하는 것)
  const [sentCount, setSentCount] = useState<number>(0); // 발신 문서함 (내가 올린 결재)
  const [myDocumentsCount, setMyDocumentsCount] = useState<number>(0); // 내 문서함 (내가 만든 문서)

  // 결재 요청 모달 상태
  const [isWorkflowModalOpen, setIsWorkflowModalOpen] = useState<boolean>(false);
  const [selectedDocument, setSelectedDocument] = useState<{ id?: string; title?: string; documentType?: 'shared' | 'personal' } | null>(null);

  const handleDocClick = (doc: { url?: string } | FetchedDocument) => {
    const url = 'url' in doc ? doc.url : (doc as FetchedDocument).url;
    if (url) {
      const fullDoc = documents.find(d => d.url === url);
      if (fullDoc) {
        addRecentDocument(fullDoc);
      }
      window.open(url, '_blank');
    }
  };

  // 문서 업로드 관련 함수들
  const openUploadModal = () => {
    setShowUploadModal(true);
    setUploadFile(null);
    setUploadFileName('');
    setUploadTag('');
    setPermissionType('shared');
    setSelectedGroups([]);
    setIndividualEmails(['']);
  };

  const closeUploadModal = () => {
    setShowUploadModal(false);
    setUploadFile(null);
    setUploadFileName('');
    setIsUploading(false);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setUploadFile(file);
      if (!uploadFileName) {
        const nameWithoutExt = file.name.replace(/\.[^/.]+$/, '');
        setUploadFileName(nameWithoutExt);
      }
    }
  };

  const handleUpload = async () => {
    if (!uploadFile || !uploadFileName.trim()) {
      alert('파일과 파일명을 입력해주세요.');
      return;
    }

    if (permissionType === 'shared' && !uploadTag.trim()) {
      alert('태그를 입력해주세요.');
      return;
    }

    setIsUploading(true);

    try {
      const userInfo = JSON.parse(localStorage.getItem('user') || '{}');
      const creatorEmail = userInfo.email || '';

      let result;

      if (permissionType === 'shared') {
        const groupEmails = selectedGroups.map(group => ENV_CONFIG.GROUP_EMAILS[group as keyof typeof ENV_CONFIG.GROUP_EMAILS]).filter(Boolean) as string[];
        const allEditors = [...groupEmails, ...individualEmails.filter(email => email.trim())];

        result = await uploadSharedDocument(
          uploadFile,
          uploadFileName,
          uploadTag,
          creatorEmail,
          allEditors
        );
      } else {
        result = await uploadPersonalDocument(
          uploadFile,
          uploadFileName,
          uploadTag || '개인',
          creatorEmail
        );
      }

      if (result.success) {
        alert('문서가 성공적으로 업로드되었습니다.');
        closeUploadModal();

        // 문서 목록 새로고침
        setIsLoading(true);
        const allDocs = await loadAllDocuments();
        const convertedDocs: FetchedDocument[] = allDocs.map((doc, index) => ({
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
        setIsLoading(false);
      } else {
        alert(`업로드 실패: ${result.message || '알 수 없는 오류'}`);
      }
    } catch (error) {
      console.error('업로드 오류:', error);
      alert('업로드 중 오류가 발생했습니다.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleShare = () => {
    if (selectedDocs.length !== 1) {
      alert("공유할 문서 1개를 선택하세요.");
      return;
    }
    const docToShare = documents.find(doc => doc.id === selectedDocs[0] || doc.documentNumber === selectedDocs[0]);
    if (docToShare) {
      navigator.clipboard.writeText(docToShare.url)
        .then(() => alert("문서 링크가 클립보드에 복사되었습니다."))
        .catch(() => alert("링크 복사에 실패했습니다."));
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

  // 태그 목록 로드
  useEffect(() => {
    const loadTags = async () => {
      setIsLoadingTags(true);
      try {
        const staticTagsResponse = await apiClient.getStaticTags();
        if (staticTagsResponse.success && staticTagsResponse.data) {
          setStaticTags(staticTagsResponse.data);
        }
        const personalTagsData = await fetchPersonalTags();
        setPersonalTags(personalTagsData);
      } catch (error) {
        console.error('태그 로드 오류:', error);
      } finally {
        setIsLoadingTags(false);
      }
    };

    if (showUploadModal) {
      loadTags();
    }
  }, [showUploadModal]);

  useEffect(() => {
    const loadDocuments = async () => {
      setIsLoading(true);
      try {
        console.log("📄 문서관리에서 문서 로딩 시작...");
        const allDocs = await loadAllDocuments();
        console.log("📄 로딩된 문서 수:", allDocs.length);
        
        const convertedDocs: FetchedDocument[] = allDocs.map((doc, index) => ({
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
      } catch (error) {
        console.error("📄 문서 로딩 오류:", error);
        setDocuments([]);
      } finally {
        setIsLoading(false);
      }
    };

    loadDocuments();

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        loadDocuments();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  const loadRecentDocuments = () => {
    const recents = getRecentDocuments();
    const formattedRecents = recents.map(doc => ({
      name: doc.title,
      time: formatRelativeTime(doc.lastAccessed),
      url: doc.url,
    }));
    setRecentDocuments(formattedRecents);
  };

  // 최근 문서 로드
  useEffect(() => {
    loadRecentDocuments();
  }, []);
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
      backgroundColor: "#4A9AFF",
      textColor: "#FFFFFF",
    },
    {
      count: sentCount,
      title: "발신 문서함",
      backgroundColor: "#4AB866",
      textColor: "#FFFFFF",
    },
    {
      count: myDocumentsCount,
      title: "내 문서함",
      backgroundColor: "#F9C620",
      textColor: "#FFFFFF",
    },
  ];

  // 문서 타입을 한국어로 변환
  const typeMap: { [key: string]: string } = {
    'shared': '공유',
    'personal': '개인'
  };

  // 필터링된 문서 목록
  const filteredDocuments = useMemo(() => {
    return documents.filter(doc => {
      // 검색어 필터링
      const matchesSearch = propSearchTerm === '' || doc.title.replace(/\s/g, '').toLowerCase().includes(propSearchTerm.replace(/\s/g, '').toLowerCase());
      if (!matchesSearch) return false;

      // 컬럼별 필터 적용
      for (const [columnKey, config] of Object.entries(filterConfigs)) {
        if (config.selectedFilters.length === 0) continue;

        let docValue: string | number | undefined;
        
        switch (columnKey) {
          case 'documentNumber':
            docValue = doc.documentNumber;
            break;
          case 'title':
            docValue = doc.title;
            break;
          case 'creator':
            docValue = doc.creator || doc.author || '';
            break;
          case 'lastModified':
            try {
              if (doc.lastModified.includes('T')) {
                docValue = formatDateToYYYYMMDD(doc.lastModified);
              } else {
                const datePart = doc.lastModified.split(' ')[0];
                docValue = datePart.replace(/\./g, '-');
              }
            } catch {
              docValue = doc.lastModified;
            }
            break;
          case 'tag':
            docValue = doc.tag || '';
            break;
          case 'documentType':
            docValue = typeMap[doc.documentType || 'shared'] || doc.documentType || '';
            break;
          default:
            continue;
        }

        if (!config.selectedFilters.includes(docValue)) {
          return false;
        }
      }

      return true;
    });
  }, [documents, propSearchTerm, filterConfigs]);

  // 정렬된 문서 목록
  const sortedDocuments = useMemo(() => {
    const sorted = [...filteredDocuments];
    
    // 필터 설정에서 정렬 정보 가져오기
    const activeSortConfig = Object.entries(filterConfigs).find(([_, config]) => config.sortDirection !== null);
    
    if (activeSortConfig) {
      const [columnKey, config] = activeSortConfig;
      const direction = config.sortDirection!;
      
      sorted.sort((a, b) => {
        let aValue: string | number | Date;
        let bValue: string | number | Date;

        switch (columnKey) {
          case 'documentNumber':
            aValue = a.documentNumber;
            bValue = b.documentNumber;
            break;
          case 'title':
            aValue = a.title;
            bValue = b.title;
            break;
          case 'creator':
            aValue = a.creator || a.author || '';
            bValue = b.creator || b.author || '';
            break;
          case 'lastModified':
            try {
              if (a.lastModified && a.lastModified.includes('T')) {
                aValue = new Date(a.lastModified);
              } else if (a.lastModified) {
                const datePart = a.lastModified.split(' ')[0];
                aValue = new Date(datePart.replace(/\./g, '-'));
              } else {
                aValue = new Date(0);
              }
              if (b.lastModified && b.lastModified.includes('T')) {
                bValue = new Date(b.lastModified);
              } else if (b.lastModified) {
                const datePart = b.lastModified.split(' ')[0];
                bValue = new Date(datePart.replace(/\./g, '-'));
              } else {
                bValue = new Date(0);
              }
            } catch {
              aValue = a.lastModified || '';
              bValue = b.lastModified || '';
            }
            break;
          case 'tag':
            aValue = a.tag || '';
            bValue = b.tag || '';
            break;
          case 'documentType':
            aValue = typeMap[a.documentType || 'shared'] || a.documentType || '';
            bValue = typeMap[b.documentType || 'shared'] || b.documentType || '';
            break;
          default:
            return 0;
        }

        if (aValue < bValue) return direction === 'asc' ? -1 : 1;
        if (aValue > bValue) return direction === 'asc' ? 1 : -1;
        return 0;
      });
    } else {
      // 기본 정렬: 최신순
      sorted.sort((a, b) => {
        try {
          let dateA: Date, dateB: Date;
          if (a.lastModified && a.lastModified.includes('T')) {
            dateA = new Date(a.lastModified);
          } else if (a.lastModified) {
            const datePart = a.lastModified.split(' ')[0];
            dateA = new Date(datePart.replace(/\./g, '-'));
          } else {
            dateA = new Date(0);
          }
          if (b.lastModified && b.lastModified.includes('T')) {
            dateB = new Date(b.lastModified);
          } else if (b.lastModified) {
            const datePart = b.lastModified.split(' ')[0];
            dateB = new Date(datePart.replace(/\./g, '-'));
          } else {
            dateB = new Date(0);
          }
          const dateDiff = dateB.getTime() - dateA.getTime();
          if (dateDiff !== 0) return dateDiff;
          return (b.originalIndex || 0) - (a.originalIndex || 0);
        } catch {
          return (b.originalIndex || 0) - (a.originalIndex || 0);
        }
      });
    }

    return sorted;
  }, [filteredDocuments, filterConfigs]);

  // 페이지네이션
  const totalPages = Math.ceil(sortedDocuments.length / documentsPerPage);
  const indexOfLastDoc = currentPage * documentsPerPage;
  const indexOfFirstDoc = indexOfLastDoc - documentsPerPage;
  const currentDocuments = sortedDocuments.slice(indexOfFirstDoc, indexOfLastDoc);

  const paginate = (pageNumber: number) => {
    if (pageNumber > 0 && pageNumber <= totalPages) {
      setCurrentPage(pageNumber);
    }
  };

  const paginationNumbers = totalPages >= 1 ? getPaginationNumbers(currentPage, totalPages) : [];

  // 검색어 변경 시 첫 페이지로
  useEffect(() => {
    setCurrentPage(1);
  }, [propSearchTerm]);

  // 컬럼별 필터 옵션 생성 (검색어만 적용된 문서 목록에서 생성)
  const getFilterOptions = (columnKey: string): FilterOption[] => {
    // 검색어만 적용된 문서 목록 (필터 적용 전)
    const searchFilteredDocs = documents.filter(doc => {
      const matchesSearch = propSearchTerm === '' || doc.title.replace(/\s/g, '').toLowerCase().includes(propSearchTerm.replace(/\s/g, '').toLowerCase());
      return matchesSearch;
    });

    const uniqueValues = new Set<string | number>();
    
    searchFilteredDocs.forEach(doc => {
      let value: string | number | undefined;
      
      switch (columnKey) {
        case 'documentNumber':
          value = doc.documentNumber;
          break;
        case 'title':
          value = doc.title;
          break;
        case 'creator':
          value = doc.creator || doc.author || '';
          break;
        case 'lastModified':
          // 날짜는 년-월-일 형식으로 변환
          try {
            if (doc.lastModified.includes('T')) {
              value = formatDateToYYYYMMDD(doc.lastModified);
            } else {
              const datePart = doc.lastModified.split(' ')[0];
              value = datePart.replace(/\./g, '-');
            }
          } catch {
            value = doc.lastModified;
          }
          break;
        case 'tag':
          value = doc.tag || '';
          break;
        case 'documentType':
          value = typeMap[doc.documentType || 'shared'] || doc.documentType || '';
          break;
        default:
          return;
      }
      
      if (value !== undefined && value !== null && value !== '') {
        uniqueValues.add(value);
      }
    });
    
    // 값별 개수 계산
    const valueCounts = new Map<string | number, number>();
    searchFilteredDocs.forEach(doc => {
      let value: string | number | undefined;
      
      switch (columnKey) {
        case 'documentNumber':
          value = doc.documentNumber;
          break;
        case 'title':
          value = doc.title;
          break;
        case 'creator':
          value = doc.creator || doc.author || '';
          break;
        case 'lastModified':
          try {
            if (doc.lastModified.includes('T')) {
              value = formatDateToYYYYMMDD(doc.lastModified);
            } else {
              const datePart = doc.lastModified.split(' ')[0];
              value = datePart.replace(/\./g, '-');
            }
          } catch {
            value = doc.lastModified;
          }
          break;
        case 'tag':
          value = doc.tag || '';
          break;
        case 'documentType':
          value = typeMap[doc.documentType || 'shared'] || doc.documentType || '';
          break;
        default:
          return;
      }
      
      if (value !== undefined && value !== null && value !== '') {
        valueCounts.set(value, (valueCounts.get(value) || 0) + 1);
      }
    });
    
    return Array.from(uniqueValues)
      .sort()
      .map(value => ({
        value,
        label: String(value),
        count: valueCounts.get(value)
      }));
  };

  // 헤더 클릭 핸들러 (필터 팝업 열기)
  const handleHeaderClick = (e: React.MouseEvent<HTMLTableCellElement>, columnKey: string) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setFilterPopupPosition({
      top: rect.bottom + 4,
      left: rect.left
    });
    setOpenFilterColumn(openFilterColumn === columnKey ? null : columnKey);
  };

  // 정렬 변경 핸들러
  const handleSortChange = (columnKey: string, direction: SortDirection) => {
    setFilterConfigs(prev => {
      const newConfigs: Record<string, {
        sortDirection: SortDirection;
        selectedFilters: (string | number)[];
      }> = {};
      
      // 모든 컬럼의 정렬을 초기화하고, 현재 컬럼만 정렬 설정
      Object.keys(prev).forEach(key => {
        newConfigs[key] = {
          ...prev[key],
          sortDirection: key === columnKey ? direction : null
        };
      });
      
      // 현재 컬럼이 없으면 새로 추가
      if (!newConfigs[columnKey]) {
        newConfigs[columnKey] = {
          sortDirection: direction,
          selectedFilters: []
        };
      } else {
        newConfigs[columnKey] = {
          ...newConfigs[columnKey],
          sortDirection: direction
        };
      }
      
      return newConfigs;
    });
    
    if (direction) {
      setSortConfig({ key: columnKey, direction });
    } else {
      setSortConfig(null);
    }
  };

  // 필터 변경 핸들러
  const handleFilterChange = (columnKey: string, filters: (string | number)[]) => {
    setFilterConfigs(prev => ({
      ...prev,
      [columnKey]: {
        ...prev[columnKey] || { sortDirection: null, selectedFilters: [] },
        selectedFilters: filters
      }
    }));
  };

  // 필터 초기화 핸들러
  const handleClearFilters = (columnKey: string) => {
    setFilterConfigs(prev => {
      const newConfigs = { ...prev };
      if (newConfigs[columnKey]) {
        newConfigs[columnKey] = {
          ...newConfigs[columnKey],
          selectedFilters: []
        };
      }
      return newConfigs;
    });
  };

  return (
    <div className="document-management-container">
      <div className="document-list-section">
        <div className="actions-bar">
          <div className="action-buttons">
            <button className="btn-print" onClick={openUploadModal}>
              업로드
            </button>
            <button className="btn-print" onClick={handleShare}>
              공유
            </button>
          </div>
        </div>

        <div className="post-list">
          {isLoading ? (
            <p className="loading-message">데이터를 불러오는 중입니다. 잠시만 기다려주세요...</p>
          ) : filteredDocuments.length > 0 ? (
            <>
              <table className="document-table">
                <colgroup>
                  <col className="col-number-width" />
                  <col className="col-title-width" />
                  <col className="col-author-width" />
                  <col className="col-date-width" />
                  <col className="col-tag-width" />
                  <col className="col-type-width" />
                </colgroup>
                <thead>
                  <tr>
                    <th 
                      className={`col-number sortable ${filterConfigs['documentNumber']?.sortDirection ? 'sorted' : ''} ${filterConfigs['documentNumber']?.selectedFilters.length ? 'filtered' : ''}`}
                      onClick={(e) => handleHeaderClick(e, 'documentNumber')}
                    >
                      <div className="th-content">
                        <span>문서번호</span>
                        {(filterConfigs['documentNumber']?.selectedFilters.length || 0) > 0 && (
                          <span className="filter-indicator">🔽</span>
                        )}
                      </div>
                    </th>
                    <th 
                      className={`col-title sortable ${filterConfigs['title']?.sortDirection ? 'sorted' : ''} ${filterConfigs['title']?.selectedFilters.length ? 'filtered' : ''}`}
                      onClick={(e) => handleHeaderClick(e, 'title')}
                    >
                      <div className="th-content">
                        <span>문서이름</span>
                        {(filterConfigs['title']?.selectedFilters.length || 0) > 0 && (
                          <span className="filter-indicator">🔽</span>
                        )}
                      </div>
                    </th>
                    <th 
                      className={`col-author sortable ${filterConfigs['creator']?.sortDirection ? 'sorted' : ''} ${filterConfigs['creator']?.selectedFilters.length ? 'filtered' : ''}`}
                      onClick={(e) => handleHeaderClick(e, 'creator')}
                    >
                      <div className="th-content">
                        <span>생성자</span>
                        {(filterConfigs['creator']?.selectedFilters.length || 0) > 0 && (
                          <span className="filter-indicator">🔽</span>
                        )}
                      </div>
                    </th>
                    <th 
                      className={`col-date sortable ${filterConfigs['lastModified']?.sortDirection ? 'sorted' : ''} ${filterConfigs['lastModified']?.selectedFilters.length ? 'filtered' : ''}`}
                      onClick={(e) => handleHeaderClick(e, 'lastModified')}
                    >
                      <div className="th-content">
                        <span>수정시간</span>
                        {(filterConfigs['lastModified']?.selectedFilters.length || 0) > 0 && (
                          <span className="filter-indicator">🔽</span>
                        )}
                      </div>
                    </th>
                    <th 
                      className={`col-tag sortable ${filterConfigs['tag']?.sortDirection ? 'sorted' : ''} ${filterConfigs['tag']?.selectedFilters.length ? 'filtered' : ''}`}
                      onClick={(e) => handleHeaderClick(e, 'tag')}
                    >
                      <div className="th-content">
                        <span>태그</span>
                        {(filterConfigs['tag']?.selectedFilters.length || 0) > 0 && (
                          <span className="filter-indicator">🔽</span>
                        )}
                      </div>
                    </th>
                    <th 
                      className={`col-type sortable ${filterConfigs['documentType']?.sortDirection ? 'sorted' : ''} ${filterConfigs['documentType']?.selectedFilters.length ? 'filtered' : ''}`}
                      onClick={(e) => handleHeaderClick(e, 'documentType')}
                    >
                      <div className="th-content">
                        <span>유형</span>
                        {(filterConfigs['documentType']?.selectedFilters.length || 0) > 0 && (
                          <span className="filter-indicator">🔽</span>
                        )}
                      </div>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {currentDocuments.map((doc) => (
                    <tr 
                      key={doc.id || doc.documentNumber} 
                      onClick={() => handleDocClick({ url: doc.url })}
                      className="document-row"
                    >
                      <td className="col-number">{doc.documentNumber}</td>
                      <td className="col-title">
                        <div className="title-cell-inner">
                          <span className="title-ellipsis">{doc.title}</span>
                        </div>
                      </td>
                      <td className="col-author">{doc.creator || doc.author}</td>
                      <td className="col-date">
                        {doc.lastModified ? (() => {
                          try {
                            // "2024.03.16 14:30" 형식 또는 ISO 형식 처리
                            if (doc.lastModified.includes('T')) {
                              return formatDateToYYYYMMDD(doc.lastModified);
                            }
                            // "2024.03.16 14:30" 형식에서 날짜만 추출
                            const datePart = doc.lastModified.split(' ')[0];
                            return datePart.replace(/\./g, '-');
                          } catch {
                            return doc.lastModified;
                          }
                        })() : '-'}
                      </td>
                      <td className="col-tag">
                        {doc.tag ? (
                          <span className="tag-badge">{doc.tag}</span>
                        ) : (
                          <span className="no-tag">-</span>
                        )}
                      </td>
                      <td className="col-type">
                        <div className={`type-badge ${doc.documentType || 'shared'}`}>
                          <div className="type-text">{typeMap[doc.documentType || 'shared']}</div>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </>
          ) : (
            <p className="no-results">문서가 없습니다.</p>
          )}
        </div>

        {/* 필터 팝업 */}
        {openFilterColumn && (
          <TableColumnFilter
            columnKey={openFilterColumn}
            columnLabel={
              openFilterColumn === 'documentNumber' ? '문서번호' :
              openFilterColumn === 'title' ? '문서이름' :
              openFilterColumn === 'creator' ? '생성자' :
              openFilterColumn === 'lastModified' ? '수정시간' :
              openFilterColumn === 'tag' ? '태그' :
              openFilterColumn === 'documentType' ? '유형' : ''
            }
            isOpen={true}
            position={filterPopupPosition}
            onClose={() => setOpenFilterColumn(null)}
            sortDirection={filterConfigs[openFilterColumn]?.sortDirection || null}
            onSortChange={(direction) => handleSortChange(openFilterColumn, direction)}
            availableOptions={getFilterOptions(openFilterColumn)}
            selectedFilters={filterConfigs[openFilterColumn]?.selectedFilters || []}
            onFilterChange={(filters) => handleFilterChange(openFilterColumn, filters)}
            onClearFilters={() => handleClearFilters(openFilterColumn)}
          />
        )}

        {filteredDocuments.length > 0 && totalPages >= 1 && (
          <div className="pagination">
            <button 
              onClick={() => paginate(currentPage - 1)} 
              disabled={currentPage === 1} 
              className="page-arrow-link"
            >
              <img src={RightArrowIcon} alt="Previous" className="arrow-icon arrow-left" />
              <span>이전</span>
            </button>

            {paginationNumbers.map((page, index) => {
              if (typeof page === 'string') {
                return <span key={`ellipsis-${index}`} className="page-ellipsis">...</span>;
              }
              return (
                <button 
                  key={page} 
                  onClick={() => paginate(page)} 
                  className={`page-link ${currentPage === page ? 'active' : ''}`}
                >
                  {page}
                </button>
              );
            })}

            <button 
              onClick={() => paginate(currentPage + 1)} 
              disabled={currentPage === totalPages} 
              className="page-arrow-link"
            >
              <span>다음</span>
              <img src={RightArrowIcon} alt="Next" className="arrow-icon" />
            </button>
          </div>
        )}
      </div>

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

      {/* 문서 업로드 모달 */}
      {showUploadModal && (
        <div className="document-modal-overlay" onClick={closeUploadModal}>
          <div className="document-modal-content has-file-upload" onClick={(e) => e.stopPropagation()}>
            <div className="document-modal-header">
              <div className="header-left">
                <h2>📤 문서 업로드</h2>
                <p className="header-subtitle">파일을 업로드하고 문서 정보를 입력해주세요</p>
              </div>
              <button className="document-modal-close" onClick={closeUploadModal}>
                <span>&times;</span>
              </button>
            </div>

            <div className="document-modal-body">
              {/* 파일 선택 */}
              <div className="form-section">
                <div className="form-group-large">
                  <label htmlFor="upload-file" className="form-label-large">
                    <span className="label-icon">📁</span>
                    파일 선택
                  </label>
                  <div className="file-upload-area">
                    <input
                      id="upload-file"
                      type="file"
                      accept=".docx,.xlsx,.doc,.xls,.pdf"
                      onChange={handleFileSelect}
                      className="file-input"
                      disabled={isUploading}
                    />
                    <div className="file-upload-display" onClick={() => !isUploading && document.getElementById('upload-file')?.click()}>
                      {uploadFile ? (
                        <div className="uploaded-file">
                          <span className="file-icon">📄</span>
                          <span className="file-name">{uploadFile.name}</span>
                          <span className="file-size">({(uploadFile.size / 1024 / 1024).toFixed(2)} MB)</span>
                        </div>
                      ) : (
                        <div className="upload-placeholder">
                          <span className="upload-icon">📁</span>
                          <span className="upload-text">파일을 선택하거나 여기에 드래그하세요</span>
                          <span className="upload-hint">지원 형식: .docx, .xlsx, .doc, .xls, .pdf</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* 파일명 입력 */}
              <div className="form-section">
                <div className="form-group-large">
                  <label htmlFor="upload-filename" className="form-label-large">
                    <span className="label-icon">📝</span>
                    파일명
                  </label>
                  <input
                    id="upload-filename"
                    type="text"
                    className="form-input-large"
                    placeholder="예: 2024년 1월 정기회의록"
                    value={uploadFileName}
                    onChange={(e) => setUploadFileName(e.target.value)}
                    disabled={isUploading}
                  />
                  <div className="input-hint">문서를 식별할 수 있는 명확한 파일명을 입력하세요</div>
                </div>

                {/* 태그 선택 */}
                <div className="form-group-large">
                  <label htmlFor="upload-tag" className="form-label-large">
                    <span className="label-icon">🏷️</span>
                    태그
                  </label>
                  <select
                    id="upload-tag"
                    className="form-select-large"
                    value={uploadTag}
                    onChange={(e) => setUploadTag(e.target.value)}
                    disabled={isUploading || isLoadingTags}
                  >
                    <option value="">선택 안 함</option>
                    {staticTags.length > 0 && (
                      <optgroup label="기본 태그">
                        {staticTags.map(tag => (
                          <option key={tag} value={tag}>{tag}</option>
                        ))}
                      </optgroup>
                    )}
                    {personalTags.length > 0 && (
                      <optgroup label="개인 태그">
                        {personalTags.map(tag => (
                          <option key={tag} value={tag}>{tag}</option>
                        ))}
                      </optgroup>
                    )}
                  </select>
                  <div className="input-hint">
                    {permissionType === 'shared'
                      ? '문서를 분류할 태그를 선택하세요 (필수)'
                      : '문서를 분류할 태그를 선택하세요 (선택사항)'
                    }
                  </div>
                </div>
              </div>

              {/* 문서 접근 권한 설정 */}
              <div className="form-section">
                <div className="form-group-large">
                  <label className="form-label-large">
                    <span className="label-icon">🔐</span>
                    문서 접근 권한
                  </label>
                  <div className="permission-options">
                    <button
                      type="button"
                      className={`permission-option ${permissionType === 'private' ? 'active' : ''}`}
                      onClick={() => setPermissionType('private')}
                      disabled={isUploading}
                    >
                      <div className="option-icon">🔒</div>
                      <div className="option-content">
                        <div className="option-title">나만 보기</div>
                        <div className="option-desc">개인 문서 폴더에 저장</div>
                      </div>
                    </button>
                    <button
                      type="button"
                      className={`permission-option ${permissionType === 'shared' ? 'active' : ''}`}
                      onClick={() => setPermissionType('shared')}
                      disabled={isUploading}
                    >
                      <div className="option-icon">👥</div>
                      <div className="option-content">
                        <div className="option-title">권한 부여</div>
                        <div className="option-desc">공유 문서 폴더에 저장</div>
                      </div>
                    </button>
                  </div>
                </div>

                {permissionType === 'shared' && (
                  <div className="sharing-options">
                    <h4 className="section-title">공유 설정</h4>

                    <div className="group-permissions-section">
                      <h5 className="subsection-title">그룹 권한</h5>
                      <div className="group-permissions">
                        {Object.entries(ENV_CONFIG.GROUP_EMAILS).map(([key, email]) => (
                          <label key={key} className="group-permission-item">
                            <input
                              type="checkbox"
                              checked={selectedGroups.includes(key)}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setSelectedGroups([...selectedGroups, key]);
                                } else {
                                  setSelectedGroups(selectedGroups.filter(group => group !== key));
                                }
                              }}
                              disabled={isUploading}
                            />
                            <span className="checkbox-custom"></span>
                            <span className="group-name">
                              {key === 'STUDENT' && '학생'}
                              {key === 'COUNCIL' && '집행부'}
                              {key === 'PROFESSOR' && '교수'}
                              {key === 'ADJUNCT_PROFESSOR' && '겸임교원'}
                              {key === 'ASSISTANT' && '조교'}
                            </span>
                          </label>
                        ))}
                      </div>
                    </div>

                    <div className="individual-emails-section">
                      <h5 className="subsection-title">개별 이메일</h5>
                      <div className="individual-emails">
                        {individualEmails.map((email, index) => (
                          <div key={index} className="email-input-group">
                            <EmailAutocomplete
                              value={email}
                              onChange={(value) => {
                                const newEmails = [...individualEmails];
                                newEmails[index] = value;
                                setIndividualEmails(newEmails);
                              }}
                              placeholder="이름이나 이메일을 입력하세요"
                              disabled={isUploading}
                              className="email-input"
                            />
                            <button
                              type="button"
                              onClick={() => {
                                const newEmails = individualEmails.filter((_, i) => i !== index);
                                setIndividualEmails(newEmails);
                              }}
                              className="remove-email-btn"
                              title="이메일 제거"
                              disabled={isUploading}
                            >
                              ×
                            </button>
                          </div>
                        ))}
                        <button
                          type="button"
                          onClick={() => setIndividualEmails([...individualEmails, ''])}
                          className="add-email-btn"
                          disabled={isUploading}
                        >
                          <span>+</span> 이메일 추가
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="document-modal-actions">
              <button
                type="button"
                className="action-btn cancel-btn"
                onClick={closeUploadModal}
                disabled={isUploading}
              >
                <span>취소</span>
              </button>
              <button
                type="button"
                className="action-btn save-btn"
                onClick={handleUpload}
                disabled={!uploadFile || !uploadFileName.trim() || (permissionType === 'shared' && !uploadTag.trim()) || isUploading}
              >
                <span>
                  {isUploading ? '업로드 중...' : '📤 업로드'}
                </span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DocumentManagement;
