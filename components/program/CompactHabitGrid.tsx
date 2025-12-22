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
    DragStartEvent,
    DragOverlay,
} from '@dnd-kit/core'
import {
    SortableContext,
    verticalListSortingStrategy,
    arrayMove,
} from '@dnd-kit/sortable'
import { CompactHabitRow } from './CompactHabitComponents'

interface Habit {
    id: string
    name: string
    description: string | null
    color: string
    icon: string
    current_streak: number
    longest_streak: number
}

interface CompactHabitGridProps {
    userId: string
    onEdit: (habit: Habit) => void
}

export default function CompactHabitGrid({ userId, onEdit }: CompactHabitGridProps) {
    const [habits, setHabits] = useState<Habit[]>([])
    const [completions, setCompletions] = useState<Map<string, Set<string>>>(new Map())
    const [weekStart, setWeekStart] = useState<Date>(getMonday(new Date()))
    const [loading, setLoading] = useState(true)
    const [activeId, setActiveId] = useState<string | null>(null)
    const supabase = createClient()

    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
        useSensor(TouchSensor, { activationConstraint: { delay: 250, tolerance: 5 } })
    )

    function getMonday(date: Date): Date {
        const d = new Date(date)
        const day = d.getDay()
        const diff = d.getDate() - day + (day === 0 ? -6 : 1)
        return new Date(d.setDate(diff))
    }

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

        if (data) setHabits(data)
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
            if (!completionMap.has(c.habit_id)) completionMap.set(c.habit_id, new Set())
            completionMap.get(c.habit_id)!.add(c.completed_date)
        })
        setCompletions(completionMap)
    }

    const isCompleted = (habitId: string, date: Date) => {
        return completions.get(habitId)?.has(date.toISOString().split('T')[0]) || false
    }

    const isToday = (date: Date) => date.toDateString() === new Date().toDateString()

    const toggleCompletion = async (habitId: string, date: Date) => {
        const dateStr = date.toISOString().split('T')[0]
        const completed = isCompleted(habitId, date)

        if (completed) {
            await supabase.from('habit_completions').delete().eq('habit_id', habitId).eq('user_id', userId).eq('completed_date', dateStr)
        } else {
            await supabase.from('habit_completions').insert({ habit_id: habitId, user_id: userId, completed_date: dateStr, count: 1 })
        }
        await loadCompletions()
    }

    const handleDelete = async (habitId: string) => {
        if (!confirm('Bu alışkanlığı silmek istediğinize emin misiniz?')) return
        await supabase.from('habits').update({ is_active: false }).eq('id', habitId)
        loadHabits()
    }

    const handleDragStart = (event: DragStartEvent) => {
        setActiveId(event.active.id as string)
    }

    const handleDragEnd = async (event: DragEndEvent) => {
        setActiveId(null)
        const { active, over } = event
        if (!over || active.id === over.id) return
        const oldIndex = habits.findIndex(h => h.id === active.id)
        const newIndex = habits.findIndex(h => h.id === over.id)
        const newHabits = arrayMove(habits, oldIndex, newIndex)
        setHabits(newHabits)

        await Promise.all(
            newHabits.map((h, i) =>
                supabase.from('habits').update({ sort_order: i }).eq('id', h.id)
            )
        )
    }

    if (loading) return <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div></div>

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between bg-white rounded-xl p-3 shadow-sm border border-gray-100">
                <button onClick={() => setWeekStart(new Date(weekStart.setDate(weekStart.getDate() - 7)))} className="p-1 hover:bg-gray-100 rounded">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M15 19l-7-7 7-7" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" /></svg>
                </button>
                <div className="text-center">
                    <div className="text-sm font-bold text-gray-900">
                        {weekDates[0].toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' })} - {weekDates[6].toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' })}
                    </div>
                </div>
                <button onClick={() => setWeekStart(new Date(weekStart.setDate(weekStart.getDate() + 7)))} className="p-1 hover:bg-gray-100 rounded">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M9 5l7 7-7 7" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" /></svg>
                </button>
            </div>

            <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragStart={handleDragStart}
                onDragEnd={handleDragEnd}
            >
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                    <table className="w-full text-xs">
                        <thead>
                            <tr className="bg-gray-50 border-b border-gray-100">
                                <th className="p-2 w-8"></th>
                                <th className="p-2 text-left text-gray-400 font-medium"></th>
                                {weekDates.map((date, i) => (
                                    <th key={i} className="p-2 text-center">
                                        <div className={`text-[10px] ${isToday(date) ? 'text-indigo-600 font-bold' : 'text-gray-400'}`}>
                                            {dayNames[i]}
                                        </div>
                                        <div className={`font-bold ${isToday(date) ? 'text-indigo-700' : 'text-gray-900'}`}>{date.getDate()}</div>
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            <SortableContext items={habits.map(h => h.id)} strategy={verticalListSortingStrategy}>
                                {habits.map(habit => (
                                    <CompactHabitRow
                                        key={habit.id}
                                        habit={habit}
                                        weekDates={weekDates}
                                        isCompleted={isCompleted}
                                        isToday={isToday}
                                        toggleCompletion={toggleCompletion}
                                        onEdit={onEdit}
                                        onDelete={handleDelete}
                                    />
                                ))}
                            </SortableContext>
                        </tbody>
                    </table>
                </div>
                <DragOverlay>
                    {activeId ? (
                        <table className="w-full text-xs opacity-80 backdrop-blur-sm">
                            <tbody>
                                <CompactHabitRow
                                    habit={habits.find(h => h.id === activeId)!}
                                    weekDates={weekDates}
                                    isCompleted={isCompleted}
                                    isToday={isToday}
                                    toggleCompletion={() => { }}
                                    onEdit={() => { }}
                                    onDelete={() => { }}
                                />
                            </tbody>
                        </table>
                    ) : null}
                </DragOverlay>
            </DndContext>
        </div>
    )
}
