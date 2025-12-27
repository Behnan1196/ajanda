'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { getTemplates, createProjectFromTemplate, deleteProject } from '@/app/actions/projects'
import TemplateGroup from './TemplateGroup'
import CreateProgramModal from '@/components/program/CreateProgramModal'
import { examTemplates } from '@/lib/templates/exam'
import { simpleTemplates } from '@/lib/templates/simple'
import { createProgramFromSimpleTemplate } from '@/app/actions/templates'

interface TutorToolsViewProps {
    onSelectTool: (tool: string) => void
}

export default function TutorToolsView({ onSelectTool }: TutorToolsViewProps) {
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

        // 1. Code templates
        const codeTemplates = [
            ...examTemplates.map(t => ({ ...t, source: 'code', moduleType: 'exam' })),
            ...simpleTemplates.map(t => ({ ...t, source: 'code', moduleType: 'general' }))
            // TODO: Add nutrition and music templates when ready
        ]

        // 2. Database templates
        const { data: dbTemplates } = await getTemplates()
        const dbMapped = (dbTemplates || []).map((t: any) => ({
            id: t.id,
            name: t.name,
            description: t.description || 'Kullanıcı şablonu',
            source: 'database',
            moduleType: t.settings?.module_type || 'general',
            duration_days: Math.ceil((new Date(t.end_date || t.created_at).getTime() - new Date(t.start_date || t.created_at).getTime()) / (1000 * 60 * 60 * 24)) || 7,
            tasks: []
        }))

        // 3. Merge
        const all = [...codeTemplates, ...dbMapped]
        setTemplates(all)
        setLoading(false)
    }

    const handleTemplateClick = (template: any) => {
        setSelectedTemplate(template)
        setShowUseModal(true)
    }

    const handleEditTemplate = (template: any) => {
        router.push(`/tutor/template-editor/${template.id}`)
    }

    const handleDeleteTemplate = async (template: any) => {
        if (!confirm(`"${template.name}" şablonunu silmek istediğinize emin misiniz? Bu işlem geri alınamaz.`)) {
            return
        }

        const result = await deleteProject(template.id)
        if (result.error) {
            alert('Hata: ' + result.error)
        } else {
            alert('✅ Şablon silindi!')
            loadAllTemplates() // Refresh list
        }
    }

    const handleCreateProgram = async (templateId: string, studentId: string, startDate: string) => {
        const template = templates.find(t => t.id === templateId)

        if (template?.source === 'database') {
            return await createProjectFromTemplate(templateId, studentId, startDate)
        } else {
            return await createProgramFromSimpleTemplate(templateId, studentId, startDate)
        }
    }

    return (
        <div className="max-w-6xl mx-auto p-4 md:p-8 space-y-12 min-h-[80vh]">
            {/* Expertise Tools Desk */}
            <section className="space-y-6">
                <div>
                    <h2 className="text-xl font-black text-gray-900 tracking-tight">Uzmanlık Masası</h2>
                    <p className="text-gray-500 text-xs font-medium">Özel araçlar üzerinden detaylı yönetim yapın.</p>
                </div>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    <button
                        onClick={() => router.push('/tutor/nutrition')}
                        className="bg-white border border-gray-200 rounded-3xl p-6 text-center hover:border-purple-300 hover:shadow-xl hover:shadow-purple-100/30 transition-all group"
                    >
                        <span className="text-4xl block mb-3 group-hover:scale-110 transition duration-300">🍏</span>
                        <h3 className="font-bold text-gray-900 group-hover:text-purple-600 transition">Beslenme Koçluğu</h3>
                        <p className="text-[10px] text-gray-400 mt-1 uppercase font-bold">Kişiye Özel</p>
                    </button>
                    <button
                        onClick={() => router.push('/tutor/music')}
                        className="bg-white border border-gray-200 rounded-3xl p-6 text-center hover:border-purple-300 hover:shadow-xl hover:shadow-purple-100/30 transition-all group"
                    >
                        <span className="text-4xl block mb-3 group-hover:scale-110 transition duration-300">🎸</span>
                        <h3 className="font-bold text-gray-900 group-hover:text-purple-600 transition">Müzik Koçluğu</h3>
                        <p className="text-[10px] text-gray-400 mt-1 uppercase font-bold">Pratik & Gelişim</p>
                    </button>
                    <button
                        onClick={() => router.push('/tutor/exam')}
                        className="bg-white border border-gray-200 rounded-3xl p-6 text-center hover:border-blue-300 hover:shadow-xl hover:shadow-blue-100/30 transition-all group"
                    >
                        <span className="text-4xl block mb-3 group-hover:scale-110 transition duration-300">📚</span>
                        <h3 className="font-bold text-gray-900 group-hover:text-blue-600 transition">Sınav Koçluğu</h3>
                        <p className="text-[10px] text-gray-400 mt-1 uppercase font-bold">TYT & AYT</p>
                    </button>
                    <button
                        onClick={() => router.push('/tutor/general')}
                        className="bg-white border border-gray-200 rounded-3xl p-6 text-center hover:border-green-300 hover:shadow-xl hover:shadow-green-100/30 transition-all group"
                    >
                        <span className="text-4xl block mb-3 group-hover:scale-110 transition duration-300">🎯</span>
                        <h3 className="font-bold text-gray-900 group-hover:text-green-600 transition">Genel Koçluk</h3>
                        <p className="text-[10px] text-gray-400 mt-1 uppercase font-bold">Özel Programlar</p>
                    </button>
                </div>
            </section>

            <div className="h-[1px] bg-gray-100"></div>

            {/* Template Library */}
            <section className="space-y-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h2 className="text-2xl font-black text-gray-900 tracking-tight">Şablon Kütüphanesi</h2>
                        <p className="text-gray-500 font-medium">Tüm şablonlarınız modül türüne göre gruplandırılmış.</p>
                    </div>
                    <button
                        onClick={() => router.push('/tutor/template-builder')}
                        className="px-8 py-3 bg-purple-600 text-white rounded-[2rem] font-bold shadow-lg shadow-purple-200 hover:bg-purple-700 hover:-translate-y-0.5 transition active:scale-95 flex items-center justify-center gap-2"
                    >
                        <span className="text-xl">✨</span>
                        Şablon Oluştur
                    </button>
                </div>

                {loading ? (
                    <div className="p-12 text-center text-gray-500 font-medium">
                        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mb-4"></div>
                        <p>Şablonlar yükleniyor...</p>
                    </div>
                ) : templates.length === 0 ? (
                    <div className="p-12 text-center bg-white rounded-2xl border border-dashed border-gray-200 text-gray-400">
                        <span className="text-4xl block mb-4">📋</span>
                        <p className="font-medium">Henüz şablon yok.</p>
                        <p className="text-xs mt-2">Bir proje oluşturup şablona dönüştürebilirsiniz.</p>
                    </div>
                ) : (
                    <div className="space-y-8">
                        <TemplateGroup
                            icon="📚"
                            title="Sınav Koçluğu"
                            templates={templates.filter(t => t.moduleType === 'exam')}
                            onTemplateClick={handleTemplateClick}
                            onEdit={handleEditTemplate}
                            onDelete={handleDeleteTemplate}
                        />

                        {/* Nutrition Templates */}
                        <TemplateGroup
                            icon="🍏"
                            title="Beslenme"
                            templates={templates.filter(t => t.moduleType === 'nutrition')}
                            onTemplateClick={handleTemplateClick}
                            onEdit={handleEditTemplate}
                            onDelete={handleDeleteTemplate}
                        />

                        {/* Music Templates */}
                        <TemplateGroup
                            icon="🎸"
                            title="Müzik"
                            templates={templates.filter(t => t.moduleType === 'music')}
                            onTemplateClick={handleTemplateClick}
                            onEdit={handleEditTemplate}
                            onDelete={handleDeleteTemplate}
                        />

                        {/* General Templates */}
                        <TemplateGroup
                            icon="📋"
                            title="Genel"
                            templates={templates.filter(t => t.moduleType === 'general')}
                            onTemplateClick={handleTemplateClick}
                            onEdit={handleEditTemplate}
                            onDelete={handleDeleteTemplate}
                        />
                    </div>
                )}
            </section>

            {/* Use Template Modal */}
            {showUseModal && selectedTemplate && (
                <CreateProgramModal
                    templates={[selectedTemplate]}
                    onClose={() => setShowUseModal(false)}
                    onSuccess={() => {
                        setShowUseModal(false)
                        alert('✅ Program oluşturuldu!')
                    }}
                    createAction={handleCreateProgram}
                    title={`${selectedTemplate.name} - Program Oluştur`}
                    moduleIcon={
                        selectedTemplate.moduleType === 'exam' ? '📚' :
                            selectedTemplate.moduleType === 'nutrition' ? '🍏' :
                                selectedTemplate.moduleType === 'music' ? '🎸' : '📋'
                    }
                />
            )}
        </div>
    )
}
