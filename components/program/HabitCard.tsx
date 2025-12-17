'use client'

import { useState } from 'react'
import CompleteHabitModal from './CompleteHabitModal'

interface HabitCardProps {
    habit: {
        id: string
        name: string
        description: string | null
        frequency: string
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
    userId: string
    onComplete: () => void
    onEdit: () => void
    onDelete: () => void
}

export default function HabitCard({ habit, userId, onComplete, onEdit, onDelete }: HabitCardProps) {
    const [showCompleteModal, setShowCompleteModal] = useState(false)
    const [showMenu, setShowMenu] = useState(false)

    const getFrequencyText = () => {
        switch (habit.frequency) {
            case 'daily':
                return 'Her gün'
            case 'weekly':
                return 'Haftalık'
            case 'monthly':
                return 'Aylık'
            default:
                return habit.frequency
        }
    }

    const getTargetText = () => {
        if (habit.target_type === 'count' && habit.target_count) {
            return `${habit.target_count}x`
        }
        if (habit.target_type === 'duration' && habit.target_duration) {
            return `${habit.target_duration} dk`
        }
        return null
    }

    return (
        <>
            <div
                className="bg-white rounded-xl p-4 shadow-sm border-2 transition hover:shadow-md"
                style={{ borderColor: `${habit.color}40` }}
            >
                <div className="flex items-start gap-3">
                    {/* Icon */}
                    <div
                        className="w-12 h-12 rounded-lg flex items-center justify-center text-2xl flex-shrink-0"
                        style={{ backgroundColor: `${habit.color}15` }}
                    >
                        {habit.icon}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                        {/* Subject/Topic Badge */}
                        {habit.subjects && (
                            <div className="flex items-center gap-2 mb-1">
                                <span className="text-xs text-gray-500">
                                    {habit.subjects.icon} {habit.subjects.name}
                                    {habit.topics && ` › ${habit.topics.name}`}
                                </span>
                            </div>
                        )}

                        {/* Name */}
                        <h3 className="font-semibold text-gray-900 mb-1">{habit.name}</h3>

                        {/* Description */}
                        {habit.description && (
                            <p className="text-sm text-gray-600 mb-2">{habit.description}</p>
                        )}

                        {/* Stats */}
                        <div className="flex items-center gap-4 text-sm">
                            {/* Frequency */}
                            <span className="text-gray-600">{getFrequencyText()}</span>

                            {/* Target */}
                            {getTargetText() && (
                                <span
                                    className="px-2 py-0.5 rounded text-xs font-medium"
                                    style={{
                                        backgroundColor: `${habit.color}15`,
                                        color: habit.color,
                                    }}
                                >
                                    Hedef: {getTargetText()}
                                </span>
                            )}

                            {/* Streak */}
                            {habit.current_streak > 0 && (
                                <div className="flex items-center gap-1">
                                    <span className="text-orange-500">🔥</span>
                                    <span className="font-semibold" style={{ color: habit.color }}>
                                        {habit.current_streak}
                                    </span>
                                    <span className="text-gray-500 text-xs">gün</span>
                                </div>
                            )}

                            {/* Longest Streak Badge */}
                            {habit.longest_streak >= 7 && (
                                <div className="flex items-center gap-1">
                                    <span>
                                        {habit.longest_streak >= 365
                                            ? '💎'
                                            : habit.longest_streak >= 100
                                                ? '🥇'
                                                : habit.longest_streak >= 30
                                                    ? '🥈'
                                                    : '🥉'}
                                    </span>
                                    <span className="text-xs text-gray-500">{habit.longest_streak}</span>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center gap-2 flex-shrink-0">
                        {/* Complete Button */}
                        <button
                            onClick={() => setShowCompleteModal(true)}
                            className="px-4 py-2 rounded-lg text-sm font-medium transition"
                            style={{
                                backgroundColor: habit.color,
                                color: 'white',
                            }}
                        >
                            ✓ Tamamla
                        </button>

                        {/* Menu Button */}
                        <div className="relative">
                            <button
                                onClick={() => setShowMenu(!showMenu)}
                                className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition"
                            >
                                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                                    <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
                                </svg>
                            </button>

                            {showMenu && (
                                <div className="absolute right-0 mt-1 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-10">
                                    <button
                                        onClick={() => {
                                            setShowMenu(false)
                                            onEdit()
                                        }}
                                        className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                                    >
                                        Düzenle
                                    </button>
                                    <button
                                        onClick={() => {
                                            setShowMenu(false)
                                            onDelete()
                                        }}
                                        className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                                    >
                                        Sil
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Complete Modal */}
            {showCompleteModal && (
                <CompleteHabitModal
                    habit={habit}
                    userId={userId}
                    onClose={() => setShowCompleteModal(false)}
                    onCompleted={() => {
                        setShowCompleteModal(false)
                        onComplete()
                    }}
                />
            )}
        </>
    )
}
