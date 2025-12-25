'use client'

import { useState, useEffect } from 'react'
import { getExercises } from '@/app/actions/music'

interface DailyPracticeCardProps {
    userId: string
    date: Date
}

export default function DailyPracticeCard({ userId, date }: DailyPracticeCardProps) {
    const [exercises, setExercises] = useState<any[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        loadData()
    }, [userId])

    const loadData = async () => {
        const res = await getExercises(userId)
        if (res.data) setExercises(res.data)
        setLoading(false)
    }

    if (loading || exercises.length === 0) return null

    return (
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm mb-4">
            <div className="bg-indigo-50 px-4 py-2 border-b border-indigo-100 flex items-center justify-between">
                <span className="text-xs font-bold text-indigo-800 flex items-center gap-1">
                    🎸 BUGÜNÜN REHBERLİ ÇALIŞMASI
                </span>
            </div>
            <div className="p-4 space-y-3">
                {exercises.slice(0, 3).map(ex => (
                    <div key={ex.id} className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-indigo-100 flex items-center justify-center text-sm">🎹</div>
                        <div className="flex-1">
                            <div className="flex justify-between items-center mb-1">
                                <h4 className="text-[10px] font-bold text-gray-900 uppercase tracking-tight">{ex.name}</h4>
                                <span className="text-[10px] font-bold text-indigo-600">{ex.current_bpm} / {ex.target_bpm} BPM</span>
                            </div>
                            <div className="w-full bg-gray-100 h-1 rounded-full overflow-hidden">
                                <div className="bg-indigo-500 h-full" style={{ width: `${Math.min((ex.current_bpm / ex.target_bpm) * 100, 100)}%` }} />
                            </div>
                        </div>
                    </div>
                ))}
            </div>
            <div className="px-4 py-2 bg-gray-50 border-t border-gray-100 text-center">
                <p className="text-[10px] text-gray-400 font-medium italic">Çalışmayı başlatmak için "Araçlar {'>'} Enstrüman Günlüğü"ne git</p>
            </div>
        </div>
    )
}
