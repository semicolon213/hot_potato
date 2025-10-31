/**
 * WorkflowEditor.tsx
 * 워크플로우 결재 문서 편집기
 * react-quilljs를 사용한 WYSIWYG 에디터
 */

import React, { useMemo } from 'react';
import { useQuill } from 'react-quilljs';
import 'quill/dist/quill.snow.css';
import './WorkflowEditor.css';

interface WorkflowEditorProps {
  value?: string;
  onChange?: (content: string) => void;
  placeholder?: string;
  readOnly?: boolean;
}

const WorkflowEditor: React.FC<WorkflowEditorProps> = ({
  value = '',
  onChange,
  placeholder = '결재 문서 내용을 입력하세요...',
  readOnly = false
}) => {
  const modules = useMemo(() => ({
    toolbar: [
      [{ 'header': [1, 2, 3, false] }],
      ['bold', 'italic', 'underline', 'strike'],
      [{ 'list': 'ordered'}, { 'list': 'bullet' }],
      [{ 'color': [] }, { 'background': [] }],
      ['link'],
      ['clean']
    ]
  }), []);

  const formats = [
    'header',
    'bold',
    'italic',
    'underline',
    'strike',
    'list',
    'bullet',
    'color',
    'background',
    'link'
  ];

  const { quill, quillRef } = useQuill({
    modules,
    formats,
    placeholder,
    readOnly
  });

  React.useEffect(() => {
    if (quill && value !== undefined) {
      const currentContent = quill.root.innerHTML;
      if (currentContent !== value) {
        quill.clipboard.dangerouslyPasteHTML(value);
      }
    }
  }, [quill, value]);

  React.useEffect(() => {
    if (quill && onChange) {
      const handler = () => {
        const content = quill.root.innerHTML;
        onChange(content);
      };
      
      quill.on('text-change', handler);
      
      return () => {
        quill.off('text-change', handler);
      };
    }
  }, [quill, onChange]);

  return (
    <div className="workflow-editor-container">
      <div ref={quillRef} className="workflow-editor" />
    </div>
  );
};

export default WorkflowEditor;

