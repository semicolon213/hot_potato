import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { TemplateCard } from './TemplateCard';
import type { Template } from '../../../../hooks/features/templates/useTemplateUI';

interface Props {
    id: string;
    template: Template;
    onUse: (type: string, title: string) => void;
    onDelete: (rowIndex: number) => void;
    onEdit?: (template: Template) => void; // Make optional
    isFixed: boolean;
    defaultTags: string[];
    onToggleFavorite?: (template: Template) => void;
    isFavorite?: boolean;
}

export function SortableTemplateCard({ id, template, onUse, onDelete, onEdit, isFixed, defaultTags, onToggleFavorite, isFavorite }: Props) {
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
            onEdit={onEdit}
            isFixed={isFixed}
            defaultTags={defaultTags}
            attributes={attributes}
            listeners={listeners}
            onToggleFavorite={onToggleFavorite}
            isFavorite={isFavorite}
        />
    );
}
