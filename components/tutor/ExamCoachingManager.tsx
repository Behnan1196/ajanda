'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import ProgramList from '@/components/program/ProgramList'
import CreateProgramModal from '@/components/program/CreateProgramModal'
import { getTemplatesByModule } from '@/lib/templates'
import { createProgramFromSimpleTemplate } from '@/app/actions/templates'
import { getTemplates, createProjectFromTemplate } from '@/app/actions/projects'

interface ExamCoachingManagerProps {
    selectedPersonaId?: string
}

export default function ExamCoachingManager({ selectedPersonaId }: ExamCoachingManagerProps) {
    const router = useRouter()
    const [showCreateModal, setShowCreateModal] = useState(false)
    const [allTemplates, setAllTemplates] = useState<any[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        loadAllTemplates()
    }, [])

    const loadAllTemplates = async () => {
        setLoading(true)

        // Get code templates from unified system
        const examCodeTemplates = getTemplatesByModule('exam')

        // Get database templates
        const { data: dbTemplates } = await getTemplates('exam')

        // Merge code templates with database templates
        const merged = [
            ...examCodeTemplates,
            ...(dbTemplates || []).map((t: any) => ({
                id: t.id,
                name: t.name,
                description: t.description || 'Kullanıcı şablonu',
                duration_days: Math.ceil((new Date(t.end_date || t.created_at).getTime() - new Date(t.start_date || t.created_at).getTime()) / (1000 * 60 * 60 * 24)) || 7,
                tasks: [], // Will be loaded when creating
                isDbTemplate: true
            }))
        ]

        setAllTemplates(merged)
        setLoading(false)
    }

    const handleCreateProgram = async (templateId: string, studentId: string, startDate: string) => {
        // Check if it's a database template
        const template = allTemplates.find(t => t.id === templateId)

        if (template?.isDbTemplate) {
            // Use project-based template creation
            const result = await createProjectFromTemplate(templateId, studentId, startDate)
            return result
        } else {
            // Use code-based template creation
            const result = await createProgramFromSimpleTemplate(templateId, studentId, startDate)
            return result
        }
    }

    return (
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
            {/* Header */}
            <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-white">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <span className="text-4xl">📚</span>
                        <div>
                            <h2 className="text-2xl font-bold text-gray-900">Sınav Koçluğu</h2>
                            <p className="text-sm text-gray-600 mt-1">
                                TYT/AYT hazırlık programları
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => router.push('/tutor/convert-to-template')}
                            className="px-4 py-2 bg-white border-2 border-blue-600 text-blue-600 rounded-xl font-bold hover:bg-blue-50 transition"
                        >
                            📋 Şablon Oluştur
                        </button>
                        <button
                            onClick={() => setShowCreateModal(true)}
                            className="px-6 py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition shadow-sm"
                        >
                            + Yeni Program Oluştur
                        </button>
                    </div>
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-4 p-6 bg-gray-50 border-b border-gray-200">
                <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">{allTemplates.length}</div>
                    <div className="text-xs text-gray-500 mt-1">Toplam Şablon</div>
                </div>
                <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">5-30</div>
                    <div className="text-xs text-gray-500 mt-1">Gün Arası</div>
                </div>
                <div className="text-center">
                    <div className="text-2xl font-bold text-purple-600">TYT</div>
                    <div className="text-xs text-gray-500 mt-1">Matematik</div>
                </div>
            </div>

            {/* Programs */}
            <div className="p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4">Aktif Programlar</h3>
                <ProgramList
                    moduleType="exam"
                    onProgramClick={(program) => {
                        // TODO: Navigate to program details
                        console.log('Program clicked:', program)
                    }}
                />
            </div>

            {/* Create Modal */}
            {showCreateModal && (
                <CreateProgramModal
                    templates={allTemplates}
                    onClose={() => setShowCreateModal(false)}
                    onSuccess={() => {
                        setShowCreateModal(false)
                        loadAllTemplates()
                        window.location.reload()
                    }}
                    createAction={handleCreateProgram}
                    title="Yeni Sınav Programı"
                    moduleIcon="📚"
                    defaultStudentId={selectedPersonaId}
                />
            )}
        </div>
    )
}
