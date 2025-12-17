'use client'

import { useState, useEffect, useMemo } from 'react'
import { Section } from '@/app/actions/exams'

interface ExamResultModalProps {
    isOpen: boolean
    onClose: () => void
    onSave: (data: any) => Promise<void>
    exam: any // Exam with template and sections
    initialData?: any // Existing result details if editing
}

export default function ExamResultModal({ isOpen, onClose, onSave, exam, initialData }: ExamResultModalProps) {
    const [formData, setFormData] = useState<Record<string, { correct: number, incorrect: number }>>({})
    const [loading, setLoading] = useState(false)

    // Initialize form data when exam opens
    useEffect(() => {
        if (isOpen && exam) {
            const initialSections: Record<string, { correct: number, incorrect: number }> = {}
            exam.template.sections.forEach((section: Section) => {
                // If editing, load existing data, otherwise 0
                const savedSection = initialData?.[section.key]
                initialSections[section.key] = {
                    correct: savedSection?.correct || 0,
                    incorrect: savedSection?.incorrect || 0
                }
            })
            setFormData(initialSections)
        }
    }, [isOpen, exam, initialData])

    // Calculate Nets live
    const calculations = useMemo(() => {
        let totalCorrect = 0
        let totalIncorrect = 0
        let totalNet = 0
        const sectionStats: Record<string, { empty: number, net: number }> = {}

        if (!exam) return { totalCorrect, totalIncorrect, totalNet, sectionStats }

        exam.template.sections.forEach((section: Section) => {
            const data = formData[section.key] || { correct: 0, incorrect: 0 }
            const empty = section.question_count - data.correct - data.incorrect
            const net = data.correct - (data.incorrect / 4)

            sectionStats[section.key] = { empty, net }
            totalCorrect += data.correct
            totalIncorrect += data.incorrect
            totalNet += net
        })

        return { totalCorrect, totalIncorrect, totalNet, sectionStats }
    }, [formData, exam])

    const handleInputChange = (sectionKey: string, field: 'correct' | 'incorrect', value: string) => {
        const numValue = parseInt(value) || 0 // Handle empty backspace as 0
        const currentSection = formData[sectionKey] || { correct: 0, incorrect: 0 }

        // Validation check would be good here or on render
        // For smoother typing, we allow input but can show warning

        setFormData(prev => ({
            ...prev,
            [sectionKey]: {
                ...prev[sectionKey],
                [field]: numValue
            }
        }))
    }

    const handleSubmit = async () => {
        setLoading(true)
        // Construct result object
        // We pass the raw formData (correct/incorrect) and also the calculated Nets can be re-calculated on server or trusted.
        // For simplicity, we pass what's needed for the DB 'details' jsonb.
        // And we pass total_net.

        // Final Validation
        for (const section of exam.template.sections) {
            const data = formData[section.key]
            if (data.correct + data.incorrect > section.question_count) {
                alert(`${section.name} bölümünde toplam soru sayısını aştınız! (Soru: ${section.question_count})`)
                setLoading(false)
                return
            }
        }

        await onSave({
            details: formData,
            total_net: calculations.totalNet
        })
        setLoading(false)
        onClose()
    }

    if (!isOpen || !exam) return null

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] flex flex-col">
                <div className="p-6 border-b border-gray-100 flex items-center justify-between">
                    <div>
                        <h2 className="text-xl font-bold text-gray-900">{exam.name}</h2>
                        <span className="text-sm text-gray-500">{exam.template.name}</span>
                    </div>
                    <div className="text-right bg-indigo-50 px-4 py-2 rounded-lg">
                        <div className="text-sm text-indigo-800 font-medium">Toplam Net</div>
                        <div className="text-2xl font-bold text-indigo-700">{calculations.totalNet.toFixed(2)}</div>
                    </div>
                </div>

                <div className="p-6 overflow-y-auto flex-1 space-y-6">
                    {exam.template.sections.map((section: Section) => {
                        const data = formData[section.key] || { correct: 0, incorrect: 0 }
                        const stats = calculations.sectionStats[section.key] || { empty: 0, net: 0 }
                        const isInvalid = data.correct + data.incorrect > section.question_count

                        return (
                            <div key={section.key} className={`p-4 rounded-lg border ${isInvalid ? 'border-red-300 bg-red-50' : 'border-gray-200 bg-white'}`}>
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="font-semibold text-gray-800">{section.name}</h3>
                                    <span className="text-xs text-gray-500 font-medium bg-gray-100 px-2 py-1 rounded">
                                        {section.question_count} Soru
                                    </span>
                                </div>

                                <div className="grid grid-cols-4 gap-4 items-end">
                                    <div>
                                        <label className="block text-xs uppercase text-green-600 font-bold mb-1">Doğru</label>
                                        <input
                                            type="number"
                                            min="0"
                                            max={section.question_count}
                                            value={data.correct.toString()} // toString to avoid leading zeros issue if I handled it carefully, but simple number input works
                                            onChange={(e) => handleInputChange(section.key, 'correct', e.target.value)}
                                            className="w-full px-3 py-2 border rounded-md focus:ring-green-500 focus:border-green-500"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs uppercase text-red-600 font-bold mb-1">Yanlış</label>
                                        <input
                                            type="number"
                                            min="0"
                                            max={section.question_count}
                                            value={data.incorrect.toString()}
                                            onChange={(e) => handleInputChange(section.key, 'incorrect', e.target.value)}
                                            className="w-full px-3 py-2 border rounded-md focus:ring-red-500 focus:border-red-500"
                                        />
                                    </div>
                                    <div className="text-center">
                                        <div className="text-xs uppercase text-gray-400 font-bold mb-1">Boş</div>
                                        <div className="py-2 font-medium text-gray-600">{stats.empty}</div>
                                    </div>
                                    <div className="text-center bg-gray-50 rounded-md border border-gray-100">
                                        <div className="text-xs uppercase text-indigo-600 font-bold mb-1 pt-1">Net</div>
                                        <div className="pb-1 font-bold text-lg text-indigo-700">{stats.net.toFixed(2)}</div>
                                    </div>
                                </div>
                                {isInvalid && (
                                    <p className="text-xs text-red-600 mt-2 font-medium">Hata: Soru sayısını aştınız!</p>
                                )}
                            </div>
                        )
                    })}
                </div>

                <div className="p-6 border-t border-gray-100 flex justify-end gap-3">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg font-medium transition"
                    >
                        İptal
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={loading}
                        className="px-6 py-2 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition disabled:opacity-50"
                    >
                        {loading ? 'Kaydediliyor...' : 'Kaydet'}
                    </button>
                </div>
            </div>
        </div>
    )
}
