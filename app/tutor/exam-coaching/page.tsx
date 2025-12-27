'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import ExamCoachingManager from '@/components/tutor/ExamCoachingManager'

export default function ExamCoachingPage() {
    const [personas, setPersonas] = useState<any[]>([])
    const [selectedPersonaId, setSelectedPersonaId] = useState<string>('')

    useEffect(() => {
        loadPersonas()
    }, [])

    const loadPersonas = async () => {
        const supabase = createClient()
        const { data } = await supabase
            .from('personas')
            .select('*')
            .order('name')

        if (data) setPersonas(data)
    }

    return (
        <div className="min-h-screen bg-gray-50 p-8">
            <div className="max-w-7xl mx-auto space-y-6">
                {/* Persona Selector */}
                <div className="bg-white rounded-2xl border border-gray-200 p-6">
                    <label className="block text-sm font-bold text-gray-900 mb-3">
                        Öğrenci Seç (Test için)
                    </label>
                    <select
                        value={selectedPersonaId}
                        onChange={(e) => setSelectedPersonaId(e.target.value)}
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-indigo-500 outline-none"
                    >
                        <option value="">-- Öğrenci seçin (veya boş bırakın) --</option>
                        {personas.map(p => (
                            <option key={p.id} value={p.id}>{p.name} ({p.role})</option>
                        ))}
                    </select>
                    <p className="text-xs text-gray-500 mt-2">
                        💡 Seçtiğiniz öğrenciye program atanacak. Boş bırakırsanız size atanır.
                    </p>
                </div>

                {/* Manager */}
                <ExamCoachingManager selectedPersonaId={selectedPersonaId} />
            </div>
        </div>
    )
}
