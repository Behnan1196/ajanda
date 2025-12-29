'use client'

import { useState, useEffect, use } from 'react'
import { useRouter } from 'next/navigation'
import { getProjectById, updateProject, deleteProject } from '@/app/actions/projects'
import TaskHierarchicalEditor from '@/components/program/TaskHierarchicalEditor'
import TaskFormModal from '@/components/tutor/TaskFormModal'

export default function TemplateEditorPage({ params: paramsPromise }: { params: Promise<{ id: string }> }) {
    const params = use(paramsPromise)
    const router = useRouter()
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [templateData, setTemplateData] = useState({
        name: '',
        description: '',
        moduleType: 'general',
        durationDays: 7
    })

    // We fetch tasks just to pass them initially, 
    // but TaskHierarchicalEditor handles re-fetching via onUpdate triggering a parent refresh if needed,
    // OR we can let TaskHierarchicalEditor manage its own data fetching if we change it.
    // Current TaskHierarchicalEditor takes 'initialTasks'. 
    // To support live updates, we can just fetch tasks here and pass them.
    const [tasks, setTasks] = useState<any[]>([])

    useEffect(() => {
        loadTemplate()
    }, [params.id])

    const loadTemplate = async () => {
        setLoading(true)

        const projectResult = await getProjectById(params.id)
        if (projectResult.error || !projectResult.data) {
            alert('Şablon bulunamadı')
            router.push('/tutor')
            return
        }

        const project = projectResult.data
        setTemplateData({
            name: project.name,
            description: project.description || '',
            moduleType: project.settings?.module_type || 'general',
            durationDays: project.settings?.duration_days || 7
        })

        // Fetch tasks for the editor
        const { getProjectTasks } = await import('@/app/actions/projects')
        const tasksResult = await getProjectTasks(params.id)
        if (tasksResult.data) {
            setTasks(tasksResult.data)
        }

        setLoading(false)
    }

    const handleSaveSettings = async () => {
        setSaving(true)

        const projectResult = await updateProject(params.id, {
            name: templateData.name,
            description: templateData.description,
            settings: {
                module_type: templateData.moduleType,
                duration_days: templateData.durationDays
            }
        })

        setSaving(false)

        if (projectResult.error) {
            alert('Proje bilgileri güncellenemedi: ' + projectResult.error)
            return
        }

        alert('Şablon ayarları güncellendi!')
        router.refresh()
    }

    const handleDelete = async () => {
        if (!confirm('Bu şablonu silmek istediğinize emin misiniz? Bu işlem geri alınamaz.')) {
            return
        }

        const result = await deleteProject(params.id)
        if (result.error) {
            alert('Hata: ' + result.error)
        } else {
            alert('✅ Şablon silindi!')
            router.push('/tutor')
        }
    }

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mb-4"></div>
                    <p className="text-gray-600">Şablon yükleniyor...</p>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-gray-50 p-8">
            <div className="max-w-6xl mx-auto">
                <div className="mb-8">
                    <button
                        onClick={() => router.push('/tutor')}
                        className="text-gray-600 hover:text-gray-900 mb-4 flex items-center gap-2"
                    >
                        ← Geri
                    </button>
                    <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                        <span className="text-4xl">✏️</span>
                        Şablon Düzenle
                    </h1>
                </div>

                <div className="bg-white rounded-2xl p-8 border border-gray-200">
                    {/* Settings Section */}
                    <div className="grid grid-cols-2 gap-6 mb-8">
                        <div className="col-span-2">
                            <label className="block text-sm font-bold text-gray-900 mb-2">
                                Şablon Adı *
                            </label>
                            <input
                                type="text"
                                value={templateData.name}
                                onChange={(e) => setTemplateData({ ...templateData, name: e.target.value })}
                                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-purple-500 outline-none"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-bold text-gray-900 mb-2">
                                Modül Türü
                            </label>
                            <select
                                value={templateData.moduleType}
                                onChange={(e) => setTemplateData({ ...templateData, moduleType: e.target.value })}
                                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-purple-500 outline-none"
                            >
                                <option value="exam">📚 Sınav Koçluğu</option>
                                <option value="nutrition">🍏 Beslenme</option>
                                <option value="music">🎸 Müzik</option>
                                <option value="general">📋 Genel</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-bold text-gray-900 mb-2">
                                Süre (Gün)
                            </label>
                            <input
                                type="number"
                                min="1"
                                value={templateData.durationDays}
                                onChange={(e) => setTemplateData({ ...templateData, durationDays: parseInt(e.target.value) || 1 })}
                                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-purple-500 outline-none"
                            />
                        </div>

                        <div className="col-span-2">
                            <label className="block text-sm font-bold text-gray-900 mb-2">
                                Açıklama
                            </label>
                            <textarea
                                value={templateData.description}
                                onChange={(e) => setTemplateData({ ...templateData, description: e.target.value })}
                                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-purple-500 outline-none"
                                rows={2}
                            />
                        </div>
                    </div>

                    <div className="flex justify-end gap-3 mb-8">
                        <button
                            onClick={handleDelete}
                            className="px-6 py-2 border-2 border-red-200 text-red-500 rounded-xl font-bold hover:bg-red-50 transition text-sm"
                        >
                            Şablonu Sil
                        </button>
                        <button
                            onClick={handleSaveSettings}
                            disabled={saving || !templateData.name}
                            className="px-6 py-2 bg-gray-900 text-white rounded-xl font-bold hover:bg-black disabled:opacity-50 transition text-sm"
                        >
                            {saving ? 'Kaydediliyor...' : 'Ayarları Kaydet'}
                        </button>
                    </div>

                    <div className="h-[1px] bg-gray-200 my-8"></div>

                    {/* Tasks Editor */}
                    <div>
                        <TaskHierarchicalEditor
                            projectId={params.id}
                            initialTasks={tasks}
                            onUpdate={loadTemplate} // Refresh tasks on change
                        />
                    </div>
                </div>
            </div>
        </div>
    )
}
