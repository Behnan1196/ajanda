'use client'

import { useState, useEffect } from 'react'

interface Template {
    id: string
    name: string
    description: string
    duration_days: number
    tasks: any[]
}

interface CreateProgramModalProps {
    templates: Template[]
    onClose: () => void
    onSuccess: () => void
    createAction: (templateId: string, studentId: string, startDate: string) => Promise<any>
    title?: string
    moduleIcon?: string
    defaultStudentId?: string  // Pre-fill student ID (for tutor mode)
}

export default function CreateProgramModal({
    templates,
    onClose,
    onSuccess,
    createAction,
    title = 'Yeni Program Oluştur',
    moduleIcon = '📋',
    defaultStudentId
}: CreateProgramModalProps) {
    const [selectedTemplate, setSelectedTemplate] = useState('')
    const [studentId, setStudentId] = useState(defaultStudentId || '')
    const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0])
    const [creating, setCreating] = useState(false)

    const handleCreate = async () => {
        if (!selectedTemplate) {
            alert('Lütfen bir şablon seçin')
            return
        }

        setCreating(true)
        const result = await createAction(selectedTemplate, studentId, startDate)
        setCreating(false)

        if (result.error) {
            alert('Hata: ' + result.error)
        } else {
            onSuccess()
        }
    }

    const selected = templates.find(t => t.id === selectedTemplate)

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-gray-200">
                    <div className="flex items-center gap-3">
                        <span className="text-3xl">{moduleIcon}</span>
                        <div>
                            <h2 className="text-xl font-bold text-gray-900">{title}</h2>
                            <p className="text-sm text-gray-500 mt-1">
                                Şablondan program oluştur
                            </p>
                        </div>
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
                            {templates.map(template => (
                                <button
                                    key={template.id}
                                    onClick={() => setSelectedTemplate(template.id)}
                                    className={`text-left p-4 rounded-xl border-2 transition ${selectedTemplate === template.id
                                        ? 'border-indigo-500 bg-indigo-50'
                                        : 'border-gray-200 hover:border-indigo-300'
                                        }`}
                                >
                                    <div className="flex items-start justify-between mb-2">
                                        <h3 className="font-bold text-gray-900">{template.name}</h3>
                                        {selectedTemplate === template.id && (
                                            <svg className="w-5 h-5 text-indigo-600" fill="currentColor" viewBox="0 0 20 20">
                                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                            </svg>
                                        )}
                                    </div>
                                    <p className="text-xs text-gray-600 mb-3">{template.description}</p>
                                    <div className="flex items-center gap-3 text-xs text-gray-500">
                                        <span>📅 {template.duration_days} gün</span>
                                        <span>📋 {template.tasks.length} görev</span>
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Student ID (Optional) - Only show if not pre-filled */}
                    {!defaultStudentId && (
                        <div>
                            <label className="block text-sm font-bold text-gray-900 mb-3">
                                2. Öğrenci (Opsiyonel)
                            </label>
                            <input
                                type="text"
                                value={studentId}
                                onChange={(e) => setStudentId(e.target.value)}
                                placeholder="Persona ID (boş bırakırsanız kendinize atanır)"
                                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-indigo-500 outline-none"
                            />
                            <p className="text-xs text-gray-500 mt-2">
                                💡 Boş bırakırsanız program size atanır
                            </p>
                        </div>
                    )}

                    {/* Start Date */}
                    <div>
                        <label className="block text-sm font-bold text-gray-900 mb-3">
                            {defaultStudentId ? '2' : '3'}. Başlangıç Tarihi
                        </label>
                        <input
                            type="date"
                            value={startDate}
                            onChange={(e) => setStartDate(e.target.value)}
                            className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-indigo-500 outline-none"
                        />
                    </div>

                    {/* Preview */}
                    {selected && (
                        <div className="bg-indigo-50 rounded-xl p-4 border border-indigo-200">
                            <h4 className="text-sm font-bold text-indigo-900 mb-2">📋 Program Özeti</h4>
                            <div className="text-xs text-indigo-700 space-y-1">
                                <p>• <strong>{selected.tasks.length} görev</strong> oluşturulacak</p>
                                <p>• Süre: <strong>{selected.duration_days} gün</strong></p>
                                <p>• Tarih: <strong>{new Date(startDate).toLocaleDateString('tr-TR')}</strong> - <strong>{new Date(new Date(startDate).getTime() + (selected.duration_days - 1) * 24 * 60 * 60 * 1000).toLocaleDateString('tr-TR')}</strong></p>
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
                        disabled={!selectedTemplate || creating}
                        className="px-6 py-2 bg-indigo-600 text-white rounded-lg font-bold hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
                    >
                        {creating ? 'Oluşturuluyor...' : '🚀 Programı Oluştur'}
                    </button>
                </div>
            </div>
        </div>
    )
}
