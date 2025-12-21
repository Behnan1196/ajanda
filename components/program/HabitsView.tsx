'use client'

import { useState } from 'react'
import WeeklyHabitGrid from './WeeklyHabitGrid'
import AddHabitButton from './AddHabitButton'
import HabitFormModal from './HabitFormModal'

interface HabitsViewProps {
    userId: string
}

export default function HabitsView({ userId }: HabitsViewProps) {
    const [showModal, setShowModal] = useState(false)
    const [gridKey, setGridKey] = useState(0) // Key to force grid refresh

    return (
        <div className="space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between pt-4">
                <div>
                    <h2 className="text-lg font-semibold text-gray-900">Alışkanlıklarım</h2>
                    <p className="text-sm text-gray-600 mt-1">
                        Haftalık takip çizelgesi
                    </p>
                </div>
            </div>

            {/* Weekly Grid */}
            <WeeklyHabitGrid key={gridKey} userId={userId} />

            {/* Add Button (FAB) */}
            <AddHabitButton onClick={() => setShowModal(true)} />

            {/* Modal */}
            {showModal && (
                <HabitFormModal
                    userId={userId}
                    editingHabit={null}
                    onClose={() => setShowModal(false)}
                    onSaved={() => {
                        setShowModal(false)
                        setGridKey(prev => prev + 1) // Refresh grid without page reload
                    }}
                />
            )}
        </div>
    )
}
