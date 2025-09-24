import React from "react";
import "./DocumentList.css";
import { BiLoaderAlt } from "react-icons/bi";

// T는 데이터 객체의 타입을 나타내는 제네릭 타입
interface Column<T extends object> {
  key: keyof T & string;
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
    key: keyof T | null;
    direction: 'asc' | 'desc';
  };
  onSort?: (key: keyof T) => void;
  showViewAll?: boolean;
  isLoading?: boolean;
  onRowDoubleClick?: (row: T) => void;
}

const DocumentList = <T extends object>({ columns, data, onPageChange, title, onRowClick, sortConfig, onSort, showViewAll = true, isLoading, onRowDoubleClick }: DocumentListProps<T>) => {
  return (
    <div className="document-container">
      <div className="table-container">
        <div
          className="section-header"
          style={{ backgroundColor: "var(--primary)" }}
        >
          <div className="section-title-container">
            <div className="section-title no-line" style={{ color: "white", margin: "10px 0 0 20px" }}>
              {title}
            </div>
          </div>
          {showViewAll && (
            <div
              className="submenu-item"
              onClick={() => onPageChange("docbox")}
              style={{ textDecoration: "none", color: "inherit" }}
            >
              <div className="view-all-button" style={{ color: "#e0e0e0" }}>
                모두 보기
              </div>
            </div>
          )}
        </div>

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

        {isLoading ? (
          <div className="table-row">
            <div className="table-cell loading-cell" style={{ width: '100%' }}>
              <BiLoaderAlt className="spinner" />
              <span>문서를 불러오는 중입니다...</span>
            </div>
          </div>
        ) : data.length > 0 ? (
          data.map((row, index) => (
            <div 
              className="table-row" 
              key={index}
              onClick={() => onRowClick && onRowClick(row)}
              onDoubleClick={() => onRowDoubleClick?.(row)}
              style={{ cursor: (onRowClick || onRowDoubleClick) ? 'pointer' : 'default' }}
            >
              {columns.map((col) => (
                <div key={String(col.key)} className={`table-cell ${col.cellClassName || ''}`} style={{ width: col.width, flex: col.width ? 'none' : 1 }}>
                  {col.render ? col.render(row) : (row[col.key] as React.ReactNode)}
                </div>
              ))}
            </div>
          ))
        ) : (
          <div className="table-row">
            <div className="table-cell no-results-cell" style={{ width: '100%' }}>
              문서가 없습니다.
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DocumentList;
