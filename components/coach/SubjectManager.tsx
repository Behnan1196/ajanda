'use client'

import { useState, useEffect } from 'react'
import { createSubject, updateSubject, deleteTopic, createTopic, seedSpecialty, getTemplates } from '@/app/actions/subjects'

interface Topic {
    id?: string
    name: string
}

interface SubjectManagerProps {
    editingSubject?: any
    onClose: () => void
    onSuccess: () => void
}

export default function SubjectManager({ editingSubject, onClose, onSuccess }: SubjectManagerProps) {
    const isEditMode = !!editingSubject
    const [mode, setMode] = useState<'create' | 'import'>(isEditMode ? 'create' : 'create')
    const [loading, setLoading] = useState(false)
    const [templates, setTemplates] = useState<any[]>([])

    // Form State
    const [name, setName] = useState('')
    const [category, setCategory] = useState('')
    const [icon, setIcon] = useState('book')
    const [color, setColor] = useState('#4F46E5')
    const [topics, setTopics] = useState<Topic[]>([])
    const [newTopic, setNewTopic] = useState('')

    // Initialize form with editing data
    useEffect(() => {
        if (editingSubject) {
            setName(editingSubject.name)
            setCategory(editingSubject.category || '')
            setIcon(editingSubject.icon || 'book')
            setColor(editingSubject.color || '#4F46E5')
            setTopics(editingSubject.topics || [])
        }
    }, [editingSubject])

    // Load templates when switching to import mode
    const loadTemplates = async () => {
        setLoading(true)
        const data = await getTemplates()
        setTemplates(data)
        setLoading(false)
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)

        if (isEditMode) {
            // Update
            const res = await updateSubject(editingSubject.id, { name, category, icon, color })
            setLoading(false)
            if (res.success) onSuccess()
        } else {
            // Create
            const topicsList = topics.map(t => t.name)
            const res = await createSubject({ name, category, icon, color, topics: topicsList })
            setLoading(false)
            if (res.success) onSuccess()
        }
    }

    const handleImport = async (slug: string) => {
        setLoading(true)
        const res = await seedSpecialty(slug)
        setLoading(false)
        if (res.success) onSuccess()
    }

    const handleAddTopic = async () => {
        if (!newTopic.trim()) return

        if (isEditMode) {
            // Immediate create
            const res = await createTopic({
                subject_id: editingSubject.id,
                name: newTopic.trim()
            })
            if (res.success) {
                // We should ideally reload data, but for now let's just push to local state to reflect UI
                // A better way is to wait for parent reload or trigger a re-fetch, 
                // but since we don't have re-fetcher passed, we optimistically update or reload page.
                // The onSuccess passed from parent triggers a reloadTasks usually.
                // Here we might need to be careful. 
                // Let's just create a temporary object. The parent WILL refresh on close.
                setTopics([...topics, { name: newTopic.trim(), id: 'temp-' + Date.now() }])
                setNewTopic('')
                // Note: Real ID is unknown until refresh.
            }
        } else {
            // Local add
            setTopics([...topics, { name: newTopic.trim() }])
            setNewTopic('')
        }
    }

    const handleRemoveTopic = async (index: number) => {
        const topic = topics[index]

        if (isEditMode && topic.id && !topic.id.startsWith('temp-')) {
            if (!confirm('Bu alt başlığı silmek istediğinize emin misiniz?')) return
            const res = await deleteTopic(topic.id)
            if (res.success) {
                setTopics(topics.filter((_, i) => i !== index))
            }
        } else {
            setTopics(topics.filter((_, i) => i !== index))
        }
    }

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 animate-fadeIn">
            <div className="bg-white w-full max-w-md rounded-2xl p-6 shadow-xl animate-scaleIn max-h-[90vh] overflow-y-auto">
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-bold text-gray-900">
                        {isEditMode ? 'Konuyu Düzenle' : 'Konu Yönetimi'}
                    </h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600">✕</button>
                </div>

                {/* Tabs - Only show in create mode */}
                {!isEditMode && (
                    <div className="flex gap-2 mb-6 bg-gray-100 p-1 rounded-lg">
                        <button
                            onClick={() => setMode('create')}
                            className={`flex-1 py-2 text-sm font-medium rounded-md transition ${mode === 'create' ? 'bg-white shadow text-indigo-600' : 'text-gray-600 hover:bg-gray-200'}`}
                        >
                            Yeni Konu
                        </button>
                        <button
                            onClick={() => {
                                setMode('import')
                                loadTemplates()
                            }}
                            className={`flex-1 py-2 text-sm font-medium rounded-md transition ${mode === 'import' ? 'bg-white shadow text-indigo-600' : 'text-gray-600 hover:bg-gray-200'}`}
                        >
                            Şablondan Yükle
                        </button>
                    </div>
                )}

                {mode === 'create' ? (
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Kategori</label>
                                <input
                                    value={category}
                                    onChange={e => setCategory(e.target.value)}
                                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
                                    placeholder="Örn: TYT, Diyet"
                                    list="category-suggestions"
                                />
                                <datalist id="category-suggestions">
                                    <option value="TYT" />
                                    <option value="AYT" />
                                    <option value="Spor" />
                                    <option value="Diyet" />
                                    <option value="Dil Öğrenimi" />
                                </datalist>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Program Adı</label>
                                <input
                                    value={name}
                                    onChange={e => setName(e.target.value)}
                                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
                                    required
                                    placeholder="Örn: Biyoloji, 30 Günlük Yoga"
                                />
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">İkon</label>
                                <select
                                    value={icon}
                                    onChange={e => setIcon(e.target.value)}
                                    className="w-full px-3 py-2 border rounded-lg"
                                >
                                    <option value="book">Kitap</option>
                                    <option value="calculator">Hesap Mak.</option>
                                    <option value="flask">Deney</option>
                                    <option value="dumbbell">Spor</option>
                                    <option value="music">Müzik</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Renk</label>
                                <input
                                    type="color"
                                    value={color}
                                    onChange={e => setColor(e.target.value)}
                                    className="w-full h-10 p-1 border rounded-lg cursor-pointer"
                                />
                            </div>
                        </div>

                        {/* Topics Section */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Alt Başlıklar</label>
                            <div className="flex gap-2 mb-2">
                                <input
                                    value={newTopic}
                                    onChange={e => setNewTopic(e.target.value)}
                                    onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), handleAddTopic())}
                                    className="flex-1 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 text-sm"
                                    placeholder="Örn: Türev, İntegral..."
                                />
                                <button
                                    type="button"
                                    onClick={handleAddTopic}
                                    className="px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 font-medium text-sm"
                                >
                                    Ekle
                                </button>
                            </div>

                            {topics.length > 0 && (
                                <div className="space-y-2 mt-2 max-h-40 overflow-y-auto">
                                    {topics.map((topic, idx) => (
                                        <div key={idx} className="flex items-center justify-between bg-gray-50 px-3 py-2 rounded-lg border border-gray-100 text-sm">
                                            <span>{topic.name}</span>
                                            <button
                                                type="button"
                                                onClick={() => handleRemoveTopic(idx)}
                                                className="text-gray-400 hover:text-red-500"
                                            >
                                                ✕
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                            {isEditMode && (
                                <p className="text-[10px] text-gray-400 mt-1">* Düzenleme modunda eklediğiniz/sildiğiniz alt başlıklar anında kaydedilir.</p>
                            )}
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full py-2.5 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 transition disabled:opacity-50"
                        >
                            {loading ? (isEditMode ? 'Güncelleniyor...' : 'Oluşturuluyor...') : (isEditMode ? 'Güncelle' : 'Oluştur')}
                        </button>
                    </form>
                ) : (
                    <div className="space-y-3">
                        {loading && templates.length === 0 ? (
                            <div className="text-center py-4 text-gray-500">Yükleniyor...</div>
                        ) : templates.map(t => (
                            <div key={t.slug} className="border rounded-lg p-3 hover:border-indigo-300 transition group">
                                <div className="flex items-center justify-between mb-1">
                                    <h3 className="font-semibold text-gray-900">{t.name}</h3>
                                    <button
                                        onClick={() => handleImport(t.slug)}
                                        className="text-xs bg-indigo-50 text-indigo-700 px-2 py-1 rounded hover:bg-indigo-100"
                                    >
                                        İçe Aktar
                                    </button>
                                </div>
                                <p className="text-xs text-gray-500 line-clamp-1">{t.preview}</p>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}
