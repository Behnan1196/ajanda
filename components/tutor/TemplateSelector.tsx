'use client'

import { useState, useEffect } from 'react'
import { getTemplates } from '@/app/actions/projects'
import { examTemplates } from '@/lib/templates/exam'
import { codingTemplates } from '@/lib/templates/coding'
import { simpleTemplates } from '@/lib/templates/simple'
import CreateProgramModal from '@/components/program/CreateProgramModal'
import { createProgramFromSimpleTemplate } from '@/app/actions/templates'
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

        // 1. Code templates
        let codeTemplates: any[] = []
        if (moduleType === 'exam') {
            codeTemplates = examTemplates.map(t => ({ ...t, source: 'code', moduleType: 'exam' }))
        } else if (moduleType === 'coding') {
            codeTemplates = codingTemplates.map(t => ({ ...t, source: 'code', moduleType: 'coding' }))
        } else if (moduleType === 'general') {
            codeTemplates = simpleTemplates.map(t => ({ ...t, source: 'code', moduleType: 'general' }))
        }

        // 2. Database templates
        const { data: dbTemplates } = await getTemplates()
        const dbMapped = (dbTemplates || [])
            .filter((t: any) => (t.settings?.module_type || 'general') === moduleType)
            .map((t: any) => ({
                id: t.id,
                name: t.name,
                description: t.description || 'Kullanıcı şablonu',
                source: 'database',
                moduleType: t.settings?.module_type || 'general',
                duration_days: t.settings?.duration_days || 7,
                tasks: [] // For now, we don't load tasks here
            }))

        setTemplates([...codeTemplates, ...dbMapped])
        setLoading(false)
    }

    const handleTemplateClick = (template: any) => {
        setSelectedTemplate(template)
        setShowModal(true)
    }

    const handleCreateProgram = async (templateId: string, studentId: string, startDate: string) => {
        if (selectedTemplate.source === 'database') {
            return await createProjectFromTemplate(templateId, studentId, startDate)
        } else {
            return await createProgramFromSimpleTemplate(templateId, studentId, startDate)
        }
    }

    if (loading) {
        return (
            <div className="p-12 text-center text-gray-500">
                <div className="inline-block animate-spin rounded-full h-10 w-10 border-4 border-gray-200 border-t-blue-600 mb-4"></div>
                <p className="font-medium">Size en uygun şablonlar hazırlanıyor...</p>
            </div>
        )
    }

    if (templates.length === 0) {
        return (
            <div className="p-12 text-center bg-white rounded-[2rem] border-2 border-dashed border-gray-100 text-gray-400">
                <span className="text-5xl block mb-4">📋</span>
                <p className="text-lg font-bold text-gray-900 mb-1">Henüz şablon yok</p>
                <p className="text-sm">Şablon Kütüphanesi'nden modüle uygun yeni bir şablon oluşturabilirsiniz.</p>
            </div>
        )
    }

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {templates.map(template => (
                    <button
                        key={template.id}
                        onClick={() => handleTemplateClick(template)}
                        className={`text-left p-6 rounded-[2rem] border-2 transition-all duration-300 group relative overflow-hidden ${template.source === 'database'
                            ? 'bg-white border-gray-100 hover:border-purple-300 hover:shadow-xl hover:shadow-purple-100/50'
                            : 'bg-blue-50/30 border-blue-100 hover:border-blue-400 hover:shadow-xl hover:shadow-blue-100/50'
                            }`}
                    >
                        {/* Decorative background circle */}
                        <div className={`absolute -right-4 -top-4 w-24 h-24 rounded-full opacity-10 group-hover:scale-110 transition-transform duration-500 ${template.source === 'database' ? 'bg-purple-600' : 'bg-blue-600'
                            }`} />

                        <div className="relative z-10">
                            <div className="flex items-start justify-between mb-3">
                                <h4 className={`font-black text-lg tracking-tight transition-colors duration-300 ${template.source === 'database' ? 'text-gray-900 group-hover:text-purple-600' : 'text-blue-900 group-hover:text-blue-700'
                                    }`}>
                                    {template.name}
                                </h4>
                                {template.source === 'database' ? (
                                    <span className="text-[10px] bg-purple-100 text-purple-600 px-3 py-1 rounded-full font-black uppercase tracking-wider shadow-sm">
                                        Kişisel
                                    </span>
                                ) : (
                                    <span className="text-[10px] bg-blue-100 text-blue-600 px-3 py-1 rounded-full font-black uppercase tracking-wider shadow-sm">
                                        Sistem
                                    </span>
                                )}
                            </div>
                            <p className="text-sm text-gray-500 mb-6 line-clamp-2 font-medium">
                                {template.description}
                            </p>
                            <div className="flex items-center justify-between mt-auto">
                                <div className="flex items-center gap-3">
                                    <span className="px-3 py-1 bg-gray-100 rounded-full text-[10px] font-bold text-gray-600">
                                        📅 {template.duration_days} GÜN
                                    </span>
                                    {template.tasks && template.tasks.length > 0 && (
                                        <span className="px-3 py-1 bg-gray-100 rounded-full text-[10px] font-bold text-gray-600">
                                            📋 {template.tasks.length} GÖREV
                                        </span>
                                    )}
                                </div>
                                <span className={`text-xs font-black uppercase tracking-tighter transition-all duration-300 flex items-center gap-1 ${template.source === 'database' ? 'text-purple-600 group-hover:gap-2' : 'text-blue-600 group-hover:gap-2'
                                    }`}>
                                    Seç <span className="text-lg">→</span>
                                </span>
                            </div>
                        </div>
                    </button>
                ))}
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
                    title={`${selectedTemplate.name} - Programı Uygula`}
                    defaultStudentId={defaultStudentId}
                />
            )}
        </div>
    )
}
