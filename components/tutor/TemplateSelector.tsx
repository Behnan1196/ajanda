'use client'

import { useState, useEffect } from 'react'
import { getTemplates } from '@/app/actions/projects'
import { getTemplatesByModule } from '@/lib/templates'
import CreateProgramModal from '@/components/program/CreateProgramModal'
import { createProgramFromTemplate } from '@/app/actions/templates'
import { createProjectFromTemplate } from '@/app/actions/projects'

interface TemplateSelectorProps {
    moduleType: 'exam' | 'nutrition' | 'music' | 'general' | 'coding'
    onSuccess: () => void
    defaultStudentId?: string
}

export default function TemplateSelector({ moduleType, onSuccess, defaultStudentId }: TemplateSelectorProps) {
    const [templates, setTemplates] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [selectedTemplate, setSelectedTemplate] = useState<any>(null)
    const [showModal, setShowModal] = useState(false)

    useEffect(() => {
        loadTemplates()
    }, [moduleType])

    const loadTemplates = async () => {
        setLoading(true)

        // 1. Unified code templates
        const codeTemplates = getTemplatesByModule(moduleType).map(t => ({
            ...t,
            source: 'code',
            tasks: t.tasks || []
        }))

        // 2. Database templates
        const { data: dbTemplates } = await getTemplates()
        const dbMapped = (dbTemplates || [])
            .filter((t: any) => t.settings?.module === moduleType || t.settings?.module_type === moduleType)
            .map((t: any) => ({
                id: t.id,
                name: t.name,
                description: t.description || 'Kullanıcı şablonu',
                source: 'database',
                moduleType,
                duration_days: Math.ceil((new Date(t.end_date || t.created_at).getTime() - new Date(t.start_date || t.created_at).getTime()) / (1000 * 60 * 60 * 24)) || 7,
                tasks: []
            }))

        // 3. Merge
        const all = [...codeTemplates, ...dbMapped]
        setTemplates(all)
        setLoading(false)
    }

    const moduleConfig: Record<string, { icon: string, name: string }> = {
        exam: { icon: '📚', name: 'Sınav Koçluğu' },
        nutrition: { icon: '🥗', name: 'Beslenme Koçluğu' },
        music: { icon: '🎸', name: 'Müzik Eğitimi' },
        coding: { icon: '💻', name: 'Yazılım Eğitimi' },
        general: { icon: '🎯', name: 'Genel Koçluk' }
    }

    const config = moduleConfig[moduleType]

    const handleCreateProgram = async (templateId: string, studentId: string, startDate: string) => {
        const template = templates.find(t => t.id === templateId)

        if (template?.source === 'database') {
            return await createProjectFromTemplate(templateId, studentId, startDate)
        } else {
            return await createProgramFromTemplate(templateId, studentId, startDate)
        }
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-white p-8">
            <div className="max-w-4xl mx-auto">
                <div className="mb-8">
                    <div className="flex items-center gap-3 mb-2">
                        <span className="text-4xl">{config.icon}</span>
                        <h1 className="text-3xl font-bold text-gray-900">{config.name}</h1>
                    </div>
                    <p className="text-gray-600">Hazır şablonlardan program oluştur</p>
                </div>

                {loading ? (
                    <div className="text-center py-12">
                        <div className="inline-block w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
                        <p className="mt-4 text-gray-600">Şablonlar yükleniyor...</p>
                    </div>
                ) : templates.length === 0 ? (
                    <div className="text-center py-12 bg-white rounded-lg shadow-sm">
                        <span className="text-6xl opacity-20">📚</span>
                        <p className="mt-4 text-gray-600">Henüz şablon bulunmuyor</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {templates.map(template => (
                            <div
                                key={template.id}
                                className="bg-white rounded-lg shadow-sm hover:shadow-md transition p-6 cursor-pointer border-2 border-transparent hover:border-indigo-200"
                                onClick={() => {
                                    setSelectedTemplate(template)
                                    setShowModal(true)
                                }}
                            >
                                <h3 className="font-bold text-lg mb-2">{template.name}</h3>
                                <p className="text-sm text-gray-600 mb-4">{template.description}</p>
                                <div className="flex items-center gap-4 text-sm text-gray-500">
                                    <span>📅 {template.duration_days} gün</span>
                                    {template.tasks && <span>📋 {template.tasks.length} görev</span>}
                                    {template.source === 'database' && <span className="text-purple-600">✨ Özel</span>}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {showModal && selectedTemplate && (
                <CreateProgramModal
                    templates={[selectedTemplate]}
                    onClose={() => setShowModal(false)}
                    onSuccess={() => {
                        setShowModal(false)
                        onSuccess()
                    }}
                    createAction={handleCreateProgram}
                    title={`${config.name} - Program Oluştur`}
                    moduleIcon={config.icon}
                    defaultStudentId={defaultStudentId}
                />
            )}
        </div>
    )
}
