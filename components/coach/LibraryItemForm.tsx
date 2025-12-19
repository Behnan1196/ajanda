'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { createLibraryItem } from '@/app/actions/library'

interface LibraryItemFormProps {
    subjectId: string
    topicId: string
    onClose: () => void
    onSuccess: () => void
}

export default function LibraryItemForm({ subjectId, topicId, onClose, onSuccess }: LibraryItemFormProps) {
    const [loading, setLoading] = useState(false)
    const [taskTypes, setTaskTypes] = useState<any[]>([])

    // Form State
    const [title, setTitle] = useState('')
    const [description, setDescription] = useState('')
    const [taskTypeId, setTaskTypeId] = useState('')
    const [dayOffset, setDayOffset] = useState(0) // 0 = 1st Day
    const [url, setUrl] = useState('') // For video/resources

    const supabase = createClient()

    useEffect(() => {
        loadTaskTypes()
    }, [])

    const loadTaskTypes = async () => {
        const { data } = await supabase.from('task_types').select('*')
        if (data) {
            setTaskTypes(data)
            if (data.length > 0) setTaskTypeId(data[0].id)
        }
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)

        const selectedType = taskTypes.find(t => t.id === taskTypeId)
        const metadata: any = {}
        if (selectedType?.name === 'video' || url) {
            metadata.url = url
        }

        const res = await createLibraryItem({
            subject_id: subjectId,
            topic_id: topicId,
            task_type_id: taskTypeId,
            title,
            description,
            day_offset: dayOffset,
            metadata
        })

        setLoading(false)
        if (res.success) onSuccess()
        else alert('Hata: ' + res.error)
    }

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 animate-fadeIn">
            <div className="bg-white w-full max-w-md rounded-2xl p-6 shadow-xl animate-scaleIn">
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-bold text-gray-900">Yeni Şablon Görev</h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600">✕</button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Görev Tipi</label>
                        <div className="grid grid-cols-4 gap-2">
                            {taskTypes.map(type => (
                                <button
                                    key={type.id}
                                    type="button"
                                    onClick={() => setTaskTypeId(type.id)}
                                    className={`
                                        p-2 rounded-lg border text-sm flex flex-col items-center gap-1 transition
                                        ${taskTypeId === type.id
                                            ? 'border-indigo-600 bg-indigo-50 text-indigo-700'
                                            : 'border-gray-200 hover:bg-gray-50 text-gray-600'}
                                    `}
                                >
                                    <span className="text-xl">
                                        {type.icon === 'video' ? '🎥' :
                                            type.icon === 'todo' ? '📝' :
                                                type.icon === 'reading' ? '📖' : '📌'}
                                    </span>
                                    <span className="text-xs font-medium capitalize">{type.name}</span>
                                </button>
                            ))}
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Başlık</label>
                        <input
                            value={title}
                            onChange={e => setTitle(e.target.value)}
                            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
                            required
                            placeholder="Örn: Giriş Videosu İzle"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Açıklama</label>
                        <textarea
                            value={description}
                            onChange={e => setDescription(e.target.value)}
                            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
                            rows={3}
                            placeholder="Görev detayı..."
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Gün Sırası</label>
                            <div className="relative">
                                <input
                                    type="number"
                                    min="1"
                                    value={dayOffset + 1}
                                    onChange={e => setDayOffset(parseInt(e.target.value) - 1)}
                                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 pl-10"
                                    required
                                />
                                <span className="absolute left-3 top-2 text-gray-400 text-sm">Gün:</span>
                            </div>
                            <p className="text-[10px] text-gray-500 mt-1">Programın kaçıncı günü?</p>
                        </div>

                        {/* Show URL field only for relevant types */}
                        {(taskTypes.find(t => t.id === taskTypeId)?.icon === 'video' || url) && (
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Video Linki</label>
                                <input
                                    value={url}
                                    onChange={e => setUrl(e.target.value)}
                                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
                                    placeholder="https://..."
                                />
                            </div>
                        )}
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full py-2.5 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 transition disabled:opacity-50 mt-4"
                    >
                        {loading ? 'Ekleniyor...' : 'Kütüphaneye Ekle'}
                    </button>
                </form>
            </div>
        </div>
    )
}
