import React from "react";
import "./StatCard.css";

interface StatCardProps {
  count: number;
  title: string;
  backgroundColor: string;
  textColor: string;
  icon?: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  iconColor?: string;
  onClick?: () => void;
  isSelected?: boolean;
  uploadIcon?: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  onUploadClick?: (e: React.MouseEvent) => void;
}

const StatCard: React.FC<StatCardProps> = ({ count, title, backgroundColor, textColor, icon: Icon, iconColor, onClick, isSelected, uploadIcon: UploadIcon, onUploadClick }) => {
  return (
    <div 
      className="stat-card"
      style={{ backgroundColor }}
      onClick={onClick}
    >
      <div className="stat-header">
        {Icon && (
          <div className="stat-icon" style={{ color: iconColor || '#333333' }}>
            <Icon />
          </div>
        )}
        <div className="stat-title" style={{ color: textColor }}>
          {title}
        </div>
        {UploadIcon && onUploadClick && (
          <button
            className="stat-upload-icon-btn"
            onClick={(e) => {
              e.stopPropagation();
              onUploadClick(e);
            }}
            title="문서 업로드"
          >
            <UploadIcon />
          </button>
        )}
      </div>
      <div className="stat-count" style={{ color: textColor }}>
        {count.toLocaleString()}
      </div>
    </div>
  );
};

export default StatCard;
