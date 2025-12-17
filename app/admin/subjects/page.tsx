'use client'

import { useState, useEffect } from 'react'
import AdminLayout from '@/components/admin/AdminLayout'
import { createClient } from '@/lib/supabase/client'

interface Subject {
    id: string
    name: string
    description: string | null
    icon: string | null
    color: string
    is_active: boolean
    created_at: string
}

export default function SubjectsPage() {
    const [subjects, setSubjects] = useState<Subject[]>([])
    const [loading, setLoading] = useState(true)
    const [showModal, setShowModal] = useState(false)
    const [editingSubject, setEditingSubject] = useState<Subject | null>(null)
    const supabase = createClient()

    useEffect(() => {
        loadSubjects()
    }, [])

    const loadSubjects = async () => {
        setLoading(true)
        const { data, error } = await supabase
            .from('subjects')
            .select('*')
            .order('name')

        if (!error && data) {
            setSubjects(data)
        }
        setLoading(false)
    }

    const handleAdd = () => {
        setEditingSubject(null)
        setShowModal(true)
    }

    const handleEdit = (subject: Subject) => {
        setEditingSubject(subject)
        setShowModal(true)
    }

    const handleDelete = async (id: string) => {
        if (!confirm('Bu konuyu silmek istediğinizden emin misiniz?')) return

        const { error } = await supabase
            .from('subjects')
            .delete()
            .eq('id', id)

        if (!error) {
            loadSubjects()
        }
    }

    const toggleActive = async (id: string, currentStatus: boolean) => {
        const { error } = await supabase
            .from('subjects')
            .update({ is_active: !currentStatus })
            .eq('id', id)

        if (!error) {
            loadSubjects()
        }
    }

    return (
        <AdminLayout>
            <div>
                <div className="flex items-center justify-between mb-6">
                    <h1 className="text-2xl font-bold text-gray-900">Ana Konular</h1>
                    <button
                        onClick={handleAdd}
                        className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition"
                    >
                        + Yeni Konu Ekle
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
                                        Konu
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                        Açıklama
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
                                {subjects.length === 0 ? (
                                    <tr>
                                        <td colSpan={4} className="px-6 py-8 text-center text-gray-500">
                                            Henüz konu eklenmemiş
                                        </td>
                                    </tr>
                                ) : (
                                    subjects.map((subject) => (
                                        <tr key={subject.id} className="hover:bg-gray-50">
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <span className="text-2xl">{subject.icon || '📚'}</span>
                                                    <div>
                                                        <div className="font-medium text-gray-900">{subject.name}</div>
                                                        <div
                                                            className="w-4 h-4 rounded mt-1"
                                                            style={{ backgroundColor: subject.color }}
                                                        />
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-sm text-gray-600">
                                                {subject.description || '-'}
                                            </td>
                                            <td className="px-6 py-4">
                                                <button
                                                    onClick={() => toggleActive(subject.id, subject.is_active)}
                                                    className={`px-3 py-1 text-xs font-medium rounded-full ${subject.is_active
                                                            ? 'bg-green-100 text-green-700'
                                                            : 'bg-gray-100 text-gray-700'
                                                        }`}
                                                >
                                                    {subject.is_active ? 'Aktif' : 'Pasif'}
                                                </button>
                                            </td>
                                            <td className="px-6 py-4 text-right space-x-2">
                                                <button
                                                    onClick={() => handleEdit(subject)}
                                                    className="text-indigo-600 hover:text-indigo-900 text-sm font-medium"
                                                >
                                                    Düzenle
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(subject.id)}
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
                    <SubjectModal
                        subject={editingSubject}
                        onClose={() => setShowModal(false)}
                        onSave={() => {
                            setShowModal(false)
                            loadSubjects()
                        }}
                    />
                )}
            </div>
        </AdminLayout>
    )
}

// Subject Modal Component
function SubjectModal({
    subject,
    onClose,
    onSave,
}: {
    subject: Subject | null
    onClose: () => void
    onSave: () => void
}) {
    const [name, setName] = useState(subject?.name || '')
    const [description, setDescription] = useState(subject?.description || '')
    const [icon, setIcon] = useState(subject?.icon || '📚')
    const [color, setColor] = useState(subject?.color || '#4F46E5')
    const [loading, setLoading] = useState(false)
    const supabase = createClient()

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)

        const { data: { user } } = await supabase.auth.getUser()

        if (!user) {
            alert('Kullanıcı bulunamadı')
            return
        }

        if (subject) {
            // Update
            const { error } = await supabase
                .from('subjects')
                .update({ name, description, icon, color })
                .eq('id', subject.id)

            if (error) {
                alert('Güncelleme hatası: ' + error.message)
            } else {
                onSave()
            }
        } else {
            // Create
            const { error } = await supabase
                .from('subjects')
                .insert({
                    name,
                    description,
                    icon,
                    color,
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

    const iconOptions = ['📚', '📐', '🎨', '🎵', '⚽', '☯️', '🌟', '💡', '🔬', '🌍']

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md">
                <h2 className="text-xl font-bold text-gray-900 mb-4">
                    {subject ? 'Konu Düzenle' : 'Yeni Konu Ekle'}
                </h2>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            İkon
                        </label>
                        <div className="grid grid-cols-5 gap-2">
                            {iconOptions.map((iconOption) => (
                                <button
                                    key={iconOption}
                                    type="button"
                                    onClick={() => setIcon(iconOption)}
                                    className={`text-2xl p-2 rounded border-2 ${icon === iconOption
                                            ? 'border-indigo-600 bg-indigo-50'
                                            : 'border-gray-200'
                                        }`}
                                >
                                    {iconOption}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Konu Adı *
                        </label>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                            placeholder="Matematik"
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
                            placeholder="Konu açıklaması..."
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Renk
                        </label>
                        <input
                            type="color"
                            value={color}
                            onChange={(e) => setColor(e.target.value)}
                            className="w-full h-10 rounded-lg cursor-pointer"
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
