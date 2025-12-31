import TaskMenu from './TaskMenu'
import YouTubePreview from '../ui/YouTubePreview'

interface TaskCardProps {
    task: {
        id: string
        title: string
        description: string | null
        metadata: {
            video_url?: string
            duration?: number
            notes?: string
            style?: {
                color?: string
                border?: string
            }
            is_group?: boolean
        }
        due_time: string | null
        is_completed: boolean
        task_types?: {
            name: string
            slug: string
            icon: string | null
        } | null
        subjects?: {
            name: string
            icon: string | null
            color: string
        } | null
        topics?: {
            name: string
        } | null
        created_by?: string
        parent_id?: string | null
        children?: any[]
    }
    onComplete: () => void
    onUncomplete: () => void
    onEdit: () => void
    onDelete: () => void
    onStyle?: () => void
    dragAttributes?: any
    dragListeners?: any
    userId?: string
    onAction?: (taskId: string, action: string, data?: any) => void
    isBeingHovered?: boolean
    dropIndicator?: 'none' | 'top' | 'bottom'
    children?: React.ReactNode
}

// Helper to find YouTube URL in text
const findYouTubeUrl = (text: string | null | undefined) => {
    if (!text) return null
    const regExp = /(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/(?:[^\/\n\s]+\/\S+\/|(?:v|e(?:mbed)?)\/|\S*?[?&]v=)|youtu\.be\/)([a-zA-Z0-9_-]{11})/
    const match = text.match(regExp)
    return match ? match[0] : null
}

