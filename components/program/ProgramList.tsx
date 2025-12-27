'use client'

import { useState, useEffect } from 'react'
import { getProjects } from '@/app/actions/projects'

interface Program {
    id: string
    name: string
    description?: string | null
    status: string
    start_date?: string | null
    end_date?: string | null
    settings: any
    created_at: string
}

interface ProgramListProps {
    moduleType?: string
    onProgramClick?: (program: Program) => void
}

export default function ProgramList({ moduleType, onProgramClick }: ProgramListProps) {
    const [programs, setPrograms] = useState<Program[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        loadPrograms()
    }, [moduleType])

    const loadPrograms = async () => {
        setLoading(true)
        const result = await getProjects()

        if (result.data) {
            // Filter by module type if specified
            const filtered = moduleType
                ? result.data.filter((p: any) => p.settings?.module_type === moduleType)
                : result.data

            setPrograms(filtered)
        }
        setLoading(false)
    }

    if (loading) {
        return (
            <div className="text-center py-12">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
                <p className="text-gray-500 mt-4">Programlar yükleniyor...</p>
            </div>
        )
    }

    if (programs.length === 0) {
        return (
            <div className="text-center py-12 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
                <p className="text-gray-400 text-sm">Henüz program yok.</p>
            </div>
        )
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {programs.map(program => (
                <ProgramCard
                    key={program.id}
                    program={program}
                    onClick={() => onProgramClick?.(program)}
                />
            ))}
        </div>
    )
}

interface ProgramCardProps {
    program: Program
    onClick?: () => void
}

function ProgramCard({ program, onClick }: ProgramCardProps) {
    const moduleType = program.settings?.module_type || 'general'
    const moduleIcons: Record<string, string> = {
        nutrition: '🥗',
        music: '🎵',
        exam: '📚',
        general: '📋',
        cleaning: '🧹'
    }

    const moduleColors: Record<string, string> = {
        nutrition: 'from-purple-50 to-white border-purple-200',
        music: 'from-pink-50 to-white border-pink-200',
        exam: 'from-blue-50 to-white border-blue-200',
        general: 'from-gray-50 to-white border-gray-200',
        cleaning: 'from-green-50 to-white border-green-200'
    }

    const icon = moduleIcons[moduleType] || '📋'
    const colorClass = moduleColors[moduleType] || moduleColors.general

    return (
        <div
            onClick={onClick}
            className={`p-4 bg-gradient-to-br ${colorClass} rounded-2xl hover:shadow-md transition cursor-pointer`}
        >
            <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                    <h3 className="font-bold text-gray-900 mb-1">{program.name}</h3>
                    <p className="text-xs text-gray-500">
                        {program.start_date
                            ? new Date(program.start_date).toLocaleDateString('tr-TR')
                            : new Date(program.created_at).toLocaleDateString('tr-TR')}
                    </p>
                </div>
                <span className="text-2xl">{icon}</span>
            </div>

            {program.description && (
                <p className="text-xs text-gray-600 mb-3 line-clamp-2">
                    {program.description}
                </p>
            )}

            <div className="flex items-center justify-between text-xs">
                <span className={`px-2 py-1 rounded-lg font-bold ${program.status === 'active'
                    ? 'bg-green-100 text-green-700'
                    : 'bg-gray-100 text-gray-600'
                    }`}>
                    {program.status === 'active' ? '✓ Aktif' : 'Tamamlandı'}
                </span>

                {program.settings?.duration_days && (
                    <span className="text-gray-500">
                        {program.settings.duration_days} gün
                    </span>
                )}
            </div>
        </div>
    )
}
