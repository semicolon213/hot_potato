import React, { useRef } from 'react';
import { NodeViewWrapper } from '@tiptap/react';

const ResizableImageComponent = ({ node, updateAttributes, selected }) => {
  const imgRef = useRef<HTMLImageElement>(null);

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!imgRef.current) return;

    e.preventDefault();
    const handle = e.currentTarget;
    const startX = e.clientX;
    const startWidth = imgRef.current.offsetWidth;

    const handleMouseMove = (e: MouseEvent) => {
      const currentX = e.clientX;
      const diffX = currentX - startX;

      let newWidth = startWidth;

      if (handle.dataset.direction?.includes('right')) {
        newWidth = startWidth + diffX;
      }
      if (handle.dataset.direction?.includes('left')) {
        newWidth = startWidth - diffX;
      }
      
      updateAttributes({
        width: `${Math.max(20, newWidth)}px`, // min width 20px
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