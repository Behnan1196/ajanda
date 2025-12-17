'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import HabitCard from './HabitCard'
import AddHabitButton from './AddHabitButton'
import HabitFormModal from './HabitFormModal'

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
    current_streak: number
    longest_streak: number
    subjects?: {
        name: string
        icon: string | null
    } | null
    topics?: {
        name: string
    } | null
}

interface HabitsViewProps {
    userId: string
}

export default function HabitsView({ userId }: HabitsViewProps) {
    const [habits, setHabits] = useState<Habit[]>([])
    const [loading, setLoading] = useState(true)
    const [showModal, setShowModal] = useState(false)
    const [editingHabit, setEditingHabit] = useState<Habit | null>(null)
    const supabase = createClient()

    useEffect(() => {
        loadHabits()
    }, [userId])

    const loadHabits = async () => {
        setLoading(true)

        const { data, error } = await supabase
            .from('habits')
            .select(`
        *,
        subjects (name, icon),
        topics (name)
      `)
            .eq('user_id', userId)
            .eq('is_active', true)
            .order('created_at', { ascending: false })

        if (!error && data) {
            setHabits(data as Habit[])
        }

        setLoading(false)
    }

    const handleEdit = (habit: Habit) => {
        setEditingHabit(habit)
        setShowModal(true)
    }

    const handleDelete = async (id: string) => {
        if (!confirm('Bu alışkanlığı silmek istediğinizden emin misiniz?')) return

        const { error } = await supabase
            .from('habits')
            .update({ is_active: false })
            .eq('id', id)

        if (!error) {
            loadHabits()
        }
    }

    if (loading) {
        return (
            <div className="flex justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
            </div>
        )
    }

    return (
        <div className="space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between pt-4">
                <div>
                    <h2 className="text-lg font-semibold text-gray-900">Alışkanlıklarım</h2>
                    <p className="text-sm text-gray-600 mt-1">
                        {habits.length} aktif alışkanlık
                    </p>
                </div>
            </div>

            {/* Habits List */}
            {habits.length === 0 ? (
                <div className="text-center py-12">
                    <div className="text-4xl mb-4">⭐</div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                        Henüz alışkanlık eklenmemiş
                    </h3>
                    <p className="text-gray-600 mb-6">
                        İlk alışkanlığını ekleyerek başla!
                    </p>
                    <button
                        onClick={() => setShowModal(true)}
                        className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition"
                    >
                        + İlk Alışkanlığını Ekle
                    </button>
                </div>
            ) : (
                <div className="space-y-3">
                    {habits.map((habit) => (
                        <HabitCard
                            key={habit.id}
                            habit={habit}
                            userId={userId}
                            onComplete={() => loadHabits()}
                            onEdit={() => handleEdit(habit)}
                            onDelete={() => handleDelete(habit.id)}
                        />
                    ))}
                </div>
            )}

            {/* Add Button (FAB) */}
            {habits.length > 0 && (
                <AddHabitButton onClick={() => {
                    setEditingHabit(null)
                    setShowModal(true)
                }} />
            )}

            {/* Modal */}
            {showModal && (
                <HabitFormModal
                    userId={userId}
                    editingHabit={editingHabit}
                    onClose={() => {
                        setShowModal(false)
                        setEditingHabit(null)
                    }}
                    onSaved={() => {
                        setShowModal(false)
                        setEditingHabit(null)
                        loadHabits()
                    }}
                />
            )}
        </div>
    )
}
