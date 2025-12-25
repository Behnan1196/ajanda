'use client'

import { useState, useEffect } from 'react'
import { getAssignedPersonas } from '@/app/actions/tutor'
import { assignProgramToStudent } from '@/app/actions/subjects'

interface AssignProgramModalProps {
    subject: any
    onClose: () => void
    onSuccess: () => void
}

export default function AssignProgramModal({ subject, onClose, onSuccess }: AssignProgramModalProps) {
    const [personas, setPersonas] = useState<any[]>([])
    const [selectedStudentId, setSelectedStudentId] = useState('')
    const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0])
    const [loading, setLoading] = useState(false)
    const [isAssigning, setIsAssigning] = useState(false)

    useEffect(() => {
        loadPersonas()
    }, [])

    const loadPersonas = async () => {
        setLoading(true)
        const res = await getAssignedPersonas()
        if (res.success) {
            setPersonas(res.data)
            if (res.data.length > 0) setSelectedStudentId(res.data[0].id)
        }
        setLoading(false)
    }

    const handleAssign = async () => {
        if (!selectedStudentId) return

        setIsAssigning(true)
        const res = await assignProgramToStudent(selectedStudentId, subject.id, startDate)
        setIsAssigning(false)

        if (res.success) {
            const studentName = personas.find(p => p.id === selectedStudentId)?.name || 'Öğrenci'
            alert(`${studentName} isimli kullanıcıya ${res.count} adet görev başarıyla atandı!`)
            onSuccess()
        } else {
            alert('Hata: ' + res.error)
        }
    }

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60] animate-fadeIn">
            <div className="bg-white w-full max-w-sm rounded-2xl p-6 shadow-xl animate-scaleIn">
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-bold text-gray-900">Program Ata</h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600">✕</button>
                </div>

                <div className="space-y-6">
                    <div className="p-4 bg-purple-50 rounded-xl border border-purple-100">
                        <div className="flex items-center gap-3">
                            <span className="text-2xl">{subject.icon || '📌'}</span>
                            <div>
                                <p className="text-sm font-bold text-gray-900">{subject.name}</p>
                                <p className="text-[10px] text-purple-600 font-bold uppercase tracking-wider">PAKET ATAMASI</p>
                            </div>
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-gray-400 mb-2 uppercase">ÖĞRENCİ SEÇİN</label>
                        {loading ? (
                            <div className="h-10 bg-gray-50 animate-pulse rounded-lg"></div>
                        ) : (
                            <select
                                value={selectedStudentId}
                                onChange={e => setSelectedStudentId(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white"
                            >
                                {personas.map(p => (
                                    <option key={p.id} value={p.id}>
                                        {p.name} {p.id === 'kendim' ? '(Size Atanacak)' : ''}
                                    </option>
                                ))}
                            </select>
                        )}
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-gray-400 mb-2 uppercase">BAŞLANGIÇ TARİHİ</label>
                        <input
                            type="date"
                            value={startDate}
                            onChange={e => setStartDate(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
                        />
                        <p className="text-[10px] text-gray-500 mt-2 italic">
                            * Görevler bu tarihten itibaren day_offset değerlerine göre dağıtılacaktır.
                        </p>
                    </div>

                    <div className="pt-4 flex gap-3">
                        <button
                            onClick={onClose}
                            className="flex-1 py-2.5 text-sm font-bold text-gray-500 hover:bg-gray-100 rounded-xl transition"
                        >
                            Vazgeç
                        </button>
                        <button
                            onClick={handleAssign}
                            disabled={isAssigning || !selectedStudentId}
                            className="flex-1 py-2.5 bg-purple-600 text-white rounded-xl text-sm font-bold hover:bg-purple-700 transition disabled:opacity-50 shadow-md"
                        >
                            {isAssigning ? 'Atanıyor...' : 'Programı Başlat'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}
