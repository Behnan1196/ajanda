'use client'

import { useState, useEffect } from 'react'
import { getCoachSubjects, deleteSubject } from '@/app/actions/subjects'
import SubjectManager from '@/components/tutor/SubjectManager'
import { useRouter } from 'next/navigation'

interface TutorToolsViewProps {
    onSelectTool?: (tool: string) => void
}

export default function TutorToolsView({ onSelectTool }: TutorToolsViewProps) {
    const router = useRouter()
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
        <div className="space-y-8">
            {/* Quick Modules Section */}
            <div>
                <h2 className="text-xl font-bold text-gray-900 mb-4">Uzmanlık Araçları</h2>
                <div className="grid grid-cols-2 gap-4">
                    <button
                        onClick={() => onSelectTool?.('nutrition')}
                        className="bg-white border border-gray-200 rounded-2xl p-6 text-center hover:border-purple-500 transition shadow-sm group"
                    >
                        <span className="text-3xl block mb-2 group-hover:scale-110 transition">🍏</span>
                        <h3 className="font-bold text-gray-900">Beslenme Yönetimi</h3>
                        <p className="text-[10px] text-gray-500 mt-1">Ölçüm girişi ve diyet planı</p>
                    </button>
                    <button
                        onClick={() => onSelectTool?.('music')}
                        className="bg-white border border-gray-200 rounded-2xl p-6 text-center hover:border-purple-500 transition shadow-sm group"
                    >
                        <span className="text-3xl block mb-2 group-hover:scale-110 transition">🎸</span>
                        <h3 className="font-bold text-gray-900">Enstrüman Eğitimi</h3>
                        <p className="text-[10px] text-gray-500 mt-1">Repertuvar ve teknik gelişim</p>
                    </button>
                    <button
                        onClick={() => onSelectTool?.('projects')}
                        className="bg-white border border-gray-200 rounded-2xl p-6 text-center hover:border-purple-500 transition shadow-sm group"
                    >
                        <span className="text-3xl block mb-2 group-hover:scale-110 transition">🏗️</span>
                        <h3 className="font-bold text-gray-900">Projelerim</h3>
                        <p className="text-[10px] text-gray-500 mt-1">Süreç ve planlama yönetimi</p>
                    </button>
                </div>
            </div>

            <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-900">Program Kütüphanesi</h2>
                <button
                    onClick={handleCreate}
                    className="px-3 py-1.5 bg-purple-600 text-white rounded-lg hover:bg-purple-700 text-sm font-medium transition shadow-sm"
                >
                    + Yeni Program
                </button>
            </div>

            {loading ? (
                <div className="flex justify-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
                </div>
            ) : subjects.length === 0 ? (
                <div className="text-center py-12 bg-gray-50 rounded-xl border border-dashed border-gray-300">
                    <span className="text-3xl block mb-2">📚</span>
                    <p className="text-gray-500 text-sm">Henüz bir program oluşturmadınız.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {subjects.map((subject) => (
                        <div
                            key={subject.id}
                            className="bg-white border border-gray-200 rounded-xl p-4 hover:shadow-sm transition group"
                        >
                            <div className="flex items-start justify-between">
                                <div className="flex items-center gap-3">
                                    <div
                                        className="w-10 h-10 rounded-lg flex items-center justify-center text-xl"
                                        style={{ backgroundColor: `${subject.color}20`, color: subject.color }}
                                    >
                                        {imageIconFallback(subject.icon)}
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-gray-900">{subject.name}</h3>
                                        <div className="flex gap-1 mt-0.5">
                                            <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${subject.is_system ? 'bg-gray-100 text-gray-600' : 'bg-purple-50 text-purple-700'
                                                }`}>
                                                {subject.is_system ? 'Sistem' : 'Kişisel'}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                                {!subject.is_system && (
                                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition">
                                        <button
                                            onClick={() => handleEdit(subject)}
                                            className="p-1 text-gray-400 hover:text-purple-600"
                                        >
                                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                            </svg>
                                        </button>
                                        <button
                                            onClick={() => handleDelete(subject.id)}
                                            className="p-1 text-gray-400 hover:text-red-500"
                                        >
                                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                            </svg>
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}

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

function imageIconFallback(icon: string) {
    if (icon === 'dumbbell') return '🏋️'
    if (icon === 'calculator') return '🔢'
    if (icon === 'book') return '📚'
    if (icon === 'flask') return '🧪'
    if (icon === 'music') return '🎵'
    return '📌'
}
