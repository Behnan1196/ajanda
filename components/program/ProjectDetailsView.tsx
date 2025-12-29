'use client'

import { useState, useEffect, useMemo } from 'react'
import { Project, getProjectTasks, createProjectTask, updateTaskOrders } from '@/app/actions/projects'
import GanttChart from './GanttChart'
import TaskEditorModal from './TaskEditorModal'
import { getTaskIcon } from '@/lib/utils/iconMapping'
import TaskHierarchicalEditor from './TaskHierarchicalEditor'
import ShoppingListEditor from './ShoppingListEditor'
import MedicineTrackerEditor from './MedicineTrackerEditor'



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

    // Reload tasks
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
                    {viewMode !== 'list' && (
                        <button
                            onClick={() => setIsAddingTask(true)}
                            className="p-1.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition"
                        >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
                            </svg>
                        </button>
                    )}
                </div>
            </div>

            {/* Add Task Form (Gantt Only) */}
            {isAddingTask && viewMode !== 'list' && (
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
                    <TaskHierarchicalEditor
                        projectId={project.id}
                        initialTasks={tasks}
                        onUpdate={loadTasks}
                        onEditTask={(task) => setEditingTask(task)}
                    />
                </div>
            ) : (
                <GanttChart
                    projectId={project.id}
                    tasks={flattenedTasks}
                    onUpdate={loadTasks}
                />
            )}

            {project.settings?.type === 'shopping' && (
                <div className="absolute inset-0 bg-gray-50 z-10 flex flex-col overflow-auto">
                    <div className="p-4 border-b bg-white flex justify-between items-center sticky top-0 shadow-sm z-20">
                        <button onClick={onBack} className="flex items-center gap-2 text-gray-500 font-bold hover:text-gray-700">
                            ← Geri
                        </button>
                        <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-2 py-1 rounded-lg">AVM Modu</span>
                    </div>
                    <ShoppingListEditor
                        project={project}
                        tasks={tasks}
                        onAddTask={async (title, metadata) => {
                            const { createProjectTask } = await import('@/app/actions/projects')
                            // We need to pass metadata, but createProjectTask signature in projects.ts doesn't support it yet as arg?
                            // Actually we can just create it then update it or update createProjectTask.
                            // OR better: createProjectTask returns data, we update immediately.
                            const result = await createProjectTask(project.id, title)
                            if (result.data) {
                                const { updateProjectTask } = await import('@/app/actions/projects')
                                if (metadata) {
                                    await updateProjectTask(project.id, result.data.id, { metadata })
                                }
                                loadTasks()
                            }
                        }}
                        onUpdateTask={async (taskId, updates) => {
                            const { updateProjectTask } = await import('@/app/actions/projects')
                            await updateProjectTask(project.id, taskId, updates)
                            loadTasks()
                        }}
                        onDeleteTask={handleDeleteTask}
                    />
                </div>
            )}

            {project.settings?.type === 'medicine' && (
                <div className="absolute inset-0 bg-gray-50 z-10 flex flex-col overflow-auto">
                    <div className="p-4 border-b bg-white flex justify-between items-center sticky top-0 shadow-sm z-20">
                        <button onClick={onBack} className="flex items-center gap-2 text-gray-500 font-bold hover:text-gray-700">
                            ← Geri
                        </button>
                        <span className="text-xs font-bold text-red-600 bg-red-50 px-2 py-1 rounded-lg">İlaç Takip Modu</span>
                    </div>
                    <MedicineTrackerEditor
                        project={project}
                        tasks={tasks}
                        onUpdate={loadTasks}
                    />
                </div>
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
