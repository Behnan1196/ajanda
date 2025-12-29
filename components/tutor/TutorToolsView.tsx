'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { getTemplates, deleteProject } from '@/app/actions/projects'
import TemplateGroup from './TemplateGroup'
import CreateProgramModal from '@/components/program/CreateProgramModal'
import { getAllModules } from '@/lib/modules/registry'
import { getAllTemplates } from '@/lib/templates'
import { createProgramFromTemplate } from '@/app/actions/templates'

interface TutorToolsViewProps {
    onSelectTool: (tool: string) => void
    selectedStudentId?: string
}

export default function TutorToolsView({ onSelectTool, selectedStudentId }: TutorToolsViewProps) {
    const router = useRouter()
    const [templates, setTemplates] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [selectedTemplate, setSelectedTemplate] = useState<any>(null)
    const [showUseModal, setShowUseModal] = useState(false)

    useEffect(() => {
        loadAllTemplates()
    }, [])

    const loadAllTemplates = async () => {
        setLoading(true)

        // 1. Unified code templates
        const codeTemplates = getAllTemplates().map((t: any) => ({
            ...t,
            source: 'code'
        }))

        // 2. Database templates (for backward compatibility or user-created ones)
        const { data: dbTemplates } = await getTemplates()
        const dbMapped = (dbTemplates || []).map((t: any) => ({
            id: t.id,
            name: t.name,
            description: t.description || (t.is_official ? 'Resmi Şablon' : 'Kullanıcı şablonu'),
            source: 'database',
            isOfficial: t.is_official,
            module: t.module || t.settings?.module || t.settings?.module_type || 'general',
            duration_days: t.settings?.duration_days || 7,
            tasks: []
        }))

        // 3. Merge
        const all = [...codeTemplates, ...dbMapped]
        setTemplates(all)
        setLoading(false)
    }

    const getToolUrl = (path: string) => {
        return selectedStudentId ? `${path}?studentId=${selectedStudentId}` : path
    }

    const handleTemplateClick = (template: any) => {
        setSelectedTemplate(template)
        setShowUseModal(true)
    }

    const handleEditTemplate = (template: any) => {
        if (template.source === 'code') {
            const encodedData = encodeURIComponent(JSON.stringify(template))
            router.push(`/tutor/template-builder?from=${encodedData}`)
        } else {
            router.push(`/tutor/template-editor/${template.id}`)
        }
    }

    const handleDeleteTemplate = async (template: any) => {
        if (!confirm(`"${template.name}" şablonunu silmek istediğinize emin misiniz?`)) return
        const result = await deleteProject(template.id)
        if (result.error) alert('Hata: ' + result.error)
        else {
            alert('✅ Şablon silindi!')
            loadAllTemplates()
        }
    }

    const handleCreateProgram = async (templateId: string, studentId: string, startDate: string) => {
        return await createProgramFromTemplate(templateId, studentId, startDate)
    }

    return (
        <div className="max-w-6xl mx-auto p-4 md:p-8 space-y-12 min-h-[80vh]">
            {/* Expertise Tools Desk - Dynamic from Registry */}
            <section className="space-y-6">
                <div>
                    <h2 className="text-xl font-black text-gray-900 tracking-tight">Uzmanlık Masası</h2>
                    <p className="text-gray-500 text-xs font-medium">Uzmanlık alanlarınıza göre özel araçları kullanın.</p>
                </div>
                <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
                    {getAllModules().map((module) => (
                        <button
                            key={module.id}
                            onClick={() => router.push(getToolUrl(module.route))}
                            className="bg-white border border-gray-200 rounded-3xl p-6 text-center hover:border-indigo-300 hover:shadow-xl hover:shadow-indigo-100/30 transition-all group"
                        >
                            <span className="text-4xl block mb-3 group-hover:scale-110 transition duration-300">{module.icon}</span>
                            <h3 className="font-bold text-gray-900 group-hover:text-indigo-600 transition">{module.nameTR}</h3>
                            <p className="text-[10px] text-gray-400 mt-1 uppercase font-bold">{module.description}</p>
                        </button>
                    ))}
                </div>
            </section>

            <div className="h-[1px] bg-gray-100"></div>

            {/* Template Library */}
            <section className="space-y-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h2 className="text-2xl font-black text-gray-900 tracking-tight">Şablon Kütüphanesi</h2>
                        <p className="text-gray-500 font-medium">Unified şablon sistemi ile hazır programları atayın.</p>
                    </div>
                </div>

                {loading ? (
                    <div className="p-12 text-center text-gray-500">Yükleniyor...</div>
                ) : (
                    <div className="space-y-8">
                        {getAllModules().map(module => {
                            const moduleTemplates = templates.filter(t => t.module === module.id)
                            if (moduleTemplates.length === 0) return null

                            return (
                                <TemplateGroup
                                    key={module.id}
                                    icon={module.icon}
                                    title={module.nameTR}
                                    templates={moduleTemplates}
                                    onTemplateClick={handleTemplateClick}
                                    onEdit={handleEditTemplate}
                                    onDelete={handleDeleteTemplate}
                                />
                            )
                        })}
                    </div>
                )}
            </section>

            {showUseModal && selectedTemplate && (
                <CreateProgramModal
                    templates={[selectedTemplate]}
                    onClose={() => setShowUseModal(false)}
                    onSuccess={() => {
                        setShowUseModal(false)
                        alert('✅ Program oluşturuldu!')
                    }}
                    createAction={handleCreateProgram}
                    onCustomize={handleEditTemplate}
                    title={`${selectedTemplate.name} - Program Oluştur`}
                />
            )}
        </div>
    )
}
