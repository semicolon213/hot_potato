import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { TemplateCard } from './TemplateCard';
import type { Template } from '../../../hooks/features/templates/useTemplateUI';

interface Props {
    id: string;
    template: Template;
    onUse: ((type: string, title: string) => void) | ((template: Template) => void);
    onDelete: (rowIndex: number) => void;
    onDeleteTemplate?: (template: Template) => void; // 템플릿 삭제 함수 (기본/개인)
    onEdit?: (template: Template) => void; // Make optional
    onEditPersonal?: (template: Template) => void; // 개인 템플릿 수정 함수
    isFixed: boolean;
    defaultTags: string[];
    onToggleFavorite?: (template: Template) => void;
    isFavorite?: boolean;
    isAdmin?: boolean; // 관리자 여부
}

export function SortableTemplateCard({ id, template, onUse, onDelete, onDeleteTemplate, onEdit, onEditPersonal, isFixed, defaultTags, onToggleFavorite, isFavorite, isAdmin = false }: Props) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
    } = useSortable({ id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
    };

    return (
        <TemplateCard
            ref={setNodeRef}
            style={style}
            template={template}
            onUse={onUse}
            onDelete={onDelete}
            onDeleteTemplate={onDeleteTemplate}
            onEdit={onEdit}
            onEditPersonal={onEditPersonal}
            isFixed={isFixed}
            defaultTags={defaultTags}
            attributes={attributes}
            listeners={listeners}
            onToggleFavorite={onToggleFavorite}
            isFavorite={isFavorite}
            allowFormEdit={!!template.isPersonal}
            isAdmin={isAdmin}
        />
    );
}
