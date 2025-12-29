'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

interface DailyNutritionCardProps {
    userId: string
    date: Date
}

export default function DailyNutritionCard({ userId, date }: DailyNutritionCardProps) {
    const [tasks, setTasks] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const supabase = createClient()

    const toLocalISOString = (d: Date) => {
        const offset = d.getTimezoneOffset()
        const localDate = new Date(d.getTime() - (offset * 60 * 1000))
        return localDate.toISOString().split('T')[0]
    }

    const dateString = toLocalISOString(date)

    useEffect(() => {
        loadData()
    }, [userId, dateString])

    const loadData = async () => {
        setLoading(true)
        // Query tasks from the unified table that match the nutrition type
        const { data, error } = await supabase
            .from('tasks')
            .select('*, task_types!inner(slug)')
            .eq('user_id', userId)
            .eq('due_date', dateString)
            .eq('task_types.slug', 'nutrition')
            .order('sort_order', { ascending: true })

        if (!error && data) {
            setTasks(data)
        }
        setLoading(false)
    }

    const handleToggleTask = async (taskId: string, currentState: boolean) => {
        const { error } = await supabase
            .from('tasks')
            .update({
                is_completed: !currentState,
                completed_at: !currentState ? new Date().toISOString() : null
            })
            .eq('id', taskId)

        if (!error) {
            setTasks(prev => prev.map(t => t.id === taskId ? { ...t, is_completed: !currentState } : t))
        }
    }

    if (loading || tasks.length === 0) return null

    // Group tasks by meal type if available in settings
    const meals = tasks.map(t => ({
        id: t.id,
        title: t.title,
        content: t.description,
        isConfirmed: t.is_completed,
        mealType: t.settings?.meal_type || 'Öğün',
        calories: t.settings?.calories
    }))

    // Calculate total calories consumed today from completed tasks
    const totalCalories = meals.reduce((sum, m) => sum + (m.isConfirmed ? (m.calories || 0) : 0), 0)

    return (
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm mb-4">
            <div className="bg-green-50 px-4 py-2 border-b border-green-100 flex items-center justify-between">
                <span className="text-xs font-bold text-green-800 flex items-center gap-1">
                    🍏 BUGÜNÜN BESLENME PLANI
                </span>
                <span className="text-[10px] font-bold text-green-600 bg-green-100 px-2 py-0.5 rounded-full">
                    🔥 {totalCalories} kcal Alındı
                </span>
            </div>
            <div className="p-4 space-y-3">
                {meals.map(meal => (
                    <div key={meal.id} className="flex items-start gap-3 group">
                        <button
                            onClick={() => handleToggleTask(meal.id, meal.isConfirmed)}
                            className={`mt-0.5 w-5 h-5 rounded-md border flex items-center justify-center transition-all ${meal.isConfirmed
                                ? 'bg-green-500 border-green-500 text-white'
                                : 'bg-white border-gray-200 text-transparent hover:border-green-300'
                                }`}
                        >
                            {meal.isConfirmed ? <span className="text-[10px]">✓</span> : <span className="text-[10px]">○</span>}
                        </button>
                        <div className="flex-1">
                            <h4 className={`text-[10px] font-bold uppercase tracking-wider ${meal.isConfirmed ? 'text-gray-400' : 'text-gray-900'}`}>
                                {meal.mealType} {meal.calories ? `- ${meal.calories} kcal` : ''}
                            </h4>
                            <p className={`text-xs ${meal.isConfirmed ? 'text-gray-400 line-through' : 'text-gray-600'} line-clamp-2`}>
                                {meal.title}: {meal.content}
                            </p>
                        </div>
                    </div>
                ))}
            </div>
            <div className="px-4 py-2 bg-gray-50 border-t border-gray-100 text-center">
                <p className="text-[10px] text-gray-400 font-medium italic">Birleşik Mimari ile yönetiliyor</p>
            </div>
        </div>
    )
}
