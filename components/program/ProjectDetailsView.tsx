'use client'

import { useState, useEffect, useMemo } from 'react'
import { Project, getProjectTasks, createProjectTask, updateTaskOrders } from '@/app/actions/projects'
import GanttChart from './GanttChart'
import TaskEditorModal from './TaskEditorModal'
import { getTaskIcon } from '@/lib/utils/iconMapping'
import {
    DndContext,
    pointerWithin,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    DragEndEvent,
    DragStartEvent,
    DragOverlay
} from '@dnd-kit/core'
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    verticalListSortingStrategy,
    useSortable
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'

// Sortable Task Item Component
function SortableTaskItem({ task, level, onEdit, onAddSubtask, onDelete, isOverlay }: any) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging
    } = useSortable({ id: task.id })

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        marginLeft: `${level * 24}px`,
        width: `calc(100% - ${level * 24}px)`,
        opacity: isDragging ? 0.3 : 1
    }

    if (isOverlay) {
        return (
            <div className="space-y-2 mb-2" style={{ marginLeft: `${level * 24}px`, width: `calc(100% - ${level * 24}px)` }}>
                <div className="w-full flex items-center gap-3 p-4 bg-white rounded-2xl border-2 border-indigo-500 shadow-xl cursor-grabbing z-50 pointer-events-none">
                    <div className="p-1 text-indigo-500">
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8h16M4 16h16" />
                        </svg>
                    </div>
                    {/* Simplified Content for Overlay */}
                    <div className="flex flex-1 items-center gap-3">
                        <div className="w-8 h-8 rounded-xl bg-indigo-50 flex items-center justify-center text-sm">
                            {getTaskIcon(task.task_types?.icon) || '📝'}
                        </div>
                        <div>
                            <h4 className="font-semibold text-gray-900 line-clamp-1">{task.title}</h4>
                        </div>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div ref={setNodeRef} style={style} className="space-y-2 mb-2">
            <div className="w-full flex items-center gap-3 p-4 bg-white rounded-2xl border border-gray-100 shadow-sm hover:border-indigo-100 transition-colors group">
                <div
                    {...attributes}
                    {...listeners}
                    className="p-1 text-gray-300 hover:text-gray-500 cursor-grab active:cursor-grabbing"
                    title="Sıralamayı Değiştir"
                >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8h16M4 16h16" />
                    </svg>
                </div>

                <div
                    className="flex flex-1 items-center gap-3 cursor-pointer"
                    onClick={() => onEdit(task)}
                >
                    <div className="w-8 h-8 rounded-xl bg-gray-50 flex items-center justify-center text-sm group-hover:bg-indigo-50 transition-colors">
                        {getTaskIcon(task.task_types?.icon) || (level > 0 ? '🔹' : '📝')}
                    </div>
                    <div>
                        <h4 className="font-semibold text-gray-900 line-clamp-1">{task.title}</h4>
                        {task.description && (
                            <p className="text-[10px] text-gray-400 line-clamp-1">{task.description}</p>
                        )}
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2">
                        {task.dependency_ids && task.dependency_ids.length > 0 && (
                            <span className="text-[10px] bg-amber-50 text-amber-600 px-2 py-0.5 rounded-full border border-amber-100 flex items-center gap-1" title="Bu görev başka görevlere bağlı">
                                🔗 Bağımlı
                            </span>
                        )}
                        {!task.start_date && (
                            <span className="text-[10px] bg-red-50 text-red-600 px-2 py-0.5 rounded-full border border-red-100 font-bold">
                                ⏳ Tarihsiz
                            </span>
                        )}
                        {task.start_date && task.end_date && (
                            <span className="text-[10px] bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded-full border border-indigo-100 font-bold whitespace-nowrap">
                                {Math.round(Math.abs(new Date(task.end_date).getTime() - new Date(task.start_date).getTime()) / (1000 * 60 * 60 * 24)) + 1} Gün
                            </span>
                        )}
                        {task.progress_percent > 0 && (
                            <span className="text-[10px] text-indigo-600 font-bold whitespace-nowrap">
                                %{task.progress_percent}
                            </span>
                        )}
                        <span className="text-[10px] bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full uppercase font-bold whitespace-nowrap">
                            {task.task_types?.name || 'GÖREV'}
                        </span>
                    </div>
                    <button
                        onClick={(e) => {
                            e.stopPropagation()
                            onAddSubtask(task.id)
                        }}
                        className="p-1.5 hover:bg-indigo-50 text-gray-400 hover:text-indigo-600 rounded-lg transition-colors"
                        title="Alt Görev Ekle"
                    >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                    </button>
                    <button
                        onClick={(e) => {
                            e.stopPropagation()
                            onDelete(task.id)
                        }}
                        className="p-1.5 hover:bg-red-50 text-gray-400 hover:text-red-500 rounded-lg transition-colors"
                        title="Görevi Sil"
                    >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                    </button>
                </div>
            </div>
            {task.children && task.children.length > 0 && (
                <SortableContext
                    items={task.children.map((c: any) => c.id)}
                    strategy={verticalListSortingStrategy}
                >
                    <div className="space-y-2">
                        {task.children.map((child: any) => (
                            <SortableTaskItem
                                key={child.id}
                                task={child}
                                level={level + 1}
                                onEdit={onEdit}
                                onAddSubtask={onAddSubtask}
                                onDelete={onDelete}
                            />
                        ))}
                    </div>
                </SortableContext>
            )}
        </div>
    )
}

