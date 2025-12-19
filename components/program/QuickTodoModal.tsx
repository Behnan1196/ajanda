'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

interface QuickTodoModalProps {
    onClose: () => void
    initialDate?: Date
    onTaskAdded?: () => void
}

export default function QuickTodoModal({ onClose, initialDate, onTaskAdded }: QuickTodoModalProps) {
    const router = useRouter()
    const [loading, setLoading] = useState(false)
    const [title, setTitle] = useState('')

    // Helper for local date string
    const toLocalISOString = (date: Date) => {
        const offset = date.getTimezoneOffset()
        const localDate = new Date(date.getTime() - (offset * 60 * 1000))
        return localDate.toISOString().split('T')[0]
    }

    const [dueDate, setDueDate] = useState(
        initialDate ? toLocalISOString(initialDate) : toLocalISOString(new Date())
    )

    const supabase = createClient()

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)

        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return

        // Create a 'todo' type task that is private
        // First try to find 'todo' or 'general' or take the first one
        let { data: typeData } = await supabase
            .from('task_types')
            .select('id')
            .eq('slug', 'todo') // Check slug first
            .single()

        if (!typeData) {
            // Try by name
            const { data: byName } = await supabase.from('task_types').select('id').eq('name', 'todo').single()
            typeData = byName
        }

        if (!typeData) {
            // Fallback to ANY type
            const { data: anyType } = await supabase.from('task_types').select('id').limit(1).single()
            typeData = anyType
        }

        if (!typeData) {
            alert('Sistemde hiç görev tipi tanımlı değil. Lütfen admin ile iletişime geçin.')
            setLoading(false)
            return
        }

        const { error } = await supabase
            .from('tasks')
            .insert({
                title,
                due_date: dueDate,
                task_type_id: typeData.id,
                user_id: user.id, // Required for RLS
                created_by: user.id,
                is_private: true, // EXPLICITLY PRIVATE
                is_completed: false
            })

        if (error) {
            alert('Hata oluştu: ' + error.message)
        } else {
            router.refresh()
            if (onTaskAdded) onTaskAdded()
            onClose()
        }
        setLoading(false)
    }

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 animate-fadeIn p-4">
            <div className="bg-white w-full max-w-sm rounded-2xl p-6 shadow-xl animate-scaleIn relative overflow-hidden">
                {/* Decorative Background */}
                <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-amber-400 to-orange-500"></div>

                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                        <span>⚡</span> Hızlı Not
                    </h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 bg-gray-50 hover:bg-gray-100 p-1.5 rounded-full transition">✕</button>
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

                    <div className="pt-2">
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full py-3 bg-gray-900 text-white rounded-xl font-medium hover:bg-gray-800 active:scale-95 transition-all disabled:opacity-50 disabled:scale-100 shadow-lg shadow-gray-200"
                        >
                            {loading ? 'Ekleniyor...' : 'Hatırlat'}
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
