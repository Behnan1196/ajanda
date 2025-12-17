'use client'

import { useState, useEffect } from 'react'
import AdminLayout from '@/components/admin/AdminLayout'
import { createClient } from '@/lib/supabase/client'

interface Topic {
    id: string
    subject_id: string
    name: string
    description: string | null
    order_index: number
    is_active: boolean
    subjects: {
        name: string
        icon: string | null
    }
}

interface Subject {
    id: string
    name: string
    icon: string | null
}

export default function TopicsPage() {
    const [topics, setTopics] = useState<Topic[]>([])
    const [subjects, setSubjects] = useState<Subject[]>([])
    const [loading, setLoading] = useState(true)
    const [showModal, setShowModal] = useState(false)
    const [editingTopic, setEditingTopic] = useState<Topic | null>(null)
    const supabase = createClient()

    useEffect(() => {
        loadData()
    }, [])

    const loadData = async () => {
        setLoading(true)

        // Load topics
        const { data: topicsData } = await supabase
            .from('topics')
            .select('*, subjects(name, icon)')
            .order('subject_id')
            .order('order_index')

        // Load subjects for dropdown
        const { data: subjectsData } = await supabase
            .from('subjects')
            .select('id, name, icon')
            .eq('is_active', true)
            .order('name')

        if (topicsData) setTopics(topicsData as any)
        if (subjectsData) setSubjects(subjectsData)

        setLoading(false)
    }

    const handleAdd = () => {
        setEditingTopic(null)
        setShowModal(true)
    }

    const handleEdit = (topic: Topic) => {
        setEditingTopic(topic)
        setShowModal(true)
    }

    const handleDelete = async (id: string) => {
        if (!confirm('Bu alt konuyu silmek istediğinizden emin misiniz?')) return

        const { error } = await supabase
            .from('topics')
            .delete()
            .eq('id', id)

        if (!error) loadData()
    }

    const toggleActive = async (id: string, currentStatus: boolean) => {
        const { error } = await supabase
            .from('topics')
            .update({ is_active: !currentStatus })
            .eq('id', id)

        if (!error) loadData()
    }

    return (
        <AdminLayout>
            <div>
                <div className="flex items-center justify-between mb-6">
                    <h1 className="text-2xl font-bold text-gray-900">Alt Konular</h1>
                    <button
                        onClick={handleAdd}
                        className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition"
                    >
                        + Yeni Alt Konu Ekle
                    </button>
                </div>

                {loading ? (
                    <div className="flex justify-center py-12">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
                    </div>
                ) : (
                    <div className="bg-white rounded-lg shadow overflow-hidden">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                        Ana Konu
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                        Alt Konu
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                        Açıklama
                                    </th>
                                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                                        Sıra
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                        Durum
                                    </th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                                        İşlemler
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {topics.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                                            Henüz alt konu eklenmemiş
                                        </td>
                                    </tr>
                                ) : (
                                    topics.map((topic) => (
                                        <tr key={topic.id} className="hover:bg-gray-50">
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-2">
                                                    <span className="text-xl">{topic.subjects.icon || '📚'}</span>
                                                    <span className="font-medium text-gray-900">
                                                        {topic.subjects.name}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 font-medium text-gray-900">
                                                {topic.name}
                                            </td>
                                            <td className="px-6 py-4 text-sm text-gray-600">
                                                {topic.description || '-'}
                                            </td>
                                            <td className="px-6 py-4 text-center text-sm text-gray-600">
                                                {topic.order_index}
                                            </td>
                                            <td className="px-6 py-4">
                                                <button
                                                    onClick={() => toggleActive(topic.id, topic.is_active)}
                                                    className={`px-3 py-1 text-xs font-medium rounded-full ${topic.is_active
                                                            ? 'bg-green-100 text-green-700'
                                                            : 'bg-gray-100 text-gray-700'
                                                        }`}
                                                >
                                                    {topic.is_active ? 'Aktif' : 'Pasif'}
                                                </button>
                                            </td>
                                            <td className="px-6 py-4 text-right space-x-2">
                                                <button
                                                    onClick={() => handleEdit(topic)}
                                                    className="text-indigo-600 hover:text-indigo-900 text-sm font-medium"
                                                >
                                                    Düzenle
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(topic.id)}
                                                    className="text-red-600 hover:text-red-900 text-sm font-medium"
                                                >
                                                    Sil
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                )}

                {showModal && (
                    <TopicModal
                        topic={editingTopic}
                        subjects={subjects}
                        onClose={() => setShowModal(false)}
                        onSave={() => {
                            setShowModal(false)
                            loadData()
                        }}
                    />
                )}
            </div>
        </AdminLayout>
    )
}

function TopicModal({
    topic,
    subjects,
    onClose,
    onSave,
}: {
    topic: Topic | null
    subjects: Subject[]
    onClose: () => void
    onSave: () => void
}) {
    const [subjectId, setSubjectId] = useState(topic?.subject_id || '')
    const [name, setName] = useState(topic?.name || '')
    const [description, setDescription] = useState(topic?.description || '')
    const [orderIndex, setOrderIndex] = useState(topic?.order_index || 0)
    const [loading, setLoading] = useState(false)
    const supabase = createClient()

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)

        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return

        if (topic) {
            const { error } = await supabase
                .from('topics')
                .update({ subject_id: subjectId, name, description, order_index: orderIndex })
                .eq('id', topic.id)

            if (error) {
                alert('Güncelleme hatası: ' + error.message)
            } else {
                onSave()
            }
        } else {
            const { error } = await supabase
                .from('topics')
                .insert({
                    subject_id: subjectId,
                    name,
                    description,
                    order_index: orderIndex,
                    created_by: user.id,
                })

            if (error) {
                alert('Oluşturma hatası: ' + error.message)
            } else {
                onSave()
            }
        }

        setLoading(false)
    }

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md">
                <h2 className="text-xl font-bold text-gray-900 mb-4">
                    {topic ? 'Alt Konu Düzenle' : 'Yeni Alt Konu Ekle'}
                </h2>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Ana Konu *
                        </label>
                        <select
                            value={subjectId}
                            onChange={(e) => setSubjectId(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                            required
                        >
                            <option value="">Seçiniz...</option>
                            {subjects.map((subject) => (
                                <option key={subject.id} value={subject.id}>
                                    {subject.icon} {subject.name}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Alt Konu Adı *
                        </label>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                            placeholder="Trigonometri"
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Açıklama
                        </label>
                        <textarea
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                            rows={3}
                            placeholder="Alt konu açıklaması..."
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Sıra
                        </label>
                        <input
                            type="number"
                            value={orderIndex}
                            onChange={(e) => setOrderIndex(parseInt(e.target.value))}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                            min="0"
                        />
                    </div>

                    <div className="flex gap-3 pt-4">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                        >
                            İptal
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50"
                        >
                            {loading ? 'Kaydediliyor...' : 'Kaydet'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}