interface ProjectDetailsViewProps {
    project: Project
    onBack: () => void
}

export default function ProjectDetailsView({ project, onBack }: ProjectDetailsViewProps) {
    const [tasks, setTasks] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [viewMode, setViewMode] = useState<'list' | 'gantt'>('list')
    const [isAddingTask, setIsAddingTask] = useState(false)
    const [newTaskTitle, setNewTaskTitle] = useState('')
    const [editingTask, setEditingTask] = useState<any | null>(null)
    const [addingSubtaskTo, setAddingSubtaskTo] = useState<string | null>(null)
    const [activeId, setActiveId] = useState<string | null>(null)

    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 8,
            },
        }),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    )

    const buildTaskTree = (flatTasks: any[]) => {
        // Ensure tasks are sorted by sort_order
        // The backend already sorts by sort_order, but new updates might need client sort.
        const sortedTasks = [...flatTasks].sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0))

        const taskMap: Record<string, any> = {}
        const tree: any[] = []

        sortedTasks.forEach(task => {
            taskMap[task.id] = { ...task, children: [] }
        })

        sortedTasks.forEach(task => {
            if (task.parent_id && taskMap[task.parent_id]) {
                taskMap[task.parent_id].children.push(taskMap[task.id])
            } else {
                tree.push(taskMap[task.id])
            }
        })

        return tree
    }

    const taskTree = useMemo(() => buildTaskTree(tasks), [tasks])

    const flattenTree = (tree: any[], result: any[] = []) => {
        tree.forEach(node => {
            result.push(node)
            if (node.children) flattenTree(node.children, result)
        })
        return result
    }

    const flattenedTasks = useMemo(() => flattenTree(taskTree), [taskTree])

    const loadTasks = async () => {
        setLoading(true)
        const result = await getProjectTasks(project.id)
        if (result.data) {
            setTasks(result.data)
        }
        setLoading(false)
    }

    useEffect(() => {
        loadTasks()
    }, [project.id])

    const handleAddTask = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!newTaskTitle.trim()) return

        const result = await createProjectTask(project.id, newTaskTitle, undefined, addingSubtaskTo || undefined)
        if (result.data) {
            setNewTaskTitle('')
            setIsAddingTask(false)
            setAddingSubtaskTo(null)
            loadTasks()
        } else if (result.error) {
            alert('Görev oluşturulamadı: ' + result.error)
        }
    }

    const handleDeleteTask = async (taskId: string) => {
        if (!confirm('Bu görevi silmek istediğinize emin misiniz?')) return

        const { deleteProjectTask } = await import('@/app/actions/projects')
        const result = await deleteProjectTask(project.id, taskId)

        if (result.success) {
            loadTasks()
        } else {
            alert('Görev silinemedi: ' + (result as any).error)
        }
    }

    const handleDragStart = (event: DragStartEvent) => {
        setActiveId(event.active.id as string)
    }

    const handleDragEnd = async (event: DragEndEvent) => {
        const { active, over } = event
        setActiveId(null)

        if (active.id !== over?.id) {
            setTasks((items) => {
                const oldIndex = items.findIndex(t => t.id === active.id)
                const newIndex = items.findIndex(t => t.id === over?.id)

                // Only allow reorder if they share the same parent? 
                // Since we flattened the list for state search but render tree...
                // The logical index in 'items' (flat list) might not directly map to tree siblings.
                // However, arrayMove works on indexes.
                // Better approach: Find parent of active item, get its children, arrayMove THEM.

                const activeItem = items[oldIndex]
                const overItem = items[newIndex]

                // Check if they are siblings OR if we dropped on the parent (implies move to top)
                const isSibling = activeItem.parent_id === overItem?.parent_id
                const isDropOnParent = activeItem.parent_id === over?.id

                if (!isSibling && !isDropOnParent) {
                    return items
                }

                // Get all siblings
                const siblings = items
                    .filter(t => t.parent_id === activeItem.parent_id)
                    .sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0))

                const oldSiblingIndex = siblings.findIndex(t => t.id === active.id)
                let newSiblingIndex

                if (isDropOnParent) {
                    newSiblingIndex = 0 // Move to top
                } else {
                    newSiblingIndex = siblings.findIndex(t => t.id === over?.id)
                }

                const newSiblings = arrayMove(siblings, oldSiblingIndex, newSiblingIndex)

                // Update sort_order for these siblings
                const updates = newSiblings.map((t, index) => ({
                    id: t.id,
                    sort_order: index
                }))

                // Optimistic update
                const newItems = [...items]
                updates.forEach(u => {
                    const idx = newItems.findIndex(t => t.id === u.id)
                    if (idx !== -1) newItems[idx].sort_order = u.sort_order
                })

                // Send to backend
                updateTaskOrders(project.id, updates).then(result => {
                    if (!result.success) {
                        console.error('Task reorder failed:', result.error)
                        // Ideally revert optimistic update here, but for now just log
                        alert('Sıralama kaydedilemedi: ' + result.error)
                    }
                })

                return newItems
            })
        }
    }

    return (
        <div className="flex flex-col h-full animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                    <button
                        onClick={onBack}
                        className="p-2 hover:bg-gray-100 rounded-xl transition"
                    >
                        <svg className="w-5 h-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                    </button>
                    <div>
                        <h2 className="text-xl font-bold text-gray-900">{project.name}</h2>
                        <p className="text-xs text-gray-500">Proje Detayları & Planlama</p>
                    </div>
                </div>

                <div className="flex bg-gray-100 p-1 rounded-xl items-center gap-1">
                    <div className="flex mr-2 border-r border-gray-200 pr-2">
                        <button
                            onClick={() => setViewMode('list')}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${viewMode === 'list' ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                        >
                            Liste
                        </button>
                        <button
                            onClick={() => setViewMode('gantt')}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${viewMode === 'gantt' ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                        >
                            Gantt
                        </button>
                    </div>
                    <button
                        onClick={() => setIsAddingTask(true)}
                        className="p-1.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition"
                    >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
                        </svg>
                    </button>
                </div>
            </div>

            {/* Add Task Form */}
            {isAddingTask && (
                <form onSubmit={handleAddTask} className="mb-6 bg-indigo-50 p-4 rounded-2xl border border-indigo-100 animate-in zoom-in-95 duration-200">
                    {addingSubtaskTo && (
                        <div className="flex items-center justify-between mb-2 px-1">
                            <span className="text-[10px] font-bold text-indigo-600 uppercase">
                                ↳ Alt Görev Ekleniyor: {tasks.find(t => t.id === addingSubtaskTo)?.title}
                            </span>
                            <button
                                type="button"
                                onClick={() => setAddingSubtaskTo(null)}
                                className="text-[10px] font-bold text-gray-400 hover:text-red-500"
                            >
                                (İptal)
                            </button>
                        </div>
                    )}
                    <input
                        type="text"
                        placeholder="Yeni görev adı..."
                        value={newTaskTitle}
                        onChange={(e) => setNewTaskTitle(e.target.value)}
                        className="w-full p-3 rounded-xl border-0 shadow-sm focus:ring-2 focus:ring-indigo-500 mb-3 text-sm"
                        autoFocus
                    />
                    <div className="flex gap-2">
                        <button
                            type="submit"
                            className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-xs font-bold hover:bg-indigo-700 transition"
                        >
                            Ekle
                        </button>
                        <button
                            type="button"
                            onClick={() => setIsAddingTask(false)}
                            className="px-4 py-2 bg-white text-gray-600 rounded-lg text-xs font-bold hover:bg-gray-100 transition"
                        >
                            Vazgeç
                        </button>
                    </div>
                </form>
            )}

            {/* View Content */}
            {loading ? (
                <div className="flex justify-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
                </div>
            ) : viewMode === 'list' ? (
                <div className="flex-1 overflow-auto">
                    {tasks.length === 0 ? (
                        <div className="text-center py-12 bg-white rounded-3xl border-2 border-dashed border-gray-100">
                            <span className="text-4xl mb-4 block">📝</span>
                            <p className="text-gray-500 text-sm mb-4">Henüz görev eklenmemiş.</p>
                            <button
                                onClick={() => setIsAddingTask(true)}
                                className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-sm font-bold shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition"
                            >
                                İlk Görevi Ekle
                            </button>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            <DndContext
                                sensors={sensors}
                                collisionDetection={pointerWithin}
                                onDragStart={handleDragStart}
                                onDragEnd={handleDragEnd}
                            >
                                <SortableContext
                                    items={taskTree.map(t => t.id)}
                                    strategy={verticalListSortingStrategy}
                                >
                                    {taskTree.map(task => (
                                        <SortableTaskItem
                                            key={task.id}
                                            task={task}
                                            level={0}
                                            onEdit={(t: any) => setEditingTask(t)}
                                            onAddSubtask={(taskId: string) => {
                                                setAddingSubtaskTo(taskId)
                                                setIsAddingTask(true)
                                            }}
                                            onDelete={(taskId: string) => handleDeleteTask(taskId)}
                                        />
                                    ))}
                                </SortableContext>
                                <DragOverlay>
                                    {activeId ? (() => {
                                        const findTask = (nodes: any[]): any | null => {
                                            for (const node of nodes) {
                                                if (node.id === activeId) return node
                                                if (node.children) {
                                                    const found = findTask(node.children)
                                                    if (found) return found
                                                }
                                            }
                                            return null
                                        }
                                        const task = findTask(taskTree)
                                        return task ? <SortableTaskItem task={task} level={0} isOverlay /> : null
                                    })() : null}
                                </DragOverlay>
                            </DndContext>
                        </div>
                    )}
                </div>
            ) : (
                <GanttChart
                    projectId={project.id}
                    tasks={flattenedTasks}
                    onUpdate={loadTasks}
                />
            )}

            {/* Editing Modal */}
            {editingTask && (
                <TaskEditorModal
                    projectId={project.id}
                    task={editingTask}
                    onClose={() => setEditingTask(null)}
                    onUpdate={loadTasks}
                />
            )}
        </div>
    )
}
