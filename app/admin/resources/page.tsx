'use client'

import { useState, useEffect } from 'react'
import AdminLayout from '@/components/admin/AdminLayout'
import { createClient } from '@/lib/supabase/client'

interface Resource {
    id: string
    subject_id: string
    topic_id: string | null
    name: string
    type: string
    url: string | null
    description: string | null
    is_active: boolean
    subjects: {
        name: string
        icon: string | null
    }
    topics: {
        name: string
    } | null
}

interface Subject {
    id: string
    name: string
    icon: string | null
}

interface Topic {
    id: string
    subject_id: string
    name: string
}

export default function ResourcesPage() {
    const [resources, setResources] = useState<Resource[]>([])
    const [subjects, setSubjects] = useState<Subject[]>([])
    const [topics, setTopics] = useState<Topic[]>([])
    const [loading, setLoading] = useState(true)
    const [showModal, setShowModal] = useState(false)
    const [editingResource, setEditingResource] = useState<Resource | null>(null)
    const supabase = createClient()

    useEffect(() => {
        loadData()
    }, [])

    const loadData = async () => {
        setLoading(true)

        const { data: resourcesData } = await supabase
            .from('resources')
            .select('*, subjects(name, icon), topics(name)')
            .order('created_at', { ascending: false })

        const { data: subjectsData } = await supabase
            .from('subjects')
            .select('id, name, icon')
            .eq('is_active', true)
            .order('name')

        const { data: topicsData } = await supabase
            .from('topics')
            .select('id, subject_id, name')
            .eq('is_active', true)
            .order('name')

        if (resourcesData) setResources(resourcesData as any)
        if (subjectsData) setSubjects(subjectsData)
        if (topicsData) setTopics(topicsData)

        setLoading(false)
    }

    const handleAdd = () => {
        setEditingResource(null)
        setShowModal(true)
    }

    const handleEdit = (resource: Resource) => {
        setEditingResource(resource)
        setShowModal(true)
    }

    const handleDelete = async (id: string) => {
        if (!confirm('Bu kaynağı silmek istediğinizden emin misiniz?')) return

        const { error } = await supabase
            .from('resources')
            .delete()
            .eq('id', id)

        if (!error) loadData()
    }

    const toggleActive = async (id: string, currentStatus: boolean) => {
        const { error } = await supabase
            .from('resources')
            .update({ is_active: !currentStatus })
            .eq('id', id)

        if (!error) loadData()
    }

    const getTypeIcon = (type: string) => {
        switch (type) {
            case 'video': return '🎥'
            case 'document': return '📄'
            case 'link': return '🔗'
            case 'book': return '📚'
            default: return '📎'
        }
    }

    return (
        <AdminLayout>
            <div>
                <div className="flex items-center justify-between mb-6">
                    <h1 className="text-2xl font-bold text-gray-900">Kaynaklar</h1>
                    <button
                        onClick={handleAdd}
                        className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition"
                    >
                        + Yeni Kaynak Ekle
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
                                        Kaynak
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                        Konu
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                        Tip
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
                                {resources.length === 0 ? (
                                    <tr>
                                        <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                                            Henüz kaynak eklenmemiş
                                        </td>
                                    </tr>
                                ) : (
                                    resources.map((resource) => (
                                        <tr key={resource.id} className="hover:bg-gray-50">
                                            <td className="px-6 py-4">
                                                <div>
                                                    <div className="font-medium text-gray-900">{resource.name}</div>
                                                    {resource.description && (
                                                        <div className="text-sm text-gray-500 mt-1">{resource.description}</div>
                                                    )}
                                                    {resource.url && (
                                                        <a
                                                            href={resource.url}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="text-sm text-indigo-600 hover:text-indigo-900 mt-1 inline-block"
                                                        >
                                                            {resource.url.substring(0, 50)}...
                                                        </a>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div>
                                                    <div className="flex items-center gap-1 text-sm">
                                                        <span>{resource.subjects.icon}</span>
                                                        <span className="font-medium">{resource.subjects.name}</span>
                                                    </div>
                                                    {resource.topics && (
                                                        <div className="text-xs text-gray-500 mt-1">
                                                            › {resource.topics.name}
                                                        </div>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="inline-flex items-center gap-1 text-sm">
                                                    {getTypeIcon(resource.type)}
                                                    <span className="capitalize">{resource.type}</span>
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <button
                                                    onClick={() => toggleActive(resource.id, resource.is_active)}
                                                    className={`px-3 py-1 text-xs font-medium rounded-full ${resource.is_active
                                                            ? 'bg-green-100 text-green-700'
                                                            : 'bg-gray-100 text-gray-700'
                                                        }`}
                                                >
                                                    {resource.is_active ? 'Aktif' : 'Pasif'}
                                                </button>
                                            </td>
                                            <td className="px-6 py-4 text-right space-x-2">
                                                <button
                                                    onClick={() => handleEdit(resource)}
                                                    className="text-indigo-600 hover:text-indigo-900 text-sm font-medium"
                                                >
                                                    Düzenle
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(resource.id)}
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
                    <ResourceModal
                        resource={editingResource}
                        subjects={subjects}
                        topics={topics}
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

function ResourceModal({
    resource,
    subjects,
    topics,
    onClose,
    onSave,
}: {
    resource: Resource | null
    subjects: Subject[]
    topics: Topic[]
    onClose: () => void
    onSave: () => void
}) {
    const [subjectId, setSubjectId] = useState(resource?.subject_id || '')
    const [topicId, setTopicId] = useState(resource?.topic_id || '')
    const [name, setName] = useState(resource?.name || '')
    const [type, setType] = useState(resource?.type || 'video')
    const [url, setUrl] = useState(resource?.url || '')
    const [description, setDescription] = useState(resource?.description || '')
    const [loading, setLoading] = useState(false)
    const supabase = createClient()

    const filteredTopics = topics.filter(t => t.subject_id === subjectId)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)

        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return

        const data = {
            subject_id: subjectId,
            topic_id: topicId || null,
            name,
            type,
            url: url || null,
            description: description || null,
        }

        if (resource) {
            const { error } = await supabase
                .from('resources')
                .update(data)
                .eq('id', resource.id)

            if (error) {
                alert('Güncelleme hatası: ' + error.message)
            } else {
                onSave()
            }
        } else {
            const { error } = await supabase
                .from('resources')
                .insert({ ...data, created_by: user.id })

            if (error) {
                alert('Oluşturma hatası: ' + error.message)
            } else {
                onSave()
            }
        }

        setLoading(false)
    }

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 overflow-y-auto">
            <div className="bg-white rounded-lg p-6 w-full max-w-md m-4">
                <h2 className="text-xl font-bold text-gray-900 mb-4">
                    {resource ? 'Kaynak Düzenle' : 'Yeni Kaynak Ekle'}
                </h2>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Ana Konu *
                        </label>
                        <select
                            value={subjectId}
                            onChange={(e) => {
                                setSubjectId(e.target.value)
                                setTopicId('') // Reset topic when subject changes
                            }}
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
                            Alt Konu (Opsiyonel)
                        </label>
                        <select
                            value={topicId}
                            onChange={(e) => setTopicId(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                            disabled={!subjectId}
                        >
                            <option value="">Seçiniz...</option>
                            {filteredTopics.map((topic) => (
                                <option key={topic.id} value={topic.id}>
                                    {topic.name}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Kaynak Adı *
                        </label>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                            placeholder="Trigonometri Video Serisi"
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Tip *
                        </label>
                        <select
                            value={type}
                            onChange={(e) => setType(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                            required
                        >
                            <option value="video">🎥 Video</option>
                            <option value="document">📄 Döküman</option>
                            <option value="link">🔗 Link</option>
                            <option value="book">📚 Kitap</option>
                            <option value="other">📎 Diğer</option>
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            URL
                        </label>
                        <input
                            type="url"
                            value={url}
                            onChange={(e) => setUrl(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                            placeholder="https://..."
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
                            placeholder="Kaynak açıklaması..."
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
