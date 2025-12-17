'use client'

import { useState, useEffect } from 'react'
import { getCoachSubjects, deleteSubject } from '@/app/actions/subjects'
import SubjectManager from '@/components/coach/SubjectManager'

export default function SubjectsPage() {
    const [subjects, setSubjects] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [showManager, setShowManager] = useState(false)
    const [editingSubject, setEditingSubject] = useState<any>(null)

    useEffect(() => {
        loadSubjects()
    }, [])

    const loadSubjects = async () => {
        setLoading(true)
        const data = await getCoachSubjects()
        setSubjects(data)
        setLoading(false)
    }

    const handleDelete = async (id: string) => {
        if (!confirm('Bu konuyu ve alt başlıklarını silmek istediğinize emin misiniz?')) return
        const res = await deleteSubject(id)
        if (res.success) loadSubjects()
        else alert('Silme hatası: ' + res.error)
    }

    const handleEdit = (subject: any) => {
        setEditingSubject(subject)
        setShowManager(true)
    }

    const handleCreate = () => {
        setEditingSubject(null)
        setShowManager(true)
    }

    return (
        <div className="min-h-screen bg-gray-50 p-6 md:p-8">
            {/* Header */}
            <div className="max-w-7xl mx-auto mb-8 flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Konu Kütüphanesi</h1>
                    <p className="text-gray-500 mt-1">Öğrencilerinize atayabileceğiniz konuları yönetin.</p>
                </div>
                <div>
                    <button
                        onClick={handleCreate}
                        className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 shadow-sm flex items-center gap-2"
                    >
                        <span>+</span> Konu Ekle
                    </button>
                </div>
            </div>

            {/* List */}
            <div className="max-w-7xl mx-auto">
                {loading ? (
                    <div className="flex justify-center py-12">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
                    </div>
                ) : subjects.length === 0 ? (
                    <div className="text-center py-16 bg-white rounded-2xl shadow-sm border border-gray-100">
                        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4 text-3xl">📚</div>
                        <h3 className="text-lg font-medium text-gray-900">Henüz konu eklemediniz</h3>
                        <p className="text-gray-500 mt-2 max-w-sm mx-auto">
                            Kendi müfredatınızı oluşturmak için "Konu Ekle" butonunu kullanın veya hazır şablonlardan yükleme yapın.
                        </p>
                        <button
                            onClick={handleCreate}
                            className="mt-6 text-indigo-600 font-medium hover:text-indigo-800"
                        >
                            Hemen Başla →
                        </button>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {subjects.map((subject) => (
                            <div key={subject.id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 hover:shadow-md transition group relative">
                                <div className="flex items-start justify-between mb-4">
                                    <div className="flex items-center gap-3">
                                        <div
                                            className="w-10 h-10 rounded-lg flex items-center justify-center text-xl"
                                            style={{ backgroundColor: `${subject.color}20`, color: subject.color }}
                                        >
                                            <i className={`icon-${subject.icon}`}></i>
                                            {/* Fallback symbols */}
                                            {subject.icon === 'dumbbell' ? '🏋️' :
                                                subject.icon === 'calculator' ? '🔢' :
                                                    subject.icon === 'book' ? '📚' :
                                                        subject.icon === 'flask' ? '🧪' :
                                                            subject.icon === 'music' ? '🎵' : '📌'}
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-gray-900">{subject.name}</h3>
                                            <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium uppercase tracking-wider ${subject.is_system ? 'bg-gray-100 text-gray-600' : 'bg-green-50 text-green-700'
                                                }`}>
                                                {subject.is_system ? 'Sistem' : 'Kişisel'}
                                            </span>
                                        </div>
                                    </div>
                                    {!subject.is_system && (
                                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition">
                                            <button
                                                onClick={() => handleEdit(subject)}
                                                className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg"
                                                title="Düzenle"
                                            >
                                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                                </svg>
                                            </button>
                                            <button
                                                onClick={() => handleDelete(subject.id)}
                                                className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg"
                                                title="Sil"
                                            >
                                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                </svg>
                                            </button>
                                        </div>
                                    )}
                                </div>

                                <div className="space-y-1">
                                    {subject.topics && subject.topics.length > 0 ? (
                                        subject.topics.map((topic: any) => (
                                            <div key={topic.id} className="text-sm text-gray-600 flex items-center gap-2">
                                                <span className="w-1.5 h-1.5 rounded-full bg-gray-300"></span>
                                                {topic.name}
                                            </div>
                                        ))
                                    ) : (
                                        <p className="text-sm text-gray-400 italic">Alt başlık yok</p>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Modal */}
            {showManager && (
                <SubjectManager
                    editingSubject={editingSubject}
                    onClose={() => setShowManager(false)}
                    onSuccess={() => {
                        setShowManager(false)
                        loadSubjects()
                    }}
                />
            )}
        </div>
    )
}
