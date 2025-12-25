'use client'

import { useState, useEffect } from 'react'
import { getRepertoire, getExercises, getPracticeLogs, recordPractice } from '@/app/actions/music'

interface MusicDiaryProps {
    userId: string
}

export default function MusicDiary({ userId }: MusicDiaryProps) {
    const [repertoire, setRepertoire] = useState<any[]>([])
    const [exercises, setExercises] = useState<any[]>([])
    const [logs, setLogs] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [recording, setRecording] = useState(false)

    useEffect(() => {
        loadData()
    }, [userId])

    const loadData = async () => {
        setLoading(true)
        const [rRes, eRes, lRes] = await Promise.all([
            getRepertoire(userId),
            getExercises(userId),
            getPracticeLogs(userId)
        ])
        if (rRes.data) setRepertoire(rRes.data)
        if (eRes.data) setExercises(eRes.data)
        if (lRes.data) setLogs(lRes.data)
        setLoading(false)
    }

    const handleRecordPractice = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        setRecording(true)
        const formData = new FormData(e.currentTarget)
        const log = {
            duration_minutes: Number(formData.get('duration')),
            content: formData.get('content') as string
        }
        const res = await recordPractice(userId, log)
        if (res.success) {
            loadData()
                ; (e.target as HTMLFormElement).reset()
        }
        setRecording(false)
    }

    if (loading) return <div className="p-8 text-center text-gray-500">Yükleniyor...</div>

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Practice Recording Form */}
                <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-4">
                    <h3 className="text-lg font-bold text-gray-900">⏱️ Bugün Pratiği Yap</h3>
                    <form onSubmit={handleRecordPractice} className="space-y-3">
                        <div>
                            <label className="text-xs font-bold text-gray-500 uppercase">Süre (Dakika)</label>
                            <input name="duration" type="number" required placeholder="30" className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none" />
                        </div>
                        <div>
                            <label className="text-xs font-bold text-gray-500 uppercase">Ne Çalıştın?</label>
                            <textarea name="content" required placeholder="Örn: C Majör Gam, Moonlight Sonata girişi..." className="w-full p-2 border rounded-lg h-24 focus:ring-2 focus:ring-indigo-500 outline-none" />
                        </div>
                        <button
                            disabled={recording}
                            className="bg-indigo-600 text-white w-full py-3 rounded-xl font-bold transition hover:bg-indigo-700 disabled:opacity-50"
                        >
                            {recording ? 'Kaydediliyor...' : 'Pratiği Kaydet'}
                        </button>
                    </form>
                </div>

                {/* Technical Progress */}
                <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-4">
                    <h3 className="text-lg font-bold text-gray-900">🚀 Teknik Gelişim</h3>
                    {exercises.length === 0 ? (
                        <p className="text-sm text-gray-400 italic">Eğitmeniniz henüz egzersiz eklememiş.</p>
                    ) : (
                        <div className="space-y-4">
                            {exercises.map(ex => (
                                <div key={ex.id}>
                                    <div className="flex justify-between text-xs font-bold mb-1">
                                        <span className="text-gray-700">{ex.name}</span>
                                        <span className="text-indigo-600">{ex.current_bpm} / {ex.target_bpm} BPM</span>
                                    </div>
                                    <div className="w-full bg-gray-100 h-1.5 rounded-full overflow-hidden">
                                        <div className="bg-indigo-500 h-full transition-all" style={{ width: `${Math.min((ex.current_bpm / ex.target_bpm) * 100, 100)}%` }} />
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Repertoire Status */}
            <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
                <h3 className="text-lg font-bold text-gray-900 mb-4">🎵 Repertuvarım</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {repertoire.map(song => (
                        <div key={song.id} className="p-4 border rounded-xl bg-gray-50">
                            <h4 className="font-bold text-gray-900 text-sm">{song.title}</h4>
                            <p className="text-xs text-gray-500 mb-2">{song.artist}</p>
                            <span className={`text-[10px] font-bold px-2 py-1 rounded-full ${song.status === 'mastered' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'
                                }`}>
                                {song.status === 'mastered' ? 'TAMAMLANDI' : 'ÖĞRENİLİYOR'}
                            </span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    )
}
