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
    const [imageFiles, setImageFiles] = useState<File[]>([])
    const [imagePreviews, setImagePreviews] = useState<string[]>(
        (editingTask?.metadata?.attachments as string[]) ||
        (editingTask?.metadata?.attachment_url ? [editingTask.metadata.attachment_url as string] : [])
    )
    const [uploading, setUploading] = useState(false)
    const [notificationPermission, setNotificationPermission] = useState<NotificationPermission | 'unsupported'>('default')
    const [showFullImage, setShowFullImage] = useState(false)
    const [activeImageIndex, setActiveImageIndex] = useState(0)

    useEffect(() => {
        if (typeof window !== 'undefined') {
            if (!('Notification' in window)) setNotificationPermission('unsupported')
            else setNotificationPermission(Notification.permission)
        }
    }, [])

    useEffect(() => {
        if (showFullImage) {
            document.body.style.overflow = 'hidden'
        } else {
            document.body.style.overflow = 'unset'
        }
    }, [showFullImage])

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
        if (e.target.files && e.target.files.length > 0) {
            const files = Array.from(e.target.files)
            setImageFiles(prev => [...prev, ...files])

            const newPreviews = files.map(file => URL.createObjectURL(file))
            setImagePreviews(prev => [...prev, ...newPreviews])
        }
    }

    const handleRemoveImage = (index: number) => {
        const previewToRemove = imagePreviews[index]

        // If it's a blob/local URL, revoke it
        if (previewToRemove.startsWith('blob:')) {
            URL.revokeObjectURL(previewToRemove)
        }

        setImagePreviews(prev => prev.filter((_, i) => i !== index))

        // We also need to remove it from imageFiles if it's a newly selected one
        // This is a bit tricky because imagePreviews contains both old (URLs) and new (blobs)
        // Let's find the corresponding index in imageFiles
        // New files are appended at the end. 
        // Number of existing (old) images:
        const existingCount = (editingTask?.metadata?.attachments as string[] ||
            (editingTask?.metadata?.attachment_url ? [editingTask.metadata.attachment_url] : [])).length

        if (index >= existingCount) {
            const fileIndex = index - existingCount
            setImageFiles(prev => prev.filter((_, i) => i !== fileIndex))
        }
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)

        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return

        let finalAttachments = imagePreviews.filter(p => !p.startsWith('blob:')) // Keep existing remote URLs

        // Handle New Image Uploads
        if (imageFiles.length > 0) {
            setUploading(true)
            try {
                for (const file of imageFiles) {
                    const compressedBlob = await compressImage(file)
                    const fileName = `${user.id}/${Date.now()}-${Math.random().toString(36).substring(7)}.jpg`

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

                    finalAttachments.push(publicUrl)
                }
            } catch (error: any) {
                alert('Resimler yüklenirken hata oluştu: ' + error.message)
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
                attachments: finalAttachments,
                attachment_url: finalAttachments[0] || null // Legacy support
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
                                        multiple
                                        className="hidden"
                                        onChange={handleImageSelect}
                                    />
                                    <span className="text-lg leading-none">📷</span>
                                    <span>{imageFiles.length > 0 ? `${imageFiles.length} Yeni` : 'Resim Ekle'}</span>
                                </label>
                            </div>

                            <button
                                type="button"
                                onClick={() => setDescription(prev => prev + (prev ? '\n- ' : '- '))}
                                className="text-xs text-gray-400 hover:text-amber-600 bg-gray-50 px-2 py-1 rounded transition"
                            >
                                • Liste Ekle
                            </button>
                        </div>

                        {/* Thumbnails Gallery */}
                        {imagePreviews.length > 0 && (
                            <div className="flex flex-wrap gap-2.5 mt-2.5">
                                {imagePreviews.map((url, index) => (
                                    <div key={index} className="relative w-20 h-20 rounded-xl overflow-hidden border-2 border-amber-200 bg-white shadow-md flex-shrink-0 group animate-scaleIn">
                                        <img
                                            src={url}
                                            className="w-full h-full object-cover cursor-pointer hover:scale-110 transition duration-300"
                                            alt={`Preview ${index}`}
                                            onClick={() => { setActiveImageIndex(index); setShowFullImage(true); }}
                                        />
                                        <button
                                            type="button"
                                            onClick={() => handleRemoveImage(index)}
                                            className="absolute top-1 right-1 bg-red-500/90 text-white w-6 h-6 flex items-center justify-center rounded-lg text-[10px] font-bold shadow-sm opacity-100 transition active:scale-90"
                                        >✕</button>
                                    </div>
                                ))}
                            </div>
                        )}
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

            {/* Full Screen Image Viewer */}
            {showFullImage && imagePreviews[activeImageIndex] && (
                <div
                    className="fixed inset-0 bg-black/95 z-[60] flex items-center justify-center animate-fadeIn p-4"
                    onClick={() => setShowFullImage(false)}
                >
                    <button
                        className="absolute top-6 right-6 text-white text-3xl bg-white/10 w-12 h-12 rounded-full flex items-center justify-center hover:bg-white/20 transition z-10"
                        onClick={(e) => { e.stopPropagation(); setShowFullImage(false); }}
                    >✕</button>

                    {imagePreviews.length > 1 && (
                        <>
                            <button
                                className="absolute left-4 top-1/2 -translate-y-1/2 text-white/50 hover:text-white text-4xl p-4 transition z-10"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setActiveImageIndex(prev => (prev > 0 ? prev - 1 : imagePreviews.length - 1));
                                }}
                            >‹</button>
                            <button
                                className="absolute right-4 top-1/2 -translate-y-1/2 text-white/50 hover:text-white text-4xl p-4 transition z-10"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setActiveImageIndex(prev => (prev < imagePreviews.length - 1 ? prev + 1 : 0));
                                }}
                            >›</button>
                        </>
                    )}

                    <img
                        src={imagePreviews[activeImageIndex]}
                        className="max-w-full max-h-full object-contain rounded shadow-2xl animate-scaleIn select-none"
                        alt={`Full Preview ${activeImageIndex}`}
                        onClick={(e) => e.stopPropagation()}
                    />

                    {imagePreviews.length > 1 && (
                        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 text-white/60 text-sm font-medium bg-black/40 px-3 py-1.5 rounded-full">
                            {activeImageIndex + 1} / {imagePreviews.length}
                        </div>
                    )}
                </div>
            )}
        </div>
    )
}
