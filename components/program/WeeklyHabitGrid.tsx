'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

interface Habit {
    id: string
    name: string
    description: string | null
    color: string
    icon: string
    current_streak: number
    longest_streak: number
}

interface WeeklyHabitGridProps {
    userId: string
}

export default function WeeklyHabitGrid({ userId }: WeeklyHabitGridProps) {
    const [habits, setHabits] = useState<Habit[]>([])
    const [completions, setCompletions] = useState<Map<string, Set<string>>>(new Map())
    const [weekStart, setWeekStart] = useState<Date>(getMonday(new Date()))
    const [loading, setLoading] = useState(true)
    const supabase = createClient()

    // Get Monday of the week for a given date
    function getMonday(date: Date): Date {
        const d = new Date(date)
        const day = d.getDay()
        const diff = d.getDate() - day + (day === 0 ? -6 : 1) // Adjust when day is Sunday
        return new Date(d.setDate(diff))
    }

    // Generate array of 7 dates starting from Monday
    const weekDates = Array.from({ length: 7 }, (_, i) => {
        const date = new Date(weekStart)
        date.setDate(weekStart.getDate() + i)
        return date
    })

    const dayNames = ['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz']

    useEffect(() => {
        loadData()
    }, [userId, weekStart])

    const loadData = async () => {
        setLoading(true)
        await Promise.all([loadHabits(), loadCompletions()])
        setLoading(false)
    }

    const loadHabits = async () => {
        const { data } = await supabase
            .from('habits')
            .select('id, name, description, color, icon, current_streak, longest_streak')
            .eq('user_id', userId)
            .eq('is_active', true)
            .order('created_at', { ascending: false })

        if (data) {
            setHabits(data)
        }
    }

    const loadCompletions = async () => {
        const weekEnd = new Date(weekStart)
        weekEnd.setDate(weekEnd.getDate() + 6)

        const { data } = await supabase
            .from('habit_completions')
            .select('habit_id, completed_date')
            .eq('user_id', userId)
            .gte('completed_date', weekStart.toISOString().split('T')[0])
            .lte('completed_date', weekEnd.toISOString().split('T')[0])

        const completionMap = new Map<string, Set<string>>()
        data?.forEach(c => {
            if (!completionMap.has(c.habit_id)) {
                completionMap.set(c.habit_id, new Set())
            }
            completionMap.get(c.habit_id)!.add(c.completed_date)
        })

        setCompletions(completionMap)
    }

    const isCompleted = (habitId: string, date: Date): boolean => {
        const dateStr = date.toISOString().split('T')[0]
        return completions.get(habitId)?.has(dateStr) || false
    }

    const isToday = (date: Date): boolean => {
        const today = new Date()
        return date.toDateString() === today.toDateString()
    }

    const toggleCompletion = async (habitId: string, date: Date) => {
        const dateStr = date.toISOString().split('T')[0]
        const completed = isCompleted(habitId, date)

        if (completed) {
            // Delete completion
            await supabase
                .from('habit_completions')
                .delete()
                .eq('habit_id', habitId)
                .eq('user_id', userId)
                .eq('completed_date', dateStr)
        } else {
            // Create completion
            await supabase
                .from('habit_completions')
                .insert({
                    habit_id: habitId,
                    user_id: userId,
                    completed_date: dateStr,
                    count: 1
                })
        }

        // Refresh data
        await loadData()
    }

    const navigateWeek = (direction: 'prev' | 'next') => {
        const newStart = new Date(weekStart)
        newStart.setDate(newStart.getDate() + (direction === 'next' ? 7 : -7))
        setWeekStart(newStart)
    }

    const goToThisWeek = () => {
        setWeekStart(getMonday(new Date()))
    }

    if (loading) {
        return (
            <div className="flex justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
            </div>
        )
    }

    if (habits.length === 0) {
        return (
            <div className="text-center py-12">
                <div className="text-4xl mb-4">⭐</div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                    Henüz alışkanlık eklenmemiş
                </h3>
                <p className="text-gray-600">
                    İlk alışkanlığını ekleyerek başla!
                </p>
            </div>
        )
    }

    return (
        <div className="space-y-4">
            {/* Week Navigation */}
            <div className="flex items-center justify-between bg-white rounded-2xl p-4 shadow-sm">
                <button
                    onClick={() => navigateWeek('prev')}
                    className="p-2 hover:bg-gray-100 rounded-lg transition"
                >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                </button>

                <div className="text-center">
                    <div className="font-bold text-gray-900">
                        {weekDates[0].toLocaleDateString('tr-TR', { day: 'numeric', month: 'long' })} - {weekDates[6].toLocaleDateString('tr-TR', { day: 'numeric', month: 'long' })}
                    </div>
                    <button
                        onClick={goToThisWeek}
                        className="text-xs text-indigo-600 hover:underline mt-1"
                    >
                        Bu Haftaya Dön
                    </button>
                </div>

                <button
                    onClick={() => navigateWeek('next')}
                    className="p-2 hover:bg-gray-100 rounded-lg transition"
                >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                </button>
            </div>

            {/* Desktop Table View */}
            <div className="hidden md:block overflow-x-auto bg-white rounded-2xl shadow-sm">
                <table className="w-full">
                    <thead>
                        <tr className="border-b-2 border-gray-200">
                            <th className="text-left p-4 font-bold text-gray-900">Alışkanlık</th>
                            {weekDates.map((date, i) => (
                                <th key={i} className="text-center p-4 w-20">
                                    <div className={`text-xs ${isToday(date) ? 'text-indigo-600 font-bold' : 'text-gray-500'}`}>
                                        {dayNames[i]}
                                    </div>
                                    <div className={`text-sm font-bold ${isToday(date) ? 'text-indigo-600' : 'text-gray-900'}`}>
                                        {date.getDate()}
                                    </div>
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {habits.map(habit => (
                            <tr key={habit.id} className="border-b border-gray-100 hover:bg-gray-50 transition">
                                <td className="p-4">
                                    <div className="flex items-center gap-3">
                                        <div
                                            className="w-10 h-10 rounded-lg flex items-center justify-center text-xl"
                                            style={{ backgroundColor: `${habit.color}15` }}
                                        >
                                            {habit.icon}
                                        </div>
                                        <div>
                                            <div className="font-semibold text-gray-900">{habit.name}</div>
                                            {habit.current_streak > 0 && (
                                                <div className="text-xs text-gray-500">
                                                    🔥 {habit.current_streak} gün
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </td>
                                {weekDates.map((date, i) => (
                                    <td key={i} className="text-center p-4">
                                        <button
                                            onClick={() => toggleCompletion(habit.id, date)}
                                            className={`w-10 h-10 rounded-full transition-all ${isCompleted(habit.id, date)
                                                    ? 'text-white shadow-md'
                                                    : 'bg-gray-100 text-gray-400 hover:bg-gray-200'
                                                }`}
                                            style={isCompleted(habit.id, date) ? { backgroundColor: habit.color } : {}}
                                        >
                                            {isCompleted(habit.id, date) ? '✓' : '○'}
                                        </button>
                                    </td>
                                ))}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Mobile Card View */}
            <div className="block md:hidden space-y-3">
                {habits.map(habit => (
                    <div key={habit.id} className="bg-white rounded-2xl p-4 shadow-sm">
                        {/* Header */}
                        <div className="flex items-center gap-3 mb-3">
                            <div
                                className="w-12 h-12 rounded-lg flex items-center justify-center text-2xl"
                                style={{ backgroundColor: `${habit.color}15` }}
                            >
                                {habit.icon}
                            </div>
                            <div className="flex-1">
                                <div className="font-bold text-gray-900">{habit.name}</div>
                                {habit.current_streak > 0 && (
                                    <div className="text-xs text-gray-500">
                                        🔥 {habit.current_streak} gün streak
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Week Grid */}
                        <div className="grid grid-cols-7 gap-1">
                            {weekDates.map((date, i) => (
                                <button
                                    key={i}
                                    onClick={() => toggleCompletion(habit.id, date)}
                                    className="flex flex-col items-center p-2 rounded-lg transition"
                                >
                                    <div className={`text-[10px] mb-1 ${isToday(date) ? 'text-indigo-600 font-bold' : 'text-gray-500'}`}>
                                        {dayNames[i]}
                                    </div>
                                    <div
                                        className={`w-8 h-8 rounded-full flex items-center justify-center text-sm transition-all ${isCompleted(habit.id, date)
                                                ? 'text-white shadow-md'
                                                : 'bg-gray-100 text-gray-400'
                                            }`}
                                        style={isCompleted(habit.id, date) ? { backgroundColor: habit.color } : {}}
                                    >
                                        {isCompleted(habit.id, date) ? '✓' : date.getDate()}
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
}
