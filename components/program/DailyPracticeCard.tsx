'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

interface DailyPracticeCardProps {
    userId: string
    date: Date
}

export default function DailyPracticeCard({ userId, date }: DailyPracticeCardProps) {
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
        const { data, error } = await supabase
            .from('tasks')
            .select('*, task_types!inner(slug)')
            .eq('user_id', userId)
            .eq('due_date', dateString)
            .eq('task_types.slug', 'music')
            .order('sort_order', { ascending: true })

        if (!error && data) {
            setTasks(data)
        }
        setLoading(false)
    }

    if (loading || tasks.length === 0) return null

    return (
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm mb-4">
            <div className="bg-indigo-50 px-4 py-2 border-b border-indigo-100 flex items-center justify-between">
                <span className="text-xs font-bold text-indigo-800 flex items-center gap-1">
                    🎸 BUGÜNÜN MÜZİK ÇALIŞMASI
                </span>
            </div>
            <div className="p-4 space-y-3">
                {tasks.slice(0, 3).map(task => (
                    <div key={task.id} className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-indigo-100 flex items-center justify-center text-sm">🎹</div>
                        <div className="flex-1">
                            <div className="flex justify-between items-center mb-1">
                                <h4 className="text-[10px] font-bold text-gray-900 uppercase tracking-tight">{task.title}</h4>
                                <span className="text-[10px] font-bold text-indigo-600">
                                    {task.duration_minutes || 0} Dakika
                                </span>
                            </div>
                            <p className="text-xs text-gray-500 line-clamp-1">{task.description}</p>
                            {task.settings?.target_bpm && (
                                <div className="mt-2 w-full bg-gray-100 h-1 rounded-full overflow-hidden">
                                    <div className="bg-indigo-500 h-full" style={{ width: `${Math.min(((task.settings?.current_bpm || 0) / task.settings.target_bpm) * 100, 100)}%` }} />
                                </div>
                            )}
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
