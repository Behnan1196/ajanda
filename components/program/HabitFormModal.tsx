'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

interface Subject {
    id: string
    name: string
    icon: string | null
}

interface Topic {
    id: string
    subject_id: string
    name: string
}

interface Habit {
    id: string
    name: string
    description: string | null
    subject_id: string | null
    topic_id: string | null
    frequency: string
    frequency_days: number[] | null
    target_type: string | null
    target_count: number | null
    target_duration: number | null
    color: string
    icon: string
}

interface HabitFormModalProps {
    userId: string
    editingHabit?: Habit | null
    onClose: () => void
    onSaved: () => void
}

export default function HabitFormModal({
    userId,
    editingHabit,
    onClose,
    onSaved,
}: HabitFormModalProps) {
    const [subjects, setSubjects] = useState<Subject[]>([])
    const [topics, setTopics] = useState<Topic[]>([])

    const [name, setName] = useState(editingHabit?.name || '')
    const [description, setDescription] = useState(editingHabit?.description || '')
    const [subjectId, setSubjectId] = useState(editingHabit?.subject_id || '')
    const [topicId, setTopicId] = useState(editingHabit?.topic_id || '')
    const [frequency, setFrequency] = useState(editingHabit?.frequency || 'daily')
    const [targetType, setTargetType] = useState(editingHabit?.target_type || 'boolean')
    const [targetCount, setTargetCount] = useState(editingHabit?.target_count || 1)
    const [targetDuration, setTargetDuration] = useState(editingHabit?.target_duration || 30)
    const [color, setColor] = useState(editingHabit?.color || '#3B82F6')
    const [loading, setLoading] = useState(false)
    const supabase = createClient()

    const isEditMode = !!editingHabit

    const iconOptions = ['⭐', '🏃', '💧', '🧘', '📚', '🎯', '💪', '🌱', '🎨', '☀️', '🌙', '🔥']
    const colorOptions = [
        '#3B82F6', // Blue
        '#10B981', // Green
        '#F59E0B', // Amber
        '#8B5CF6', // Purple
        '#EC4899', // Pink
        '#6B7280', // Gray
    ]

    useEffect(() => {
        loadData()
    }, [])

    const loadData = async () => {
        // Subjects and Topics loading removed as per minimalist design
    }

    const filteredTopics = topics.filter((t) => t.subject_id === subjectId)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)

        const habitData = {
            user_id: userId,
            name,
            description: description || null,
            subject_id: subjectId || null,
            topic_id: topicId || null,
            frequency,
            target_type: targetType,
            target_count: targetType === 'count' ? targetCount : null,
            target_duration: targetType === 'duration' ? targetDuration : null,
            color,
            icon: '⭐', // Default star icon (not used in minimalist UI)
        }

        if (isEditMode) {
            const { error } = await supabase
                .from('habits')
                .update(habitData)
                .eq('id', editingHabit.id)

            if (error) {
                alert('Güncelleme hatası: ' + error.message)
            } else {
                onSaved()
            }
        } else {
            // Get max sort_order for this user to add new habit at bottom
            const { data: maxOrderData } = await supabase
                .from('habits')
                .select('sort_order')
                .eq('user_id', userId)
                .order('sort_order', { ascending: false })
                .limit(1)
                .single()

            const newSortOrder = (maxOrderData?.sort_order ?? -1) + 1

            const { error } = await supabase.from('habits').insert({
                ...habitData,
                sort_order: newSortOrder
            })

            if (error) {
                alert('Oluşturma hatası: ' + error.message)
            } else {
                onSaved()
            }
        }

        setLoading(false)
    }

    return (
        <div className="fixed inset-0 bg-black/50 flex items-end justify-center z-50 animate-fadeIn">
            <div className="bg-white w-full max-w-2xl rounded-t-3xl p-6 max-h-[85vh] overflow-y-auto animate-slideUp">
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-bold text-gray-900">
                        {isEditMode ? 'Alışkanlığı Düzenle' : 'Yeni Alışkanlık'}
                    </h2>
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

                    {/* Color Selection */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Renk
                        </label>
                        <div className="grid grid-cols-6 gap-2">
                            {colorOptions.map((colorOption) => (
                                <button
                                    key={colorOption}
                                    type="button"
                                    onClick={() => setColor(colorOption)}
                                    className={`w-full h-10 rounded-lg border-2 transition ${color === colorOption ? 'border-gray-900 scale-110' : 'border-gray-200'
                                        }`}
                                    style={{ backgroundColor: colorOption }}
                                />
                            ))}
                        </div>
                    </div>

                    {/* Name */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Alışkanlık Adı *
                        </label>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                            placeholder="Sabah Koşusu"
                            required
                        />
                    </div>

                    {/* Description */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Açıklama
                        </label>
                        <textarea
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                            rows={2}
                            placeholder="Her sabah 30 dakika koşu..."
                        />
                    </div>

                    {/* Subject/Topic selections removed */}

                    {/* Frequency */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Sıklık *
                        </label>
                        <select
                            value={frequency}
                            onChange={(e) => setFrequency(e.target.value)}
                            className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                            required
                        >
                            <option value="daily">Her gün</option>
                            <option value="weekly">Haftalık</option>
                            <option value="monthly">Aylık</option>
                        </select>
                    </div>

                    {/* Target Type */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Hedef Tipi *
                        </label>
                        <div className="grid grid-cols-3 gap-2">
                            <button
                                type="button"
                                onClick={() => setTargetType('boolean')}
                                className={`py-3 px-4 rounded-lg border-2 text-sm font-medium transition ${targetType === 'boolean'
                                    ? 'border-indigo-600 bg-indigo-50 text-indigo-600'
                                    : 'border-gray-200 text-gray-600 hover:border-gray-300'
                                    }`}
                            >
                                Yapıldı/Yapılmadı
                            </button>
                            <button
                                type="button"
                                onClick={() => setTargetType('count')}
                                className={`py-3 px-4 rounded-lg border-2 text-sm font-medium transition ${targetType === 'count'
                                    ? 'border-indigo-600 bg-indigo-50 text-indigo-600'
                                    : 'border-gray-200 text-gray-600 hover:border-gray-300'
                                    }`}
                            >
                                Sayı
                            </button>
                            <button
                                type="button"
                                onClick={() => setTargetType('duration')}
                                className={`py-3 px-4 rounded-lg border-2 text-sm font-medium transition ${targetType === 'duration'
                                    ? 'border-indigo-600 bg-indigo-50 text-indigo-600'
                                    : 'border-gray-200 text-gray-600 hover:border-gray-300'
                                    }`}
                            >
                                Süre
                            </button>
                        </div>
                    </div>

                    {/* Target Count */}
                    {targetType === 'count' && (
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Hedef Sayı
                            </label>
                            <input
                                type="number"
                                value={targetCount}
                                onChange={(e) => setTargetCount(parseInt(e.target.value) || 1)}
                                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                min="1"
                                placeholder="8"
                            />
                            <p className="text-sm text-gray-500 mt-1">
                                Örn: Günde 8 bardak su
                            </p>
                        </div>
                    )}

                    {/* Target Duration */}
                    {targetType === 'duration' && (
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Hedef Süre (Dakika)
                            </label>
                            <input
                                type="number"
                                value={targetDuration}
                                onChange={(e) => setTargetDuration(parseInt(e.target.value) || 0)}
                                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                min="1"
                                step="5"
                                placeholder="30"
                            />
                            <p className="text-sm text-gray-500 mt-1">
                                Örn: 30 dakika koşu
                            </p>
                        </div>
                    )}

                    {/* Submit Button */}
                    <div className="flex gap-3 pt-4">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition"
                        >
                            İptal
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="flex-1 px-6 py-3 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition disabled:opacity-50"
                        >
                            {loading
                                ? isEditMode
                                    ? 'Güncelleniyor...'
                                    : 'Kaydediliyor...'
                                : isEditMode
                                    ? 'Güncelle'
                                    : 'Kaydet'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}
