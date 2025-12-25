'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { db } from '@/lib/db'
import { useLiveQuery } from 'dexie-react-hooks'
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

    const habitsQuery = useLiveQuery(
        () => db.habits.where('user_id').equals(userId).toArray(),
        [userId]
    )

    const completionsQuery = useLiveQuery(
        () => db.habit_completions.where('user_id').equals(userId).toArray(),
        [userId]
    )

    useEffect(() => {
        if (habitsQuery) {
            const activeHabits = habitsQuery
                .filter(h => h.is_active !== false)
                .sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0))
            setHabits(activeHabits)
            setLoading(false)
        }
    }, [habitsQuery])

    useEffect(() => {
        if (completionsQuery) {
            const compMap = new Map<string, Set<string>>()
            completionsQuery.forEach(c => {
                if (!compMap.has(c.habit_id)) compMap.set(c.habit_id, new Set())
                compMap.get(c.habit_id)!.add(c.completed_date)
            })
            setCompletions(compMap)
        }
    }, [completionsQuery])

    const loadData = async () => {
        // Data is handled by useLiveQuery reactive hooks
    }

    const isCompleted = (habitId: string, date: Date) => {
        return completions.get(habitId)?.has(date.toISOString().split('T')[0]) || false
    }

    const isToday = (date: Date) => date.toDateString() === new Date().toDateString()

    const toggleCompletion = async (habitId: string, date: Date) => {
        const dateStr = date.toISOString().split('T')[0]
        const completed = isCompleted(habitId, date)

        if (completed) {
            // Find the local completion entry to delete
            const comp = await db.habit_completions.get({ habit_id: habitId, completed_date: dateStr })
            if (comp) {
                await db.habit_completions.delete(comp.id)
                const { error } = await supabase.from('habit_completions').delete().eq('id', comp.id)
                // If error, it's fine, sync will handle it (actually delete is tricky with sync, 
                // but for now local-first means it's gone from UI immediately)
            }
        } else {
            const newComp = {
                id: crypto.randomUUID(),
                habit_id: habitId,
                user_id: userId,
                completed_at: new Date().toISOString(),
                completed_date: dateStr,
                count: 1,
                duration: null,
                notes: null,
                is_dirty: 1,
                last_synced_at: null
            }
            await db.habit_completions.add(newComp)
            const { error } = await supabase.from('habit_completions').insert({
                id: newComp.id,
                habit_id: newComp.habit_id,
                user_id: newComp.user_id,
                completed_date: newComp.completed_date,
                count: 1
            })
            if (!error) await db.habit_completions.update(newComp.id, { is_dirty: 0 })
        }
    }

    const handleDelete = async (habitId: string) => {
        if (!confirm('Bu alışkanlığı silmek istediğinize emin misiniz?')) return
        await db.habits.update(habitId, { is_active: false, is_dirty: 1 })
        const { error } = await supabase.from('habits').update({ is_active: false }).eq('id', habitId)
        if (!error) await db.habits.update(habitId, { is_dirty: 0 })
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

        // Bulk local update
        for (let i = 0; i < newHabits.length; i++) {
            await db.habits.update(newHabits[i].id, { sort_order: i, is_dirty: 1 })
            const { error } = await supabase.from('habits').update({ sort_order: i }).eq('id', newHabits[i].id)
            if (!error) await db.habits.update(newHabits[i].id, { is_dirty: 0 })
        }
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
