import React from "react";
import "./EmptyDocument.css";

interface EmptyDocumentProps {
  onPageChange: (pageName: string) => void;
}

const EmptyDocument: React.FC<EmptyDocumentProps> = ({ onPageChange }) => {
  return (
    <div className="empty-document-container">
      <button onClick={() => onPageChange('ddd')}>Go to Dashboard</button>
    </div>
  );
};

export default EmptyDocument;
