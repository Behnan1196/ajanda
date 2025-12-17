'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'

interface CompleteHabitModalProps {
    habit: {
        id: string
        name: string
        icon: string
        color: string
        target_type: string | null
        target_count: number | null
        target_duration: number | null
    }
    userId: string
    onClose: () => void
    onCompleted: () => void
}

export default function CompleteHabitModal({
    habit,
    userId,
    onClose,
    onCompleted,
}: CompleteHabitModalProps) {
    const [count, setCount] = useState(habit.target_count || 1)
    const [duration, setDuration] = useState(habit.target_duration || 0)
    const [notes, setNotes] = useState('')
    const [loading, setLoading] = useState(false)
    const supabase = createClient()

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)

        const today = new Date().toISOString().split('T')[0]

        const { error } = await supabase.from('habit_completions').insert({
            habit_id: habit.id,
            user_id: userId,
            completed_date: today,
            count: habit.target_type === 'count' ? count : null,
            duration: habit.target_type === 'duration' ? duration : null,
            notes: notes || null,
        })

        if (error) {
            console.error('Error completing habit:', error)
            alert('Alışkanlık tamamlanırken hata oluştu')
        } else {
            onCompleted()
        }

        setLoading(false)
    }

    return (
        <div className="fixed inset-0 bg-black/50 flex items-end justify-center z-50 animate-fadeIn">
            <div className="bg-white w-full max-w-md rounded-t-3xl p-6 animate-slideUp">
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                        <div
                            className="w-12 h-12 rounded-lg flex items-center justify-center text-2xl"
                            style={{ backgroundColor: `${habit.color}15` }}
                        >
                            {habit.icon}
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-gray-900">{habit.name}</h2>
                            <p className="text-sm text-gray-600">Bugün tamamla</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600 transition"
                    >
                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    {/* Count Input */}
                    {habit.target_type === 'count' && (
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Kaç kez tamamladınız?
                            </label>
                            <div className="flex items-center gap-3">
                                <button
                                    type="button"
                                    onClick={() => setCount(Math.max(1, count - 1))}
                                    className="w-10 h-10 rounded-lg bg-gray-100 hover:bg-gray-200 transition flex items-center justify-center"
                                >
                                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                                    </svg>
                                </button>
                                <input
                                    type="number"
                                    value={count}
                                    onChange={(e) => setCount(parseInt(e.target.value) || 0)}
                                    className="flex-1 text-center text-2xl font-bold py-3 rounded-lg border-2 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                    style={{ borderColor: habit.color }}
                                    min="1"
                                />
                                <button
                                    type="button"
                                    onClick={() => setCount(count + 1)}
                                    className="w-10 h-10 rounded-lg bg-gray-100 hover:bg-gray-200 transition flex items-center justify-center"
                                >
                                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                    </svg>
                                </button>
                            </div>
                            {habit.target_count && (
                                <p className="text-sm text-gray-600 mt-2 text-center">
                                    Hedef: {habit.target_count}x
                                </p>
                            )}
                        </div>
                    )}

                    {/* Duration Input */}
                    {habit.target_type === 'duration' && (
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Kaç dakika?
                            </label>
                            <div className="flex items-center gap-3">
                                <button
                                    type="button"
                                    onClick={() => setDuration(Math.max(0, duration - 5))}
                                    className="w-10 h-10 rounded-lg bg-gray-100 hover:bg-gray-200 transition flex items-center justify-center"
                                >
                                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                                    </svg>
                                </button>
                                <input
                                    type="number"
                                    value={duration}
                                    onChange={(e) => setDuration(parseInt(e.target.value) || 0)}
                                    className="flex-1 text-center text-2xl font-bold py-3 rounded-lg border-2 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                    style={{ borderColor: habit.color }}
                                    min="0"
                                    step="5"
                                />
                                <button
                                    type="button"
                                    onClick={() => setDuration(duration + 5)}
                                    className="w-10 h-10 rounded-lg bg-gray-100 hover:bg-gray-200 transition flex items-center justify-center"
                                >
                                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                    </svg>
                                </button>
                            </div>
                            {habit.target_duration && (
                                <p className="text-sm text-gray-600 mt-2 text-center">
                                    Hedef: {habit.target_duration} dk
                                </p>
                            )}
                        </div>
                    )}

                    {/* Notes */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Notlar (Opsiyonel)
                        </label>
                        <textarea
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                            rows={3}
                            placeholder="Bugün nasıl geçti?"
                        />
                    </div>

                    {/* Submit Button */}
                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full py-3 rounded-lg text-white font-medium transition disabled:opacity-50"
                        style={{ backgroundColor: habit.color }}
                    >
                        {loading ? 'Kaydediliyor...' : '✓ Tamamla'}
                    </button>
                </form>
            </div>
        </div>
    )
}
