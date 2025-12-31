'use client'

import { useState } from 'react'
import { Project } from '@/app/actions/projects'

interface ProjectDetailsViewProps {
    project: Project
    onBack: () => void
}

type TabType = 'overview' | 'timeline' | 'tasks' | 'resources' | 'notes'

export default function ProjectDetailsView({ project, onBack }: ProjectDetailsViewProps) {
    const [activeTab, setActiveTab] = useState<TabType>('overview')

    const tabs = [
        { id: 'overview' as TabType, label: 'Genel Bakış', icon: '📊' },
        { id: 'timeline' as TabType, label: 'Zaman Çizelgesi', icon: '📅' },
        { id: 'tasks' as TabType, label: 'Görevler', icon: '✓' },
        { id: 'resources' as TabType, label: 'Kaynaklar', icon: '📁' },
        { id: 'notes' as TabType, label: 'Notlar', icon: '📝' }
    ]

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
                <div className="p-4">
                    {/* Back Button & Title */}
                    <div className="flex items-center gap-3 mb-4">
                        <button
                            onClick={onBack}
                            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                            title="Geri Dön"
                        >
                            <svg className="w-5 h-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                            </svg>
                        </button>
                        <div className="flex-1">
                            <h1 className="text-2xl font-black text-gray-900">{project.name}</h1>
                            <div className="flex items-center gap-2 mt-1">
                                {/* Status Badge */}
                                <span className={`text-[9px] font-black uppercase tracking-tighter px-2 py-0.5 rounded-full ${project.metadata?.status === 'completed' ? 'bg-emerald-100 text-emerald-700' :
                                        project.metadata?.status === 'active' ? 'bg-indigo-100 text-indigo-700' :
                                            project.metadata?.status === 'on-hold' ? 'bg-amber-100 text-amber-700' :
                                                'bg-gray-100 text-gray-600'
                                    }`}>
                                    {project.metadata?.status === 'completed' ? '✓ Tamamlandı' :
                                        project.metadata?.status === 'active' ? '● Aktif' :
                                            project.metadata?.status === 'on-hold' ? '⏸ Beklemede' :
                                                '○ Planlama'}
                                </span>

                                {/* Priority Badge */}
                                {project.metadata?.priority && (
                                    <span className={`text-[9px] font-black uppercase tracking-tighter px-2 py-0.5 rounded-full ${project.metadata.priority === 'critical' ? 'bg-red-100 text-red-700' :
                                            project.metadata.priority === 'high' ? 'bg-orange-100 text-orange-700' :
                                                project.metadata.priority === 'medium' ? 'bg-blue-100 text-blue-700' :
                                                    'bg-gray-100 text-gray-600'
                                        }`}>
                                        {project.metadata.priority === 'critical' ? '🔥 Kritik' :
                                            project.metadata.priority === 'high' ? '⬆ Yüksek' :
                                                project.metadata.priority === 'medium' ? '➡ Orta' :
                                                    '⬇ Düşük'}
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Tab Bar */}
                    <div className="flex gap-1 overflow-x-auto pb-1">
                        {tabs.map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-bold whitespace-nowrap transition-all ${activeTab === tab.id
                                        ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200'
                                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                    }`}
                            >
                                <span>{tab.icon}</span>
                                <span>{tab.label}</span>
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Tab Content */}
            <div className="p-4">
                {activeTab === 'overview' && <OverviewTab project={project} />}
                {activeTab === 'timeline' && <TimelineTab project={project} />}
                {activeTab === 'tasks' && <TasksTab project={project} />}
                {activeTab === 'resources' && <ResourcesTab project={project} />}
                {activeTab === 'notes' && <NotesTab project={project} />}
            </div>
        </div>
    )
}

// Overview Tab Component
function OverviewTab({ project }: { project: Project }) {
    const progress = project.metadata?.progress_percentage || 0

    return (
        <div className="space-y-6">
            {/* Progress Card */}
            <div className="bg-white rounded-2xl p-6 border border-gray-200">
                <h2 className="text-lg font-bold text-gray-900 mb-4">İlerleme</h2>
                <div className="space-y-3">
                    <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-gray-600">Tamamlanma Oranı</span>
                        <span className="text-2xl font-black text-indigo-600">%{progress}</span>
                    </div>
                    <div className="h-3 w-full bg-gray-100 rounded-full overflow-hidden">
                        <div
                            className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full transition-all duration-500"
                            style={{ width: `${progress}%` }}
                        ></div>
                    </div>
                </div>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <StatCard icon="✓" label="Tamamlanan" value="0" color="emerald" />
                <StatCard icon="⏳" label="Devam Eden" value="0" color="indigo" />
                <StatCard icon="📅" label="Bekleyen" value="0" color="amber" />
                <StatCard icon="🎯" label="Toplam" value="0" color="gray" />
            </div>

            {/* Project Info */}
            <div className="bg-white rounded-2xl p-6 border border-gray-200">
                <h2 className="text-lg font-bold text-gray-900 mb-4">Proje Bilgileri</h2>
                <div className="space-y-3">
                    {project.description && (
                        <InfoRow label="Açıklama" value={project.description} />
                    )}
                    <InfoRow label="Oluşturulma" value={new Date(project.created_at).toLocaleDateString('tr-TR')} />
                    {project.start_date && (
                        <InfoRow label="Başlangıç" value={new Date(project.start_date).toLocaleDateString('tr-TR')} />
                    )}
                    {project.end_date && (
                        <InfoRow label="Bitiş" value={new Date(project.end_date).toLocaleDateString('tr-TR')} />
                    )}
                </div>
            </div>
        </div>
    )
}

// Timeline Tab Component
function TimelineTab({ project }: { project: Project }) {
    return (
        <div className="bg-white rounded-2xl p-6 border border-gray-200 min-h-[400px] flex items-center justify-center">
            <div className="text-center">
                <div className="text-6xl mb-4">📅</div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">Gantt Chart</h3>
                <p className="text-gray-500">Week 3'te eklenecek</p>
            </div>
        </div>
    )
}

// Tasks Tab Component
function TasksTab({ project }: { project: Project }) {
    return (
        <div className="bg-white rounded-2xl p-6 border border-gray-200 min-h-[400px] flex items-center justify-center">
            <div className="text-center">
                <div className="text-6xl mb-4">✓</div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">Görev Yönetimi</h3>
                <p className="text-gray-500">Milestone ve task yapısı eklenecek</p>
            </div>
        </div>
    )
}

// Resources Tab Component
function ResourcesTab({ project }: { project: Project }) {
    return (
        <div className="bg-white rounded-2xl p-6 border border-gray-200 min-h-[400px] flex items-center justify-center">
            <div className="text-center">
                <div className="text-6xl mb-4">📁</div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">Kaynaklar</h3>
                <p className="text-gray-500">Week 4'te eklenecek</p>
            </div>
        </div>
    )
}

// Notes Tab Component
function NotesTab({ project }: { project: Project }) {
    return (
        <div className="bg-white rounded-2xl p-6 border border-gray-200 min-h-[400px] flex items-center justify-center">
            <div className="text-center">
                <div className="text-6xl mb-4">📝</div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">Notlar</h3>
                <p className="text-gray-500">Week 5'te eklenecek</p>
            </div>
        </div>
    )
}

// Helper Components
function StatCard({ icon, label, value, color }: { icon: string; label: string; value: string; color: string }) {
    const colorClasses = {
        emerald: 'bg-emerald-50 text-emerald-700',
        indigo: 'bg-indigo-50 text-indigo-700',
        amber: 'bg-amber-50 text-amber-700',
        gray: 'bg-gray-50 text-gray-700'
    }

    return (
        <div className={`${colorClasses[color as keyof typeof colorClasses]} rounded-xl p-4`}>
            <div className="text-2xl mb-2">{icon}</div>
            <div className="text-2xl font-black mb-1">{value}</div>
            <div className="text-xs font-bold opacity-70">{label}</div>
        </div>
    )
}

function InfoRow({ label, value }: { label: string; value: string }) {
    return (
        <div className="flex items-start justify-between py-2 border-b border-gray-100 last:border-0">
            <span className="text-sm font-medium text-gray-600">{label}</span>
            <span className="text-sm font-bold text-gray-900 text-right">{value}</span>
        </div>
    )
}
