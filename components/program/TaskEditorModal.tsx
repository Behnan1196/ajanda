'use client'

import { useState, useEffect } from 'react'
import { updateProjectTask, getProjectTasks } from '@/app/actions/projects'
import { createClient } from '@/lib/supabase/client'

interface TaskEditorModalProps {
    projectId: string
    task: any
    onClose: () => void
    onUpdate: () => void
}

export default function TaskEditorModal({ projectId, task, onClose, onUpdate }: TaskEditorModalProps) {
    const [title, setTitle] = useState(task.title)
    const [description, setDescription] = useState(task.description || '')
    const [startDate, setStartDate] = useState(task.start_date ? task.start_date.split('T')[0] : '')
    const [endDate, setEndDate] = useState(task.end_date ? task.end_date.split('T')[0] : '')
    const [progress, setProgress] = useState(task.progress_percent || 0)
    const [assignedTo, setAssignedTo] = useState(task.assigned_to || '')
    const [dependencyIds, setDependencyIds] = useState<string[]>(task.dependency_ids || [])
    const [duration, setDuration] = useState(0)
    const [loading, setLoading] = useState(false)
    const [availableUsers, setAvailableUsers] = useState<Array<{ id: string, name: string }>>([])
    const [allProjectTasks, setAllProjectTasks] = useState<any[]>([])

    // Helper to get local date string YYYY-MM-DD
    const toLocalISOString = (date: Date) => {
        const offset = date.getTimezoneOffset()
        const adjusted = new Date(date.getTime() - (offset * 60 * 1000))
        return adjusted.toISOString().split('T')[0]
    }

    useEffect(() => {
        if (startDate && endDate) {
            const start = new Date(startDate)
            const end = new Date(endDate)
            start.setHours(0, 0, 0, 0)
            end.setHours(0, 0, 0, 0)
            const diffTime = Math.abs(end.getTime() - start.getTime())
            const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24))
            setDuration(diffDays + 1)
        } else {
            setDuration(0)
        }
    }, [startDate, endDate])

    const handleDurationChange = (val: string) => {
        const d = parseInt(val) || 0
        setDuration(d)
        if (startDate && d > 0) {
            const start = new Date(startDate)
            const end = new Date(start)
            end.setDate(start.getDate() + d - 1) // Inclusive: start=22, duration=3 => end=24
            setEndDate(toLocalISOString(end))
        }
    }

    useEffect(() => {
        async function loadData() {
            setLoading(true)
            const supabase = createClient()
            const { data: { user } } = await supabase.auth.getUser()

            // Parallel load users and tasks
            const [usersRes, tasksRes] = await Promise.all([
                supabase.from('users').select('id, name').order('name'),
                getProjectTasks(projectId)
            ])

            if (usersRes.data) setAvailableUsers(usersRes.data)
            if (tasksRes.data) {
                // Filter out current task to prevent circular dependency on self
                setAllProjectTasks(tasksRes.data.filter((t: any) => t.id !== task.id))
            }
            setLoading(false)
        }
        loadData()
    }, [projectId, task.id])

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)

        const updates = {
            title,
            description,
            start_date: startDate ? new Date(startDate).toISOString() : null,
            end_date: endDate ? new Date(endDate).toISOString() : null,
            progress_percent: Number(progress),
            is_completed: Number(progress) === 100,
            assigned_to: assignedTo || null,
            dependency_ids: dependencyIds.length > 0 ? dependencyIds : null
        }

        const result = await updateProjectTask(projectId, task.id, updates)
        if (result.data) {
            onUpdate()
            onClose()
        } else if (result.error) {
            alert('Güncelleme hatası: ' + result.error)
        }
        setLoading(false)
    }

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
                <div className="p-6 border-b border-gray-100 flex items-center justify-between">
                    <h3 className="text-lg font-bold text-gray-900">Görev Detayları</h3>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-xl transition text-gray-400">
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                <form onSubmit={handleSave} className="p-6 space-y-4">
                    <div>
                        <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Görev Adı</label>
                        <input
                            type="text"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            className="w-full p-3 bg-gray-50 rounded-xl border-0 focus:ring-2 focus:ring-indigo-500 text-sm"
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Açıklama</label>
                        <textarea
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            className="w-full p-3 bg-gray-50 rounded-xl border-0 focus:ring-2 focus:ring-indigo-500 text-sm h-24 resize-none"
                            placeholder="Opsiyonel açıklama..."
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Başlangıç</label>
                            <input
                                type="date"
                                value={startDate}
                                onChange={(e) => setStartDate(e.target.value)}
                                className="w-full p-3 bg-gray-50 rounded-xl border-0 focus:ring-2 focus:ring-indigo-500 text-sm"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Bitiş</label>
                            <input
                                type="date"
                                value={endDate}
                                onChange={(e) => setEndDate(e.target.value)}
                                className="w-full p-3 bg-gray-50 rounded-xl border-0 focus:ring-2 focus:ring-indigo-500 text-sm"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Süre (Gün)</label>
                        <input
                            type="number"
                            min="1"
                            value={duration}
                            onChange={(e) => handleDurationChange(e.target.value)}
                            className="w-full p-3 bg-gray-50 rounded-xl border-0 focus:ring-2 focus:ring-indigo-500 text-sm"
                            placeholder="Örn: 5"
                        />
                    </div>

                    <div>
                        <div className="flex items-center justify-between mb-2">
                            <label className="block text-xs font-bold text-gray-400 uppercase">İlerleme</label>
                            <span className="text-sm font-bold text-indigo-600">%{progress}</span>
                        </div>
                        <input
                            type="range"
                            min="0"
                            max="100"
                            step="5"
                            value={progress}
                            onChange={(e) => setProgress(parseInt(e.target.value))}
                            className="w-full h-2 bg-gray-100 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                        />
                    </div>

                    {availableUsers.length > 0 && (
                        <div>
                            <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Atanan Kişi</label>
                            <select
                                value={assignedTo}
                                onChange={(e) => setAssignedTo(e.target.value)}
                                className="w-full p-3 bg-gray-50 rounded-xl border-0 focus:ring-2 focus:ring-indigo-500 text-sm"
                            >
                                <option value="">Atanmadı</option>
                                {availableUsers.map(user => (
                                    <option key={user.id} value={user.id}>{user.name}</option>
                                ))}
                            </select>
                        </div>
                    )}

                    <div>
                        <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Öncül Görevler (Bağımlılıklar)</label>
                        <div className="space-y-2 max-h-32 overflow-y-auto p-2 bg-gray-50 rounded-xl">
                            {allProjectTasks.map(t => (
                                <label key={t.id} className="flex items-center gap-2 cursor-pointer hover:bg-white p-1 rounded transition-colors">
                                    <input
                                        type="checkbox"
                                        checked={dependencyIds.includes(t.id)}
                                        onChange={(e) => {
                                            if (e.target.checked) {
                                                setDependencyIds([...dependencyIds, t.id])
                                            } else {
                                                setDependencyIds(dependencyIds.filter(id => id !== t.id))
                                            }
                                        }}
                                        className="rounded text-indigo-600 focus:ring-indigo-500"
                                    />
                                    <span className="text-xs text-gray-700 truncate">{t.title}</span>
                                </label>
                            ))}
                            {allProjectTasks.length === 0 && (
                                <p className="text-[10px] text-gray-400 text-center py-2">Eklenebilecek başka görev yok.</p>
                            )}
                        </div>
                    </div>

                    <div className="pt-4 flex gap-2">
                        <button
                            type="submit"
                            disabled={loading}
                            className="flex-1 py-3 bg-indigo-600 text-white rounded-xl text-sm font-bold shadow-lg shadow-indigo-100 hover:bg-indigo-700 disabled:opacity-50 transition"
                        >
                            {loading ? 'Kaydediliyor...' : 'Değişiklikleri Kaydet'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}
