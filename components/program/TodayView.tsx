'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import SortableTaskCard from './SortableTaskCard'
import AddTaskButton from './AddTaskButton'
import AddQuickTodoButton from './AddQuickTodoButton'
import TaskFormModal from './TaskFormModal'
import QuickTodoModal from './QuickTodoModal'
import {
    DndContext,
    closestCenter,
    PointerSensor,
    TouchSensor,
    useSensor,
    useSensors,
    DragEndEvent,
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
    }
    due_date: string | null
    due_time: string | null
    is_completed: boolean
    subject_id: string | null
    topic_id: string | null
    task_types: {
        name: string
        slug: string
        icon: string | null
    }
    is_private?: boolean
}

interface TodayViewProps {
    userId: string
    initialDate?: Date | null
}

export default function TodayView({ userId, initialDate }: TodayViewProps) {
    const [tasks, setTasks] = useState<Task[]>([])
    const [loading, setLoading] = useState(true)
    const [showTaskModal, setShowTaskModal] = useState(false)
    const [showQuickTodoModal, setShowQuickTodoModal] = useState(false)
    const [editingTask, setEditingTask] = useState<Task | null>(null)
    const [selectedDate, setSelectedDate] = useState(initialDate || new Date())
    const supabase = createClient()

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

    const handleDragEnd = async (event: DragEndEvent) => {
        const { active, over } = event

        if (!over || active.id === over.id) return

        const oldIndex = tasks.findIndex(t => t.id === active.id)
        const newIndex = tasks.findIndex(t => t.id === over.id)

        // Optimistic update
        const newTasks = arrayMove(tasks, oldIndex, newIndex)
        setTasks(newTasks)

        // Update database
        for (let i = 0; i < newTasks.length; i++) {
            await supabase
                .from('tasks')
                .update({ sort_order: i })
                .eq('id', newTasks[i].id)
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
        task_types (
          name,
          slug,
          icon
        ),
        subjects (
          name,
          icon,
          color
        ),
        topics (
          name
        )
      `)
            .eq('user_id', userId)
            .is('project_id', null)
            .eq('due_date', dateString)
            .order('sort_order', { ascending: true })
            .order('due_time', { ascending: true, nullsFirst: false })

        if (error) {
            console.error('Error loading tasks:', error)
        } else {
            // Apply sorting logic:
            // 1. Quick Todos (is_private) that are completed (is_completed) go to BOTTOM (Lowest priority)
            // 2. Everything else keeps its order (based on DB sort due_time)

            const sortedData = (data as Task[]).sort((a, b) => {
                const isQuickA = a.is_private || false
                const isQuickB = b.is_private || false

                // If both are quick, sort completed to bottom
                if (isQuickA && a.is_completed && !(isQuickB && b.is_completed)) return 1
                if (!(isQuickA && a.is_completed) && (isQuickB && b.is_completed)) return -1

                // If one is completed quick vs pending quick, handled above.
                // If mixed types, we specifically only want COMPLETED QUICK items to drop.
                // Pending Quick items can stay mixed.

                // Let's refine:
                // If A is Completed Quick Todo -> Weight 100
                // If B is Completed Quick Todo -> Weight 100
                // Else -> Weight 0

                const weightA = (a.is_private && a.is_completed) ? 100 : 0
                const weightB = (b.is_private && b.is_completed) ? 100 : 0

                return weightA - weightB
                // If weights equal (both 0 or both 100), preserve original order (stable sort implied or just 0)
            })

            setTasks(sortedData)
        }
        setLoading(false)
    }

    useEffect(() => {
        loadTasks(selectedDate)
    }, [userId, selectedDate])

    const handleTaskComplete = async (taskId: string) => {
        const { error } = await supabase
            .from('tasks')
            .update({
                is_completed: true,
                completed_at: new Date().toISOString(),
            })
            .eq('id', taskId)

        if (!error) {
            loadTasks(selectedDate)
        }
    }

    const handleTaskUncomplete = async (taskId: string) => {
        const { error } = await supabase
            .from('tasks')
            .update({
                is_completed: false,
                completed_at: null,
            })
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
        }
    }

    const handleTaskEdit = (task: Task) => {
        setEditingTask(task)
        if (task.is_private) {
            setShowQuickTodoModal(true)
        } else {
            setShowTaskModal(true)
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

    const handleAddTask = () => {
        setEditingTask(null)
        setShowTaskModal(true)
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
            {/* Tarih Navigasyonu */}
            <div className="mb-6">
                <div className="flex items-center justify-between bg-white p-3 px-4 rounded-xl border border-gray-100 shadow-sm">
                    <button
                        onClick={goToPreviousDay}
                        className="p-2 hover:bg-gray-100 rounded-lg transition text-gray-400 hover:text-indigo-600"
                        aria-label="Önceki gün"
                    >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                    </button>

                    <div className="flex items-center gap-2 flex-1 justify-center overflow-hidden px-2">
                        <div className="flex items-center gap-2 truncate">
                            <span className="text-[15px] font-bold text-gray-900 capitalize whitespace-nowrap">
                                {dayName}
                            </span>
                            <span className="text-[13px] text-gray-400 font-medium whitespace-nowrap">
                                {formattedDate}
                            </span>
                        </div>
                        {tasks.length > 0 && (
                            <span className="bg-indigo-50 text-indigo-600 text-[11px] font-bold px-2 py-0.5 rounded-full border border-indigo-100 flex-shrink-0">
                                {tasks.length}
                            </span>
                        )}
                    </div>

                    <button
                        onClick={goToNextDay}
                        className="p-2 hover:bg-gray-100 rounded-lg transition text-gray-400 hover:text-indigo-600"
                        aria-label="Sonraki gün"
                    >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                    </button>
                </div>

                {/* Bugüne Dön Butonu */}
                {!isToday() && (
                    <div className="flex justify-center mt-3">
                        <button
                            onClick={goToToday}
                            className="px-4 py-1 text-xs bg-indigo-50 text-indigo-600 rounded-full hover:bg-indigo-100 transition font-semibold border border-indigo-100"
                        >
                            📅 Bugüne Dön
                        </button>
                    </div>
                )}
            </div>

            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                <SortableContext items={tasks.map(t => t.id)} strategy={verticalListSortingStrategy}>
                    <div className="space-y-3 mb-20">
                        {tasks.map((task) => (
                            <SortableTaskCard
                                key={task.id}
                                task={task}
                                onComplete={() => handleTaskComplete(task.id)}
                                onUncomplete={() => handleTaskUncomplete(task.id)}
                                onEdit={() => handleTaskEdit(task)}
                                onDelete={() => handleTaskDelete(task.id)}
                            />
                        ))}

                        {tasks.length === 0 && (
                            <div className="text-center py-12 bg-white rounded-lg border-2 border-dashed border-gray-300">
                                <p className="text-gray-500 mb-2">Bu gün için görev yok</p>
                                <p className="text-sm text-gray-400">+ butonuna tıklayarak ekleyin</p>
                            </div>
                        )}
                    </div>
                </SortableContext>
            </DndContext>

            <AddQuickTodoButton initialDate={selectedDate} onTaskAdded={() => loadTasks(selectedDate)} />
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
