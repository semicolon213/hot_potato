/**
 * @file SheetSelectionModal.tsx
 * @brief Google Sheets 목록을 표시하고 선택하는 모달 컴포넌트
 */

import React from 'react';

interface SheetSelectionModalProps {
  isOpen: boolean;
  sheets: { id: string; name: string; }[];
  onClose: () => void;
  onSelect: (sheet: { id:string; name: string; }) => void;
}

const SheetSelectionModal: React.FC<SheetSelectionModalProps> = ({ isOpen, sheets, onClose, onSelect }) => {
  if (!isOpen) {
    return null;
  }

  return (
    <div style={styles.overlay}>
      <div style={styles.modal}>
        <div style={styles.header}>
          <h2>장부 선택</h2>
          <button onClick={onClose} style={styles.closeButton}>&times;</button>
        </div>
        <div style={styles.body}>
          {sheets.length > 0 ? (
            <ul style={styles.list}>
              {sheets.map(sheet => (
                <li key={sheet.id} onClick={() => onSelect(sheet)} style={styles.listItem}>
                  {sheet.name}
                </li>
              ))}
            </ul>
          ) : (
            <p>선택할 수 있는 장부가 없습니다.</p>
          )}
        </div>
      </div>
    </div>
  );
};

const styles: { [key: string]: React.CSSProperties } = {
  overlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  modal: {
    backgroundColor: 'white',
    padding: '20px',
    borderRadius: '8px',
    width: '400px',
    maxWidth: '90%',
    boxShadow: '0 2px 10px rgba(0, 0, 0, 0.1)',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottom: '1px solid #eee',
    paddingBottom: '10px',
    marginBottom: '10px',
  },
  closeButton: {
    border: 'none',
    background: 'none',
    fontSize: '24px',
    cursor: 'pointer',
  },
  body: {
    maxHeight: '300px',
    overflowY: 'auto',
  },
  list: {
    listStyle: 'none',
    padding: 0,
    margin: 0,
  },
  listItem: {
    padding: '10px',
    cursor: 'pointer',
    borderBottom: '1px solid #f0f0f0',
  }
};

export default SheetSelectionModal;
