import React from "react";
import "./InfoCard.css";

export interface Item {
  name: string;
  time?: string;
  url?: string;
}

interface InfoCardProps {
  title: string;
  subtitle: string;
  icon: string;
  backgroundColor: string;
  items: Item[];
  onItemClick?: (item: Item) => void;
}

const InfoCard: React.FC<InfoCardProps> = ({
  title,
  subtitle,
  icon,
  backgroundColor,
  items,
  onItemClick,
}) => {
  return (
    <div className="card document-card">
      <div className="card-header" style={{ backgroundColor }}>
        <div className="card-icon-container">
          <div className="card-icon">
            <div className={`icon ${icon}`}></div>
          </div>
        </div>
        <div className="card-title">{title}</div>
        <div className="card-subtitle">{subtitle}</div>
      </div>

      <div className="items-list">
        {items.map((item, index) => (
          <div 
            className="list-item" 
            key={index}
            onClick={() => onItemClick && item.url && onItemClick(item)}
            style={{ cursor: onItemClick && item.url ? 'pointer' : 'default' }}
          >
            <div className="item-info">
              <div className="item-name">{item.name}</div>
              {item.time && <div className="item-time">{item.time}</div>}
            </div>
            <div className="item-arrow">
              <div className="icon icon-chevron-right"></div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default InfoCard;
