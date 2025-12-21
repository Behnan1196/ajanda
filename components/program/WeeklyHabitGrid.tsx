'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
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
    useSortable,
    arrayMove,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { SortableHabitRow, SortableHabitCard } from './SortableHabitComponents'

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

    // Drag & Drop sensors
    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 8, // 8px movement to activate
            },
        }),
        useSensor(TouchSensor, {
            activationConstraint: {
                delay: 250, // Long press on mobile
                tolerance: 5,
            },
        })
    )

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
            .select('id, name, description, color, icon, current_streak, longest_streak, sort_order')
            .eq('user_id', userId)
            .eq('is_active', true)
            .order('sort_order', { ascending: true })

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

    const handleDragEnd = async (event: DragEndEvent) => {
        const { active, over } = event

        if (!over || active.id === over.id) return

        const oldIndex = habits.findIndex(h => h.id === active.id)
        const newIndex = habits.findIndex(h => h.id === over.id)

        // Optimistic update
        const newHabits = arrayMove(habits, oldIndex, newIndex)
        setHabits(newHabits)

        // Update database
        await updateSortOrder(newHabits)
    }

    const updateSortOrder = async (reorderedHabits: typeof habits) => {
        // Update each habit's sort_order
        for (let i = 0; i < reorderedHabits.length; i++) {
            await supabase
                .from('habits')
                .update({ sort_order: i })
                .eq('id', reorderedHabits[i].id)
        }
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
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                <div className="hidden md:block overflow-x-auto bg-white rounded-2xl shadow-sm">
                    <table className="w-full">
                        <thead>
                            <tr className="border-b-2 border-gray-200">
                                <th className="text-left p-4 font-bold text-gray-900 w-8"></th>
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
                            <SortableContext items={habits.map(h => h.id)} strategy={verticalListSortingStrategy}>
                                {habits.map(habit => (
                                    <SortableHabitRow
                                        key={habit.id}
                                        habit={habit}
                                        weekDates={weekDates}
                                        isCompleted={isCompleted}
                                        isToday={isToday}
                                        toggleCompletion={toggleCompletion}
                                    />
                                ))}
                            </SortableContext>
                        </tbody>
                    </table>
                </div>
            </DndContext>

            {/* Mobile Card View */}
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                <div className="block md:hidden space-y-3">
                    <SortableContext items={habits.map(h => h.id)} strategy={verticalListSortingStrategy}>
                        {habits.map(habit => (
                            <SortableHabitCard
                                key={habit.id}
                                habit={habit}
                                weekDates={weekDates}
                                dayNames={dayNames}
                                isCompleted={isCompleted}
                                isToday={isToday}
                                toggleCompletion={toggleCompletion}
                            />
                        ))}
                    </SortableContext>
                </div>
            </DndContext>
        </div>
    )
}
