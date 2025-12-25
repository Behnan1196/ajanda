'use client'

import { useState, useEffect } from 'react'
import { getDietPlans, getDailyLog, updateDailyLog } from '@/app/actions/nutrition'

interface DailyNutritionCardProps {
    userId: string
    date: Date
}

export default function DailyNutritionCard({ userId, date }: DailyNutritionCardProps) {
    const [dietPlans, setDietPlans] = useState<any[]>([])
    const [dailyLog, setDailyLog] = useState<any>(null)
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)

    const dateString = date.toISOString().split('T')[0]
    const dayOfWeek = (date.getDay() + 6) % 7

    useEffect(() => {
        loadData()
    }, [userId, dateString])

    const loadData = async () => {
        setLoading(true)
        const [dRes, lRes] = await Promise.all([
            getDietPlans(userId),
            getDailyLog(userId, dateString)
        ])
        if (dRes.data) setDietPlans(dRes.data)
        if (lRes.data) setDailyLog(lRes.data)
        else setDailyLog(null)
        setLoading(false)
    }

    const handleToggleMeal = async (meal: string, currentState: boolean) => {
        setSaving(true)
        const currentConfirmations = dailyLog?.meal_confirmations || {}
        const newConfirmations = { ...currentConfirmations, [meal]: !currentState }

        const res = await updateDailyLog(userId, dateString, {
            meal_confirmations: newConfirmations
        })

        if (res.success) {
            loadData()
        }
        setSaving(false)
    }

    if (loading) return null

    const todaysMenu = dietPlans.filter(p => p.day_of_week === dayOfWeek)
    if (todaysMenu.length === 0) return null

    const water = dailyLog?.water_ml || 0
    const confirmations = dailyLog?.meal_confirmations || {}

    return (
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm mb-4">
            <div className="bg-green-50 px-4 py-2 border-b border-green-100 flex items-center justify-between">
                <span className="text-xs font-bold text-green-800 flex items-center gap-1">
                    🍏 BUGÜNÜN BESLENME PLANI
                </span>
                <span className="text-[10px] font-bold text-blue-600 bg-blue-100 px-2 py-0.5 rounded-full">
                    💧 {(water / 1000).toFixed(1)}L Su
                </span>
            </div>
            <div className="p-4 space-y-3">
                {['Kahvaltı', 'Öğle', 'Akşam', 'Ara Öğün'].map(meal => {
                    const item = todaysMenu.find(p => p.meal_type === meal)
                    if (!item) return null
                    const isConfirmed = !!confirmations[meal]

                    return (
                        <div key={meal} className="flex items-start gap-3 group">
                            <button
                                onClick={() => handleToggleMeal(meal, isConfirmed)}
                                disabled={saving}
                                className={`mt-0.5 w-5 h-5 rounded-md border flex items-center justify-center transition-all ${isConfirmed
                                    ? 'bg-green-500 border-green-500 text-white'
                                    : 'bg-white border-gray-200 text-transparent hover:border-green-300'
                                    }`}
                            >
                                {isConfirmed ? <span className="text-[10px]">✓</span> : <span className="text-[10px]">○</span>}
                            </button>
                            <div className="flex-1">
                                <h4 className={`text-[10px] font-bold uppercase tracking-wider ${isConfirmed ? 'text-gray-400' : 'text-gray-900'}`}>{meal}</h4>
                                <p className={`text-xs ${isConfirmed ? 'text-gray-400 line-through' : 'text-gray-600'} line-clamp-2`}>
                                    {item.content}
                                </p>
                            </div>
                        </div>
                    )
                })}
            </div>
            <div className="px-4 py-2 bg-gray-50 border-t border-gray-100 text-center">
                <p className="text-[10px] text-gray-400 font-medium italic">Detaylar için "Araçlar {'>'} Diyet Günlüğüm"e git</p>
            </div>
        </div>
    )
}
