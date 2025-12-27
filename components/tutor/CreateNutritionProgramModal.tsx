'use client'

import { useState, useEffect } from 'react'
import { nutritionTemplates, type NutritionTemplate } from '@/lib/templates/nutrition'
import { createNutritionProgramFromTemplate } from '@/app/actions/nutrition'

interface CreateNutritionProgramModalProps {
    onClose: () => void
    onSuccess: () => void
}

export default function CreateNutritionProgramModal({ onClose, onSuccess }: CreateNutritionProgramModalProps) {
    const [selectedTemplate, setSelectedTemplate] = useState<NutritionTemplate | null>(null)
    const [studentId, setStudentId] = useState('')
    const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0])
    const [students, setStudents] = useState<any[]>([])
    const [loading, setLoading] = useState(false)
    const [creating, setCreating] = useState(false)

    useEffect(() => {
        loadStudents()
    }, [])

    const loadStudents = async () => {
        setLoading(true)
        try {
            // Persona listesini al
            const res = await fetch('/api/personas')
            if (res.ok) {
                const data = await res.json()
                setStudents(data)
            }
        } catch (e) {
            console.error('Failed to load students:', e)
        }
        setLoading(false)
    }

    const handleCreate = async () => {
        if (!selectedTemplate || !studentId) {
            alert('Lütfen şablon ve öğrenci seçin')
            return
        }

        setCreating(true)
        const result = await createNutritionProgramFromTemplate(
            selectedTemplate.id,
            studentId,
            startDate
        )
        setCreating(false)

        if (result.error) {
            alert('Program oluşturulamadı: ' + result.error)
        } else {
            onSuccess()
        }
    }

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-gray-200">
                    <div>
                        <h2 className="text-xl font-bold text-gray-900">Yeni Beslenme Programı</h2>
                        <p className="text-sm text-gray-500 mt-1">Şablondan program oluştur ve öğrenciye ata</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-gray-100 rounded-lg transition"
                    >
                        <svg className="w-5 h-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                    {/* Template Selection */}
                    <div>
                        <label className="block text-sm font-bold text-gray-900 mb-3">
                            1. Şablon Seç
                        </label>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {nutritionTemplates.map(template => (
                                <button
                                    key={template.id}
                                    onClick={() => setSelectedTemplate(template)}
                                    className={`text-left p-4 rounded-xl border-2 transition ${selectedTemplate?.id === template.id
                                            ? 'border-purple-500 bg-purple-50'
                                            : 'border-gray-200 hover:border-purple-300'
                                        }`}
                                >
                                    <div className="flex items-start justify-between mb-2">
                                        <h3 className="font-bold text-gray-900">{template.name}</h3>
                                        {selectedTemplate?.id === template.id && (
                                            <svg className="w-5 h-5 text-purple-600" fill="currentColor" viewBox="0 0 20 20">
                                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                            </svg>
                                        )}
                                    </div>
                                    <p className="text-xs text-gray-600 mb-3">{template.description}</p>
                                    <div className="flex items-center gap-4 text-xs">
                                        <span className="text-purple-600 font-bold">
                                            🔥 {template.target_calories} kcal/gün
                                        </span>
                                        <span className="text-gray-500">
                                            📅 {template.duration_days} gün
                                        </span>
                                        <span className="text-gray-500">
                                            🍽️ {template.meals.length} öğün
                                        </span>
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Student Selection */}
                    <div>
                        <label className="block text-sm font-bold text-gray-900 mb-3">
                            2. Öğrenci Seç
                        </label>
                        {loading ? (
                            <div className="text-center py-4 text-gray-500">Öğrenciler yükleniyor...</div>
                        ) : (
                            <select
                                value={studentId}
                                onChange={(e) => setStudentId(e.target.value)}
                                className="w-full px-4 py-3 bg-white border-2 border-gray-200 rounded-xl focus:border-purple-500 focus:ring-0 outline-none"
                            >
                                <option value="">Öğrenci seçin...</option>
                                {students.map(student => (
                                    <option key={student.id} value={student.id}>
                                        {student.name}
                                    </option>
                                ))}
                            </select>
                        )}
                    </div>

                    {/* Start Date */}
                    <div>
                        <label className="block text-sm font-bold text-gray-900 mb-3">
                            3. Başlangıç Tarihi
                        </label>
                        <input
                            type="date"
                            value={startDate}
                            onChange={(e) => setStartDate(e.target.value)}
                            className="w-full px-4 py-3 bg-white border-2 border-gray-200 rounded-xl focus:border-purple-500 focus:ring-0 outline-none"
                        />
                    </div>

                    {/* Preview */}
                    {selectedTemplate && (
                        <div className="bg-purple-50 rounded-xl p-4 border border-purple-200">
                            <h4 className="text-sm font-bold text-purple-900 mb-2">📋 Program Özeti</h4>
                            <div className="text-xs text-purple-700 space-y-1">
                                <p>• <strong>{selectedTemplate.meals.length} öğün</strong> task olarak oluşturulacak</p>
                                <p>• Günlük hedef: <strong>{selectedTemplate.target_calories} kalori</strong></p>
                                <p>• Süre: <strong>{selectedTemplate.duration_days} gün</strong> ({new Date(startDate).toLocaleDateString('tr-TR')} - {new Date(new Date(startDate).getTime() + (selectedTemplate.duration_days - 1) * 24 * 60 * 60 * 1000).toLocaleDateString('tr-TR')})</p>
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg font-medium transition"
                    >
                        İptal
                    </button>
                    <button
                        onClick={handleCreate}
                        disabled={!selectedTemplate || !studentId || creating}
                        className="px-6 py-2 bg-purple-600 text-white rounded-lg font-bold hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
                    >
                        {creating ? 'Oluşturuluyor...' : 'Programı Oluştur'}
                    </button>
                </div>
            </div>
        </div>
    )
}
