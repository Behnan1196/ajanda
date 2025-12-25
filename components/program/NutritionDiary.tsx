'use client'

import { useState, useEffect } from 'react'
import { getDietPlans, getDailyLog, updateDailyLog } from '@/app/actions/nutrition'

interface NutritionDiaryProps {
    userId: string
}

export default function NutritionDiary({ userId }: NutritionDiaryProps) {
    const [dietPlans, setDietPlans] = useState<any[]>([])
    const [dailyLog, setDailyLog] = useState<any>(null)
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)

    const todayDate = new Date().toISOString().split('T')[0]
    const dayOfWeek = (new Date().getDay() + 6) % 7 // Convert 0 (Sun) - 6 (Sat) to 0 (Mon) - 6 (Sun)

    useEffect(() => {
        loadData()
    }, [userId])

    const loadData = async () => {
        setLoading(true)
        const [dRes, lRes] = await Promise.all([
            getDietPlans(userId),
            getDailyLog(userId, todayDate)
        ])
        if (dRes.data) setDietPlans(dRes.data)
        if (lRes.data) setDailyLog(lRes.data)
        setLoading(false)
    }

    const handleUpdateLog = async (updates: any) => {
        setSaving(true)
        const res = await updateDailyLog(userId, todayDate, updates)
        if (res.success) {
            // Optimistic update or refresh
            loadData()
        }
        setSaving(false)
    }

    if (loading) return <div className="p-8 text-center text-gray-500">Yükleniyor...</div>

    const todaysMenu = dietPlans.filter(p => p.day_of_week === dayOfWeek)
    const water = dailyLog?.water_ml || 0
    const steps = dailyLog?.step_count || 0
    const confirmations = dailyLog?.meal_confirmations || {}

    return (
        <div className="space-y-6">
            {/* Quick Stats: Water & Steps */}
            <div className="grid grid-cols-2 gap-4">
                <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4 flex flex-col items-center text-center">
                    <span className="text-2xl mb-1">💧</span>
                    <h3 className="text-[10px] font-bold text-blue-800 uppercase tracking-wider mb-2">Su Takibi</h3>
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => handleUpdateLog({ water_ml: Math.max(0, water - 250) })}
                            className="w-8 h-8 rounded-full bg-white text-blue-600 border border-blue-200 flex items-center justify-center font-bold"
                        >
                            -
                        </button>
                        <span className="text-lg font-bold text-blue-900 leading-none">{(water / 1000).toFixed(1)} <small className="text-[10px]">L</small></span>
                        <button
                            onClick={() => handleUpdateLog({ water_ml: water + 250 })}
                            className="w-8 h-8 rounded-full bg-white text-blue-600 border border-blue-200 flex items-center justify-center font-bold"
                        >
                            +
                        </button>
                    </div>
                </div>

                <div className="bg-orange-50 border border-orange-100 rounded-2xl p-4 flex flex-col items-center text-center">
                    <span className="text-2xl mb-1">🏃</span>
                    <h3 className="text-[10px] font-bold text-orange-800 uppercase tracking-wider mb-2">Adım Sayısı</h3>
                    <div className="flex items-center gap-2">
                        <input
                            type="number"
                            value={steps}
                            onChange={(e) => handleUpdateLog({ step_count: parseInt(e.target.value) || 0 })}
                            className="w-20 bg-transparent text-center font-bold text-lg text-orange-900 focus:outline-none"
                        />
                        <span className="text-[10px] font-bold text-orange-700">Adım</span>
                    </div>
                </div>
            </div>

            {/* Todays Menu */}
            <div className="bg-white rounded-2xl border border-gray-200 p-6">
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-lg font-bold text-gray-900">🍴 Bugünün Menüsü</h2>
                    <span className="text-xs text-gray-500 font-medium">
                        {new Date().toLocaleDateString('tr-TR', { weekday: 'long' })}
                    </span>
                </div>

                {todaysMenu.length === 0 ? (
                    <div className="text-center py-12 bg-gray-50 rounded-xl border border-dashed border-gray-300">
                        <p className="text-gray-500 text-sm">Henüz bir beslenme planı atanmamış.</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {['Kahvaltı', 'Öğle', 'Akşam', 'Ara Öğün'].map(meal => {
                            const item = todaysMenu.find(p => p.meal_type === meal)
                            if (!item) return null
                            const isConfirmed = !!confirmations[meal]

                            return (
                                <div key={meal} className={`group border border-gray-100 rounded-xl p-4 transition ${isConfirmed ? 'bg-green-50/50 border-green-100' : 'bg-white hover:border-indigo-100'}`}>
                                    <div className="flex items-start justify-between gap-4">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2 mb-1">
                                                <h4 className="text-xs font-bold text-gray-900 uppercase tracking-wider">{meal}</h4>
                                                {isConfirmed && <span className="text-[10px] px-1.5 py-0.5 bg-green-100 text-green-700 rounded-full font-bold">TAMAMLANDI</span>}
                                            </div>
                                            <p className={`text-sm ${isConfirmed ? 'text-gray-500 line-through' : 'text-gray-700'} whitespace-pre-wrap`}>
                                                {item.content}
                                            </p>
                                        </div>
                                        <button
                                            onClick={() => handleUpdateLog({
                                                meal_confirmations: { ...confirmations, [meal]: !isConfirmed }
                                            })}
                                            className={`w-10 h-10 rounded-xl border flex items-center justify-center transition ${isConfirmed ? 'bg-green-600 border-green-600 text-white' : 'bg-white border-gray-200 text-gray-300 hover:border-green-500 hover:text-green-500'}`}
                                        >
                                            {isConfirmed ? '✓' : '○'}
                                        </button>
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                )}
            </div>
        </div>
    )
}
