'use client'

import { useState, use } from 'react'
import { useRouter } from 'next/navigation'
import { createTemplateFromBuilder } from '@/app/actions/projects'
import TaskFormModal from '@/components/tutor/TaskFormModal'
import { DndContext, closestCenter, DragEndEvent, PointerSensor, useSensor, useSensors } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy, arrayMove, useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'

interface Task {
    id: string
    title: string
    description: string
    day: number
    duration: number
    parent_id?: string
}

function SortableTask({
    task,
    onEdit,
    onDelete,
    onAddSubtask,
    isSubtask = false
}: {
    task: Task,
    onEdit: () => void,
    onDelete: () => void,
    onAddSubtask: () => void,
    isSubtask?: boolean
}) {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
        id: task.id
    })

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
        marginLeft: isSubtask ? '2rem' : '0'
    }

    return (
        <div
            ref={setNodeRef}
            style={style}
            className={`flex items-center gap-4 p-4 bg-white rounded-xl border-2 hover:border-purple-300 transition ${isSubtask ? 'border-gray-100 bg-gray-50/50' : 'border-gray-200'
                }`}
        >
            <button
                {...attributes}
                {...listeners}
                className="cursor-grab active:cursor-grabbing text-gray-400 hover:text-gray-600"
            >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8h16M4 16h16" />
                </svg>
            </button>

            <div className="flex-1">
                <div className="flex items-center gap-2">
                    {isSubtask && <span className="text-gray-400">↳</span>}
                    <div className="font-bold text-gray-900">{task.title}</div>
                </div>
                {task.description && (
                    <p className="text-sm text-gray-600 mt-1">{task.description}</p>
                )}
                <div className="text-xs text-gray-500 mt-1">
                    Gün {task.day} • {task.duration} dakika
                </div>
            </div>

            <div className="flex items-center gap-1">
                {!isSubtask && (
                    <button
                        onClick={onAddSubtask}
                        title="Alt Görev Ekle"
                        className="p-2 text-purple-600 hover:bg-purple-50 rounded-lg transition"
                    >
                        ➕
                    </button>
                )}
                <button
                    onClick={onEdit}
                    className="p-2 text-gray-600 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition"
                >
                    ✏️
                </button>
                <button
                    onClick={onDelete}
                    className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                >
                    🗑️
                </button>
            </div>
        </div>
    )
}

