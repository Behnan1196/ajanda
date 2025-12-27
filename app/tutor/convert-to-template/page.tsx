'use client'

import { useState, useEffect } from 'react'
import { getProjects, convertProjectToTemplate } from '@/app/actions/projects'
import { useRouter } from 'next/navigation'

export default function ConvertToTemplatePage() {
    const router = useRouter()
    const [projects, setProjects] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [converting, setConverting] = useState<string | null>(null)

    useEffect(() => {
        loadProjects()
    }, [])

    const loadProjects = async () => {
        setLoading(true)
        const { data } = await getProjects()
        if (data) {
            // Filter out templates and show only active projects
            const activeProjects = data.filter((p: any) => !p.is_template && p.status === 'active')
            setProjects(activeProjects)
        }
        setLoading(false)
    }

    const handleConvert = async (projectId: string, projectName: string) => {
        if (!confirm(`"${projectName}" projesini şablona dönüştürmek istediğinize emin misiniz?`)) {
            return
        }

        setConverting(projectId)
        const result = await convertProjectToTemplate(projectId)
        setConverting(null)

        if (result.error) {
            alert('Hata: ' + result.error)
        } else {
            alert('✅ Şablon oluşturuldu!')
            loadProjects()
        }
    }

    return (
        <div className="min-h-screen bg-gray-50 p-8">
            <div className="max-w-4xl mx-auto">
                {/* Header */}
                <div className="mb-8">
                    <button
                        onClick={() => router.back()}
                        className="text-gray-600 hover:text-gray-900 mb-4"
                    >
                        ← Geri
                    </button>
                    <h1 className="text-3xl font-bold text-gray-900">Şablona Dönüştür</h1>
                    <p className="text-gray-600 mt-2">
                        Mevcut projelerinizi yeniden kullanılabilir şablonlara dönüştürün.
                    </p>
                </div>

                {/* Projects List */}
                {loading ? (
                    <div className="text-center py-12">
                        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
                        <p className="text-gray-500 mt-4">Projeler yükleniyor...</p>
                    </div>
                ) : projects.length === 0 ? (
                    <div className="text-center py-12 bg-white rounded-2xl border border-dashed border-gray-200">
                        <span className="text-4xl block mb-4">📋</span>
                        <p className="text-gray-400">Şablona dönüştürülebilecek proje yok.</p>
                        <p className="text-xs text-gray-400 mt-2">Önce bir proje oluşturun.</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {projects.map(project => (
                            <div
                                key={project.id}
                                className="bg-white rounded-2xl border border-gray-200 p-6 hover:shadow-md transition"
                            >
                                <div className="flex items-start justify-between">
                                    <div className="flex-1">
                                        <h3 className="text-lg font-bold text-gray-900">{project.name}</h3>
                                        {project.description && (
                                            <p className="text-sm text-gray-600 mt-1">{project.description}</p>
                                        )}
                                        <div className="flex items-center gap-4 mt-3 text-xs text-gray-500">
                                            <span>📅 {new Date(project.created_at).toLocaleDateString('tr-TR')}</span>
                                            {project.settings?.module_type && (
                                                <span className="px-2 py-1 bg-gray-100 rounded-lg">
                                                    {project.settings.module_type}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => handleConvert(project.id, project.name)}
                                        disabled={converting === project.id}
                                        className="px-4 py-2 bg-purple-600 text-white rounded-lg font-bold hover:bg-purple-700 disabled:opacity-50 transition"
                                    >
                                        {converting === project.id ? 'Dönüştürülüyor...' : '📋 Şablona Dönüştür'}
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Info Box */}
                <div className="mt-8 bg-blue-50 rounded-2xl p-6 border border-blue-200">
                    <h4 className="font-bold text-blue-900 mb-2">💡 Nasıl Çalışır?</h4>
                    <ul className="text-sm text-blue-700 space-y-1">
                        <li>• Projeniz şablona dönüştürülür</li>
                        <li>• Görevler ve tarihler korunur</li>
                        <li>• Şablon, yeni programlar oluşturmak için kullanılabilir</li>
                        <li>• Farklı öğrencilere farklı tarihlerde atanabilir</li>
                    </ul>
                </div>
            </div>
        </div>
    )
}
