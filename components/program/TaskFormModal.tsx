'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

interface TaskType {
    id: string
    name: string
    slug: string
    schema: {
        fields: {
            name: string
            type: string
            label: string
            required: boolean
            placeholder?: string
        }[]
    }
}

interface Task {
    id: string
    title: string
    description: string | null
    task_type_id: string
    metadata: Record<string, unknown>
    due_date: string | null
    due_time: string | null
    is_private?: boolean
}

interface TaskFormModalProps {
    userId: string
    editingTask?: Task | null
    defaultDate?: Date
    onClose: () => void
    onTaskSaved: () => void
    relationshipId?: string
}

export default function TaskFormModal({ userId, editingTask, defaultDate, onClose, onTaskSaved, relationshipId }: TaskFormModalProps) {
    const [taskTypes, setTaskTypes] = useState<TaskType[]>([])

    // User Context
    const [currentUserRole, setCurrentUserRole] = useState<'student' | 'coach' | 'admin'>('student')
    const [isOwnTask, setIsOwnTask] = useState(false)

    // Form State
    // Helper for local date string
    const toLocalISOString = (date: Date) => {
        const offset = date.getTimezoneOffset()
        const localDate = new Date(date.getTime() - (offset * 60 * 1000))
        return localDate.toISOString().split('T')[0]
    }

    const [selectedType, setSelectedType] = useState<string>('')
    const [title, setTitle] = useState('')
    const [description, setDescription] = useState('')
    const [dueDate, setDueDate] = useState(
        defaultDate ? toLocalISOString(defaultDate) : toLocalISOString(new Date())
    )
    const [dueTime, setDueTime] = useState('')
    const [isPrivate, setIsPrivate] = useState(false)
    const [metadata, setMetadata] = useState<Record<string, unknown>>({})
    const [loading, setLoading] = useState(false)

    const supabase = createClient()
    const isEditMode = !!editingTask

    useEffect(() => {
        loadData()
    }, [])

    useEffect(() => {
        if (editingTask) {
            setTitle(editingTask.title)
            setDescription(editingTask.description || '')
            setSelectedType(editingTask.task_type_id)
            setDueDate(editingTask.due_date || toLocalISOString(new Date()))
            setDueTime(editingTask.due_time || '')
            setIsPrivate(editingTask.is_private || false)
            setMetadata(editingTask.metadata || {})
        }
    }, [editingTask])

    const loadData = async () => {
        // 1. Get Current User Role & Info
        const { data: { user } } = await supabase.auth.getUser()
        if (user) {
            setIsOwnTask(user.id === userId)

            // Fetch roles
            const { data: userData } = await supabase
                .from('users')
                .select('roles')
                .eq('id', user.id)
                .single()

            if (userData && userData.roles) {
                if (userData.roles.includes('coach')) setCurrentUserRole('coach')
                else if (userData.roles.includes('admin')) setCurrentUserRole('admin')
                else setCurrentUserRole('student')
            }
        }

        // 2. Load task types
        const { data: taskTypesData } = await supabase
            .from('task_types')
            .select('*')
            .eq('is_active', true)

        if (taskTypesData) {
            setTaskTypes(taskTypesData as TaskType[])
            if (taskTypesData.length > 0 && !editingTask) {
                const todoType = taskTypesData.find(t => t.slug === 'todo')
                setSelectedType(todoType ? todoType.id : taskTypesData[0].id)
            }
        }
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)

        const finalTitle = title || 'Yeni Görev'

        const payload = {
            task_type_id: selectedType,
            title: finalTitle,
            description,
            metadata,
            due_date: dueDate,
            due_time: dueTime || null,
            is_private: isPrivate
        }

        if (isEditMode && editingTask) {
            // UPDATE mode
            const { error } = await supabase
                .from('tasks')
                .update(payload)
                .eq('id', editingTask.id)

            if (error) {
                console.error('Error updating task:', error)
                alert('Görev güncellenirken hata oluştu')
            } else {
                onTaskSaved()
            }
        } else {
            // CREATE mode
            const { data: { user: currentUser } } = await supabase.auth.getUser()
            if (!currentUser) {
                alert('Oturum hatası')
                setLoading(false)
                return
            }

            // Get max sort_order from Supabase
            const { data: maxOrderData } = await supabase
                .from('tasks')
                .select('sort_order')
                .eq('user_id', userId)
                .eq('due_date', payload.due_date)
                .order('sort_order', { ascending: false })
                .limit(1)

            const newSortOrder = (maxOrderData?.[0]?.sort_order ?? -1) + 1

            const taskData = {
                ...payload,
                user_id: userId,
                created_by: currentUser.id,
                assigned_by: currentUser.id !== userId ? currentUser.id : null,
                relationship_id: relationshipId || null,
                sort_order: newSortOrder
            }

            const { error } = await supabase.from('tasks').insert(taskData)

            if (error) {
                console.error('Error creating task:', error)
                alert('Görev oluşturulurken hata oluştu')
            } else {
                onTaskSaved()
            }
        }

        setLoading(false)
    }

    const currentTaskType = taskTypes.find((t) => t.id === selectedType)
    const isStudentView = currentUserRole === 'student' || isOwnTask

    return (
        <div className="fixed inset-0 bg-black/50 flex items-end justify-center z-50 animate-fadeIn">
            <div className="bg-white w-full max-w-2xl rounded-t-3xl p-6 max-h-[90vh] overflow-y-auto animate-slideUp transition-all h-auto">
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-bold text-gray-900">
                        {isEditMode ? 'Görevi Düzenle' : (isStudentView ? 'Yeni Görev' : 'Görev Ata')}
                    </h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition">
                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    {/* Header: Title */}
                    <div>
                        <input
                            type="text"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder="Görev Başlığı"
                            className="w-full text-xl font-bold border-0 border-b border-transparent focus:border-indigo-500 focus:ring-0 px-0 py-2"
                        />
                    </div>

                    {/* Date & Time */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-medium text-gray-500 mb-1">TARİH</label>
                            <input
                                type="date"
                                value={dueDate}
                                onChange={(e) => setDueDate(e.target.value)}
                                className="w-full px-3 py-2 bg-gray-50 rounded-lg border-0 text-sm focus:ring-2 focus:ring-indigo-500"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-gray-500 mb-1">SAAT (Opsiyonel)</label>
                            <input
                                type="time"
                                value={dueTime}
                                onChange={(e) => setDueTime(e.target.value)}
                                className="w-full px-3 py-2 bg-gray-50 rounded-lg border-0 text-sm focus:ring-2 focus:ring-indigo-500"
                            />
                        </div>
                    </div>

                    {/* Task Type & Description */}
                    <div className="space-y-4 pt-4 border-t border-gray-100">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Görev Tipi</label>
                            <div className="flex gap-2 flex-wrap">
                                {taskTypes.map((type) => (
                                    <button
                                        type="button"
                                        key={type.id}
                                        onClick={() => setSelectedType(type.id)}
                                        className={`px-3 py-1.5 rounded-lg text-sm font-medium transition border ${selectedType === type.id
                                            ? 'bg-indigo-50 border-indigo-200 text-indigo-700'
                                            : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
                                            }`}
                                    >
                                        {type.name}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Açıklama / Notlar</label>
                            <textarea
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                rows={2}
                                placeholder="Detaylar..."
                            />
                        </div>

                        {currentTaskType?.schema.fields.map((field) => (
                            <div key={field.name}>
                                <label className="block text-sm font-medium text-gray-700 mb-2">{field.label}</label>
                                <input
                                    type={field.type === 'url' ? 'url' : field.type === 'number' ? 'number' : 'text'}
                                    value={(metadata[field.name] as string) || ''}
                                    onChange={(e) =>
                                        setMetadata({ ...metadata, [field.name]: field.type === 'number' ? parseInt(e.target.value) : e.target.value })
                                    }
                                    className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                    placeholder={field.placeholder}
                                    required={field.required}
                                />
                            </div>
                        ))}
                    </div>

                    <div className="flex gap-3 pt-4 border-t border-gray-100">
                        <button type="button" onClick={onClose} className="flex-1 px-6 py-3 text-gray-500 hover:text-gray-700 font-medium transition">
                            İptal
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="flex-[2] px-6 py-3 bg-indigo-600 text-white rounded-xl font-bold shadow-lg shadow-indigo-200 hover:bg-indigo-700 hover:shadow-xl transition disabled:opacity-50"
                        >
                            {loading ? 'Kaydediliyor...' : (isEditMode ? 'Güncelle' : 'Kaydet')}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}
