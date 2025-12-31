'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import SortableTaskCard from './SortableTaskCard'
import AddTaskButton from './AddTaskButton'
import TaskFormModal from './TaskFormModal'
import QuickTodoModal from './QuickTodoModal'
import DailyNutritionCard from './DailyNutritionCard'
import DailyPracticeCard from './DailyPracticeCard'
import {
    DndContext,
    closestCenter,
    PointerSensor,
    TouchSensor,
    useSensor,
    useSensors,
    DragEndEvent,
    DragOverEvent,
    rectIntersection,
    CollisionDetection,
    pointerWithin,
    closestCorners
} from '@dnd-kit/core'
import {
    SortableContext,
    verticalListSortingStrategy,
    arrayMove,
} from '@dnd-kit/sortable'

interface Task {
    id: string
    title: string
    description: string | null
    task_type_id: string
    metadata: {
        video_url?: string
        duration?: number
        notes?: string
        is_group?: boolean
    }
    due_date: string | null
    due_time: string | null
    is_completed: boolean
    task_types: {
        name: string
        slug: string
        icon: string | null
    }
    is_private?: boolean
    parent_id?: string | null
    children?: Task[]
}

interface TodayViewProps {
    userId: string
    initialDate?: Date | null
    isTutorMode?: boolean
}

