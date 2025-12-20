'use client'

import { useState } from 'react'
import ProjectListView from './ProjectListView'
import ProjectDetailsView from './ProjectDetailsView'
import { Project } from '@/app/actions/projects'

interface ToolCardProps {
    title: string
    description: string
    icon: string
    color: string
    onClick: () => void
}

function ToolCard({ title, description, icon, color, onClick }: ToolCardProps) {
    return (
        <button
            onClick={onClick}
            className="flex flex-col items-start p-5 bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md hover:border-indigo-200 transition-all text-left w-full group"
        >
            <div className={`w-12 h-12 ${color} rounded-xl flex items-center justify-center text-2xl mb-4 group-hover:scale-110 transition-transform`}>
                {icon}
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-1">{title}</h3>
            <p className="text-sm text-gray-500 leading-relaxed">{description}</p>
        </button>
    )
}

export default function LifeHubView() {
    const [activeTool, setActiveTool] = useState<string | null>(null)
    const [selectedProject, setSelectedProject] = useState<Project | null>(null)

    const tools = [
        {
            id: 'projects',
            title: 'Projeler (Gantt)',
            description: 'Karmaşık görevleri zaman çizelgesi üzerinde planlayın ve alt görevlerle yönetin.',
            icon: '📊',
            color: 'bg-indigo-50 text-indigo-600'
        },
        {
            id: 'inventory',
            title: 'Envanter & Stok',
            description: 'Ev eşyaları, araç bakımı ve ilaç stoklarını takip edin.',
            icon: '📦',
            color: 'bg-amber-50 text-amber-600'
        },
        {
            id: 'health',
            title: 'Sağlık & Diyet',
            description: 'Beslenme planları ve sağlık metriklerini analiz edin.',
            icon: '🍎',
            color: 'bg-emerald-50 text-emerald-600'
        },
        {
            id: 'finance',
            title: 'Bütçe & Alışveriş',
            description: 'Alışveriş listeleri ve kişisel harcamaları yönetin.',
            icon: '💰',
            color: 'bg-blue-50 text-blue-600'
        }
    ]

    if (activeTool === 'projects') {
        if (selectedProject) {
            return (
                <ProjectDetailsView
                    project={selectedProject}
                    onBack={() => setSelectedProject(null)}
                />
            )
        }

        return (
            <div className="flex flex-col h-full">
                <div className="flex items-center gap-3 mb-6">
                    <button
                        onClick={() => setActiveTool(null)}
                        className="p-2 hover:bg-gray-100 rounded-lg transition"
                    >
                        <svg className="w-5 h-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                    </button>
                    <h2 className="text-xl font-bold text-gray-900">Projelerim</h2>
                </div>

                <ProjectListView onProjectSelect={(project) => setSelectedProject(project)} />
            </div>
        )
    }

    return (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="mb-8">
                <h2 className="text-2xl font-extrabold text-gray-900 mb-2">Life Hub</h2>
                <p className="text-gray-500">Yaşam işletim sisteminizin tüm modülleri burada.</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {tools.map(tool => (
                    <ToolCard
                        key={tool.id}
                        {...tool}
                        onClick={() => tool.id === 'projects' ? setActiveTool('projects') : alert(`${tool.title} modülü yakında eklenecek.`)}
                    />
                ))}
            </div>

            <div className="mt-8 p-6 bg-indigo-600 rounded-3xl text-white overflow-hidden relative shadow-xl shadow-indigo-200">
                <div className="relative z-10">
                    <h3 className="text-lg font-bold mb-2">AI Analizi</h3>
                    <p className="text-sm text-indigo-100 opacity-90 leading-relaxed mb-4">
                        Tüm modüllerdeki verileriniz toplandığında, AI asistanınız hayatınızdaki gizli bağlantıları bulmanıza yardımcı olacak.
                    </p>
                    <button className="px-4 py-2 bg-white/20 hover:bg-white/30 backdrop-blur-md rounded-xl text-sm font-medium transition">
                        Yakında Keşfet
                    </button>
                </div>
                <div className="absolute -right-8 -bottom-8 text-8xl opacity-10 blur-sm pointer-events-none">
                    🧠
                </div>
            </div>
        </div>
    )
}
