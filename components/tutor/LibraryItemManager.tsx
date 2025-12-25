'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { getLibraryItems, saveLibraryItems, deleteLibraryItem } from '@/app/actions/subjects'

interface LibraryItemManagerProps {
    subject: any
    onClose: () => void
}

export default function LibraryItemManager({ subject, onClose }: LibraryItemManagerProps) {
    const [items, setItems] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [taskTypes, setTaskTypes] = useState<any[]>([])
    const [isSaving, setIsSaving] = useState(false)

    // New Item Form State
    const [newTitle, setNewTitle] = useState('')
    const [newType, setNewType] = useState('')
    const [newOffset, setNewOffset] = useState(0)
    const [selectedTopic, setSelectedTopic] = useState('')

    const supabase = createClient()

    useEffect(() => {
        loadData()
    }, [subject.id])

    const loadData = async () => {
        setLoading(true)
        const [libItems, { data: types }] = await Promise.all([
            getLibraryItems(subject.id),
            supabase.from('task_types').select('*').eq('is_active', true)
        ])
        setItems(libItems)
        setTaskTypes(types || [])
        if (types && types.length > 0) setNewType(types[0].id)
        if (subject.topics?.length > 0) setSelectedTopic(subject.topics[0].id)
        setLoading(false)
    }

    const handleAddItem = async () => {
        if (!newTitle.trim()) return

        const newItem = {
            subject_id: subject.id,
            topic_id: selectedTopic || null,
            task_type_id: newType,
            title: newTitle.trim(),
            day_offset: newOffset,
            is_active: true
        }

        setIsSaving(true)
        const res = await saveLibraryItems([newItem])
        setIsSaving(false)

        if (res.success) {
            setNewTitle('')
            loadData()
        } else {
            alert('Hata: ' + res.error)
        }
    }

    const handleDelete = async (id: string) => {
        if (!confirm('Bu şablon görevi silmek istediğinize emin misiniz?')) return
        const res = await deleteLibraryItem(id)
        if (res.success) loadData()
    }

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60] animate-fadeIn">
            <div className="bg-white w-full max-w-2xl rounded-2xl p-6 shadow-xl animate-scaleIn max-h-[90vh] flex flex-col">
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h2 className="text-xl font-bold text-gray-900">{subject.name} - Görev Kütüphanesi</h2>
                        <p className="text-xs text-gray-500">Program içindeki otomatik görevleri tanımlayın.</p>
                    </div>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600">✕</button>
                </div>

                {/* Add Form */}
                <div className="bg-purple-50 p-4 rounded-xl border border-purple-100 mb-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <div>
                            <label className="block text-[10px] font-bold text-purple-700 mb-1 uppercase">GÖREV ADI</label>
                            <input
                                value={newTitle}
                                onChange={e => setNewTitle(e.target.value)}
                                className="w-full px-3 py-2 bg-white border border-purple-200 rounded-lg text-sm focus:ring-2 focus:ring-purple-500"
                                placeholder="Örn: Giriş videosunu izle"
                            />
                        </div>
                        <div>
                            <label className="block text-[10px] font-bold text-purple-700 mb-1 uppercase">GÖREV TİPİ</label>
                            <select
                                value={newType}
                                onChange={e => setNewType(e.target.value)}
                                className="w-full px-3 py-2 bg-white border border-purple-200 rounded-lg text-sm"
                            >
                                {taskTypes.map(t => (
                                    <option key={t.id} value={t.id}>{t.name}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end mb-4">
                        <div>
                            <label className="block text-[10px] font-bold text-purple-700 mb-1 uppercase">ALT BAŞLIK / MODÜL</label>
                            <select
                                value={selectedTopic}
                                onChange={e => setSelectedTopic(e.target.value)}
                                className="w-full px-3 py-2 bg-white border border-purple-200 rounded-lg text-sm"
                            >
                                <option value="">Genel (Konusuz)</option>
                                {subject.topics?.map((topic: any) => (
                                    <option key={topic.id} value={topic.id}>{topic.name}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-[10px] font-bold text-purple-700 mb-1 uppercase">ZAMANLAMA (Gün Ofseti)</label>
                            <div className="flex items-center gap-2">
                                <input
                                    type="number"
                                    value={newOffset}
                                    onChange={e => setNewOffset(parseInt(e.target.value))}
                                    className="w-20 px-3 py-2 bg-white border border-purple-200 rounded-lg text-sm"
                                    min="0"
                                />
                                <span className="text-xs text-purple-600">
                                    {newOffset === 0 ? 'Başlangıç Günü' : `${newOffset}. Gün`}
                                </span>
                            </div>
                        </div>
                    </div>
                    <button
                        onClick={handleAddItem}
                        disabled={isSaving || !newTitle}
                        className="w-full bg-purple-600 text-white py-2 rounded-lg text-sm font-bold hover:bg-purple-700 transition disabled:opacity-50"
                    >
                        {isSaving ? 'Ekleniyor...' : '+ Görev Şablonu Ekle'}
                    </button>
                </div>

                {/* List */}
                <div className="flex-1 overflow-y-auto pr-2">
                    {loading ? (
                        <div className="text-center py-12 text-gray-400">Yükleniyor...</div>
                    ) : items.length === 0 ? (
                        <div className="text-center py-12 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                            <span className="text-3xl block mb-2">📋</span>
                            <p className="text-sm text-gray-500">Henüz şablon görev eklenmemiş.</p>
                        </div>
                    ) : (
                        <table className="w-full text-left text-sm">
                            <thead className="text-[10px] text-gray-400 uppercase font-bold sticky top-0 bg-white">
                                <tr>
                                    <th className="pb-3 pr-4">Zaman</th>
                                    <th className="pb-3 pr-4">Görev</th>
                                    <th className="pb-3 pr-4">Tipi</th>
                                    <th className="pb-3 text-right">İşlem</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {items.map(item => (
                                    <tr key={item.id} className="group">
                                        <td className="py-3 pr-4 font-medium text-purple-600">
                                            {item.day_offset === 0 ? 'Başlangıç' : `${item.day_offset}. Gün`}
                                        </td>
                                        <td className="py-3 pr-4 font-semibold text-gray-900">{item.title}</td>
                                        <td className="py-3 pr-4">
                                            <span className="px-2 py-0.5 bg-gray-100 rounded text-[10px] font-bold text-gray-500">
                                                {item.task_types?.name}
                                            </span>
                                        </td>
                                        <td className="py-3 text-right">
                                            <button
                                                onClick={() => handleDelete(item.id)}
                                                className="p-1.5 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition"
                                            >
                                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                </svg>
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>

                <div className="mt-6 pt-6 border-t border-gray-100 flex justify-end">
                    <button
                        onClick={onClose}
                        className="px-6 py-2 bg-gray-900 text-white rounded-xl text-sm font-bold hover:bg-gray-800 transition"
                    >
                        Tamamlandı
                    </button>
                </div>
            </div>
        </div>
    )
}
