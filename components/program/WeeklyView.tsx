'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import TaskCard from './TaskCard'
import TaskFormModal from './TaskFormModal'

interface Task {
    id: string
    title: string
    description: string | null
    task_type_id: string
    metadata: any
    due_date: string | null
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
    relationship?: {
        role_label: string
    } | null
}

interface WeeklyViewProps {
    userId: string
    onDateSelect?: (date: Date) => void
    relationshipId?: string // Context
}

export default function WeeklyView({ userId, onDateSelect = () => { }, relationshipId }: WeeklyViewProps) {
    const [currentWeekStart, setCurrentWeekStart] = useState(getStartOfWeek(new Date()))
    const [weekTasks, setWeekTasks] = useState<Map<string, Task[]>>(new Map())
    const [loading, setLoading] = useState(true)
    const [showTaskModal, setShowTaskModal] = useState(false)
    const [selectedDate, setSelectedDate] = useState<Date>(new Date())
    const supabase = createClient()

    // Helper to get start of week (Monday)
    function getStartOfWeek(date: Date) {
        const d = new Date(date)
        const day = d.getDay()
        const diff = d.getDate() - day + (day === 0 ? -6 : 1) // Adjust when day is Sunday
        const start = new Date(d.setDate(diff))
        start.setHours(0, 0, 0, 0)
        return start
    }

    useEffect(() => {
        loadWeekTasks()
    }, [userId, currentWeekStart])

    const loadWeekTasks = async (silent = false) => {
        if (!silent) setLoading(true)

        const start = new Date(currentWeekStart)
        const end = new Date(start)
        end.setDate(end.getDate() + 6)
        end.setHours(23, 59, 59, 999)

        const startStr = start.toISOString().split('T')[0]
        const endStr = end.toISOString().split('T')[0]

        const { data, error } = await supabase
            .from('tasks')
            .select(`
        *,
        task_types (name, slug, icon),
        subjects (name, icon, color),
        topics (name),
        relationship:relationship_id (role_label)
      `)
            .eq('user_id', userId)
            .gte('due_date', startStr)
            .lte('due_date', endStr)
            .order('due_time', { ascending: true, nullsFirst: false })

        if (error) {
            console.error('Error loading tasks:', error)
        } else {
            const tasksMap = new Map<string, Task[]>()
            data?.forEach((task: any) => {
                if (task.due_date) {
                    const current = tasksMap.get(task.due_date) || []
                    current.push(task)
                    tasksMap.set(task.due_date, current)
                }
            })
            setWeekTasks(tasksMap)
        }
        if (!silent) setLoading(false)
    }

    const getDaysInWeek = () => {
        const days = []
        const start = new Date(currentWeekStart)
        for (let i = 0; i < 7; i++) {
            const d = new Date(start)
            d.setDate(d.getDate() + i)
            days.push(d)
        }
        return days
    }

    const isToday = (date: Date) => {
        return date.toDateString() === new Date().toDateString()
    }

    const getTaskIcon = (icon: string | null) => {
        if (!icon) return null
        if (icon === 'check-square') return '📝'
        if (icon === 'play-circle') return '🎥'
        if (icon === 'users') return '👥'
        return icon
    }

    const navigateWeek = (direction: 'prev' | 'next') => {
        const newStart = new Date(currentWeekStart)
        newStart.setDate(newStart.getDate() + (direction === 'next' ? 7 : -7))
        setCurrentWeekStart(newStart)
    }

    const goToThisWeek = () => {
        setCurrentWeekStart(getStartOfWeek(new Date()))
    }

    // Task handling (Completed only for now, can expand to edit/delete)
    const handleTaskComplete = async (taskId: string) => {
        const { error } = await supabase
            .from('tasks')
            .update({ is_completed: true, completed_at: new Date().toISOString() })
            .eq('id', taskId)

        if (!error) loadWeekTasks(true) // Silent reload
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
            loadWeekTasks(true) // Silent reload
        }
    }

    const weekDays = getDaysInWeek()
    const monthName = currentWeekStart.toLocaleDateString('tr-TR', { month: 'long', year: 'numeric' })

    if (loading) {
        return (
            <div className="flex justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
            </div>
        )
    }

    return (
        <div className="space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between">
                <button onClick={() => navigateWeek('prev')} className="p-2 hover:bg-gray-100 rounded-lg">
                    <svg className="w-5 h-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                </button>

                <div className="text-center">
                    <h2 className="text-lg font-semibold text-gray-900 capitalize">{monthName}</h2>
                    <button onClick={goToThisWeek} className="text-sm text-indigo-600 font-medium hover:text-indigo-800">
                        Bu Hafta
                    </button>
                </div>

                <button onClick={() => navigateWeek('next')} className="p-2 hover:bg-gray-100 rounded-lg">
                    <svg className="w-5 h-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                </button>
            </div>

            {/* Week Grid */}
            <div className="grid grid-cols-1 md:grid-cols-7 gap-4">
                {weekDays.map((date) => {
                    const dateStr = date.toISOString().split('T')[0]
                    const tasksForDay = weekTasks.get(dateStr) || []
                    const isDayToday = isToday(date)
                    const dayName = date.toLocaleDateString('tr-TR', { weekday: 'long' })
                    const dayShort = date.toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' })

                    return (
                        <div key={dateStr} className={`group flex flex-col gap-2 min-h-[200px] rounded-xl p-2 border ${isDayToday ? 'bg-indigo-50 border-indigo-200' : 'bg-gray-50 border-gray-200'}`}>
                            {/* Day Header */}
                            <button
                                onClick={() => onDateSelect(date)}
                                className="text-left w-full hover:bg-black/5 rounded p-1 transition"
                            >
                                <div className={`text-xs font-semibold uppercase ${isDayToday ? 'text-indigo-700' : 'text-gray-500'}`}>
                                    {dayName}
                                </div>
                                <div className={`text-sm font-bold ${isDayToday ? 'text-indigo-900' : 'text-gray-900'}`}>
                                    {dayShort}
                                </div>
                            </button>

                            {/* Add Task Button */}
                            <div className="px-1">
                                <button
                                    onClick={() => {
                                        setSelectedDate(date)
                                        setShowTaskModal(true)
                                    }}
                                    className="w-full py-1 text-xs text-indigo-600 font-medium hover:bg-indigo-50 rounded border border-transparent hover:border-indigo-100 flex items-center justify-center gap-1 transition opacity-0 group-hover:opacity-100"
                                >
                                    <span>+</span> Ekle
                                </button>
                            </div>

                            {/* Tasks List */}
                            <div className="flex-1 space-y-2">
                                {tasksForDay.map(task => (
                                    // Minimal Task Card
                                    <div
                                        key={task.id}
                                        className={`bg-white p-2 rounded-lg shadow-sm border border-gray-100 text-xs ${task.is_completed ? 'opacity-50' : ''}`}
                                    >
                                        <div className="flex items-start justify-between gap-1">
                                            <span className="font-medium truncate line-clamp-2">{task.title}</span>
                                            {task.task_types.icon && <span className="text-base">{getTaskIcon(task.task_types.icon)}</span>}
                                        </div>

                                        {/* Assigner Badge */}
                                        {task.relationship?.role_label && (
                                            <div className="mt-1">
                                                <span className="text-[10px] bg-indigo-50 text-indigo-700 px-1 py-0.5 rounded border border-indigo-100 inline-block font-medium">
                                                    {task.relationship.role_label}
                                                </span>
                                            </div>
                                        )}

                                        {task.due_time && (
                                            <div className="text-gray-500 mt-1 text-[10px]">
                                                {task.due_time.substring(0, 5)}
                                            </div>
                                        )}
                                        {/* Simple Checkbox for quick complete */}
                                        <div className="mt-2 pt-2 border-t border-gray-50 flex justify-end">
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation()
                                                    task.is_completed ? handleTaskUncomplete(task.id) : handleTaskComplete(task.id)
                                                }}
                                                className={`w-5 h-5 rounded-full border flex items-center justify-center transition ${task.is_completed
                                                    ? 'bg-green-500 border-green-500 text-white'
                                                    : 'border-gray-300 hover:border-gray-400'
                                                    }`}
                                            >
                                                {task.is_completed && <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>}
                                            </button>
                                        </div>
                                    </div>
                                ))}
                                {tasksForDay.length === 0 && (
                                    <div className="text-center py-4 text-gray-300 text-xs italic">
                                        Boş
                                    </div>
                                )}
                            </div>
                        </div>
                    )
                })}
            </div>

            {/* Task Form Modal */}
            {showTaskModal && (
                <TaskFormModal
                    userId={userId}
                    defaultDate={selectedDate}
                    onClose={() => setShowTaskModal(false)}
                    relationshipId={relationshipId} // Pass context
                    onTaskSaved={() => {
                        setShowTaskModal(false)
                        loadWeekTasks()
                    }}
                />
            )}
        </div>
    )
}
