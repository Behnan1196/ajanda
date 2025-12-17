'use client'

import { useState, useEffect } from 'react'
import { getStudentExamResults, saveExamResult, getExams } from '@/app/actions/exams'
import ExamResultModal from './ExamResultModal'

interface ExamResultsViewProps {
    userId: string
    readOnly?: boolean
}

export default function ExamResultsView({ userId, readOnly = false }: ExamResultsViewProps) {
    const [results, setResults] = useState<any[]>([])
    const [availableExams, setAvailableExams] = useState<any[]>([])
    const [loading, setLoading] = useState(true)

    // Modal State
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [selectedExam, setSelectedExam] = useState<any>(null)
    const [editModeData, setEditModeData] = useState<any>(null)

    // Selection Modal State (for choosing which exam to add)
    const [isSelectionModalOpen, setIsSelectionModalOpen] = useState(false)

    useEffect(() => {
        loadData()
    }, [userId])

    const loadData = async () => {
        setLoading(true)
        const [resultsData, examsData] = await Promise.all([
            getStudentExamResults(userId),
            getExams()
        ])
        setResults(resultsData)
        setAvailableExams(examsData)
        setLoading(false)
    }

    const handleAddClick = () => {
        // Filter out exams that already have results logic? 
        // Or users can just re-enter? Let's show all for now.
        setIsSelectionModalOpen(true)
    }

    const handleExamSelect = (exam: any) => {
        setIsSelectionModalOpen(false)

        // Check if result already exists
        const existingResult = results.find(r => r.exam_id === exam.id)
        if (existingResult) {
            handleEditResult(existingResult)
        } else {
            setSelectedExam(exam)
            setEditModeData(null)
            setIsModalOpen(true)
        }
    }

    const handleEditResult = (result: any) => {
        // Ideally we fetch the FULL exam details again or ensure 'result.exam' has template info
        // Our 'getStudentExamResults' includes exam.template, so we should be good.
        // But 'result.exam' from the join needs to follow the structure expected by Modal.
        // Warning: getExams has proper structure. getStudentExamResults join structure might be slightly different.
        // Let's rely on finding the exam in 'availableExams' to be safe and consistent.

        const examDef = availableExams.find(e => e.id === result.exam_id)
        if (examDef) {
            setSelectedExam(examDef)
            setEditModeData(result.details)
            setIsModalOpen(true)
        } else {
            alert('Sınav tanımı bulunamadı.')
        }
    }

    const handleSaveResult = async (data: any) => {
        const payload = {
            user_id: userId,
            exam_id: selectedExam.id,
            details: data.details,
            total_net: data.total_net
        }

        const response = await saveExamResult(payload)
        if (response.error) {
            alert('Hata: ' + response.error)
        } else {
            // Success
            loadData() // Refresh list
            setIsModalOpen(false) // Close modal on successful save
        }
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-900">Sınav Sonuçları</h2>
                {!readOnly && (
                    <button
                        onClick={handleAddClick}
                        className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition"
                    >
                        + Sonuç Gir
                    </button>
                )}
            </div>

            {loading ? (
                <div className="text-center py-12 text-gray-500">Yükleniyor...</div>
            ) : results.length === 0 ? (
                <div className="text-center py-12 bg-gray-50 rounded-lg border border-gray-200">
                    <p className="text-gray-500">Henüz girilmiş sınav sonucu yok.</p>
                </div>
            ) : (
                <div className="grid gap-4">
                    {results.map((result) => (
                        <div key={result.id} className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm flex items-center justify-between group hover:border-indigo-300 transition">
                            <div>
                                <h3 className="font-bold text-gray-900">{result.exam?.name}</h3>
                                <div className="text-sm text-gray-500 flex gap-4">
                                    <span>{new Date(result.created_at).toLocaleDateString('tr-TR')}</span>
                                    <span className="text-gray-300">|</span>
                                    <span>{result.exam?.template?.name}</span>
                                </div>
                            </div>
                            <div className="text-right flex items-center gap-4">
                                <div>
                                    <div className="text-2xl font-bold text-indigo-600">{result.total_net} <span className="text-sm font-normal text-gray-500">Net</span></div>
                                </div>
                                <button
                                    onClick={() => handleEditResult(result)}
                                    className="px-3 py-1 text-sm text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 rounded border border-gray-200 transition"
                                >
                                    Düzenle
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Exam Select Modal */}
            {isSelectionModalOpen && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl shadow-xl max-w-md w-full">
                        <div className="p-4 border-b border-gray-100 flex justify-between items-center">
                            <h3 className="font-bold text-gray-900">Sınav Seçin</h3>
                            <button onClick={() => setIsSelectionModalOpen(false)} className="text-gray-400 hover:text-gray-600">✕</button>
                        </div>
                        <div className="p-2 max-h-[60vh] overflow-y-auto">
                            {availableExams.length === 0 ? (
                                <div className="p-4 text-center text-gray-500">Tanımlı sınav bulunamadı.</div>
                            ) : (
                                <div className="space-y-1">
                                    {availableExams.map(exam => {
                                        const hasResult = results.some(r => r.exam_id === exam.id)
                                        return (
                                            <button
                                                key={exam.id}
                                                onClick={() => handleExamSelect(exam)}
                                                className="w-full text-left p-3 hover:bg-gray-50 rounded-lg flex items-center justify-between group"
                                            >
                                                <div>
                                                    <div className="font-medium text-gray-900">{exam.name}</div>
                                                    <div className="text-xs text-gray-500">
                                                        {new Date(exam.date).toLocaleDateString('tr-TR')} • {exam.template?.name}
                                                    </div>
                                                </div>
                                                {hasResult && (
                                                    <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded">Girildi</span>
                                                )}
                                            </button>
                                        )
                                    })}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Result Entry Wizard */}
            <ExamResultModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSave={handleSaveResult}
                exam={selectedExam}
                initialData={editModeData}
            />
        </div>
    )
}
