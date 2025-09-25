import React from "react";
import "./StatCard.css";

interface StatCardProps {
  count: number;
  title: string;
  backgroundColor: string;
  textColor: string;
}

const StatCard: React.FC<StatCardProps> = ({ count, title, backgroundColor, textColor }) => {
  return (
    <div className="stat-card" style={{ backgroundColor }}>
      <div className="stat-count" style={{ color: textColor }}>
        {count}
      </div>
      <div className="stat-title" style={{ color: textColor }}>
        {title}
      </div>
    </div>
  );
};

export default StatCard;
