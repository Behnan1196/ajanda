'use client'

import { useEffect, useState } from 'react'
import { getAssignedStudents } from '@/app/actions/coach'
import Link from 'next/link'

export default function CoachDashboard() {
    const [students, setStudents] = useState<any[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        loadStudents()
    }, [])

    const loadStudents = async () => {
        const result = await getAssignedStudents()
        if (result.success) {
            setStudents(result.data)
        }
        setLoading(false)
    }

    if (loading) {
        return <div className="p-8 text-center text-gray-500">Yükleniyor...</div>
    }

    return (
        <div>
            <h1 className="text-2xl font-bold text-gray-900 mb-6">Öğrencilerim</h1>

            {students.length === 0 ? (
                <div className="bg-white rounded-lg p-8 text-center shadow-sm border border-gray-200">
                    <span className="text-4xl block mb-4">👶</span>
                    <h3 className="text-lg font-medium text-gray-900">Henüz öğrenciniz yok</h3>
                    <p className="text-gray-500 mt-2">
                        Yönetici tarafından size öğrenci atandığında burada göreceksiniz.
                    </p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {students.map((student) => (
                        <Link
                            key={student.relationshipId} // Unique key per assignment
                            href={`/coach/students/${student.id}`}
                            className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition group relative overflow-hidden"
                        >
                            {/* Role Label Badge */}
                            <div className="absolute top-0 right-0 bg-indigo-50 px-3 py-1 rounded-bl-lg border-b border-l border-indigo-100">
                                <span className="text-xs font-semibold text-indigo-700">
                                    {student.role}
                                </span>
                            </div>

                            <div className="flex items-center gap-4 mt-2">
                                <div className="h-12 w-12 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center text-xl font-bold">
                                    {student.name.charAt(0).toUpperCase()}
                                </div>
                                <div>
                                    <h3 className="font-semibold text-gray-900 group-hover:text-indigo-600 transition">
                                        {student.name}
                                    </h3>
                                    <p className="text-sm text-gray-500">{student.email}</p>
                                </div>
                            </div>
                            <div className="mt-4 pt-4 border-t border-gray-100 flex justify-between items-center text-sm">
                                <span className="text-gray-500">Programı Gör</span>
                                <span className="text-indigo-600">→</span>
                            </div>
                        </Link>
                    ))}
                </div>
            )}
        </div>
    )
}
