import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import TaskMenu from './TaskMenu'
import YouTubePreview from '../ui/YouTubePreview'

// Helper to find YouTube URL in text
const findYouTubeUrl = (text: string | null | undefined) => {
    if (!text) return null
    const regExp = /(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/(?:[^\/\n\s]+\/\S+\/|(?:v|e(?:mbed)?)\/|\S*?[?&]v=)|youtu\.be\/)([a-zA-Z0-9_-]{11})/
    const match = text.match(regExp)
    return match ? match[0] : null
}

interface WeeklyTaskCardProps {
    task: any
    onEdit: () => void
    onDelete: () => void
    onComplete: () => void
    onUncomplete: () => void
    onStyle?: () => void
    isOverlay?: boolean
    userId?: string
}

export default function WeeklyTaskCard({
    task,
    onEdit,
    onDelete,
    onComplete,
    onUncomplete,
    onStyle,
    isOverlay = false,
    userId
}: WeeklyTaskCardProps) {

    // Permission Logic:
    // If we are in student mode (implied by context if we are checking permissions like this):
    // - User can edit if they created it (created_by === userId)
    // - User can edit if there is no restriction logic applied (default)
    // - BUT here we strictly want: if created_by != userId (assigned by coach), NO EDIT.
    // However, we need to be careful about 'userId' prop.
    // In WeeklyView, 'userId' is the id of the user whose board we are viewing.
    // If I am the student viewing my board, userId is ME.
    // If task.created_by is ME, I made it.
    // If task.created_by is COACH, I didn't make it.

    // If userId is NOT provided (older usage?), default to allow? Or maybe we should allow all for now if unsure.
    // But the request is specific.
    // Let's assume userId is passed.

    const canModify = !userId || task.created_by === userId

    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id: task.id })

    // Determine video URL source order: metadata.video_url > description > notes
    const videoUrl = task.metadata?.video_url || findYouTubeUrl(task.description) || findYouTubeUrl(task.metadata?.notes)

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0 : 1,
        zIndex: isOverlay ? 1000 : undefined,
    }

    const getTaskIcon = () => {
        switch (task.task_types?.slug) {
            case 'video':
                return (
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" />
                    </svg>
                )
            case 'todo':
                return (
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                )
            default:
                return <span className="text-lg">{task.task_types?.icon || '📝'}</span>
        }
    }

    const getStyleClasses = () => {
        const s = task.metadata?.style
        const color = s?.color || 'white'
        const border = s?.border || 'solid'

        let classes = ''

        // Colors
        switch (color) {
            case 'red': classes = 'bg-red-50 border-red-200'; break;
            case 'green': classes = 'bg-emerald-50 border-emerald-200'; break;
            case 'blue': classes = 'bg-blue-50 border-blue-200'; break;
            case 'yellow': classes = 'bg-amber-50 border-amber-200'; break;
            case 'purple': classes = 'bg-purple-50 border-purple-200'; break;
            default: classes = 'bg-white border-gray-200';
        }

        // Border Style
        if (border === 'dashed') classes += ' border-dashed'
        if (border === 'thick') classes += ' border-l-4'

        return classes
    }

    return (
        <div
            ref={isOverlay ? undefined : setNodeRef}
            style={isOverlay ? undefined : style}
            className={`${getStyleClasses()} rounded-xl p-3 shadow-sm border hover:shadow-md transition group ${task.is_completed ? 'opacity-60' : ''} ${isOverlay ? 'shadow-xl ring-2 ring-indigo-400 rotate-2 cursor-grabbing pointer-events-none' : ''
                }`}
        >
            <div className="flex items-start gap-3">
                {/* Left Side: Icon Handle */}
                <div className="flex items-center mt-0.5 shrink-0">
                    <div
                        {...attributes}
                        {...listeners}
                        className={`cursor-grab active:cursor-grabbing p-1 -m-1 rounded hover:bg-gray-50 transition-colors ${task.task_types?.slug === 'video' ? 'text-red-600' : 'text-indigo-600'}`}
                        title="Sıralamak için sürükleyin"
                    >
                        {getTaskIcon()}
                    </div>
                </div>

                {/* Main Content */}
                <div
                    onClick={onEdit}
                    className="flex-1 min-w-0 cursor-pointer"
                >
                    {/* Subject/Topic Badge */}
                    {task.subjects && (
                        <div className="flex items-center gap-2 mb-1">
                            <span
                                className="inline-flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded"
                                style={{ backgroundColor: `${task.subjects.color}15`, color: task.subjects.color }}
                            >
                                {task.subjects.icon} {task.subjects.name}
                            </span>
                            {task.topics && (
                                <span className="text-[10px] text-gray-400">
                                    › {task.topics.name}
                                </span>
                            )}
                        </div>
                    )}

                    <h4 className={`font-medium text-sm leading-tight ${task.is_completed ? 'line-through text-gray-400' : 'text-gray-900'}`}>
                        {task.title}
                    </h4>

                    {task.description && (
                        <p className="text-xs text-gray-600 mt-1 line-clamp-2">{task.description}</p>
                    )}

                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                        {/* Time */}
                        {task.due_time && (
                            <div className="text-xs text-indigo-400 font-medium flex items-center gap-1">
                                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                {task.due_time.slice(0, 5)}
                            </div>
                        )}

                        {/* Duration */}
                        {task.metadata?.duration && (
                            <span className="flex items-center gap-1 text-[10px] text-gray-500 bg-gray-50 px-1.5 py-0.5 rounded">
                                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                {task.metadata.duration} dk
                            </span>
                        )}

                        {/* Video Link Indicator */}
                        {!videoUrl && task.metadata?.video_url && (
                            <a
                                href={task.metadata.video_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                onClick={(e) => e.stopPropagation()}
                                className="flex items-center gap-1 text-[10px] text-blue-600 hover:text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded"
                            >
                                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                </svg>
                                Video
                            </a>
                        )}
                    </div>

                    {/* YouTube Preview */}
                    {videoUrl && (
                        <div className="mt-2" onClick={(e) => e.stopPropagation()}>
                            <YouTubePreview url={videoUrl} />
                        </div>
                    )}
                </div>

                {/* Right Side: Toggle Button */}
                <div className="flex flex-col items-center gap-2 shrink-0">
                    <TaskMenu
                        taskId={task.id}
                        isCompleted={task.is_completed}
                        onEdit={canModify ? onEdit : undefined}
                        onDelete={canModify ? onDelete : undefined}
                        onUncomplete={onUncomplete}
                        onStyle={onStyle}
                    />
                    <button
                        onClick={(e) => {
                            e.stopPropagation()
                            task.is_completed ? onUncomplete() : onComplete()
                        }}
                        className={`w-6 h-6 rounded-full border flex items-center justify-center transition-all ${task.is_completed
                            ? 'bg-green-500 border-green-500 text-white'
                            : 'border-gray-300 text-transparent hover:border-green-500 hover:text-green-500'
                            }`}
                    >
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                    </button>
                </div>
            </div>
        </div>
    )
}
