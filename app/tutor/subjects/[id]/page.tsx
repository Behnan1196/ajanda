'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { getLibraryItems, createLibraryItem, deleteLibraryItem } from '@/app/actions/library'
import { createTopic, deleteTopic } from '@/app/actions/subjects'
import LibraryItemForm from '@/components/tutor/LibraryItemForm'

// Icons
const ICONS = {
    video: '🎥',
    todo: '📝',
    reading: '📖',
    quiz: '❓',
    meeting: '🤝'
}

export default function ProgramBuilderPage() {
    const params = useParams()
    const router = useRouter()
    const [subject, setSubject] = useState<any>(null)
    const [items, setItems] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [activeTopicId, setActiveTopicId] = useState<string | null>(null)
    const [showItemForm, setShowItemForm] = useState(false)
    const [newItemTopicId, setNewItemTopicId] = useState<string | null>(null)

    const supabase = createClient()

    useEffect(() => {
        loadData()
    }, [])

    const loadData = async () => {
        setLoading(true)
        // 1. Get Subject & Topics
        const { data: subjectData } = await supabase
            .from('subjects')
            .select('*, topics(*)')
            .eq('id', params.id)
            .single()

        if (subjectData) {
            setSubject(subjectData)
            // Default to first topic if exists
            if (subjectData.topics?.length > 0 && !activeTopicId) {
                // Sort topics by created_at or order_index ideally, but for now just pick first
                setActiveTopicId(subjectData.topics[0].id)
            }
        }

        // 2. Get Library Items
        const libraryItems = await getLibraryItems(params.id as string)
        setItems(libraryItems || [])

        setLoading(false)
    }

    const handleAddItem = (topicId: string) => {
        setNewItemTopicId(topicId)
        setShowItemForm(true)
    }

    const handleDeleteItem = async (itemId: string) => {
        if (!confirm('Bu şablon görevi silmek istediğinize emin misiniz?')) return
        await deleteLibraryItem(itemId, params.id as string)
        loadData()
    }

    const handleAddTopic = async () => {
        const name = prompt('Yeni Modül Adı:')
        if (!name) return

        await createTopic({
            subject_id: params.id as string,
            name: name
        })
        loadData()
    }

    const handleDeleteTopic = async (topicId: string) => {
        if (!confirm('Bu modülü ve içindeki tüm görevleri silmek istediğinize emin misiniz?')) return
        await deleteTopic(topicId)
        loadData()
    }

    if (loading) return (
        <div className="flex items-center justify-center min-h-screen">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
        </div>
    )

    if (!subject) return <div>Program bulunamadı.</div>

    // Sort topics: created_at asc for now
    const sortedTopics = subject.topics?.sort((a: any, b: any) =>
        new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    ) || []

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col h-screen">
            {/* Header */}
            <header className="bg-white border-b px-6 py-4 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-4">
                    <button onClick={() => router.back()} className="text-gray-500 hover:text-gray-700">
                        ← Geri
                    </button>
                    <div>
                        <div className="flex items-center gap-2">
                            <h1 className="text-xl font-bold">{subject.name}</h1>
                            <span className="text-xs px-2 py-0.5 bg-indigo-50 text-indigo-700 rounded-full font-medium">
                                {subject.category || 'Genel'}
                            </span>
                        </div>
                        <p className="text-sm text-gray-500">Program İçerik Yönetimi</p>
                    </div>
                </div>
                <div className="flex gap-2">
                    <button className="px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 rounded-lg">
                        Önizle
                    </button>
                    <button className="px-4 py-2 text-sm font-medium bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">
                        Kaydet
                    </button>
                </div>
            </header>

            {/* Content Builder */}
            <div className="flex flex-1 overflow-hidden">
                {/* Sidebar: Modules (Topics) */}
                <aside className="w-80 bg-white border-r flex flex-col">
                    <div className="p-4 border-b flex items-center justify-between">
                        <h2 className="font-semibold text-gray-700">Modüller</h2>
                        <button
                            onClick={handleAddTopic}
                            className="text-xs bg-gray-100 hover:bg-gray-200 px-2 py-1 rounded text-gray-600"
                        >
                            + Ekle
                        </button>
                    </div>

                    <div className="flex-1 overflow-y-auto p-2 space-y-1">
                        {sortedTopics.length === 0 && (
                            <div className="text-center py-8 text-gray-400 text-sm">
                                Henüz modül yok.<br />"Ekle" butonuna basarak başlayın.
                            </div>
                        )}

                        {sortedTopics.map((topic: any) => {
                            // Calculate item count for this topic
                            const itemCount = items.filter(i => i.topic_id === topic.id).length
                            const isActive = activeTopicId === topic.id

                            return (
                                <div
                                    key={topic.id}
                                    onClick={() => setActiveTopicId(topic.id)}
                                    className={`
                                        group flex items-center justify-between px-3 py-3 rounded-lg cursor-pointer transition
                                        ${isActive ? 'bg-indigo-50 border-indigo-200 border' : 'hover:bg-gray-50 border border-transparent'}
                                    `}
                                >
                                    <div className="flex items-center gap-3 overflow-hidden">
                                        <div className={`
                                            w-6 h-6 rounded flex items-center justify-center text-xs font-medium shrink-0
                                            ${isActive ? 'bg-indigo-200 text-indigo-800' : 'bg-gray-200 text-gray-600'}
                                        `}>
                                            {itemCount}
                                        </div>
                                        <span className={`truncate text-sm ${isActive ? 'font-medium text-indigo-900' : 'text-gray-700'}`}>
                                            {topic.name}
                                        </span>
                                    </div>

                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation()
                                            handleDeleteTopic(topic.id)
                                        }}
                                        className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-500 p-1"
                                    >
                                        ✕
                                    </button>
                                </div>
                            )
                        })}
                    </div>
                </aside>

                {/* Main: Tasks (Library Items) */}
                <main className="flex-1 bg-gray-50 overflow-y-auto p-8">
                    {activeTopicId ? (
                        <div className="max-w-3xl mx-auto">
                            <div className="flex items-center justify-between mb-6">
                                <h2 className="text-lg font-bold text-gray-900">
                                    {sortedTopics.find((t: any) => t.id === activeTopicId)?.name} içerikleri
                                </h2>
                                <button
                                    onClick={() => handleAddItem(activeTopicId)}
                                    className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 shadow-sm flex items-center gap-2 text-sm"
                                >
                                    <span>+</span> Görev Ekle
                                </button>
                            </div>

                            <div className="space-y-3">
                                {items.filter(i => i.topic_id === activeTopicId).length === 0 ? (
                                    <div className="text-center py-12 border-2 border-dashed border-gray-200 rounded-xl">
                                        <div className="text-4xl mb-3">📝</div>
                                        <h3 className="text-gray-900 font-medium">Bu modül boş</h3>
                                        <p className="text-gray-500 text-sm mt-1">
                                            Personaların bu modülü çalışırken yapması gereken<br />görevleri ekleyin (Video, Test, Okuma vb.)
                                        </p>
                                        <button
                                            onClick={() => handleAddItem(activeTopicId)}
                                            className="mt-4 text-indigo-600 font-medium text-sm hover:underline"
                                        >
                                            İlk görevi ekle
                                        </button>
                                    </div>
                                ) : (
                                    items
                                        .filter(i => i.topic_id === activeTopicId)
                                        .map((item) => (
                                            <div key={item.id} className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex items-start gap-4 hover:border-indigo-300 transition group">
                                                <div className="mt-1 w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center text-lg">
                                                    {(ICONS as any)[item.task_types?.icon] || '📌'}
                                                </div>
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <span className="text-xs font-semibold px-2 py-0.5 rounded bg-blue-50 text-blue-700">
                                                            {item.day_offset + 1}. Gün
                                                        </span>
                                                        <h3 className="font-semibold text-gray-900">{item.title}</h3>
                                                    </div>
                                                    <p className="text-sm text-gray-500 line-clamp-2">{item.description}</p>
                                                </div>
                                                <div className="opacity-0 group-hover:opacity-100 flex gap-1">
                                                    <button
                                                        onClick={() => handleDeleteItem(item.id)}
                                                        className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg"
                                                    >
                                                        🗑️
                                                    </button>
                                                </div>
                                            </div>
                                        ))
                                )}
                            </div>
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center h-full text-gray-400">
                            <span className="text-4xl mb-4">👈</span>
                            <p>İçeriklerini görmek için soldan bir modül seçin.</p>
                        </div>
                    )}
                </main>
            </div>

            {/* Item Form Modal */}
            {showItemForm && newItemTopicId && (
                <LibraryItemForm
                    subjectId={params.id as string}
                    topicId={newItemTopicId}
                    onClose={() => setShowItemForm(false)}
                    onSuccess={() => {
                        setShowItemForm(false)
                        loadData()
                    }}
                />
            )}
        </div>
    )
}
