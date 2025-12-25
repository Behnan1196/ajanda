'use client'

import { useState, useEffect } from 'react'
import { getRepertoire, upsertRepertoireItem, getExercises, upsertExercise } from '@/app/actions/music'
import { getCoachSubjects, deleteSubject } from '@/app/actions/subjects'
import SubjectManager from '@/components/tutor/SubjectManager'
import LibraryItemManager from '@/components/tutor/LibraryItemManager'
import AssignProgramModal from '@/components/tutor/AssignProgramModal'

interface MusicManagerProps {
    userId: string
}

export default function MusicManager({ userId }: MusicManagerProps) {
    const [repertoire, setRepertoire] = useState<any[]>([])
    const [exercises, setExercises] = useState<any[]>([])
    const [subjects, setSubjects] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [view, setView] = useState<'repertoire' | 'exercises' | 'templates'>('repertoire')

    // Template management states
    const [showSubjectManager, setShowSubjectManager] = useState(false)
    const [showLibrary, setShowLibrary] = useState(false)
    const [showAssignModal, setShowAssignModal] = useState(false)
    const [selectedSubject, setSelectedSubject] = useState<any>(null)
    const [editingSubject, setEditingSubject] = useState<any>(null)

    useEffect(() => {
        loadData()
    }, [userId])

    const loadData = async () => {
        setLoading(true)
        const [rRes, eRes, sRes] = await Promise.all([
            getRepertoire(userId),
            getExercises(userId),
            getCoachSubjects('music')
        ])
        if (rRes.data) setRepertoire(rRes.data)
        if (eRes.data) setExercises(eRes.data)
        setSubjects(sRes)
        setLoading(false)
    }

    const handleDeleteSubject = async (id: string) => {
        if (!confirm('Bu programı silmek istediğinize emin misiniz?')) return
        const res = await deleteSubject(id)
        if (res.success) loadData()
    }

    const handleAddSong = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        const formData = new FormData(e.currentTarget)
        const item = {
            title: formData.get('title'),
            artist: formData.get('artist'),
            status: 'learning',
            difficulty: Number(formData.get('difficulty'))
        }
        const res = await upsertRepertoireItem(userId, item)
        if (res.success) {
            loadData()
                ; (e.target as HTMLFormElement).reset()
        }
    }

    const handleAddExercise = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        const formData = new FormData(e.currentTarget)
        const exercise = {
            name: formData.get('name'),
            target_bpm: Number(formData.get('target_bpm')),
            current_bpm: 0
        }
        const res = await upsertExercise(userId, exercise)
        if (res.success) {
            loadData()
                ; (e.target as HTMLFormElement).reset()
        }
    }

    if (loading) return <div className="p-8 text-center text-gray-400">Yükleniyor...</div>

    return (
        <div className="space-y-6">
            <div className="flex bg-gray-100 p-1 rounded-xl">
                <button
                    onClick={() => setView('repertoire')}
                    className={`flex-1 py-2 text-sm font-bold rounded-lg transition ${view === 'repertoire' ? 'bg-white shadow-sm text-indigo-600' : 'text-gray-500'}`}
                >
                    🎼 Repertuvar
                </button>
                <button
                    onClick={() => setView('exercises')}
                    className={`flex-1 py-2 text-sm font-bold rounded-lg transition ${view === 'exercises' ? 'bg-white shadow-sm text-indigo-600' : 'text-gray-500'}`}
                >
                    🎹 Egzersizler
                </button>
                <button
                    onClick={() => setView('templates')}
                    className={`flex-1 py-2 text-sm font-bold rounded-lg transition ${view === 'templates' ? 'bg-white shadow-sm text-indigo-600' : 'text-gray-500'}`}
                >
                    🎸 Şablonlar
                </button>
            </div>

            {view === 'repertoire' && (
                <div className="space-y-6">
                    <form onSubmit={handleAddSong} className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm space-y-3">
                        <h3 className="text-sm font-bold text-gray-900">Yeni Parça Ekle</h3>
                        <div className="grid grid-cols-2 gap-3">
                            <input name="title" placeholder="Parça Adı" required className="text-sm p-2 border rounded-lg" />
                            <input name="artist" placeholder="Sanatçı" className="text-sm p-2 border rounded-lg" />
                        </div>
                        <div className="flex gap-3">
                            <select name="difficulty" className="text-sm p-2 border rounded-lg flex-1">
                                <option value="1">⭐ Çok Kolay</option>
                                <option value="2">⭐⭐ Kolay</option>
                                <option value="3">⭐⭐⭐ Orta</option>
                                <option value="4">⭐⭐⭐⭐ Zor</option>
                                <option value="5">⭐⭐⭐⭐⭐ Üstad</option>
                            </select>
                            <button type="submit" className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-bold">Ekle</button>
                        </div>
                    </form>

                    <div className="space-y-3">
                        {repertoire.map((item) => (
                            <div key={item.id} className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex items-center justify-between">
                                <div>
                                    <h4 className="font-bold text-gray-900">{item.title}</h4>
                                    <p className="text-xs text-gray-500">{item.artist} • {"⭐".repeat(item.difficulty)}</p>
                                </div>
                                <span className={`text-[10px] font-bold px-2 py-1 rounded-full ${item.status === 'mastered' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'}`}>
                                    {item.status === 'mastered' ? 'TAMAMLANDI' : 'ÖĞRENİLİYOR'}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {view === 'exercises' && (
                <div className="space-y-6">
                    <form onSubmit={handleAddExercise} className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm space-y-3">
                        <h3 className="text-sm font-bold text-gray-900">Teknik Egzersiz Ekle</h3>
                        <div className="flex gap-3">
                            <input name="name" placeholder="Egzersiz Adı (Örn: Gamlar, Arpej)" required className="text-sm p-2 border rounded-lg flex-1" />
                            <input name="target_bpm" type="number" placeholder="Hedef BPM" className="text-sm p-2 border rounded-lg w-24" />
                            <button type="submit" className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-bold">Ekle</button>
                        </div>
                    </form>

                    <div className="grid grid-cols-1 gap-3">
                        {exercises.map((ex) => (
                            <div key={ex.id} className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
                                <div className="flex justify-between items-center mb-2">
                                    <h4 className="font-bold text-gray-900">{ex.name}</h4>
                                    <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-2 py-1 rounded-lg">Hedef: {ex.target_bpm} BPM</span>
                                </div>
                                <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
                                    <div
                                        className="bg-indigo-500 h-full transition-all"
                                        style={{ width: `${Math.min((ex.current_bpm / ex.target_bpm) * 100, 100)}%` }}
                                    />
                                </div>
                                <p className="text-[10px] text-gray-400 mt-2 text-right">Güncel: {ex.current_bpm} BPM</p>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {view === 'templates' && (
                <div className="space-y-6">
                    <div className="flex items-center justify-between">
                        <h3 className="text-lg font-bold text-gray-900">Müzik Programı Kütüphanesi</h3>
                        <button
                            onClick={() => {
                                setEditingSubject(null)
                                setShowSubjectManager(true)
                            }}
                            className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-sm font-bold hover:bg-indigo-700 transition shadow-sm"
                        >
                            + Yeni Şablon Program
                        </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {subjects.map(subject => (
                            <div key={subject.id} className="group relative p-4 bg-white border border-gray-100 rounded-2xl hover:border-indigo-300 hover:shadow-md transition">
                                <div className="flex items-center justify-between mb-4">
                                    <div className="flex items-center gap-3">
                                        <span className="text-2xl">{subject.icon || '🎸'}</span>
                                        <div>
                                            <h4 className="font-bold text-gray-900">{subject.name}</h4>
                                            <p className="text-[10px] text-gray-400 uppercase font-bold tracking-wider">{subject.category || 'MÜZİK'}</p>
                                        </div>
                                    </div>
                                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition">
                                        <button
                                            onClick={() => {
                                                setSelectedSubject(subject)
                                                setShowLibrary(true)
                                            }}
                                            className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition"
                                            title="Görevleri Düzenle"
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
                                            className="p-1.5 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition"
                                            title="Öğrenciye Ata"
                                        >
                                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                            </svg>
                                        </button>
                                        <button
                                            onClick={() => {
                                                setEditingSubject(subject)
                                                setShowSubjectManager(true)
                                            }}
                                            className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition"
                                            title="Programı Düzenle"
                                        >
                                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                            </svg>
                                        </button>
                                        <button
                                            onClick={() => handleDeleteSubject(subject.id)}
                                            className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition"
                                            title="Sil"
                                        >
                                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                            </svg>
                                        </button>
                                    </div>
                                </div>
                                <div className="text-xs text-gray-500">
                                    {subject.topics?.length || 0} Alt Başlık • {subject.description || 'Müzik programı şablonu.'}
                                </div>
                            </div>
                        ))}
                        {subjects.length === 0 && (
                            <div className="col-span-full py-12 text-center bg-gray-50 rounded-2xl border border-dashed border-gray-200">
                                <p className="text-gray-400 text-sm">Henüz bir müzik şablonu oluşturulmadı.</p>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Modals */}
            {showSubjectManager && (
                <SubjectManager
                    editingSubject={editingSubject}
                    onClose={() => setShowSubjectManager(false)}
                    onSuccess={() => {
                        setShowSubjectManager(false)
                        loadData()
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
                    onSuccess={() => setShowAssignModal(false)}
                />
            )}
        </div>
    )
}
