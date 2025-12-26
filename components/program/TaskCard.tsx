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
        }
        due_time: string | null
        is_completed: boolean
        task_types: {
            name: string
            slug: string
            icon: string | null
        }
        subjects?: {
            name: string
            icon: string | null
            color: string
        } | null
        topics?: {
            name: string
        } | null
    }
    onComplete: () => void
    onUncomplete: () => void
    onEdit: () => void
    onDelete: () => void
    dragAttributes?: any
    dragListeners?: any
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
    dragAttributes,
    dragListeners
}: TaskCardProps) {
    const { task_types, title, description, metadata, due_time, is_completed } = task

    // Determine video URL source order: metadata.video_url > description > notes
    const videoUrl = metadata.video_url || findYouTubeUrl(description) || findYouTubeUrl(metadata.notes)

    const getIcon = () => {
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

    return (
        <div className={`bg-white rounded-xl p-4 shadow-sm border border-gray-200 transition ${is_completed ? 'opacity-60' : ''}`}>
            <div className="flex items-start gap-3">
                {/* Left Side: Icon Handle */}
                <div className="flex items-center mt-0.5 shrink-0">
                    <div
                        {...dragAttributes}
                        {...dragListeners}
                        className={`cursor-grab active:cursor-grabbing p-1 -m-1 rounded hover:bg-gray-50 transition-colors ${task_types.slug === 'video' ? 'text-red-600' : 'text-indigo-600'}`}
                        title="Sıralamak için sürükleyin"
                    >
                        {getIcon()}
                    </div>
                </div>

                <div className="flex-1 min-w-0">
                    {/* Subject/Topic Badge */}
                    {task.subjects && (
                        <div className="flex items-center gap-2 mb-2">
                            <span
                                className="inline-flex items-center gap-1 text-xs font-medium px-2 py-1 rounded"
                                style={{ backgroundColor: `${task.subjects.color}15`, color: task.subjects.color }}
                            >
                                {task.subjects.icon} {task.subjects.name}
                            </span>
                            {task.topics && (
                                <span className="text-xs text-gray-500">
                                    › {task.topics.name}
                                </span>
                            )}
                        </div>
                    )}

                    <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-medium text-gray-500 uppercase">
                            {task_types.name}
                        </span>
                        {due_time && (
                            <span className="text-xs text-gray-400">
                                {due_time.slice(0, 5)}
                            </span>
                        )}
                    </div>

                    <h3 className={`font-semibold text-gray-900 mb-1 ${is_completed ? 'line-through' : ''}`}>
                        {title}
                    </h3>

                    {description && (
                        <p className="text-sm text-gray-600 mb-2">{description}</p>
                    )}

                    <div className="flex items-center gap-3 text-sm text-gray-500">
                        {!videoUrl && metadata.video_url && (
                            /* Fallback link if preview logic somehow fails but url exists (unlikely given logic above) */
                            <a
                                href={metadata.video_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-1 text-blue-600 hover:text-blue-700"
                            >
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                </svg>
                                Video
                            </a>
                        )}

                        {metadata.duration && (
                            <span className="flex items-center gap-1">
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                {metadata.duration} dk
                            </span>
                        )}
                    </div>

                    {/* YouTube Preview */}
                    {videoUrl && (
                        <YouTubePreview url={videoUrl} />
                    )}
                </div>

                <div className="flex flex-col items-center gap-2 shrink-0">
                    <TaskMenu
                        taskId={task.id}
                        isCompleted={is_completed}
                        onEdit={onEdit}
                        onDelete={onDelete}
                        onUncomplete={onUncomplete}
                    />
                    <button
                        onClick={is_completed ? onUncomplete : onComplete}
                        className={`w-6 h-6 rounded-full border flex items-center justify-center transition-colors ${is_completed
                            ? 'bg-green-500 border-green-500 text-white'
                            : 'border-gray-300 hover:border-gray-400'
                            }`}
                    >
                        {is_completed && (
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                            </svg>
                        )}
                    </button>
                </div>
            </div>
        </div>
    )
}
