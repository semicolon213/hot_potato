import React, { useMemo, useCallback } from 'react';
import { createEditor, Editor, Transforms, Text } from 'slate';
import { Slate, Editable, withReact, ReactEditor } from 'slate-react';
import { withHistory } from 'slate-history';
import './RichTextEditor.css';

const RichTextEditor = ({ value, onChange }) => {
  const editor = useMemo(() => withHistory(withReact(createEditor())), []);

  const renderElement = useCallback(props => {
    switch (props.element.type) {
      case 'image':
        return <img src={props.element.url} alt="" {...props.attributes} style={{ maxWidth: '100%' }}/>;
      case 'paragraph':
      default:
        return <p {...props.attributes}>{props.children}</p>;
    }
  }, []);

  const renderLeaf = useCallback(props => {
    let children = props.children;
    if (props.leaf.bold) {
      children = <strong>{children}</strong>;
    }
    if (props.leaf.underline) {
      children = <u>{children}</u>;
    }
    if (props.leaf.fontSize) {
      children = <span style={{ fontSize: props.leaf.fontSize }}>{children}</span>;
    }
    if (props.leaf.color) {
      children = <span style={{ color: props.leaf.color }}>{children}</span>;
    }
    return <span {...props.attributes}>{children}</span>;
  }, []);

  return (
    <div className="rich-text-editor">
      <Slate editor={editor} initialValue={value} onChange={onChange}>
        <div className="toolbar">
          <ToolButton format="bold" icon="B" editor={editor} />
          <ToolButton format="underline" icon="U" editor={editor} />
          <FontSizeSelect editor={editor} />
          <ColorSelect editor={editor} />
          <ImageButton editor={editor} />
        </div>
        <Editable
          className="editable-area"
          renderElement={renderElement}
          renderLeaf={renderLeaf}
          placeholder="내용을 입력하세요..."
        />
      </Slate>
    </div>
  );
};

const isMarkActive = (editor, format) => {
  const marks = Editor.marks(editor);
  return marks ? marks[format] === true : false;
};

const toggleMark = (editor, format) => {
  const isActive = isMarkActive(editor, format);
  if (isActive) {
    Editor.removeMark(editor, format);
  } else {
    Editor.addMark(editor, format, true);
  }
};

const ToolButton = ({ format, icon, editor }) => (
  <button
    className={isMarkActive(editor, format) ? 'active' : ''}
    onMouseDown={event => {
      event.preventDefault();
      toggleMark(editor, format);
    }}
  >
    {icon}
  </button>
);

const FONT_SIZES = ['12px', '14px', '16px', '18px', '24px', '32px'];
const FontSizeSelect = ({ editor }) => (
  <select onChange={e => {
    e.preventDefault();
    Editor.addMark(editor, 'fontSize', e.target.value);
  }}>
    <option value="">크기</option>
    {FONT_SIZES.map(size => (
      <option key={size} value={size}>{size}</option>
    ))}
  </select>
);

const COLORS = ['#000000', '#e60000', '#ff9900', '#ffff00', '#008a00', '#0066cc', '#9933ff'];
const ColorSelect = ({ editor }) => (
  <select onChange={e => {
    e.preventDefault();
    Editor.addMark(editor, 'color', e.target.value);
  }}>
    <option value="">색상</option>
    {COLORS.map(color => (
      <option key={color} value={color} style={{ color }}>{color}</option>
    ))}
  </select>
);

const ImageButton = ({ editor }) => {
  const imageInput = React.useRef<HTMLInputElement>(null);

  const handleImageUpload = (event) => {
    const file = event.target.files[0];
    const reader = new FileReader();
    reader.onload = () => {
      const url = reader.result as string;
      const imageNode = { type: 'image', url, children: [{ text: '' }] };
      Transforms.insertNodes(editor, imageNode);
    };
    reader.readAsDataURL(file);
  };

  return (
    <>
      <button onMouseDown={event => {
        event.preventDefault();
        imageInput.current?.click();
      }}>
        이미지
      </button>
      <input type="file" ref={imageInput} onChange={handleImageUpload} style={{ display: 'none' }} accept="image/*" />
    </>
  );
};

export default RichTextEditor;
