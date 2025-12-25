'use client'

import { useState, useEffect } from 'react'
import { getCoachSubjects, deleteSubject } from '@/app/actions/subjects'
import SubjectManager from './SubjectManager'
import LibraryItemManager from './LibraryItemManager'
import AssignProgramModal from './AssignProgramModal'

interface TutorToolsViewProps {
    onSelectTool: (tool: string) => void
}

export default function TutorToolsView({ onSelectTool }: TutorToolsViewProps) {
    const [subjects, setSubjects] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [showManager, setShowManager] = useState(false)
    const [editingSubject, setEditingSubject] = useState<any>(null)

    const [showLibrary, setShowLibrary] = useState(false)
    const [showAssignModal, setShowAssignModal] = useState(false)
    const [selectedSubject, setSelectedSubject] = useState<any>(null)

    useEffect(() => {
        loadSubjects()
    }, [])

    const loadSubjects = async () => {
        setLoading(true)
        const data = await getCoachSubjects()
        setSubjects(data)
        setLoading(false)
    }

    const handleEdit = (subject: any) => {
        setEditingSubject(subject)
        setShowManager(true)
    }

    const handleDelete = async (id: string) => {
        if (!confirm('Bu programı silmek istediğinize emin misiniz?')) return
        const res = await deleteSubject(id)
        if (res.success) loadSubjects()
    }

    return (
        <div className="max-w-6xl mx-auto p-4 md:p-8 space-y-12 min-h-[80vh]">
            {/* Expertise Tools Desk */}
            <section className="space-y-6">
                <div>
                    <h2 className="text-xl font-black text-gray-900 tracking-tight">Uzmanlık Masası</h2>
                    <p className="text-gray-500 text-xs font-medium">Özel araçlar üzerinden detaylı yönetim yapın.</p>
                </div>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    <button
                        onClick={() => onSelectTool('nutrition')}
                        className="bg-white border border-gray-200 rounded-3xl p-6 text-center hover:border-purple-300 hover:shadow-xl hover:shadow-purple-100/30 transition-all group"
                    >
                        <span className="text-4xl block mb-3 group-hover:scale-110 transition duration-300">🍏</span>
                        <h3 className="font-bold text-gray-900 group-hover:text-purple-600 transition">Beslenme Yönetimi</h3>
                        <p className="text-[10px] text-gray-400 mt-1 uppercase font-bold">Plan & Şablonlar</p>
                    </button>
                    <button
                        onClick={() => onSelectTool('music')}
                        className="bg-white border border-gray-200 rounded-3xl p-6 text-center hover:border-purple-300 hover:shadow-xl hover:shadow-purple-100/30 transition-all group"
                    >
                        <span className="text-4xl block mb-3 group-hover:scale-110 transition duration-300">🎸</span>
                        <h3 className="font-bold text-gray-900 group-hover:text-purple-600 transition">Müzik Yönetimi</h3>
                        <p className="text-[10px] text-gray-400 mt-1 uppercase font-bold">Pratik & Şablonlar</p>
                    </button>
                    {/* Placeholder for future tools */}
                    <div className="bg-gray-50/50 border border-dashed border-gray-200 rounded-3xl p-6 flex flex-col items-center justify-center opacity-40">
                        <span className="text-2xl mb-2 grayscale">🧠</span>
                        <p className="text-[10px] font-bold text-gray-400 uppercase">Yeni Araçlar Yolda</p>
                    </div>
                </div>
            </section>

            <div className="h-[1px] bg-gray-100"></div>

            <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-black text-gray-900 tracking-tight">Program Kütüphanesi</h2>
                    <p className="text-gray-500 font-medium">Tüm şablon programlarınızı buradan yönetin.</p>
                </div>
                <button
                    onClick={() => {
                        setEditingSubject(null)
                        setShowManager(true)
                    }}
                    className="px-8 py-3 bg-purple-600 text-white rounded-[2rem] font-bold shadow-lg shadow-purple-200 hover:bg-purple-700 hover:-translate-y-0.5 transition active:scale-95 flex items-center justify-center gap-2"
                >
                    <span className="text-xl">✨</span>
                    Yeni Şablon Oluştur
                </button>
            </header>

            {loading ? (
                <div className="p-12 text-center text-gray-500 font-medium">Yükleniyor...</div>
            ) : subjects.length === 0 ? (
                <div className="p-12 text-center bg-white rounded-2xl border border-dashed border-gray-200 text-gray-400">
                    <p className="text-sm">Henüz bir program tanımlanmadı. Uzmanlık şablonlarını oluşturmaya başlayabilirsiniz.</p>
                </div>
            ) : (
                <div className="space-y-12">
                    {Array.from(new Set(subjects.map(s => s.module_type || 'general'))).sort().map(moduleType => (
                        <div key={moduleType} className="space-y-6">
                            <div className="flex items-center gap-3">
                                <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest whitespace-nowrap">
                                    {getModuleName(moduleType)}
                                </h3>
                                <div className="h-[1px] flex-1 bg-gray-100"></div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {subjects.filter(s => (s.module_type || 'general') === moduleType).map((subject) => (
                                    <div
                                        key={subject.id}
                                        className="bg-white border border-gray-200 rounded-[2rem] p-5 hover:border-purple-300 hover:shadow-xl hover:shadow-purple-100/50 transition-all duration-300 group relative"
                                    >
                                        <div className="flex items-start justify-between mb-4">
                                            <div className="flex items-center gap-4">
                                                <div
                                                    className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl shadow-sm border border-gray-50 group-hover:scale-110 transition-transform"
                                                    style={{ backgroundColor: `${subject.color}15`, color: subject.color }}
                                                >
                                                    {imageIconFallback(subject.icon) || '📌'}
                                                </div>
                                                <div>
                                                    <h3 className="font-bold text-gray-900 leading-tight">{subject.name}</h3>
                                                    <div className="flex items-center gap-2 mt-0.5">
                                                        <span className="text-[10px] text-gray-400 font-bold tracking-wider uppercase">
                                                            {subject.category || 'GENEL'}
                                                        </span>
                                                        {subject.is_system && (
                                                            <span className="text-[8px] bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded-full font-black italic">
                                                                SİSTEM
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition duration-200 translate-x-2 group-hover:translate-x-0">
                                                <button
                                                    onClick={() => {
                                                        setSelectedSubject(subject)
                                                        setShowLibrary(true)
                                                    }}
                                                    className="p-2 text-gray-400 hover:text-purple-600 hover:bg-purple-50 rounded-xl transition"
                                                    title="Görev Şablonlarını Yönet"
                                                >
                                                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                                                    </svg>
                                                </button>
                                                <button
                                                    onClick={() => {
                                                        setSelectedSubject(subject)
                                                        setShowAssignModal(true)
                                                    }}
                                                    className="p-2 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-xl transition"
                                                    title="Öğrenciye Ata"
                                                >
                                                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                                    </svg>
                                                </button>
                                                {!subject.is_system && (
                                                    <>
                                                        <button
                                                            onClick={() => handleEdit(subject)}
                                                            className="p-2 text-gray-400 hover:text-purple-600 hover:bg-purple-50 rounded-xl transition"
                                                            title="Düzenle"
                                                        >
                                                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                                            </svg>
                                                        </button>
                                                        <button
                                                            onClick={() => handleDelete(subject.id)}
                                                            className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition"
                                                            title="Sil"
                                                        >
                                                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                            </svg>
                                                        </button>
                                                    </>
                                                )}
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-4 text-[10px] font-bold text-gray-500 bg-gray-50/50 p-2 rounded-xl group-hover:bg-purple-50 transition">
                                            <span className="flex items-center gap-1">🏷️ {subject.topics?.length || 0} Başlık</span>
                                            <span className="w-1 h-1 bg-gray-300 rounded-full"></span>
                                            <span className="truncate flex-1">📝 {subject.description || 'Şablon detayları tanımlanmadı.'}</span>
                                        </div>
                                    </div>
                                ))}
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
            {showLibrary && selectedSubject && (
                <LibraryItemManager
                    subject={selectedSubject}
                    onClose={() => setShowLibrary(false)}
                />
            )}

            {showAssignModal && selectedSubject && (
                <AssignProgramModal
                    subject={selectedSubject}
                    onClose={() => setShowAssignModal(false)}
                    onSuccess={() => {
                        setShowAssignModal(false)
                        loadSubjects()
                    }}
                />
            )}
        </div>
    )
}

function getModuleName(type: string) {
    if (type === 'nutrition') return 'Beslenme Programları'
    if (type === 'music') return 'Enstrüman Programları'
    if (type === 'fitness') return 'Fitness & Spor'
    if (type === 'academic') return 'Akademik Planlar'
    return 'Genel Planlar'
}

function imageIconFallback(icon: string) {
    if (icon === 'dumbbell') return '🏋️'
    if (icon === 'calculator') return '🔢'
    if (icon === 'book') return '📚'
    if (icon === 'flask') return '🧪'
    if (icon === 'music') return '🎵'
    return '📌'
}
