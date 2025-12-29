'use client'

import { useState, useEffect } from 'react'
import { getProjects, Project } from '@/app/actions/projects'
import { ShoppingCart, Pill } from 'lucide-react'

interface SharedProjectsListProps {
    userId: string
    onSelect: (project: Project) => void
}

export default function SharedProjectsList({ userId, onSelect }: SharedProjectsListProps) {
    const [projects, setProjects] = useState<Project[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        loadProjects()
    }, [userId])

    const loadProjects = async () => {
        setLoading(true)
        const { data } = await getProjects(userId, 'personal')
        if (data) {
            // Filter specialized projects
            const shared = data.filter(p =>
                (p.settings?.type === 'shopping' || p.settings?.module === 'shopping') ||
                (p.settings?.type === 'medicine' || p.settings?.module === 'medicine')
            )
            setProjects(shared)
        }
        setLoading(false)
    }

    if (loading) return <div className="text-xs text-gray-400">Yükleniyor...</div>

    if (projects.length === 0) {
        return (
            <div className="bg-white border-2 border-dashed border-gray-200 rounded-xl p-6 flex flex-col items-center justify-center text-gray-400 gap-2">
                <span className="text-2xl opacity-50">🛒</span>
                <span className="text-xs font-bold">Henüz ortak liste yok</span>
            </div>
        )
    }

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {projects.map(project => (
                <button
                    key={project.id}
                    onClick={() => onSelect(project)}
                    className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm hover:border-indigo-300 hover:shadow-md transition text-left group"
                >
                    <div className="flex items-center justify-between mb-2">
                        <div className={`p-2 rounded-lg ${project.settings?.type === 'medicine' ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'
                            }`}>
                            {project.settings?.type === 'medicine' ? <Pill size={18} /> : <ShoppingCart size={18} />}
                        </div>
                        <span className="text-[10px] uppercase font-bold text-gray-400">
                            {new Date(project.created_at).toLocaleDateString()}
                        </span>
                    </div>
                    <h4 className="font-bold text-gray-800 group-hover:text-indigo-600 transition truncate">
                        {project.name}
                    </h4>
                    <p className="text-xs text-gray-500 line-clamp-1">
                        {project.description || 'Açıklama yok'}
                    </p>
                </button>
            ))}
        </div>
    )
}