export default function TemplateBuilderPage() {
    const router = useRouter()
    const [templateData, setTemplateData] = useState({
        name: '',
        description: '',
        moduleType: 'general' as any,
        durationDays: 7
    })
    const [tasks, setTasks] = useState<Task[]>([])
    const [saving, setSaving] = useState(false)
    const [showTaskModal, setShowTaskModal] = useState(false)
    const [editingTask, setEditingTask] = useState<Task | undefined>(undefined)
    const [currentParentId, setCurrentParentId] = useState<string | undefined>(undefined)

    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 8,
            },
        })
    )

    const handleSave = async () => {
        setSaving(true)
        // Flatten tasks to send to server - ensuring subtasks come after parents if needed, 
        // though our current server action handles simple list.
        // We'll need to update createTemplateFromBuilder to support parent_id.
        const result = await createTemplateFromBuilder(templateData, tasks)
        setSaving(false)

        if (result.error) {
            alert('Hata: ' + result.error)
        } else {
            alert('✅ Şablon başarıyla kaydedildi!')
            router.push('/tutor')
        }
    }

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event
        if (over && active.id !== over.id) {
            const oldIndex = tasks.findIndex(t => t.id === active.id)
            const newIndex = tasks.findIndex(t => t.id === over.id)
            setTasks(arrayMove(tasks, oldIndex, newIndex))
        }
    }

    const handleAddTask = (parentId?: string) => {
        setCurrentParentId(parentId)
        setEditingTask(undefined)
        setShowTaskModal(true)
    }

    const handleEditTask = (task: Task) => {
        setEditingTask(task)
        setCurrentParentId(task.parent_id)
        setShowTaskModal(true)
    }

    const handleSaveTask = (taskData: any) => {
        const taskWithParent = { ...taskData, parent_id: currentParentId }

        if (editingTask) {
            setTasks(tasks.map(t => t.id === taskData.id ? taskWithParent : t))
        } else {
            // If it's a subtask, insert it after the parent
            if (currentParentId) {
                const parentIndex = tasks.findIndex(t => t.id === currentParentId)
                const newTasks = [...tasks]
                newTasks.splice(parentIndex + 1, 0, taskWithParent)
                setTasks(newTasks)
            } else {
                setTasks([...tasks, taskWithParent])
            }
        }
        setShowTaskModal(false)
        setEditingTask(undefined)
        setCurrentParentId(undefined)
    }

    const handleDeleteTask = (taskId: string) => {
        if (confirm('Bu görevi silmek istediğinize emin misiniz?')) {
            // Also delete subtasks if it's a parent
            setTasks(tasks.filter(t => t.id !== taskId && t.parent_id !== taskId))
        }
    }

    return (
        <div className="min-h-screen bg-gray-50 p-8">
            <div className="max-w-6xl mx-auto">
                {/* Header */}
                <div className="mb-8">
                    <button
                        onClick={() => router.back()}
                        className="text-gray-600 hover:text-gray-900 mb-4 flex items-center gap-2"
                    >
                        ← Geri
                    </button>
                    <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                        <span className="text-4xl">✨</span>
                        Yeni Şablon Oluştur
                    </h1>
                </div>

                {/* Main Content */}
                <div className="bg-white rounded-2xl p-8 border border-gray-200">
                    {/* Basic Info */}
                    <div className="grid grid-cols-2 gap-6 mb-8">
                        <div className="col-span-2">
                            <label className="block text-sm font-bold text-gray-900 mb-2">
                                Şablon Adı *
                            </label>
                            <input
                                type="text"
                                value={templateData.name}
                                onChange={(e) => setTemplateData({ ...templateData, name: e.target.value })}
                                placeholder="Örn: 30 Günlük TYT Matematik Programı"
                                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-purple-500 outline-none"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-bold text-gray-900 mb-2">
                                Modül Türü
                            </label>
                            <select
                                value={templateData.moduleType}
                                onChange={(e) => setTemplateData({ ...templateData, moduleType: e.target.value as any })}
                                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-purple-500 outline-none"
                            >
                                <option value="exam">📚 Sınav Koçluğu</option>
                                <option value="nutrition">🍏 Beslenme</option>
                                <option value="music">Guitar Müzik</option>
                                <option value="general">📋 Genel</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-bold text-gray-900 mb-2">
                                Süre (Gün)
                            </label>
                            <input
                                type="number"
                                min="1"
                                value={templateData.durationDays}
                                onChange={(e) => setTemplateData({ ...templateData, durationDays: parseInt(e.target.value) || 1 })}
                                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-purple-500 outline-none"
                            />
                        </div>

                        <div className="col-span-2">
                            <label className="block text-sm font-bold text-gray-900 mb-2">
                                Açıklama
                            </label>
                            <textarea
                                value={templateData.description}
                                onChange={(e) => setTemplateData({ ...templateData, description: e.target.value })}
                                placeholder="Şablon hakkında kısa bir açıklama..."
                                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-purple-500 outline-none"
                                rows={2}
                            />
                        </div>
                    </div>

                    <div className="h-[1px] bg-gray-200 my-8"></div>

                    {/* Tasks Section */}
                    <div>
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-xl font-bold text-gray-900">Görevler</h3>
                            <button
                                onClick={() => handleAddTask()}
                                className="px-4 py-2 bg-purple-600 text-white rounded-xl font-bold hover:bg-purple-700 transition"
                            >
                                + Görev Ekle
                            </button>
                        </div>

                        <DndContext
                            sensors={sensors}
                            collisionDetection={closestCenter}
                            onDragEnd={handleDragEnd}
                        >
                            <SortableContext items={tasks.map(t => t.id)} strategy={verticalListSortingStrategy}>
                                <div className="space-y-3">
                                    {tasks.map(task => (
                                        <SortableTask
                                            key={task.id}
                                            task={task}
                                            isSubtask={!!task.parent_id}
                                            onEdit={() => handleEditTask(task)}
                                            onDelete={() => handleDeleteTask(task.id)}
                                            onAddSubtask={() => handleAddTask(task.id)}
                                        />
                                    ))}
                                </div>
                            </SortableContext>
                        </DndContext>

                        {tasks.length === 0 && (
                            <div className="text-center py-12 text-gray-400 border-2 border-dashed border-gray-200 rounded-xl">
                                <span className="text-4xl block mb-2">📋</span>
                                <p>Henüz görev yok</p>
                            </div>
                        )}
                    </div>

                    {/* Actions */}
                    <div className="flex justify-end gap-4 mt-8 pt-8 border-t border-gray-200">
                        <button
                            onClick={handleSave}
                            disabled={saving || !templateData.name}
                            className="px-8 py-3 bg-purple-600 text-white rounded-xl font-bold hover:bg-purple-700 disabled:opacity-50 transition"
                        >
                            {saving ? 'Kaydediliyor...' : '✨ Şablonu Oluştur'}
                        </button>
                    </div>
                </div>

                {/* Task Modal */}
                {showTaskModal && (
                    <TaskFormModal
                        task={editingTask as any}
                        durationDays={templateData.durationDays}
                        onSave={handleSaveTask}
                        onClose={() => {
                            setShowTaskModal(false)
                            setEditingTask(undefined)
                            setCurrentParentId(undefined)
                        }}
                    />
                )}
            </div>
        </div>
    )
}
