import React from "react";
import "./DocumentList.css";
import { BiLoaderAlt } from "react-icons/bi";

// T는 데이터 객체의 타입을 나타내는 제네릭 타입
interface Column<T extends object> {
  key: string;
  header: string;
  width?: string;
  // render 함수는 이제 제네릭 타입 T를 사용하여 row의 타입을 정확히 알 수 있음
  render?: (row: T) => React.ReactNode;
  cellClassName?: string;
  sortable?: boolean;
}

interface DocumentListProps<T extends object> {
  columns: Column<T>[];
  data: T[];
  onPageChange: (pageName: string) => void;
  title: string;
  onRowClick?: (row: T) => void;
  sortConfig?: {
    key: string | null;
    direction: 'asc' | 'desc';
  } | null;
  onSort?: (key: string) => void;
  showViewAll?: boolean;
  isLoading?: boolean;
  onRowDoubleClick?: (row: T) => void;
  headerContent?: React.ReactNode;
  showTableHeader?: boolean;
}

const DocumentList = <T extends object>({ columns, data, onPageChange, title, onRowClick, sortConfig, onSort, showViewAll = true, isLoading, onRowDoubleClick, headerContent, showTableHeader = true }: DocumentListProps<T>) => {
  return (
    <div className="document-container">
      <div className="table-container">
        <div
          className="section-header"
          style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingRight: '20px' }}
        >
          <div className="section-title-container">
            <div className="section-title no-line">
              {title}
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            {headerContent}
            {showViewAll && (
              <button
                className="view-all-button"
                onClick={() => onPageChange("docbox")}
              >
                모두 보기
              </button>
            )}
          </div>
        </div>

        {showTableHeader && (
          <div className="table-header">
            {columns.map((col) => (
              <div
                key={String(col.key)}
                className={`table-header-cell ${col.cellClassName || ''} ${col.sortable !== false ? 'sortable' : ''}`}
                style={{ width: col.width, flex: col.width ? 'none' : 1 }}
                onClick={() => col.sortable !== false && onSort?.(col.key)}
              >
                <div className="header-content">
                  <span>{col.header}</span>
                  {col.sortable !== false && sortConfig?.key === col.key && (
                    <span className="sort-indicator">
                      {sortConfig.direction === 'asc' ? '↑' : '↓'}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {isLoading ? (
          <div className="table-row">
            <div className="table-cell loading-cell" style={{ width: '100%' }}>
              <BiLoaderAlt className="spinner" />
              <span>문서를 불러오는 중입니다...</span>
            </div>
          </div>
        ) : data.length > 0 ? (
          data.map((row, index) => {
            const isLastRow = index === data.length - 1;
            return (
              <div 
                className={`table-row ${isLastRow ? 'last-row-no-header' : ''}`}
                key={index}
                onClick={() => onRowClick && onRowClick(row)}
                onDoubleClick={() => onRowDoubleClick?.(row)}
                style={{ cursor: (onRowClick || onRowDoubleClick) ? 'pointer' : 'default' }}
              >
                {columns.map((col) => (
                  <div key={String(col.key)} className={`table-cell ${col.cellClassName || ''}`} style={{ width: col.width, flex: col.width ? 'none' : 1 }}>
                    {col.render ? col.render(row) : String((row as Record<string, unknown>)[col.key] || '') as React.ReactNode}
                  </div>
                ))}
              </div>
            );
          })
        ) : showTableHeader ? (
          <div className="table-row">
            <div className="table-cell no-results-cell" style={{ width: '100%' }}>
              문서가 없습니다.
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
};

export default DocumentList;
