// src/pages/Ddd/hooks/useWidgetManager.ts
import { useState, useEffect, useRef } from 'react';
import { widgetOptions } from '../constants/widgetOptions';

export interface Widget {
  id: string;
  type: string;
  title: string;
  icon: string;
  order: number;
}

export const useWidgetManager = () => {
  const [widgets, setWidgets] = useState<Widget[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    const savedWidgets = localStorage.getItem('dashboardWidgets');
    if (savedWidgets) {
      setWidgets(JSON.parse(savedWidgets));
    } else {
      setWidgets([{ id: 'welcome-1', type: 'welcome', title: '환영합니다', icon: 'fas fa-door-open', order: 0 }]);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('dashboardWidgets', JSON.stringify(widgets));
  }, [widgets]);

  const handleAddWidget = (widgetType: string) => {
    const option = widgetOptions.find(opt => opt.type === widgetType);
    if (option) {
      if (option.type !== 'welcome' && widgets.some(w => w.type === widgetType)) {
        alert('이미 추가된 위젯입니다.');
        return;
      }
      
      const newWidget: Widget = {
        id: `${widgetType}-${Date.now()}`,
        type: option.type,
        title: option.title,
        icon: option.icon,
        order: widgets.length,
      };
      setWidgets(prev => [...prev, newWidget]);
      setIsModalOpen(false);
    }
  };

  const handleRemoveWidget = (id: string) => {
    setWidgets(prev => prev.filter(widget => widget.id !== id));
  };

  const dragItem = useRef<number | null>(null);
  const dragOverItem = useRef<number | null>(null);

  const handleDragStart = (e: React.DragEvent<HTMLDivElement>, index: number) => {
    dragItem.current = index;
    e.currentTarget.classList.add('dragging');
  };

  const handleDragEnter = (e: React.DragEvent<HTMLDivElement>, index: number) => {
    dragOverItem.current = index;
    e.currentTarget.classList.add('dragOver');
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.currentTarget.classList.remove('dragOver');
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.currentTarget.classList.remove('dragOver');
    e.currentTarget.classList.remove('dragging');

    if (dragItem.current === null || dragOverItem.current === null) return;

    const widgetsCopy = [...widgets];
    const draggedItemContent = widgetsCopy[dragItem.current];

    if (dragItem.current === dragOverItem.current) {
        dragItem.current = null;
        dragOverItem.current = null;
        return;
    }

    widgetsCopy.splice(dragItem.current, 1);
    widgetsCopy.splice(dragOverItem.current, 0, draggedItemContent);

    setWidgets(widgetsCopy);
    dragItem.current = null;
    dragOverItem.current = null;
  };

  const handleDragEnd = (e: React.DragEvent<HTMLDivElement>) => {
    e.currentTarget.classList.remove('dragging');
    document.querySelectorAll('.dragOver').forEach(el => el.classList.remove('dragOver'));
    dragItem.current = null;
    dragOverItem.current = null;
  };

  return {
    widgets,
    isModalOpen,
    setIsModalOpen,
    handleAddWidget,
    handleRemoveWidget,
    handleDragStart,
    handleDragEnter,
    handleDragLeave,
    handleDrop,
    handleDragEnd,
  };
};