export default function TodayView({ userId, initialDate, isTutorMode = false }: TodayViewProps) {
    const [tasks, setTasks] = useState<Task[]>([])
    const [loading, setLoading] = useState(true)
    const [showTaskModal, setShowTaskModal] = useState(false)
    const [showQuickTodoModal, setShowQuickTodoModal] = useState(false)
    const [editingTask, setEditingTask] = useState<Task | null>(null)
    const [selectedDate, setSelectedDate] = useState(initialDate || new Date())
    const [activeId, setActiveId] = useState<string | null>(null)
    const supabase = createClient()

    const buildTaskTree = (flatTasks: Task[]) => {
        const taskMap = new Map<string, any>()
        const roots: any[] = []

        flatTasks.forEach(task => {
            taskMap.set(task.id, { ...task, children: [] })
        })

        flatTasks.forEach(task => {
            const taskInMap = taskMap.get(task.id)
            if (task.parent_id && taskMap.has(task.parent_id)) {
                taskMap.get(task.parent_id).children.push(taskInMap)
            } else {
                roots.push(taskInMap)
            }
        })

        return roots
    }

    const taskTree = buildTaskTree(tasks)

    const handleTaskAction = (taskId: string, action: string) => {
        switch (action) {
            case 'complete': handleTaskComplete(taskId); break
            case 'uncomplete': handleTaskUncomplete(taskId); break
            case 'edit': {
                const task = tasks.find(t => t.id === taskId)
                if (task) handleTaskEdit(task)
                break
            }
            case 'delete': handleTaskDelete(taskId); break
            case 'style': {
                // Style currently not implemented in TodayView but could be
                alert('Stil Düzenleme Ajanda görünümünde yakında aktif olacak.')
                break
            }
        }
    }

    const toLocalISOString = (date: Date) => {
        const offset = date.getTimezoneOffset()
        const localDate = new Date(date.getTime() - (offset * 60 * 1000))
        return localDate.toISOString().split('T')[0]
    }

    const loadTasks = async (date: Date) => {
        setLoading(true)
        const dateString = toLocalISOString(date)

        const { data, error } = await supabase
            .from('tasks')
            .select(`
                *,
                task_types!inner (name, slug, icon)
            `)
            .eq('user_id', userId)
            .eq('due_date', dateString)
            .filter('task_types.slug', 'not.in', '("nutrition","music")')
            .order('sort_order', { ascending: true })

        if (!error && data) {
            setTasks(data as Task[])
        }
        setLoading(false)
    }

    useEffect(() => {
        loadTasks(selectedDate)
    }, [userId, selectedDate])

    // Drag & Drop sensors
    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 8,
            },
        }),
        useSensor(TouchSensor, {
            activationConstraint: {
                delay: 250,
                tolerance: 5,
            },
        })
    )

    const handleDragStart = (event: any) => {
        setActiveId(event.active.id)
    }

    const customCollisionDetection: CollisionDetection = (args) => {
        const pointerCollisions = pointerWithin(args)
        const taskCollision = pointerCollisions.find(c => tasks.some(t => t.id === c.id))
        if (taskCollision) return [taskCollision]
        return closestCorners(args)
    }

    const handleDragOver = (event: DragOverEvent) => {
        const { active, over } = event
        if (!over || active.id === over.id) return

        const oldIndex = tasks.findIndex(t => t.id === active.id)
        const newIndex = tasks.findIndex(t => t.id === over.id)

        if (oldIndex !== -1 && newIndex !== -1 && oldIndex !== newIndex) {
            setTasks(prev => arrayMove(prev, oldIndex, newIndex))
        }
    }

    const handleDragEnd = async (event: DragEndEvent) => {
        const { active, over } = event
        setActiveId(null)
        if (!over) return

        const activeId = active.id as string
        const overId = over.id as string

        if (activeId === overId) return

        // 1. Check if we dropped ONTO a group container (Nesting)
        const overTask = tasks.find(t => t.id === overId)
        if (overTask && overTask.metadata?.is_group === true && activeId !== overId) {
            const { error } = await supabase
                .from('tasks')
                .update({
                    parent_id: overId,
                    due_date: overTask.due_date
                })
                .eq('id', activeId)

            if (!error) {
                loadTasks(selectedDate)
                return
            }
        }

        // 2. Regular Reordering / Moving / Extraction
        // Determine the target parent_id
        let targetParentId: string | null = null
        if (overTask) {
            targetParentId = overTask.parent_id || null
        }

        const finalizedTasks = [...tasks]
        for (let i = 0; i < finalizedTasks.length; i++) {
            const task = finalizedTasks[i]
            const updateData: any = { sort_order: i }

            // If this is the active task, update its parent_id to match its new environment
            if (task.id === activeId) {
                updateData.parent_id = targetParentId
            }

            const { error } = await supabase
                .from('tasks')
                .update(updateData)
                .eq('id', task.id)

            // RECURSION: Keep children synced to the current date
            if (!error && task.metadata?.is_group === true) {
                await supabase
                    .from('tasks')
                    .update({ due_date: selectedDate.toISOString().split('T')[0] })
                    .eq('parent_id', task.id)
            }
        }

        loadTasks(selectedDate)
    }

    const handleTaskComplete = async (taskId: string) => {
        const completedAt = new Date().toISOString()

        // Optimistic UI update (if state management were more complex, we'd update `tasks` state here)
        // For now, we rely on loadTasks being called or re-render

        const { error } = await supabase
            .from('tasks')
            .update({ is_completed: true, completed_at: completedAt })
            .eq('id', taskId)

        if (!error) {
            loadTasks(selectedDate)
        }
    }

    const handleTaskUncomplete = async (taskId: string) => {
        const { error } = await supabase
            .from('tasks')
            .update({ is_completed: false, completed_at: null })
            .eq('id', taskId)

        if (!error) {
            loadTasks(selectedDate)
        }
    }

    const handleTaskDelete = async (taskId: string) => {
        const { error } = await supabase
            .from('tasks')
            .delete()
            .eq('id', taskId)

        if (!error) {
            loadTasks(selectedDate)
        } else {
            console.error('Remote delete failed:', error)
        }
    }

    const handleAddTask = () => {
        setEditingTask(null)
        if (isTutorMode) {
            setShowTaskModal(true)
        } else {
            setShowQuickTodoModal(true)
        }
    }


    const handleTaskSaved = () => {
        setShowTaskModal(false)
        setShowQuickTodoModal(false)
        setEditingTask(null)
        loadTasks(selectedDate)
    }

    const handleCloseModal = () => {
        setShowTaskModal(false)
        setShowQuickTodoModal(false)
        setEditingTask(null)
    }

    const handleTaskEdit = (task: Task) => {
        setEditingTask(task)
        if (task.is_private) {
            setShowQuickTodoModal(true)
        } else {
            setShowTaskModal(true)
        }
    }

    // Tarih navigasyon fonksiyonları
    const goToPreviousDay = () => {
        const newDate = new Date(selectedDate)
        newDate.setDate(newDate.getDate() - 1)
        setSelectedDate(newDate)
    }

    const goToNextDay = () => {
        const newDate = new Date(selectedDate)
        newDate.setDate(newDate.getDate() + 1)
        setSelectedDate(newDate)
    }

    const goToToday = () => {
        setSelectedDate(new Date())
    }

    const isToday = () => {
        const today = new Date()
        return selectedDate.toDateString() === today.toDateString()
    }

    if (loading) {
        return (
            <div className="flex justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
            </div>
        )
    }

    const formattedDate = selectedDate.toLocaleDateString('tr-TR', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
    })

    const dayName = selectedDate.toLocaleDateString('tr-TR', {
        weekday: 'long',
    })

    return (
        <div className="relative">
            {/* Tarih Navigasyonu - Sticky with glassmorphism */}
            <div className="sticky top-0 z-20 pb-4 bg-gray-50/80 backdrop-blur-md -mx-4 px-4 pt-2">
                <div className="flex items-center justify-between bg-white/90 backdrop-blur-xl p-3 px-4 rounded-2xl border border-white/20 shadow-[0_8px_30px_rgb(0,0,0,0.04)] ring-1 ring-black/[0.02]">
                    <button
                        onClick={goToPreviousDay}
                        className="p-2 hover:bg-gray-100 rounded-xl transition-all active:scale-95 text-gray-400 hover:text-indigo-600"
                        aria-label="Önceki gün"
                    >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
                        </svg>
                    </button>

                    <div className="flex flex-col items-center">
                        <div className="flex items-center gap-2">
                            <span className="text-[15px] font-black text-gray-900 capitalize tracking-tight">
                                {isToday() ? 'Bugün' : dayName}
                            </span>
                            {tasks.length > 0 && (
                                <span className="bg-indigo-600 text-white text-[10px] font-black px-2 py-0.5 rounded-full shadow-lg shadow-indigo-200">
                                    {tasks.length}
                                </span>
                            )}
                        </div>
                        <span className="text-[11px] text-gray-400 font-bold uppercase tracking-widest">
                            {formattedDate}
                        </span>
                    </div>

                    <button
                        onClick={goToNextDay}
                        className="p-2 hover:bg-gray-100 rounded-xl transition-all active:scale-95 text-gray-400 hover:text-indigo-600"
                        aria-label="Sonraki gün"
                    >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                        </svg>
                    </button>
                </div>

                {!isToday() && (
                    <div className="flex justify-center -mb-2 mt-2">
                        <button
                            onClick={goToToday}
                            className="px-4 py-1.5 text-[10px] bg-white text-indigo-600 rounded-full hover:bg-indigo-50 transition-all font-black uppercase tracking-widest border border-indigo-100 shadow-sm active:scale-95"
                        >
                            📅 Bugüne Dön
                        </button>
                    </div>
                )}
            </div>

            {/* Modular Summaries */}
            <DailyNutritionCard userId={userId} date={selectedDate} />
            <DailyPracticeCard userId={userId} date={selectedDate} />

            <DndContext
                sensors={sensors}
                collisionDetection={customCollisionDetection}
                onDragStart={handleDragStart}
                onDragOver={handleDragOver}
                onDragEnd={handleDragEnd}
            >
                <SortableContext items={taskTree.map(t => t.id)} strategy={verticalListSortingStrategy}>
                    <div className="space-y-3 mb-20">
                        {taskTree.map((task, idx) => (
                            <SortableTaskCard
                                key={task.id}
                                task={task}
                                onComplete={() => handleTaskComplete(task.id)}
                                onUncomplete={() => handleTaskUncomplete(task.id)}
                                onEdit={() => handleTaskEdit(task)}
                                onDelete={() => handleTaskDelete(task.id)}
                                onAction={handleTaskAction}
                                index={idx}
                                activeId={activeId}
                            />
                        ))}

                        {taskTree.length === 0 && (
                            <div className="text-center py-20 bg-white/50 rounded-3xl border-2 border-dashed border-gray-200 flex flex-col items-center group hover:border-indigo-300 transition-colors">
                                <div className="w-16 h-16 bg-gray-50 rounded-2xl flex items-center justify-center text-3xl mb-4 group-hover:scale-110 transition-transform">✨</div>
                                <p className="text-gray-900 font-bold">Harika bir gün mü?</p>
                                <p className="text-sm text-gray-400 max-w-[200px] mx-auto mt-1">Planlarını eklemek için aşağıdaki + butonuna tıkla.</p>
                            </div>
                        )}
                    </div>
                </SortableContext>
            </DndContext>

            <AddTaskButton onClick={handleAddTask} />

            {showTaskModal && (
                <TaskFormModal
                    userId={userId}
                    editingTask={editingTask}
                    defaultDate={selectedDate}
                    onClose={handleCloseModal}
                    onTaskSaved={handleTaskSaved}
                />
            )}

            {showQuickTodoModal && (
                <QuickTodoModal
                    onClose={handleCloseModal}
                    initialDate={selectedDate}
                    onTaskAdded={handleTaskSaved}
                    editingTask={editingTask}
                />
            )}
        </div>
    )
}
