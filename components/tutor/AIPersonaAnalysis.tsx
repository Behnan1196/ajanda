'use client'

import { useState } from 'react'
import { generatePersonaAnalysis, AIAnalysisResult } from '@/app/actions/ai'
import { createBulkTasks, CreateTaskInput } from '@/app/actions/tasks'

// Helper to get date for next occurrence of a day
function getNextDate(dayName: string): Date {
    const days = ['Pazar', 'Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi']
    const today = new Date()
    const currentDayIndex = today.getDay()
    const targetDayIndex = days.indexOf(dayName)

    if (targetDayIndex === -1) return new Date(today.setDate(today.getDate() + 1)) // Default to tomorrow if unknown

    let daysToAdd = targetDayIndex - currentDayIndex
    // If today is Monday (1) and target is Monday (1), we want next Monday (+7)
    // If current is Tuesday (2) and target is Monday (1), daysToAdd is -1, so +7 = 6 (next week)
    if (daysToAdd <= 0) daysToAdd += 7

    const targetDate = new Date(today)
    targetDate.setDate(targetDate.getDate() + daysToAdd)
    return targetDate
}

interface AIPersonaAnalysisProps {
    personaId: string
}

export default function AIPersonaAnalysis({ personaId }: AIPersonaAnalysisProps) {
    const [analyzing, setAnalyzing] = useState(false)
    const [applying, setApplying] = useState(false)
    const [result, setResult] = useState<AIAnalysisResult | null>(null)
    const [error, setError] = useState<string | null>(null)
    const [successMsg, setSuccessMsg] = useState<string | null>(null)
    const [coachNotes, setCoachNotes] = useState('')

    const handleAnalyze = async () => {
        setAnalyzing(true)
        setError(null)
        setSuccessMsg(null)

        try {
            const response = await generatePersonaAnalysis(personaId, coachNotes)
            if (response.error) {
                setError(response.error)
            } else {
                setResult(response.data || null)
            }
        } catch (e) {
            setError('Beklenmeyen bir hata oluştu')
        } finally {
            setAnalyzing(false)
        }
    }

    const handleApplySchedule = async () => {
        if (!result?.weekly_schedule) return

        setApplying(true)
        setError(null)

        try {
            const tasksToCreate: CreateTaskInput[] = []

            result.weekly_schedule.forEach(day => {
                const date = getNextDate(day.day)
                // Set to 09:00 AM by default
                date.setHours(9, 0, 0, 0)

                day.tasks.forEach(task => {
                    tasksToCreate.push({
                        user_id: personaId,
                        title: task,
                        description: `AI Önerisi - Odak: ${day.focus}`,
                        due_date: date.toISOString(),
                        task_type: 'todo',
                        is_completed: false
                    })
                })
            })

            const response = await createBulkTasks(tasksToCreate)
            if (response.error) {
                setError(response.error)
            } else {
                setSuccessMsg('Haftalık program başarıyla uygulandı! Personanın takvimine eklendi.')
                setResult(null) // Clear result to show freshness
                setCoachNotes('')
            }

        } catch (e) {
            setError('Program uygulanırken hata oluştu')
        } finally {
            setApplying(false)
        }
    }

    return (
        <div className="bg-gradient-to-r from-indigo-50 to-purple-50 p-6 rounded-xl border border-indigo-100 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <span className="text-2xl">🤖</span>
                    <h2 className="text-lg font-bold text-gray-900">AI Tutor Asistanı</h2>
                </div>
            </div>

            <div className="bg-white p-4 rounded-lg border border-indigo-100 shadow-sm">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tutor Notu / Odak Noktası (Opsiyonel)
                </label>
                <div className="flex gap-2">
                    <input
                        type="text"
                        value={coachNotes}
                        onChange={(e) => setCoachNotes(e.target.value)}
                        placeholder="Örn: Bu hafta geometriye ağırlık ver, deneme netleri düşük..."
                        className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm"
                    />
                    <button
                        onClick={handleAnalyze}
                        disabled={analyzing}
                        className="px-6 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition disabled:opacity-75 flex items-center gap-2 min-w-[120px] justify-center"
                    >
                        {analyzing ? (
                            <>
                                <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
                                Analiz...
                            </>
                        ) : (
                            'Analiz Et'
                        )}
                    </button>
                </div>
            </div>

            {error && (
                <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm">
                    {error}
                </div>
            )}

            {successMsg && (
                <div className="bg-green-50 text-green-600 p-3 rounded-lg text-sm flex items-center gap-2">
                    <span>✅</span>
                    {successMsg}
                </div>
            )}

            {result && (
                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    {/* Summary */}
                    <div className="bg-white p-4 rounded-lg shadow-sm border border-indigo-100">
                        <h3 className="font-semibold text-gray-900 mb-2">Genel Değerlendirme</h3>
                        <p className="text-gray-700 text-sm leading-relaxed">{result.analysis}</p>
                    </div>

                    {/* Stats Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="bg-green-50 p-4 rounded-lg border border-green-100">
                            <h3 className="font-semibold text-green-800 mb-2 flex items-center gap-2">
                                <span>💪</span> Güçlü Yönler
                            </h3>
                            <ul className="list-disc list-inside text-sm text-green-700 space-y-1">
                                {result.strengths.map((s, i) => <li key={i}>{s}</li>)}
                            </ul>
                        </div>
                        <div className="bg-red-50 p-4 rounded-lg border border-red-100">
                            <h3 className="font-semibold text-red-800 mb-2 flex items-center gap-2">
                                <span>⚠️</span> Gelişim Alanları
                            </h3>
                            <ul className="list-disc list-inside text-sm text-red-700 space-y-1">
                                {result.weaknesses.map((w, i) => <li key={i}>{w}</li>)}
                            </ul>
                        </div>
                    </div>

                    {/* Weekly Schedule */}
                    {result.weekly_schedule && (
                        <div className="bg-white rounded-lg shadow-sm border border-indigo-100 overflow-hidden">
                            <div className="bg-indigo-50 px-4 py-3 border-b border-indigo-100 flex items-center justify-between">
                                <h3 className="font-semibold text-indigo-900">Önerilen Haftalık Program</h3>
                                <button
                                    onClick={handleApplySchedule}
                                    disabled={applying}
                                    className="text-xs bg-indigo-600 text-white px-3 py-1.5 rounded-lg font-medium hover:bg-indigo-700 flex items-center gap-2 transition disabled:opacity-50"
                                >
                                    {applying ? 'Uygulanıyor...' : 'Programı Uygula (+)'}
                                </button>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm text-left">
                                    <thead className="bg-gray-50 text-gray-700">
                                        <tr>
                                            <th className="px-4 py-2 w-32">Gün</th>
                                            <th className="px-4 py-2 w-48">Odak</th>
                                            <th className="px-4 py-2">Görevler</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100">
                                        {result.weekly_schedule.map((day, idx) => (
                                            <tr key={idx} className="hover:bg-gray-50">
                                                <td className="px-4 py-3 font-medium text-gray-900">{day.day}</td>
                                                <td className="px-4 py-3 text-indigo-600 font-medium">{day.focus}</td>
                                                <td className="px-4 py-3 text-gray-600">
                                                    <ul className="list-disc list-inside">
                                                        {day.tasks.map((t, i) => <li key={i}>{t}</li>)}
                                                    </ul>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {/* Quick Tasks */}
                    <div>
                        <h3 className="font-semibold text-gray-900 mb-3">Önerilen Aksiyonlar</h3>
                        <div className="grid gap-3">
                            {result.suggestions.map((suggestion, index) => (
                                <div key={index} className="flex items-start justify-between bg-white p-3 rounded-lg border border-gray-200 hover:border-indigo-300 transition">
                                    <div>
                                        <div className="font-medium text-gray-900">{suggestion.title}</div>
                                        <div className="text-xs text-gray-500 mt-1">{suggestion.description}</div>
                                    </div>
                                    <button
                                        onClick={() => alert('Manuel ekleme')}
                                        className="text-xs bg-indigo-50 text-indigo-700 px-3 py-1 rounded-full font-medium hover:bg-indigo-100"
                                    >
                                        + Ekle
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
