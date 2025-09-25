import React from 'react';

interface ListItem {
  id: string;
  text: string;
  link?: string;
}

interface GenericWidgetProps {
  content?: string;
  items?: ListItem[];
}

const GenericWidget: React.FC<GenericWidgetProps> = ({ content, items }) => {
  if (content) {
    return <p>{content}</p>;
  }

  if (items) {
    return (
      <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
        {items.map(item => (
          <li key={item.id} style={{ marginBottom: '8px' }}>
            {item.link ? <a href={item.link} style={{ textDecoration: 'none', color: 'inherit' }}>{item.text}</a> : item.text}
          </li>
        ))}
      </ul>
    );
  }

  return <p>위젯 콘텐츠를 로드할 수 없습니다.</p>;
};

export default GenericWidget;
