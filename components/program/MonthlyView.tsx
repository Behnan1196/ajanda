'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import AddQuickTodoButton from './AddQuickTodoButton'

interface MonthlyViewProps {
    userId: string
    onDateSelect: (date: Date) => void
}

interface DayData {
    date: Date
    taskCount: number
    completedCount: number
}

export default function MonthlyView({ userId, onDateSelect }: MonthlyViewProps) {
    const [currentMonth, setCurrentMonth] = useState(new Date())
    const [monthData, setMonthData] = useState<Map<string, DayData>>(new Map())
    const [loading, setLoading] = useState(true)
    const supabase = createClient()

    useEffect(() => {
        loadMonthData()
    }, [userId, currentMonth])

    const toLocalISOString = (date: Date) => {
        const year = date.getFullYear()
        const month = String(date.getMonth() + 1).padStart(2, '0')
        const day = String(date.getDate()).padStart(2, '0')
        return `${year}-${month}-${day}`
    }

    const loadMonthData = async () => {
        setLoading(true)

        // Ayın ilk ve son günü
        const year = currentMonth.getFullYear()
        const month = currentMonth.getMonth()
        const firstDay = new Date(year, month, 1)
        const lastDay = new Date(year, month + 1, 0)

        const firstDateStr = toLocalISOString(firstDay)
        const lastDateStr = toLocalISOString(lastDay)

        // Ayın tüm görevlerini çek
        const { data, error } = await supabase
            .from('tasks')
            .select('due_date, is_completed')
            .eq('user_id', userId)
            .gte('due_date', firstDateStr)
            .lte('due_date', lastDateStr)

        if (error) {
            console.error('Error loading month data:', error)
        } else {
            // Tarihlere göre grupla
            const dataMap = new Map<string, DayData>()

            data?.forEach((task) => {
                if (task.due_date) {
                    const existing = dataMap.get(task.due_date)
                    if (existing) {
                        existing.taskCount++
                        if (task.is_completed) existing.completedCount++
                    } else {
                        dataMap.set(task.due_date, {
                            date: new Date(task.due_date),
                            taskCount: 1,
                            completedCount: task.is_completed ? 1 : 0,
                        })
                    }
                }
            })

            setMonthData(dataMap)
        }

        setLoading(false)
    }

    const getDaysInMonth = () => {
        const year = currentMonth.getFullYear()
        const month = currentMonth.getMonth()

        const firstDay = new Date(year, month, 1)
        const lastDay = new Date(year, month + 1, 0)

        // Haftanın ilk günü (Pazartesi = 1, Pazar = 0)
        const firstDayOfWeek = firstDay.getDay()
        const daysInMonth = lastDay.getDate()

        // Önceki aydan gösterilecek günler
        const prevMonthDays = firstDayOfWeek === 0 ? 6 : firstDayOfWeek - 1

        const days: (Date | null)[] = []

        // Önceki ayın günleri
        const prevMonth = new Date(year, month, 0)
        const prevMonthLastDay = prevMonth.getDate()
        for (let i = prevMonthDays; i > 0; i--) {
            days.push(new Date(year, month - 1, prevMonthLastDay - i + 1))
        }

        // Bu ayın günleri
        for (let i = 1; i <= daysInMonth; i++) {
            days.push(new Date(year, month, i))
        }

        // Sonraki ayın günleri (42 gün = 6 hafta)
        const remainingDays = 42 - days.length
        for (let i = 1; i <= remainingDays; i++) {
            days.push(new Date(year, month + 1, i))
        }

        return days
    }

    const goToPreviousMonth = () => {
        setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1))
    }

    const goToNextMonth = () => {
        setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1))
    }

    const goToToday = () => {
        setCurrentMonth(new Date())
    }

    const isToday = (date: Date) => {
        const today = new Date()
        return date.toDateString() === today.toDateString()
    }

    const isCurrentMonth = (date: Date) => {
        return date.getMonth() === currentMonth.getMonth()
    }

    const handleDateClick = (date: Date) => {
        onDateSelect(date)
    }

    const monthName = currentMonth.toLocaleDateString('tr-TR', {
        month: 'long',
        year: 'numeric',
    })

    const weekDays = ['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz']

    const days = getDaysInMonth()

    return (
        <div className="p-4">
            {/* Header */}
            <div className="mb-4">
                <div className="flex items-center justify-between mb-4">
                    <button
                        onClick={goToPreviousMonth}
                        className="p-2 hover:bg-gray-100 rounded-lg transition"
                    >
                        <svg className="w-5 h-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                    </button>

                    <h2 className="text-lg font-semibold text-gray-900 capitalize">
                        {monthName}
                    </h2>

                    <button
                        onClick={goToNextMonth}
                        className="p-2 hover:bg-gray-100 rounded-lg transition"
                    >
                        <svg className="w-5 h-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                    </button>
                </div>

                <button
                    onClick={goToToday}
                    className="w-full px-4 py-2 text-sm bg-indigo-50 text-indigo-600 rounded-lg hover:bg-indigo-100 transition font-medium"
                >
                    Bu Aya Dön
                </button>
            </div>

            {/* Calendar Grid */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                {/* Week Days */}
                <div className="grid grid-cols-7 border-b border-gray-200 bg-gray-50">
                    {weekDays.map((day) => (
                        <div key={day} className="text-center py-2 text-xs font-medium text-gray-600">
                            {day}
                        </div>
                    ))}
                </div>

                {/* Days Grid */}
                <div className="grid grid-cols-7">
                    {days.map((date, index) => {
                        if (!date) return <div key={index} />

                        const dateStr = toLocalISOString(date)
                        const dayData = monthData.get(dateStr)
                        const today = isToday(date)
                        const currentMonth = isCurrentMonth(date)

                        return (
                            <button
                                key={index}
                                onClick={() => handleDateClick(date)}
                                className={`
                  aspect-square p-2 border-b border-r border-gray-100 
                  hover:bg-indigo-50 transition relative
                  ${!currentMonth ? 'bg-gray-50 text-gray-400' : 'text-gray-900'}
                  ${today ? 'bg-indigo-100 font-semibold' : ''}
                `}
                            >
                                <div className="text-sm">
                                    {date.getDate()}
                                </div>

                                {dayData && dayData.taskCount > 0 && (
                                    <div className={`absolute bottom-0.5 right-0.5 text-[10px] font-medium px-1 rounded ${dayData.completedCount === dayData.taskCount
                                        ? 'bg-green-100 text-green-700'
                                        : dayData.completedCount > 0
                                            ? 'bg-yellow-100 text-yellow-700'
                                            : 'bg-indigo-100 text-indigo-700'
                                        }`}>
                                        {dayData.completedCount}/{dayData.taskCount}
                                    </div>
                                )}
                            </button>
                        )
                    })}
                </div>
            </div>
            <AddQuickTodoButton onTaskAdded={loadMonthData} />
        </div>
    )
}
