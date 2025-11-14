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
        width: `${Math.max(20, newWidth)}`,
        height: `${Math.max(20, newHeight)}`,
      });
    };

    const handleMouseUp = () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
  };

  // 이미지 로드 후 초기 크기 설정
  useEffect(() => {
    if (imgRef.current && !node.attrs.width && !node.attrs.height) {
      const img = imgRef.current;
      
      // 이미 로드된 이미지인 경우
      if (img.complete && img.naturalWidth > 0) {
        const maxWidth = 800;
        let width = img.naturalWidth;
        let height = img.naturalHeight;
        
        if (width > maxWidth) {
          const ratio = maxWidth / width;
          width = maxWidth;
          height = height * ratio;
        }
        
        updateAttributes({
          width: `${width}`,
          height: `${height}`
        });
      } else {
        // 아직 로드되지 않은 이미지인 경우
        img.onload = () => {
          const maxWidth = 800;
          let width = img.naturalWidth;
          let height = img.naturalHeight;
          
          if (width > maxWidth) {
            const ratio = maxWidth / width;
            width = maxWidth;
            height = height * ratio;
          }
          
          updateAttributes({
            width: `${width}`,
            height: `${height}`
          });
        };
      }
    }
  }, [node.attrs.src, node.attrs.width, node.attrs.height, updateAttributes]);

  return (
    <NodeViewWrapper 
      className={`resizable-image-wrapper ${selected ? 'selected' : ''}`}
      style={{
        display: 'inline-block',
        position: 'relative',
      }}
    >
      <img
        ref={imgRef}
        src={node.attrs.src}
        alt=""
        style={{
          width: node.attrs.width ? `${node.attrs.width}px` : 'auto',
          height: node.attrs.height ? `${node.attrs.height}px` : 'auto',
          display: 'block',
          userSelect: 'none',
          margin: 0,
          padding: 0,
        }}
        draggable={false}
      />
      {selected && (
        <>
          <div className="resize-handle" data-direction="top-left" onMouseDown={handleMouseDown} style={{ top: '-6px', left: '-6px' }}></div>
          <div className="resize-handle" data-direction="top" onMouseDown={handleMouseDown} style={{ top: '-6px', left: '50%', transform: 'translateX(-50%)' }}></div>
          <div className="resize-handle" data-direction="top-right" onMouseDown={handleMouseDown} style={{ top: '-6px', right: '-6px' }}></div>
          <div className="resize-handle" data-direction="left" onMouseDown={handleMouseDown} style={{ top: '50%', left: '-6px', transform: 'translateY(-50%)' }}></div>
          <div className="resize-handle" data-direction="right" onMouseDown={handleMouseDown} style={{ top: '50%', right: '-6px', transform: 'translateY(-50%)' }}></div>
          <div className="resize-handle" data-direction="bottom-left" onMouseDown={handleMouseDown} style={{ bottom: '-6px', left: '-6px' }}></div>
          <div className="resize-handle" data-direction="bottom" onMouseDown={handleMouseDown} style={{ bottom: '-6px', left: '50%', transform: 'translateX(-50%)' }}></div>
          <div className="resize-handle" data-direction="bottom-right" onMouseDown={handleMouseDown} style={{ bottom: '-6px', right: '-6px' }}></div>
        </>
      )}
    </NodeViewWrapper>
  );
};

export default ResizableImageComponent;