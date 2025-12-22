'use client'

import { useState } from 'react'
import CompactHabitGrid from './CompactHabitGrid'
import AddHabitButton from './AddHabitButton'
import HabitFormModal from './HabitFormModal'

interface HabitsViewProps {
    userId: string
}

export default function HabitsView({ userId }: HabitsViewProps) {
    const [showModal, setShowModal] = useState(false)
    const [editingHabit, setEditingHabit] = useState<any>(null)
    const [gridKey, setGridKey] = useState(0)

    const handleEdit = (habit: any) => {
        setEditingHabit(habit)
        setShowModal(true)
    }

    const handleSaved = () => {
        setShowModal(false)
        setEditingHabit(null)
        setGridKey(prev => prev + 1)
    }

    return (
        <div className="space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between pt-4 px-1">
                <div>
                    <h2 className="text-lg font-semibold text-gray-900">Alışkanlıklarım</h2>
                    <p className="text-sm text-gray-600 mt-1">
                        Haftalık takip çizelgesi
                    </p>
                </div>
            </div>

            {/* Compact Grid */}
            <CompactHabitGrid
                key={gridKey}
                userId={userId}
                onEdit={handleEdit}
            />

            {/* Add Button */}
            <AddHabitButton onClick={() => {
                setEditingHabit(null)
                setShowModal(true)
            }} />

            {/* Modal */}
            {showModal && (
                <HabitFormModal
                    userId={userId}
                    editingHabit={editingHabit}
                    onClose={() => {
                        setShowModal(false)
                        setEditingHabit(null)
                    }}
                    onSaved={handleSaved}
                />
            )}
        </div>
    )
}
