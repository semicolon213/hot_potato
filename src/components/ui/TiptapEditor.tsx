import React from 'react';
import { useEditor, EditorContent, ReactNodeViewRenderer } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';

import { TextStyle } from '@tiptap/extension-text-style';
import { Color } from '@tiptap/extension-color';
import { Image } from '@tiptap/extension-image';

import { FontSize } from './FontSize';
import './TiptapEditor.css';
import ResizableImageComponent from './ResizableImage';
import { CustomImage } from './CustomImage';

// CustomImage에 NodeView 추가
const CustomImageWithResize = CustomImage.extend({
  addNodeView() {
    return ReactNodeViewRenderer(ResizableImageComponent);
  },
});

const MenuBar = ({ editor }) => {
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  if (!editor) {
    return null;
  }

  const addImage = (event) => {
    const files = Array.from(event.target.files);
    files.forEach(file => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const src = e.target.result as string;
        // 이미지 로드 후 원본 크기 가져오기
        const img = document.createElement('img');
        img.onload = () => {
          // 원본 크기로 이미지 삽입 (최대 너비 800px로 제한)
          const maxWidth = 800;
          let width = img.naturalWidth;
          let height = img.naturalHeight;
          
          if (width > maxWidth) {
            const ratio = maxWidth / width;
            width = maxWidth;
            height = height * ratio;
          }
          
          editor.chain().focus().setImage({ 
            src,
            width: `${width}`,
            height: `${height}`
          }).run();
        };
        img.src = src;
      };
      reader.readAsDataURL(file);
    });
    event.target.value = ''; // Reset the input value
  };

  const handleImageButtonClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="toolbar">
      <button onClick={() => editor.chain().focus().toggleBold().run()} className={`toolbar-bold-button ${editor.isActive('bold') ? 'is-active' : ''}`}>
        굵게
      </button>
      <button onClick={() => editor.chain().focus().toggleUnderline().run()} className={`toolbar-underline-button ${editor.isActive('underline') ? 'is-active' : ''}`}>
          밑줄
      </button>
      <select className="toolbar-fontsize-select" onChange={(e) => editor.chain().focus().setFontSize(e.target.value).run()}>
        <option value="">글자 크기</option>
        <option value="12px">12px</option>
        <option value="14px">14px</option>
        <option value="16px">16px</option>
        <option value="20px">20px</option>
        <option value="24px">24px</option>
      </select>
      <input
        type="color"
        className="toolbar-color-input"
        onInput={event => editor.chain().focus().setColor(event.target.value).run()}
        value={editor.getAttributes('textStyle').color || '#000000'}
      />
      <button onClick={handleImageButtonClick} className="toolbar-image-button">이미지</button>
      <input type="file" accept="image/*" ref={fileInputRef} onChange={addImage} style={{ display: 'none' }} />
    </div>
  );
};

const TiptapEditor = ({ content, onContentChange }) => {
  const editor = useEditor({
                    extensions: [
                      StarterKit,
                      TextStyle,
                      Color,
                      CustomImageWithResize.configure({
                        inline: false,
                        allowBase64: true,
                      }),
                      FontSize,
                    ],    content: content,
    onUpdate: ({ editor }) => {
      onContentChange(editor.getHTML());
    },
  });

  return (
    <div className="tiptap-editor">
      <MenuBar editor={editor} />
      <EditorContent editor={editor} />
    </div>
  );
};

export default TiptapEditor;
