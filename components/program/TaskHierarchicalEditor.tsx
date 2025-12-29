'use client'

import { useState, useMemo } from 'react'
import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    DragEndEvent,
    DragStartEvent,
    DragOverlay,
    defaultDropAnimationSideEffects,
    DropAnimation
} from '@dnd-kit/core'
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    verticalListSortingStrategy,
    useSortable
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { createProjectTask, updateProjectTask, deleteProjectTask, updateTaskOrders } from '@/app/actions/projects'

interface Task {
    id: string
    title: string
    description?: string | null
    parent_id?: string | null
    sort_order?: number
    start_date?: string | null
    due_date?: string | null
    is_completed?: boolean
    duration_minutes?: number
    metadata?: any
    task_types?: {
        name: string
        icon: string | null
    }
}

interface TaskHierarchicalEditorProps {
    projectId: string
    initialTasks: Task[]
    onUpdate?: () => void
    onEditTask?: (task: Task) => void
}

interface SortableTaskItemProps {
    task: Task & { children?: Task[] }
    depth: number
    onEdit: (task: Task) => void
    onDelete: (id: string) => void
    onAddSubtask: (id: string) => void
    isOverlay?: boolean
}

function SortableTaskItem({ task, depth, onEdit, onDelete, onAddSubtask, isOverlay }: SortableTaskItemProps) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging
    } = useSortable({ id: task.id, data: { ...task, depth } })

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        marginLeft: `${depth * 24}px`, // Visual indentation
        opacity: isDragging ? 0.3 : 1
    }

    if (isOverlay) {
        return (
            <div style={style} className="bg-white p-4 rounded-xl border-2 border-indigo-500 shadow-xl cursor-grabbing ring-4 ring-indigo-500/20 rotate-1">
                <div className="font-bold text-gray-900 border-b pb-2 mb-2">{task.title}</div>
                {task.children && task.children.length > 0 && (
                    <div className="space-y-1 pl-4 border-l-2 border-indigo-100 mt-2">
                        {task.children.map(child => (
                            <div key={child.id} className="text-sm text-gray-600 bg-gray-50 p-2 rounded flex items-center gap-2">
                                <span className="w-1.5 h-1.5 rounded-full bg-indigo-300"></span>
                                <span>{child.title}</span>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        )
    }

    return (
        <div ref={setNodeRef} style={style} className="space-y-2 mb-2">
            <div
                className={`group relative flex items-center gap-3 p-3 bg-white rounded-xl border transition-all ${task.is_completed ? 'opacity-60 bg-gray-50' : 'border-gray-200 hover:border-indigo-300 hover:shadow-sm'
                    } ${depth > 0 ? 'bg-gray-50/50' : ''}`}
            >
                {depth > 0 && (
                    <div className="absolute -left-3 top-1/2 w-3 h-px bg-gray-300"></div>
                )}

                <button
                    {...attributes}
                    {...listeners}
                    className="cursor-grab active:cursor-grabbing text-gray-300 hover:text-indigo-500 p-1"
                >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8h16M4 16h16" />
                    </svg>
                </button>

                {/* Content */}
                <div className="flex-1 min-w-0" onClick={() => onEdit(task)}>
                    <div className="flex items-center gap-2">
                        <h4 className={`font-semibold text-gray-900 truncate cursor-pointer ${task.is_completed ? 'line-through decoration-gray-400 text-gray-500' : ''}`}>
                            {task.title}
                        </h4>
                        {task.task_types?.name && (
                            <span className="text-[10px] px-1.5 py-0.5 bg-gray-100 text-gray-500 rounded font-medium uppercase">
                                {task.task_types.name}
                            </span>
                        )}
                        {task.metadata?.calories && (
                            <span className="text-[10px] px-1.5 py-0.5 bg-green-100 text-green-700 rounded font-medium">
                                {task.metadata.calories} kcal
                            </span>
                        )}
                    </div>
                    {task.description && (
                        <p className="text-xs text-gray-500 truncate">{task.description}</p>
                    )}
                </div>

                {/* Actions */}
                <div className="flex items-center opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity gap-1">
                    {depth === 0 && (
                        <button
                            onClick={() => onAddSubtask(task.id)}
                            className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition"
                            title="Alt Görev Ekle"
                        >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                            </svg>
                        </button>
                    )}
                    <button
                        onClick={() => onEdit(task)}
                        className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition"
                    >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                        </svg>
                    </button>
                    <button
                        onClick={() => onDelete(task.id)}
                        className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                    >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                    </button>
                </div>
            </div>

            {/* Render Children Recursively */}
            {task.children && task.children.length > 0 && (
                <div className="border-l-2 border-transparent hover:border-gray-200 transition-colors">
                    <SortableContext items={task.children.map(c => c.id)} strategy={verticalListSortingStrategy}>
                        <div className="space-y-2">
                            {task.children.map(child => (
                                <SortableTaskItem
                                    key={child.id}
                                    task={child}
                                    depth={depth + 1}
                                    onEdit={onEdit}
                                    onDelete={onDelete}
                                    onAddSubtask={onAddSubtask}
                                />
                            ))}
                        </div>
                    </SortableContext>
                </div>
            )}
        </div>
    )
}

export default function TaskHierarchicalEditor({ projectId, initialTasks, onUpdate, onEditTask }: TaskHierarchicalEditorProps) {
    const [tasks, setTasks] = useState<Task[]>(initialTasks)
    const [activeId, setActiveId] = useState<string | null>(null)
    const [editingTask, setEditingTask] = useState<Task | null>(null)
    const [showInput, setShowInput] = useState(false)
    const [newTaskTitle, setNewTaskTitle] = useState('')
    const [addingToParent, setAddingToParent] = useState<string | null>(null)

    // Sync from parent reloads
    useMemo(() => {
        setTasks(initialTasks)
    }, [initialTasks])

    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
        useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
    )

    // Convert flat list to tree
    const taskTree = useMemo(() => {
        const tree: (Task & { children: Task[] })[] = []
        const taskMap = new Map()

        // Init map
        tasks.forEach(t => taskMap.set(t.id, { ...t, children: [] }))

        // Build tree
        // Sort by sort_order first
        const sortedTasks = [...tasks].sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0))

        sortedTasks.forEach(task => {
            const node = taskMap.get(task.id)
            if (task.parent_id && taskMap.has(task.parent_id)) {
                taskMap.get(task.parent_id).children.push(node)
            } else {
                tree.push(node)
            }
        })

        return tree
    }, [tasks])

    const handleDragStart = (event: DragStartEvent) => {
        setActiveId(event.active.id as string)
    }

    const handleDragEnd = async (event: DragEndEvent) => {
        const { active, over } = event
        setActiveId(null)

        if (!over) return
        if (active.id === over.id) return

        // Use tasks directly
        const activeTask = tasks.find(t => t.id === active.id)
        if (!activeTask) return

        let overTask = tasks.find(t => t.id === over.id)
        if (!overTask) return

        // LOGIC: Resolve 'over' to the same level as 'active' if possible

        // Case A: Active is a ROOT item
        if (!activeTask.parent_id) {
            // If over is a child, find its root
            if (overTask.parent_id) {
                const root = tasks.find(t => t.id === overTask.parent_id)
                if (root) overTask = root
            }

            // Now both should be roots. If not, we can't sort.
            if (overTask.parent_id) return // Still a child (maybe deep nesting?), abort.

            // Perform Root Swap
            const roots = tasks.filter(t => !t.parent_id).sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0))
            const oldIndex = roots.findIndex(t => t.id === activeTask.id)
            const newIndex = roots.findIndex(t => t.id === overTask.id)

            if (oldIndex !== newIndex) {
                const newRoots = arrayMove(roots, oldIndex, newIndex)

                // Re-calculate sort orders for ALL roots
                const updates = newRoots.map((t, i) => ({ id: t.id, sort_order: i }))

                // Optimistic update
                const newTasks = [...tasks]
                updates.forEach(u => {
                    const t = newTasks.find(x => x.id === u.id)
                    if (t) t.sort_order = u.sort_order
                })
                setTasks(newTasks)

                await updateTaskOrders(projectId, updates)
            }
            return
        }

        // Case B: Active is a CHILD item
        // Only allow swapping with siblings for now
        if (activeTask.parent_id === overTask.parent_id) {
            const siblings = tasks
                .filter(t => t.parent_id === activeTask.parent_id)
                .sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0))

            const oldIndex = siblings.findIndex(t => t.id === active.id)
            const newIndex = siblings.findIndex(t => t.id === over.id)

            if (oldIndex !== newIndex) {
                const newSiblings = arrayMove(siblings, oldIndex, newIndex)

                const updates = newSiblings.map((t, i) => ({ id: t.id, sort_order: i }))

                // Optimistic Update
                const newTasks = [...tasks]
                updates.forEach(u => {
                    const t = newTasks.find(x => x.id === u.id)
                    if (t) t.sort_order = u.sort_order
                })
                setTasks(newTasks)

                await updateTaskOrders(projectId, updates)
            }
        }
    }

    const handleAddTask = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!newTaskTitle.trim()) return

        const result = await createProjectTask(projectId, newTaskTitle, undefined, addingToParent || undefined)
        if (result.data) {
            setTasks([...tasks, result.data])
            setNewTaskTitle('')
            setShowInput(false)
            setAddingToParent(null)
            onUpdate?.()
        }
    }

    const handleDelete = async (id: string) => {
        if (!confirm('Görevi silmek istediğinize emin misiniz? Alt görevler de silinebilir.')) return
        setTasks(tasks.filter(t => t.id !== id && t.parent_id !== id)) // Optimistic
        await deleteProjectTask(projectId, id)
        onUpdate?.()
    }

    const startAdd = (parentId: string | null = null) => {
        setAddingToParent(parentId)
        setShowInput(true)
    }

    const activeItem = activeId ? tasks.find(t => t.id === activeId) : null

    return (
        <div className="bg-gray-50/50 rounded-2xl p-6 border border-gray-100">
            {/* Toolbar */}
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h3 className="font-bold text-gray-900">Görev Hiyerarşisi</h3>
                    <p className="text-xs text-gray-500">Sürükleyip bırakarak sıralamayı düzenleyin.</p>
                </div>
                <button
                    onClick={() => startAdd(null)}
                    className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-sm font-bold shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition flex items-center gap-2"
                >
                    <span>+</span> Yeni Ana Görev
                </button>
            </div>

            {/* Input Form */}
            {showInput && (
                <form onSubmit={handleAddTask} className="mb-4 bg-white p-4 rounded-xl border-2 border-indigo-100 shadow-sm animate-in fade-in slide-in-from-top-2">
                    <h4 className="text-xs font-bold text-indigo-600 uppercase mb-2">
                        {addingToParent ? '↳ Alt Görev Ekle' : 'Yeni Ana Görev'}
                    </h4>
                    <div className="flex gap-2">
                        <input
                            autoFocus
                            value={newTaskTitle}
                            onChange={(e) => setNewTaskTitle(e.target.value)}
                            className="flex-1 px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                            placeholder="Görev adı..."
                        />
                        <button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-bold">Kaydet</button>
                        <button type="button" onClick={() => setShowInput(false)} className="px-4 py-2 bg-gray-100 text-gray-600 rounded-lg text-sm font-bold">İptal</button>
                    </div>
                </form>
            )}

            {/* List */}
            <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragStart={handleDragStart}
                onDragEnd={handleDragEnd}
            >
                <SortableContext
                    items={taskTree.map(t => t.id)}
                    strategy={verticalListSortingStrategy}
                >
                    <div className="space-y-4">
                        {taskTree.map(task => (
                            <SortableTaskItem
                                key={task.id}
                                task={task} // Now includes children
                                depth={0}
                                onEdit={(t: Task) => onEditTask ? onEditTask(t) : setEditingTask(t)}
                                onDelete={handleDelete}
                                onAddSubtask={(pid: string) => startAdd(pid)}
                            />
                        ))}
                    </div>
                </SortableContext>

                <DragOverlay>
                    {activeItem ? (
                        <SortableTaskItem
                            task={{
                                ...activeItem,
                                children: tasks.filter(t => t.parent_id === activeItem.id) // Attach children for visual overlay
                            }}
                            depth={0}
                            onEdit={() => { }}
                            onDelete={() => { }}
                            onAddSubtask={() => { }}
                            isOverlay
                        />
                    ) : null}
                </DragOverlay>
            </DndContext>

            {/* Edit Modal Placeholders (Fallback if onEditTask not provided) */}
            {editingTask && !onEditTask && (
                <div className="fixed inset-0 bg-black/20 flex items-center justify-center z-[100]" onClick={() => setEditingTask(null)}>
                    <div className="bg-white p-6 rounded-2xl shadow-2xl max-w-md w-full" onClick={e => e.stopPropagation()}>
                        <h3 className="font-bold mb-4">Görevi Düzenle</h3>
                        <input
                            className="w-full p-2 border rounded mb-4"
                            defaultValue={editingTask.title}
                            onBlur={async (e) => {
                                const val = e.target.value
                                if (val !== editingTask.title) {
                                    // Update
                                    await updateProjectTask(projectId, editingTask.id, { title: val })
                                    setTasks(tasks.map(t => t.id === editingTask.id ? { ...t, title: val } : t))
                                    onUpdate?.()
                                }
                                setEditingTask(null)
                            }}
                        />
                        <p className="text-xs text-gray-500">Düzenlemeyi bitirmek için dışarı tıklayın.</p>
                    </div>
                </div>
            )}
        </div>
    )
}
