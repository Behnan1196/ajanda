'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { getStudentRelationships } from '@/app/actions/coach'
import WeeklyView from '@/components/program/WeeklyView'
import ProgressView from '@/components/program/ProgressView'
import AIStudentAnalysis from '@/components/coach/AIStudentAnalysis'
import ExamResultsView from '@/components/program/ExamResultsView'

export default function StudentDetailPage() {
    const params = useParams()
    const studentId = params.id as string

    const [activeTab, setActiveTab] = useState<'program' | 'gelisim' | 'sinavlar'>('program')
    const [roles, setRoles] = useState<any[]>([])
    const [activeRelationshipId, setActiveRelationshipId] = useState<string>('')
    const [loadingRoles, setLoadingRoles] = useState(true)

    useEffect(() => {
        const loadRoles = async () => {
            const data = await getStudentRelationships(studentId)

            if (Array.isArray(data)) {
                setRoles(data)
                if (data.length > 0) {
                    setActiveRelationshipId(data[0].id)
                }
            } else {
                console.error('Failed to load roles:', data)
                setRoles([])
            }
            setLoadingRoles(false)
        }
        loadRoles()
    }, [studentId])

    return (
        <div className="h-[calc(100vh-2rem)] flex flex-col">
            <div className="mb-4 space-y-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Link href="/coach" className="text-gray-500 hover:text-gray-700">
                            ← Geri
                        </Link>
                        <h1 className="text-2xl font-bold text-gray-900">Öğrenci Detayı</h1>
                    </div>

                    {/* Roles Switcher */}
                    {!loadingRoles && roles.length > 0 && (
                        <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-lg border border-indigo-100 shadow-sm">
                            <span className="text-xs text-gray-500 font-medium uppercase tracking-wider">Aktif Rol:</span>
                            {roles.length > 1 ? (
                                <select
                                    value={activeRelationshipId}
                                    onChange={(e) => setActiveRelationshipId(e.target.value)}
                                    className="text-sm font-semibold text-indigo-700 bg-transparent border-none focus:ring-0 cursor-pointer"
                                >
                                    {roles.map(r => (
                                        <option key={r.id} value={r.id}>{r.role}</option>
                                    ))}
                                </select>
                            ) : (
                                <span className="text-sm font-semibold text-indigo-700 px-1">
                                    {roles[0].role}
                                </span>
                            )}
                        </div>
                    )}
                </div>

                <div className="flex bg-gray-100 p-1 rounded-lg w-max">
                    <button
                        onClick={() => setActiveTab('program')}
                        className={`px-4 py-2 rounded-md text-sm font-medium transition ${activeTab === 'program' ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-600 hover:text-gray-900'
                            }`}
                    >
                        Program
                    </button>
                    <button
                        onClick={() => setActiveTab('gelisim')}
                        className={`px-4 py-2 rounded-md text-sm font-medium transition ${activeTab === 'gelisim' ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-600 hover:text-gray-900'
                            }`}
                    >
                        Gelişim
                    </button>
                    <button
                        onClick={() => setActiveTab('sinavlar')}
                        className={`px-4 py-2 rounded-md text-sm font-medium transition ${activeTab === 'sinavlar' ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-600 hover:text-gray-900'
                            }`}
                    >
                        Sınavlar
                    </button>
                </div>
            </div>

            <div className="flex-1 bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden flex flex-col">
                {activeTab === 'program' ? (
                    <div className="h-full overflow-y-auto p-4">
                        <WeeklyView
                            userId={studentId}
                            relationshipId={activeRelationshipId}
                        />
                    </div>
                ) : activeTab === 'gelisim' ? (
                    <div className="p-6 h-full overflow-y-auto space-y-6">
                        <AIStudentAnalysis studentId={studentId} />
                        <ProgressView userId={studentId} />
                    </div>
                ) : (
                    <div className="p-6 h-full overflow-y-auto">
                        <ExamResultsView userId={studentId} />
                    </div>
                )}
            </div>
        </div>
    )
}
