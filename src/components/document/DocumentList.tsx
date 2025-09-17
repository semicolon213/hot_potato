import React from "react";
import "./DocumentList.css";

// T는 데이터 객체의 타입을 나타내는 제네릭 타입
interface Column<T extends object> {
  key: keyof T & string;
  header: string;
  width?: string;
  // render 함수는 이제 제네릭 타입 T를 사용하여 row의 타입을 정확히 알 수 있음
  render?: (row: T) => React.ReactNode;
  cellClassName?: string;
}

interface DocumentListProps<T extends object> {
  columns: Column<T>[];
  data: T[];
  onPageChange: (pageName: string) => void;
  title: string;
}

const DocumentList = <T extends object>({ columns, data, onPageChange, title }: DocumentListProps<T>) => {
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
          <div
            className="submenu-item"
            onClick={() => onPageChange("docbox")}
            style={{ textDecoration: "none", color: "inherit" }}
          >
            <div className="view-all-button" style={{ color: "#e0e0e0" }}>
              모두 보기
            </div>
          </div>
        </div>

        <div className="table-header">
          {columns.map((col) => (
            <div key={String(col.key)} className={`table-header-cell ${col.cellClassName || ''}`} style={{ width: col.width, flex: col.width ? 'none' : 1 }}>
              {col.header}
            </div>
          ))}
        </div>

        {data.map((row, index) => (
          <div className="table-row" key={index}>
            {columns.map((col) => (
              <div key={String(col.key)} className={`table-cell ${col.cellClassName || ''}`} style={{ width: col.width, flex: col.width ? 'none' : 1 }}>
                {col.render ? col.render(row) : (row[col.key] as React.ReactNode)}
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
};

export default DocumentList;
