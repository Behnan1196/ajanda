'use client'

import { useState, useEffect } from 'react'
import { getRepertoire, upsertRepertoireItem, getExercises, upsertExercise } from '@/app/actions/music'

interface MusicManagerProps {
    userId: string
}

export default function MusicManager({ userId }: MusicManagerProps) {
    const [repertoire, setRepertoire] = useState<any[]>([])
    const [exercises, setExercises] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [view, setView] = useState<'repertoire' | 'exercises'>('repertoire')

    useEffect(() => {
        loadData()
    }, [userId])

    const loadData = async () => {
        setLoading(true)
        const [rRes, eRes] = await Promise.all([
            getRepertoire(userId),
            getExercises(userId)
        ])
        if (rRes.data) setRepertoire(rRes.data)
        if (eRes.data) setExercises(eRes.data)
        setLoading(false)
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
            </div>

            {view === 'repertoire' ? (
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
                                <span className={`text-[10px] font-bold px-2 py-1 rounded-full ${item.status === 'mastered' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'
                                    }`}>
                                    {item.status === 'mastered' ? 'TAMAMLANDI' : 'ÖĞRENİLİYOR'}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            ) : (
                <div className="space-y-6">
                    <form onSubmit={handleAddExercise} className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm space-y-3">
                        <h3 className="text-sm font-bold text-gray-900">Teknik Egzersiz Ekle</h3>
                        <div className="flex gap-3">
                            <input name="name" placeholder="Egzersiz Adı (rn: Gamlar, Arpej)" required className="text-sm p-2 border rounded-lg flex-1" />
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
        </div>
    )
}
