'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import TaskCard from './TaskCard'
import AddTaskButton from './AddTaskButton'
import AddQuickTodoButton from './AddQuickTodoButton'
import TaskFormModal from './TaskFormModal'

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
}

interface TodayViewProps {
    userId: string
    initialDate?: Date | null
}

export default function TodayView({ userId, initialDate }: TodayViewProps) {
    const [tasks, setTasks] = useState<Task[]>([])
    const [loading, setLoading] = useState(true)
    const [showTaskModal, setShowTaskModal] = useState(false)
    const [editingTask, setEditingTask] = useState<Task | null>(null)
    const [selectedDate, setSelectedDate] = useState(initialDate || new Date())
    const supabase = createClient()

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
            .eq('due_date', dateString)
            .order('due_time', { ascending: true, nullsFirst: false })

        if (error) {
            console.error('Error loading tasks:', error)
        } else {
            setTasks(data as Task[])
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
        setShowTaskModal(true)
    }

    const handleTaskSaved = () => {
        setShowTaskModal(false)
        setEditingTask(null)
        loadTasks(selectedDate)
    }

    const handleCloseModal = () => {
        setShowTaskModal(false)
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
            <div className="mb-4">
                <div className="flex items-center justify-between mb-2">
                    <button
                        onClick={goToPreviousDay}
                        className="p-2 hover:bg-gray-100 rounded-lg transition"
                        aria-label="Önceki gün"
                    >
                        <svg className="w-5 h-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                    </button>

                    <div className="text-center flex-1">
                        <h2 className="text-lg font-semibold text-gray-900 capitalize">
                            {dayName}
                        </h2>
                        <p className="text-sm text-gray-600">{formattedDate}</p>
                    </div>

                    <button
                        onClick={goToNextDay}
                        className="p-2 hover:bg-gray-100 rounded-lg transition"
                        aria-label="Sonraki gün"
                    >
                        <svg className="w-5 h-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                    </button>
                </div>

                {/* Bugüne Dön Butonu */}
                {!isToday() && (
                    <div className="flex justify-center">
                        <button
                            onClick={goToToday}
                            className="px-4 py-1.5 text-sm bg-indigo-50 text-indigo-600 rounded-full hover:bg-indigo-100 transition font-medium"
                        >
                            Bugüne Dön
                        </button>
                    </div>
                )}

                <div className="text-center mt-2">
                    <p className="text-sm text-gray-600">
                        {tasks.length === 0 ? 'Bu gün için görev yok' : `${tasks.length} görev`}
                    </p>
                </div>
            </div>

            <div className="space-y-3 mb-20">
                {tasks.map((task) => (
                    <TaskCard
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
        </div>
    )
}
