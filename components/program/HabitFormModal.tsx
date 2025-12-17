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
    const [color, setColor] = useState(editingHabit?.color || '#10B981')
    const [icon, setIcon] = useState(editingHabit?.icon || '⭐')
    const [loading, setLoading] = useState(false)
    const supabase = createClient()

    const isEditMode = !!editingHabit

    const iconOptions = ['⭐', '🏃', '💧', '🧘', '📚', '🎯', '💪', '🌱', '🎨', '☀️', '🌙', '🔥']
    const colorOptions = [
        '#10B981', // Green
        '#3B82F6', // Blue
        '#8B5CF6', // Purple
        '#F59E0B', // Amber
        '#EF4444', // Red
        '#EC4899', // Pink
    ]

    useEffect(() => {
        loadData()
    }, [])

    const loadData = async () => {
        const { data: subjectsData } = await supabase
            .from('subjects')
            .select('id, name, icon')
            .eq('is_active', true)
            .order('name')

        const { data: topicsData } = await supabase
            .from('topics')
            .select('id, subject_id, name')
            .eq('is_active', true)
            .order('name')

        if (subjectsData) setSubjects(subjectsData)
        if (topicsData) setTopics(topicsData)
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
            icon,
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
            const { error } = await supabase.from('habits').insert(habitData)

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
                    {/* Icon Selection */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            İkon
                        </label>
                        <div className="grid grid-cols-6 gap-2">
                            {iconOptions.map((iconOption) => (
                                <button
                                    key={iconOption}
                                    type="button"
                                    onClick={() => setIcon(iconOption)}
                                    className={`text-2xl p-3 rounded-lg border-2 transition ${icon === iconOption
                                            ? 'border-indigo-600 bg-indigo-50'
                                            : 'border-gray-200 hover:border-gray-300'
                                        }`}
                                >
                                    {iconOption}
                                </button>
                            ))}
                        </div>
                    </div>

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

                    {/* Subject */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Ana Konu (Opsiyonel)
                        </label>
                        <select
                            value={subjectId}
                            onChange={(e) => {
                                setSubjectId(e.target.value)
                                setTopicId('')
                            }}
                            className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                        >
                            <option value="">Seçiniz...</option>
                            {subjects.map((subject) => (
                                <option key={subject.id} value={subject.id}>
                                    {subject.icon} {subject.name}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Topic */}
                    {subjectId && (
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Alt Konu (Opsiyonel)
                            </label>
                            <select
                                value={topicId}
                                onChange={(e) => setTopicId(e.target.value)}
                                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                            >
                                <option value="">Seçiniz...</option>
                                {filteredTopics.map((topic) => (
                                    <option key={topic.id} value={topic.id}>
                                        {topic.name}
                                    </option>
                                ))}
                            </select>
                        </div>
                    )}

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
