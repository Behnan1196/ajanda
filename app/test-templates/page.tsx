'use client'

import { useState } from 'react'
import { simpleTemplates } from '@/lib/templates/simple'
import { createProgramFromSimpleTemplate } from '@/app/actions/templates'

export default function TemplateTestPage() {
    const [selectedTemplate, setSelectedTemplate] = useState('')
    const [studentId, setStudentId] = useState('')
    const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0])
    const [creating, setCreating] = useState(false)
    const [result, setResult] = useState<any>(null)

    const handleCreate = async () => {
        if (!selectedTemplate || !studentId) {
            alert('Lütfen şablon seçin ve öğrenci ID girin')
            return
        }

        setCreating(true)
        setResult(null)

        const res = await createProgramFromSimpleTemplate(
            selectedTemplate,
            studentId,
            startDate
        )

        setCreating(false)
        setResult(res)

        if (res.data) {
            alert(`Program oluşturuldu! ID: ${res.data.id}`)
        } else {
            alert(`Hata: ${res.error}`)
        }
    }

    return (
        <div className="min-h-screen bg-gray-50 p-8">
            <div className="max-w-4xl mx-auto">
                <div className="bg-white rounded-2xl shadow-lg p-8">
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">
                        🧪 Şablon Test Sayfası
                    </h1>
                    <p className="text-gray-600 mb-8">
                        Basit şablonlardan program oluşturmayı test edin
                    </p>

                    <div className="space-y-6">
                        {/* Template Selection */}
                        <div>
                            <label className="block text-sm font-bold text-gray-900 mb-3">
                                1. Şablon Seç
                            </label>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {simpleTemplates.map(template => (
                                    <button
                                        key={template.id}
                                        onClick={() => setSelectedTemplate(template.id)}
                                        className={`text-left p-4 rounded-xl border-2 transition ${selectedTemplate === template.id
                                                ? 'border-indigo-500 bg-indigo-50'
                                                : 'border-gray-200 hover:border-indigo-300'
                                            }`}
                                    >
                                        <h3 className="font-bold text-gray-900 mb-2">
                                            {template.name}
                                        </h3>
                                        <p className="text-xs text-gray-600 mb-3">
                                            {template.description}
                                        </p>
                                        <div className="flex items-center gap-3 text-xs text-gray-500">
                                            <span>📅 {template.duration_days} gün</span>
                                            <span>📋 {template.tasks.length} görev</span>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Student ID */}
                        <div>
                            <label className="block text-sm font-bold text-gray-900 mb-3">
                                2. Öğrenci ID (Test için herhangi bir UUID)
                            </label>
                            <input
                                type="text"
                                value={studentId}
                                onChange={(e) => setStudentId(e.target.value)}
                                placeholder="Örn: 123e4567-e89b-12d3-a456-426614174000"
                                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-indigo-500 outline-none"
                            />
                            <p className="text-xs text-gray-500 mt-2">
                                💡 İpucu: Supabase'deki bir persona ID'si girin
                            </p>
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
                                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-indigo-500 outline-none"
                            />
                        </div>

                        {/* Preview */}
                        {selectedTemplate && (
                            <div className="bg-indigo-50 rounded-xl p-4 border border-indigo-200">
                                <h4 className="text-sm font-bold text-indigo-900 mb-2">
                                    📋 Oluşturulacak Görevler
                                </h4>
                                <div className="space-y-2">
                                    {simpleTemplates
                                        .find(t => t.id === selectedTemplate)
                                        ?.tasks.map((task, idx) => (
                                            <div
                                                key={idx}
                                                className="text-xs text-indigo-700 flex items-center gap-2"
                                            >
                                                <span className="font-bold">Gün {task.day}:</span>
                                                <span>{task.title}</span>
                                                <span className="text-indigo-500">({task.duration}dk)</span>
                                            </div>
                                        ))}
                                </div>
                            </div>
                        )}

                        {/* Create Button */}
                        <button
                            onClick={handleCreate}
                            disabled={!selectedTemplate || !studentId || creating}
                            className="w-full py-4 bg-indigo-600 text-white rounded-xl font-bold text-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
                        >
                            {creating ? 'Oluşturuluyor...' : '🚀 Programı Oluştur'}
                        </button>

                        {/* Result */}
                        {result && (
                            <div className={`p-4 rounded-xl ${result.data ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
                                <h4 className="font-bold mb-2">
                                    {result.data ? '✅ Başarılı!' : '❌ Hata'}
                                </h4>
                                <pre className="text-xs overflow-auto">
                                    {JSON.stringify(result, null, 2)}
                                </pre>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}
