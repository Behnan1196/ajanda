import { useDraggable } from '@dnd-kit/core'
import { CSS } from '@dnd-kit/utilities'

interface DraggableSpecializedSummaryProps {
    id: string
    type: 'nutrition' | 'music'
    children: React.ReactNode
    disabled?: boolean
}

export default function DraggableSpecializedSummary({ id, type, children, disabled = false }: DraggableSpecializedSummaryProps) {
    const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
        id: id,
        data: {
            type: 'specialized-group',
            groupType: type
        },
        disabled
    })

    const style = {
        transform: CSS.Translate.toString(transform),
        opacity: isDragging ? 0.3 : 1,
        touchAction: 'none',
        zIndex: isDragging ? 50 : undefined
    }

    return (
        <div ref={setNodeRef} style={style} {...listeners} {...attributes} className="cursor-grab active:cursor-grabbing">
            {children}
        </div>
    )
}
