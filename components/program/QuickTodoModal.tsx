'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { requestNotificationPermission, sendTestNotification } from '@/lib/notifications'

interface Task {
    id: string
    title: string
    due_date: string | null
    task_type_id: string
    metadata: Record<string, unknown>
    description: string | null
    due_time: string | null
}

interface QuickTodoModalProps {
    onClose: () => void
    initialDate?: Date
    onTaskAdded?: () => void
    editingTask?: Task | null
}

export default function QuickTodoModal({ onClose, initialDate, onTaskAdded, editingTask }: QuickTodoModalProps) {
    const router = useRouter()
    const [loading, setLoading] = useState(false)
    const [title, setTitle] = useState(editingTask?.title || '')
    const [description, setDescription] = useState(editingTask?.description || '')
    const [dueTime, setDueTime] = useState(editingTask?.due_time || '')
    const [imageFile, setImageFile] = useState<File | null>(null)
    const [imagePreview, setImagePreview] = useState<string | null>(editingTask?.metadata?.attachment_url as string || null)
    const [uploading, setUploading] = useState(false)
    const [notificationPermission, setNotificationPermission] = useState<NotificationPermission | 'unsupported'>('default')

    useEffect(() => {
        if (typeof window !== 'undefined') {
            if (!('Notification' in window)) setNotificationPermission('unsupported')
            else setNotificationPermission(Notification.permission)
        }
    }, [])

    const handleRequestPermission = async () => {
        const granted = await requestNotificationPermission()
        if (granted) setNotificationPermission('granted')
        else setNotificationPermission(Notification.permission)
    }

    // Helper for local date string
    const toLocalISOString = (date: Date) => {
        const offset = date.getTimezoneOffset()
        const localDate = new Date(date.getTime() - (offset * 60 * 1000))
        return localDate.toISOString().split('T')[0]
    }

    const [dueDate, setDueDate] = useState(
        editingTask?.due_date || (initialDate ? toLocalISOString(initialDate) : toLocalISOString(new Date()))
    )

    const supabase = createClient()
    const isEditMode = !!editingTask

    // Helper: Client-side Image Compression
    const compressImage = (file: File): Promise<Blob> => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader()
            reader.readAsDataURL(file)
            reader.onload = (event) => {
                const img = new Image()
                img.src = event.target?.result as string
                img.onload = () => {
                    const canvas = document.createElement('canvas')
                    const MAX_WIDTH = 1024
                    const scaleSize = MAX_WIDTH / img.width
                    // Only scale down if width > MAX_WIDTH
                    if (scaleSize < 1) {
                        canvas.width = MAX_WIDTH
                        canvas.height = img.height * scaleSize
                    } else {
                        canvas.width = img.width
                        canvas.height = img.height
                    }

                    const ctx = canvas.getContext('2d')
                    ctx?.drawImage(img, 0, 0, canvas.width, canvas.height)

                    canvas.toBlob((blob) => {
                        if (blob) resolve(blob)
                        else reject(new Error('Compression failed'))
                    }, 'image/jpeg', 0.8) // 80% quality JPEG
                }
                img.onerror = (err) => reject(err)
            }
            reader.onerror = (err) => reject(err)
        })
    }

    const handleImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0]
            setImageFile(file)
            setImagePreview(URL.createObjectURL(file))
        }
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)

        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return

        let attachmentUrl = editingTask?.metadata?.attachment_url || null

        // Handle Image Upload if new file selected
        if (imageFile) {
            setUploading(true)
            try {
                const compressedBlob = await compressImage(imageFile)
                const fileName = `${user.id}/${Date.now()}.jpg`

                const { error: uploadError } = await supabase.storage
                    .from('task-attachments')
                    .upload(fileName, compressedBlob, {
                        contentType: 'image/jpeg',
                        upsert: true
                    })

                if (uploadError) throw uploadError

                const { data: { publicUrl } } = supabase.storage
                    .from('task-attachments')
                    .getPublicUrl(fileName)

                attachmentUrl = publicUrl
            } catch (error: any) {
                alert('Resim yüklenirken hata oluştu: ' + error.message)
                setLoading(false)
                setUploading(false)
                return
            }
            setUploading(false)
        }

        const taskData = {
            title,
            description,
            due_date: dueDate,
            due_time: dueTime || null,
            metadata: {
                ...(editingTask?.metadata as Record<string, unknown> || {}),
                attachment_url: attachmentUrl
            }
        }

        let error

        if (isEditMode && editingTask) {
            const { error: updateError } = await supabase
                .from('tasks')
                .update(taskData)
                .eq('id', editingTask.id)
            error = updateError
        } else {
            // ... type lookup ...
            let typeId = ''
            // Fast lookup for 'todo'
            const { data: typeData } = await supabase.from('task_types').select('id').eq('slug', 'todo').single()
            if (typeData) typeId = typeData.id
            else {
                const { data: anyType } = await supabase.from('task_types').select('id').limit(1).single()
                typeId = anyType?.id
            }

            const { error: insertError } = await supabase
                .from('tasks')
                .insert({
                    ...taskData,
                    task_type_id: typeId,
                    user_id: user.id,
                    created_by: user.id,
                    is_private: true,
                    is_completed: false
                })
            error = insertError
        }

        if (error) {
            alert('Hata oluştu: ' + error.message)
        } else {
            router.refresh()
            if (onTaskAdded) onTaskAdded()
            onClose()
        }
        setLoading(false)
    }

    // Auto-bullet handler
    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === 'Enter') {
            const textarea = e.currentTarget
            const start = textarea.selectionStart
            const currentContent = description

            // Get current line
            const lastNewLine = currentContent.lastIndexOf('\n', start - 1)
            const currentLine = currentContent.substring(lastNewLine + 1, start)

            // Check if current line starts with hyphen or bullet
            const match = currentLine.match(/^(\s*[-•]\s)/)

            if (match) {
                e.preventDefault()
                const prefix = match[1]
                const newValue =
                    currentContent.substring(0, start) +
                    '\n' + prefix +
                    currentContent.substring(textarea.selectionEnd)

                setDescription(newValue)

                // Move cursor after the inserted prefix
                setTimeout(() => {
                    const newCursorPos = start + prefix.length + 1
                    textarea.selectionStart = textarea.selectionEnd = newCursorPos
                }, 0)
            }
        }
    }

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 animate-fadeIn p-4">
            <div className="bg-white w-full max-w-sm rounded-2xl p-6 shadow-xl animate-scaleIn relative overflow-hidden">
                {/* Decorative Background */}
                <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-amber-400 to-orange-500"></div>

                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                        <span>⚡</span> {isEditMode ? 'Notu Düzenle' : 'Hızlı Not'}
                    </h2>
                    <div className="flex items-center gap-2">
                        {notificationPermission === 'default' && (
                            <button
                                type="button"
                                onClick={handleRequestPermission}
                                title="Bildirimleri Aç"
                                className="text-xs font-semibold text-amber-600 bg-amber-50 px-2 py-1 rounded-lg hover:bg-amber-100 transition"
                            >
                                🔔 Bildirimleri Aç
                            </button>
                        )}
                        {notificationPermission === 'granted' && (
                            <button
                                type="button"
                                onClick={() => sendTestNotification()}
                                title="Bildirimi Test Et"
                                className="text-xs font-semibold text-gray-500 bg-gray-50 px-2 py-1 rounded-lg hover:bg-gray-100 transition"
                            >
                                🧪 Test Et
                            </button>
                        )}
                        <button onClick={onClose} className="text-gray-400 hover:text-gray-600 bg-gray-50 hover:bg-gray-100 p-1.5 rounded-full transition">✕</button>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <input
                            autoFocus
                            value={title}
                            onChange={e => setTitle(e.target.value)}
                            className="w-full text-lg font-medium border-0 border-b-2 border-gray-100 focus:border-amber-400 focus:ring-0 px-0 py-2 placeholder:text-gray-300 transition-colors"
                            placeholder="Ne yapacaksın?"
                            required
                        />
                    </div>

                    {/* Description Area */}
                    <div className="relative">
                        <textarea
                            value={description}
                            onChange={e => setDescription(e.target.value)}
                            onKeyDown={handleKeyDown}
                            className="w-full text-sm border-0 bg-gray-50 rounded-lg px-3 py-2 text-gray-700 placeholder:text-gray-400 focus:ring-2 focus:ring-amber-100 transition-all resize-none"
                            placeholder="Detaylar, liste veya notlar..."
                            rows={3}
                        />
                        <div className="flex gap-2 mt-2 justify-between items-center">
                            {/* Image Upload Button */}
                            <div className="flex items-center gap-2">
                                <label className="cursor-pointer group flex items-center gap-1.5 text-xs text-gray-500 hover:text-amber-600 transition bg-gray-50 px-2 py-1 rounded">
                                    <input
                                        type="file"
                                        accept="image/*"
                                        className="hidden"
                                        onChange={handleImageSelect}
                                    />
                                    <span className="text-lg leading-none">📷</span>
                                    <span>{imageFile ? 'Resim Seçildi' : 'Resim Ekle'}</span>
                                </label>
                                {imagePreview && (
                                    <div className="relative group w-8 h-8 rounded overflow-hidden border border-gray-200">
                                        <img src={imagePreview} className="w-full h-full object-cover" alt="Preview" />
                                        <button
                                            type="button"
                                            onClick={() => { setImageFile(null); setImagePreview(null); }}
                                            className="absolute inset-0 bg-black/50 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 text-[10px]"
                                        >✕</button>
                                    </div>
                                )}
                            </div>

                            <button
                                type="button"
                                onClick={() => setDescription(prev => prev + (prev ? '\n- ' : '- '))}
                                className="text-xs text-gray-400 hover:text-amber-600 bg-gray-50 px-2 py-1 rounded transition"
                            >
                                • Liste Ekle
                            </button>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">Zaman</label>
                            <input
                                type="date"
                                value={dueDate}
                                onChange={e => setDueDate(e.target.value)}
                                className="w-full px-3 py-2 bg-gray-50 border border-gray-100 rounded-lg text-sm focus:ring-2 focus:ring-amber-200 focus:bg-white transition-all outline-none"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">Saat</label>
                            <input
                                type="time"
                                value={dueTime}
                                onChange={e => setDueTime(e.target.value)}
                                className="w-full px-3 py-2 bg-gray-50 border border-gray-100 rounded-lg text-sm focus:ring-2 focus:ring-amber-200 focus:bg-white transition-all outline-none"
                            />
                        </div>
                    </div>

                    <div className="pt-2">
                        <button
                            type="submit"
                            disabled={loading || uploading}
                            className="w-full py-3 bg-gray-900 text-white rounded-xl font-medium hover:bg-gray-800 active:scale-95 transition-all disabled:opacity-50 disabled:scale-100 shadow-lg shadow-gray-200"
                        >
                            {uploading ? 'Resim Yükleniyor...' : (loading ? 'Kaydediliyor...' : (isEditMode ? 'Güncelle' : 'Kaydet'))}
                        </button>
                    </div>
                </form>

                <div className="mt-4 text-center">
                    <span className="text-[10px] text-gray-400 bg-gray-50 px-2 py-1 rounded-full">
                        🔒 Bu not sadece senin görebileceğin şekilde eklenecek
                    </span>
                </div>
            </div>
        </div>
    )
}