export default function TaskCard({
    task,
    onComplete,
    onUncomplete,
    onEdit,
    onDelete,
    onStyle,
    dragAttributes,
    dragListeners,
    userId,
    onAction,
    children,
    isBeingHovered,
    dropIndicator = 'none'
}: TaskCardProps) {
    const { task_types, title, description, metadata, due_time, is_completed, created_by } = task
    const childrenData = task.children

    const canModify = !userId || created_by === userId
    const isActuallyGroup = metadata?.is_group === true || (childrenData && childrenData.length > 0)
    const isEmptyGroup = metadata?.is_group === true && (!childrenData || childrenData.length === 0)

    // Determine video URL source order: metadata.video_url > description > notes
    const videoUrl = metadata.video_url || findYouTubeUrl(description) || findYouTubeUrl(metadata.notes)

    const getIcon = () => {
        if (isActuallyGroup) {
            return (
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                </svg>
            )
        }
        if (!task_types) return null
        switch (task_types.slug) {
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
                return null
        }
    }

    const getStyleClasses = () => {
        const s = task.metadata?.style
        const color = s?.color || 'white'
        const border = s?.border || 'solid'

        let classes = 'transition-all duration-300 transform hover:scale-[1.01] '

        // Colors - using more premium shades
        switch (color) {
            case 'red': classes += 'bg-red-50/50 border-red-100 ring-1 ring-red-200/20'; break;
            case 'green': classes += 'bg-emerald-50/50 border-emerald-100 ring-1 ring-emerald-200/20'; break;
            case 'blue': classes += 'bg-blue-50/50 border-blue-100 ring-1 ring-blue-200/20'; break;
            case 'yellow': classes += 'bg-amber-50/50 border-amber-100 ring-1 ring-amber-200/20'; break;
            case 'purple': classes += 'bg-purple-50/50 border-purple-100 ring-1 ring-purple-200/20'; break;
            default: classes += 'bg-white border-gray-100 shadow-sm hover:shadow-md';
        }

        // Border Style
        if (border === 'dashed') classes += ' border-dashed'
        if (border === 'thick') classes += ' border-l-4 border-l-indigo-500'

        return classes
    }

    return (
        <div className="relative">
            {dropIndicator === 'top' && (
                <div className="absolute -top-1 left-0 right-0 h-0.5 bg-indigo-500 border-t-2 border-dashed border-indigo-400 z-10 animate-pulse" />
            )}

            <div className={`
                ${getStyleClasses()} 
                rounded-2xl 
                ${isActuallyGroup ? 'p-3' : (task.parent_id ? 'p-2.5 px-0' : 'p-4')} 
                border relative transition-all duration-200
                ${isBeingHovered ? 'ring-2 ring-indigo-500 shadow-lg scale-[1.02] bg-indigo-50/10' : ''}
                ${is_completed ? 'opacity-60 grayscale-[0.5]' : ''}
                ${isActuallyGroup ? 'border-2 border-indigo-200/50 bg-indigo-50/5 shadow-md' : ''}
                ${task.parent_id ? 'border-none shadow-none bg-transparent hover:scale-100' : ''}
            `}>
                <div className="flex items-start gap-4">
                    {/* Left Side: Icon Handle */}
                    <div className="flex items-center mt-1 shrink-0">
                        <div
                            {...dragAttributes}
                            {...dragListeners}
                            className={`cursor-grab active:cursor-grabbing p-1.5 -m-1.5 rounded-lg hover:bg-white/80 transition-colors shadow-sm bg-white border border-gray-100 ${task?.task_types?.slug === 'video' ? 'text-red-500' : 'text-indigo-600'}`}
                            title="Sıralamak için sürükleyin"
                        >
                            {getIcon()}
                        </div>
                    </div>

                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1.5">
                            <span className="text-[9px] font-black tracking-widest text-gray-400 uppercase">
                                {isActuallyGroup ? title : (task?.task_types?.name || 'GENEL')}
                            </span>
                            {due_time && (
                                <span className="flex items-center gap-1 text-[11px] font-bold text-indigo-500 bg-indigo-50 px-2 py-0.5 rounded-full">
                                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                    {due_time.slice(0, 5)}
                                </span>
                            )}
                        </div>

                        <h3 className={`text-sm font-semibold text-gray-900 leading-tight mb-0.5 ${is_completed ? 'line-through text-gray-400' : ''}`}>
                            {!isActuallyGroup && title}
                        </h3>

                        {description && (
                            <p className="text-[10px] text-gray-400 leading-tight mb-2 line-clamp-2">{description}</p>
                        )}

                        <div className="flex items-center gap-4">
                            {!videoUrl && metadata.video_url && (
                                <a
                                    href={metadata.video_url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center gap-1.5 text-xs font-bold text-blue-600 hover:text-blue-700 transition"
                                >
                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                    </svg>
                                    Kaynağa Git
                                </a>
                            )}

                            {metadata.duration && (
                                <span className="flex items-center gap-1.5 text-xs font-bold text-gray-400">
                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                                    </svg>
                                    {metadata.duration} dk
                                </span>
                            )}
                        </div>

                        {/* YouTube Preview - Correct Single Placement */}
                        {videoUrl && (
                            <div className="mt-3 rounded-xl overflow-hidden shadow-inner bg-gray-50 border border-gray-100">
                                <YouTubePreview url={videoUrl} />
                            </div>
                        )}
                    </div>

                    <div className="flex flex-col items-center gap-3 shrink-0 self-stretch justify-between">
                        <TaskMenu
                            taskId={task.id}
                            isCompleted={is_completed}
                            onEdit={canModify ? onEdit : undefined}
                            onDelete={canModify ? onDelete : undefined}
                            onUncomplete={onUncomplete}
                            onStyle={onStyle}
                        />
                        {!isActuallyGroup && (
                            <button
                                onClick={is_completed ? onUncomplete : onComplete}
                                className={`w-8 h-8 rounded-xl border-2 flex items-center justify-center transition-all duration-300 ${is_completed
                                    ? 'bg-green-500 border-green-500 text-white shadow-lg shadow-green-200'
                                    : 'bg-white border-gray-100 text-transparent hover:border-indigo-400 hover:text-indigo-200'
                                    }`}
                            >
                                <svg className="w-5 h-5 transition-transform duration-300"
                                    fill="none" viewBox="0 0 24 24" stroke="currentColor"
                                    style={{ transform: is_completed ? 'scale(1)' : 'scale(0.5)' }}>
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                </svg>
                            </button>
                        )}
                    </div>
                </div>

                {/* Hierarchical Children (Grouping) - Full width below main content */}
                {isActuallyGroup && children && (
                    <div className="mt-3 space-y-1 pb-1">
                        {children}
                    </div>
                )}

                {isEmptyGroup && (
                    <div className="mt-4 border-2 border-dashed border-gray-200 rounded-xl p-6 flex flex-col items-center justify-center text-gray-400 gap-2 bg-gray-50/50">
                        <svg className="w-8 h-8 opacity-20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                        </svg>
                        <span className="text-xs font-medium italic">Görevleri buraya bırakın</span>
                    </div>
                )}

                {dropIndicator === 'bottom' && (
                    <div className="absolute -bottom-1 left-0 right-0 h-0.5 bg-indigo-500 border-t-2 border-dashed border-indigo-400 z-10 animate-pulse" />
                )}
            </div>
        </div>
    )
}
