import { useState } from 'react'

interface TaskFormModalProps {
    task?: {
        id: string
        title: string
        description: string
        day: number
        duration: number
    }
    durationDays: number
    onSave: (task: any) => void
    onClose: () => void
}

export default function TaskFormModal({ task, durationDays, onSave, onClose }: TaskFormModalProps) {
    const [formData, setFormData] = useState({
        title: task?.title || '',
        description: task?.description || '',
        day: task?.day || 1,
        duration: task?.duration || 60
    })

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        onSave({
            id: task?.id || Date.now().toString(),
            ...formData
        })
    }

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                <h3 className="text-xl font-bold text-gray-900 mb-6">
                    {task ? 'Görevi Düzenle' : 'Yeni Görev'}
                </h3>

                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Title */}
                    <div>
                        <label className="block text-sm font-bold text-gray-900 mb-2">
                            Görev Adı *
                        </label>
                        <input
                            type="text"
                            value={formData.title}
                            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                            placeholder="Örn: Matematik Deneme Sınavı"
                            className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-purple-500 outline-none"
                            required
                        />
                    </div>

                    {/* Description */}
                    <div>
                        <label className="block text-sm font-bold text-gray-900 mb-2">
                            Açıklama
                        </label>
                        <textarea
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            placeholder="Görev hakkında detaylı bilgi..."
                            className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-purple-500 outline-none"
                            rows={3}
                        />
                    </div>

                    {/* Day & Duration */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-bold text-gray-900 mb-2">
                                Gün *
                            </label>
                            <input
                                type="number"
                                min="1"
                                max={durationDays}
                                value={formData.day}
                                onChange={(e) => setFormData({ ...formData, day: parseInt(e.target.value) || 1 })}
                                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-purple-500 outline-none"
                                required
                            />
                            <p className="text-xs text-gray-500 mt-1">
                                1-{durationDays} arası
                            </p>
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-gray-900 mb-2">
                                Süre (dakika) *
                            </label>
                            <input
                                type="number"
                                min="1"
                                value={formData.duration}
                                onChange={(e) => setFormData({ ...formData, duration: parseInt(e.target.value) || 60 })}
                                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-purple-500 outline-none"
                                required
                            />
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-4 pt-4">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-xl font-bold hover:bg-gray-50 transition"
                        >
                            İptal
                        </button>
                        <button
                            type="submit"
                            className="flex-1 px-6 py-3 bg-purple-600 text-white rounded-xl font-bold hover:bg-purple-700 transition"
                        >
                            {task ? 'Güncelle' : 'Ekle'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}
