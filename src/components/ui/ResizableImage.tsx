import React, { useRef, useEffect, useCallback } from 'react';
import { NodeViewWrapper } from '@tiptap/react';

const ResizableImageComponent = ({ node, updateAttributes, selected }) => {
  const imgRef = useRef<HTMLImageElement>(null);

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!imgRef.current) return;

    e.preventDefault();
    const handle = e.currentTarget;
    const startX = e.clientX;
    const startY = e.clientY;
    const startWidth = imgRef.current.offsetWidth;
    const startHeight = imgRef.current.offsetHeight;

    const handleMouseMove = (e: MouseEvent) => {
      const direction = handle.dataset.direction;
      const ratio = startWidth / startHeight;

      let newWidth = startWidth;
      let newHeight = startHeight;

      switch (direction) {
        case 'left':
          newWidth = startWidth - (e.clientX - startX);
          break;
        case 'right':
          newWidth = startWidth + (e.clientX - startX);
          break;
        case 'top':
          newHeight = startHeight - (e.clientY - startY);
          break;
        case 'bottom':
          newHeight = startHeight + (e.clientY - startY);
          break;
        case 'top-left':
          newWidth = startWidth - (e.clientX - startX);
          newHeight = newWidth / ratio;
          break;
        case 'top-right':
          newWidth = startWidth + (e.clientX - startX);
          newHeight = newWidth / ratio;
          break;
        case 'bottom-left':
          newWidth = startWidth - (e.clientX - startX);
          newHeight = newWidth / ratio;
          break;
        case 'bottom-right':
          newWidth = startWidth + (e.clientX - startX);
          newHeight = newWidth / ratio;
          break;
      }

      updateAttributes({
        width: `${Math.max(20, newWidth)}px`,
        height: `${Math.max(20, newHeight)}px`,
      });
    };

    const handleMouseUp = () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
  };

  return (
    <NodeViewWrapper className={`resizable-image-wrapper ${selected ? 'selected' : ''}`}>
      <img
        ref={imgRef}
        src={node.attrs.src}
        style={{
          width: node.attrs.width,
          height: node.attrs.height,
        }}
      />
      {selected && (
        <>
          <div className="resize-handle" data-direction="top-left" onMouseDown={handleMouseDown}></div>
          <div className="resize-handle" data-direction="top" onMouseDown={handleMouseDown}></div>
          <div className="resize-handle" data-direction="top-right" onMouseDown={handleMouseDown}></div>
          <div className="resize-handle" data-direction="left" onMouseDown={handleMouseDown}></div>
          <div className="resize-handle" data-direction="right" onMouseDown={handleMouseDown}></div>
          <div className="resize-handle" data-direction="bottom-left" onMouseDown={handleMouseDown}></div>
          <div className="resize-handle" data-direction="bottom" onMouseDown={handleMouseDown}></div>
          <div className="resize-handle" data-direction="bottom-right" onMouseDown={handleMouseDown}></div>
        </>
      )}
    </NodeViewWrapper>
  );
};

export default ResizableImageComponent;