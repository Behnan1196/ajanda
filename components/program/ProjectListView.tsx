import { useState, useEffect } from 'react'
import { getProjects, createProject, updateProject, deleteProject, Project } from '@/app/actions/projects'

interface ProjectListViewProps {
    onProjectSelect: (project: Project) => void
    userId?: string
    filter?: 'all' | 'personal' | 'coach'
}

export default function ProjectListView({ onProjectSelect, userId, filter = 'all' }: ProjectListViewProps) {
    const [projects, setProjects] = useState<Project[]>([])
    const [loading, setLoading] = useState(true)
    const [name, setName] = useState('')
    const [isCreating, setIsCreating] = useState(false)
    const [editingProject, setEditingProject] = useState<Project | null>(null)

    const loadProjects = async () => {
        setLoading(true)
        const result = await getProjects(userId, filter)
        if (result.data) {
            setProjects(result.data)
        }
        setLoading(false)
    }

    useEffect(() => {
        loadProjects()
    }, [userId, filter])

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

    const handleUpdateProject = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!editingProject || !name.trim()) return

        const result = await updateProject(editingProject.id, { name })

        if (result.data) {
            setName('')
            setEditingProject(null)
            loadProjects()
        } else if (result.error) {
            alert('Proje güncellenemedi: ' + result.error)
        }
    }

    const startEdit = (project: Project) => {
        setEditingProject(project)
        setName(project.name)
        setIsCreating(false)
    }

    const handleDelete = async (id: string) => {
        if (!confirm('Bu projeyi silmek istediğinize emin misiniz?')) return
        const result = await deleteProject(id)
        if (result.success) {
            loadProjects()
        } else {
            alert('Silme başarısız: ' + result.error)
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
                    <h2 className="text-xl font-bold text-gray-900">{userId ? 'Öğrenci Projeleri' : 'Projelerim'}</h2>
                    <p className="text-sm text-gray-500">{userId ? 'Öğrencinin aktif süreçleri.' : 'Karmaşık hedeflerinizi yönetin.'}</p>
                </div>
                {!editingProject && !isCreating && (
                    <button
                        onClick={() => setIsCreating(true)}
                        className="p-2 bg-indigo-600 text-white rounded-xl shadow-lg shadow-indigo-200 hover:bg-indigo-700 transition"
                    >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                    </button>
                )}
            </div>

            {(isCreating || editingProject) && (
                <form onSubmit={editingProject ? handleUpdateProject : handleCreateProject} className="mb-6 bg-indigo-50 p-4 rounded-2xl border border-indigo-100 animate-in zoom-in-95 duration-200">
                    <h3 className="text-xs font-bold text-indigo-800 uppercase mb-2">
                        {editingProject ? 'Projeyi Düzenle' : 'Yeni Proje'}
                    </h3>
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
                            {editingProject ? 'Kaydet' : 'Oluştur'}
                        </button>
                        <button
                            type="button"
                            onClick={() => {
                                setIsCreating(false)
                                setEditingProject(null)
                                setName('')
                            }}
                            className="px-4 py-2 bg-white text-gray-600 rounded-lg text-sm font-medium hover:bg-gray-100 transition"
                        >
                            Vazgeç
                        </button>
                    </div>
                </form>
            )}

            <div className="grid grid-cols-1 gap-3">
                {projects.map(project => (
                    <div
                        key={project.id}
                        onClick={() => !editingProject && !isCreating && onProjectSelect(project)}
                        className={`flex items-center justify-between p-5 bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md hover:border-indigo-200 transition-all text-left group cursor-pointer ${editingProject?.id === project.id ? 'ring-2 ring-indigo-500' : ''}`}
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

                        <div className="flex items-center gap-2">
                            <button
                                onClick={(e) => {
                                    e.stopPropagation()
                                    startEdit(project)
                                }}
                                className="p-2 text-gray-300 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition"
                                title="Projeyi Düzenle"
                            >
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                </svg>
                            </button>
                            <button
                                onClick={(e) => {
                                    e.stopPropagation()
                                    handleDelete(project.id)
                                }}
                                className="p-2 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition"
                                title="Projeyi Sil"
                            >
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                            </button>
                            <div className="w-px h-6 bg-gray-200 mx-1"></div>
                            <svg className="w-5 h-5 text-gray-300 group-hover:text-indigo-400 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                        </div>
                    </div>
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
