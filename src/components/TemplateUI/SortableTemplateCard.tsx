import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { TemplateCard } from './TemplateCard';
import type { Template } from '../../hooks/useTemplateUI';

interface Props {
    id: string;
    template: Template;
    onUse: (type: string, title: string) => void;
    onDelete: (rowIndex: number) => void;
    isFixed: boolean;
    defaultTags: string[];
}

export function SortableTemplateCard({ id, template, onUse, onDelete, isFixed, defaultTags }: Props) {
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
            isFixed={isFixed}
            defaultTags={defaultTags}
            attributes={attributes}
            listeners={listeners}
        />
    );
}
