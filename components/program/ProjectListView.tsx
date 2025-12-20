'use client'

import { useState, useEffect } from 'react'
import { getProjects, createProject, Project } from '@/app/actions/projects'

interface ProjectListViewProps {
    onProjectSelect: (project: Project) => void
}

export default function ProjectListView({ onProjectSelect }: ProjectListViewProps) {
    const [projects, setProjects] = useState<Project[]>([])
    const [loading, setLoading] = useState(true)
    const [name, setName] = useState('')
    const [isCreating, setIsCreating] = useState(false)

    const loadProjects = async () => {
        setLoading(true)
        const result = await getProjects()
        if (result.data) {
            setProjects(result.data)
        }
        setLoading(false)
    }

    useEffect(() => {
        loadProjects()
    }, [])

    const handleCreateProject = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!name.trim()) return

        const result = await createProject(name)

        if (result.data) {
            setName('')
            setIsCreating(false)
            loadProjects()
        } else if (result.error) {
            alert('Proje oluşturulamadı: ' + result.error)
        }
    }

    if (loading) {
        return (
            <div className="flex justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
            </div>
        )
    }

    return (
        <div className="animate-in fade-in duration-500">
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h2 className="text-xl font-bold text-gray-900">Projelerim</h2>
                    <p className="text-sm text-gray-500">Karmaşık hedeflerinizi yönetin.</p>
                </div>
                <button
                    onClick={() => setIsCreating(true)}
                    className="p-2 bg-indigo-600 text-white rounded-xl shadow-lg shadow-indigo-200 hover:bg-indigo-700 transition"
                >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                </button>
            </div>

            {isCreating && (
                <form onSubmit={handleCreateProject} className="mb-6 bg-indigo-50 p-4 rounded-2xl border border-indigo-100 animate-in zoom-in-95 duration-200">
                    <input
                        type="text"
                        placeholder="Proje Adı (Örn: Gitar Öğrenimi)"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="w-full p-3 rounded-xl border-0 shadow-sm focus:ring-2 focus:ring-indigo-500 mb-3"
                        autoFocus
                    />
                    <div className="flex gap-2">
                        <button
                            type="submit"
                            className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition"
                        >
                            Oluştur
                        </button>
                        <button
                            type="button"
                            onClick={() => setIsCreating(false)}
                            className="px-4 py-2 bg-white text-gray-600 rounded-lg text-sm font-medium hover:bg-gray-100 transition"
                        >
                            Vazgeç
                        </button>
                    </div>
                </form>
            )}

            <div className="grid grid-cols-1 gap-3">
                {projects.map(project => (
                    <button
                        key={project.id}
                        onClick={() => onProjectSelect(project)}
                        className="flex items-center justify-between p-5 bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md hover:border-indigo-200 transition-all text-left group"
                    >
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-gray-50 text-gray-400 group-hover:bg-indigo-50 group-hover:text-indigo-600 rounded-xl flex items-center justify-center text-xl transition-colors">
                                🏗️
                            </div>
                            <div>
                                <h3 className="font-bold text-gray-900">{project.name}</h3>
                                <p className="text-xs text-gray-400">{new Date(project.created_at).toLocaleDateString('tr-TR')} oluşturuldu</p>
                            </div>
                        </div>
                        <svg className="w-5 h-5 text-gray-300 group-hover:text-indigo-400 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                    </button>
                ))}

                {projects.length === 0 && !isCreating && (
                    <div className="text-center py-12 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200">
                        <p className="text-gray-400 text-sm">Henüz bir projeniz yok.</p>
                        <button
                            onClick={() => setIsCreating(true)}
                            className="text-indigo-600 text-sm font-bold mt-2 hover:underline"
                        >
                            İlk Projeni Oluştur
                        </button>
                    </div>
                )}
            </div>
        </div>
    )
}
