'use client'

import { useState, useEffect } from 'react'
import { Project } from '@/app/actions/projects'
import { createClient } from '@/lib/supabase/client'

interface ProjectDetailsViewProps {
    project: Project
    onBack: () => void
}

type TabType = 'overview' | 'timeline' | 'tasks' | 'resources' | 'notes'

export default function ProjectDetailsView({ project, onBack }: ProjectDetailsViewProps) {
    const [activeTab, setActiveTab] = useState<TabType>('overview')
    const [tasks, setTasks] = useState<any[]>([])
    const [loading, setLoading] = useState(false)

    // Load tasks when Tasks tab is active
    useEffect(() => {
        if (activeTab === 'tasks') {
            loadTasks()
        }
    }, [activeTab, project.id])

    const loadTasks = async () => {
        setLoading(true)
        const supabase = createClient()

        // Fetch tasks where due_date matches project ID (we'll use a special convention)
        // OR we can add a project_id field to tasks metadata
        const { data, error } = await supabase
            .from('tasks')
            .select('*')
            .eq('metadata->>project_id', project.id)
            .order('sort_order', { ascending: true })

        if (!error && data) {
            setTasks(data)
        }
        setLoading(false)
    }

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
                {activeTab === 'overview' && <OverviewTab project={project} tasks={tasks} />}
                {activeTab === 'timeline' && <TimelineTab project={project} />}
                {activeTab === 'tasks' && <TasksTab project={project} tasks={tasks} loading={loading} onRefresh={loadTasks} />}
                {activeTab === 'resources' && <ResourcesTab project={project} />}
                {activeTab === 'notes' && <NotesTab project={project} />}
            </div>
        </div>
    )
}

// Overview Tab Component
function OverviewTab({ project, tasks }: { project: Project; tasks: any[] }) {
    const progress = project.metadata?.progress_percentage || 0
    const completedTasks = tasks.filter(t => t.is_completed).length
    const totalTasks = tasks.length
    const pendingTasks = totalTasks - completedTasks

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
                <StatCard icon="✓" label="Tamamlanan" value={completedTasks.toString()} color="emerald" />
                <StatCard icon="⏳" label="Devam Eden" value="0" color="indigo" />
                <StatCard icon="📅" label="Bekleyen" value={pendingTasks.toString()} color="amber" />
                <StatCard icon="🎯" label="Toplam" value={totalTasks.toString()} color="gray" />
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
function TasksTab({ project, tasks, loading, onRefresh }: { project: Project; tasks: any[]; loading: boolean; onRefresh: () => void }) {
    const [isAddingMilestone, setIsAddingMilestone] = useState(false)
    const [milestoneName, setMilestoneName] = useState('')

    const handleAddMilestone = async () => {
        if (!milestoneName.trim()) return

        const supabase = createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return

        // Get 'todo' task type ID
        const { data: taskType } = await supabase
            .from('task_types')
            .select('id')
            .eq('slug', 'todo')
            .single()

        if (!taskType) {
            alert('Task type not found')
            return
        }

        const { error } = await supabase
            .from('tasks')
            .insert({
                user_id: user.id,
                title: milestoneName,
                task_type_id: taskType.id,
                created_by: user.id,
                metadata: {
                    project_id: project.id,
                    is_project: true,
                    project_type: 'milestone'
                },
                is_completed: false,
                sort_order: tasks.length
            })

        if (!error) {
            setMilestoneName('')
            setIsAddingMilestone(false)
            onRefresh()
        } else {
            alert('Milestone oluşturulamadı: ' + error.message)
        }
    }

    // Build tree structure
    const milestones = tasks.filter(t => t.metadata?.project_type === 'milestone' && !t.parent_id)
    const tasksByMilestone = tasks.filter(t => t.metadata?.project_type === 'task')

    return (
        <div className="space-y-4">
            {/* Add Milestone Button */}
            <div className="flex justify-between items-center">
                <h2 className="text-lg font-bold text-gray-900">Kilometre Taşları</h2>
                {!isAddingMilestone && (
                    <button
                        onClick={() => setIsAddingMilestone(true)}
                        className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition"
                    >
                        + Kilometre Taşı Ekle
                    </button>
                )}
            </div>

            {/* Add Milestone Form */}
            {isAddingMilestone && (
                <div className="bg-indigo-50 p-4 rounded-xl border border-indigo-100">
                    <input
                        type="text"
                        placeholder="Kilometre Taşı Adı (Örn: Database Tasarımı)"
                        value={milestoneName}
                        onChange={(e) => setMilestoneName(e.target.value)}
                        className="w-full p-3 rounded-lg border-0 shadow-sm focus:ring-2 focus:ring-indigo-500 mb-3"
                        autoFocus
                    />
                    <div className="flex gap-2">
                        <button
                            onClick={handleAddMilestone}
                            className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition"
                        >
                            Oluştur
                        </button>
                        <button
                            onClick={() => {
                                setIsAddingMilestone(false)
                                setMilestoneName('')
                            }}
                            className="px-4 py-2 bg-white text-gray-600 rounded-lg text-sm font-medium hover:bg-gray-100 transition"
                        >
                            Vazgeç
                        </button>
                    </div>
                </div>
            )}

            {/* Milestones List */}
            {loading ? (
                <div className="flex justify-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
                </div>
            ) : milestones.length === 0 ? (
                <div className="bg-white rounded-2xl p-12 border-2 border-dashed border-gray-200 text-center">
                    <div className="text-4xl mb-3">🎯</div>
                    <p className="text-gray-500 text-sm">Henüz kilometre taşı eklenmemiş</p>
                </div>
            ) : (
                <div className="space-y-3">
                    {milestones.map((milestone) => (
                        <MilestoneCard
                            key={milestone.id}
                            milestone={milestone}
                            tasks={tasksByMilestone.filter(t => t.parent_id === milestone.id)}
                            projectId={project.id}
                            onRefresh={onRefresh}
                        />
                    ))}
                </div>
            )}
        </div>
    )
}

// Milestone Card Component
function MilestoneCard({ milestone, tasks, projectId, onRefresh }: { milestone: any; tasks: any[]; projectId: string; onRefresh: () => void }) {
    const [isExpanded, setIsExpanded] = useState(true)
    const [isAddingTask, setIsAddingTask] = useState(false)
    const [taskName, setTaskName] = useState('')

    const completedTasks = tasks.filter(t => t.is_completed).length
    const progress = tasks.length > 0 ? Math.round((completedTasks / tasks.length) * 100) : 0

    const handleAddTask = async () => {
        if (!taskName.trim()) return

        const supabase = createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return

        // Get 'todo' task type ID
        const { data: taskType } = await supabase
            .from('task_types')
            .select('id')
            .eq('slug', 'todo')
            .single()

        if (!taskType) {
            alert('Task type not found')
            return
        }

        const { error } = await supabase
            .from('tasks')
            .insert({
                user_id: user.id,
                title: taskName,
                parent_id: milestone.id,
                task_type_id: taskType.id,
                created_by: user.id,
                metadata: {
                    project_id: projectId,
                    is_project: true,
                    project_type: 'task',
                    status: 'todo'
                },
                is_completed: false,
                sort_order: tasks.length
            })

        if (!error) {
            setTaskName('')
            setIsAddingTask(false)
            onRefresh()
        } else {
            alert('Görev oluşturulamadı: ' + error.message)
        }
    }

    const handleToggleTask = async (taskId: string, isCompleted: boolean) => {
        const supabase = createClient()
        await supabase
            .from('tasks')
            .update({ is_completed: !isCompleted })
            .eq('id', taskId)

        onRefresh()
    }

    return (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            {/* Milestone Header */}
            <div className="p-4 bg-gradient-to-r from-indigo-50 to-purple-50 border-b border-indigo-100">
                <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => setIsExpanded(!isExpanded)}
                            className="p-1 hover:bg-white/50 rounded transition"
                        >
                            <svg className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-90' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                        </button>
                        <h3 className="text-base font-bold text-gray-900">{milestone.title}</h3>
                    </div>
                    <span className="text-xs font-bold text-indigo-600">%{progress}</span>
                </div>
                <div className="h-1.5 w-full bg-white/50 rounded-full overflow-hidden ml-7">
                    <div
                        className="h-full bg-indigo-600 rounded-full transition-all duration-300"
                        style={{ width: `${progress}%` }}
                    ></div>
                </div>
            </div>

            {/* Tasks List */}
            {isExpanded && (
                <div className="p-4">
                    {tasks.length === 0 && !isAddingTask ? (
                        <div className="text-center py-6 text-gray-400 text-sm">
                            Henüz görev eklenmemiş
                        </div>
                    ) : (
                        <div className="space-y-2 mb-3">
                            {tasks.map((task) => (
                                <div key={task.id} className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded-lg transition">
                                    <input
                                        type="checkbox"
                                        checked={task.is_completed}
                                        onChange={() => handleToggleTask(task.id, task.is_completed)}
                                        className="w-4 h-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                                    />
                                    <span className={`text-sm flex-1 ${task.is_completed ? 'line-through text-gray-400' : 'text-gray-900'}`}>
                                        {task.title}
                                    </span>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Add Task Form */}
                    {isAddingTask ? (
                        <div className="bg-gray-50 p-3 rounded-lg">
                            <input
                                type="text"
                                placeholder="Görev adı..."
                                value={taskName}
                                onChange={(e) => setTaskName(e.target.value)}
                                className="w-full p-2 rounded border-0 shadow-sm focus:ring-2 focus:ring-indigo-500 mb-2 text-sm"
                                autoFocus
                            />
                            <div className="flex gap-2">
                                <button
                                    onClick={handleAddTask}
                                    className="px-3 py-1.5 bg-indigo-600 text-white rounded text-xs font-medium hover:bg-indigo-700 transition"
                                >
                                    Ekle
                                </button>
                                <button
                                    onClick={() => {
                                        setIsAddingTask(false)
                                        setTaskName('')
                                    }}
                                    className="px-3 py-1.5 bg-white text-gray-600 rounded text-xs font-medium hover:bg-gray-100 transition"
                                >
                                    Vazgeç
                                </button>
                            </div>
                        </div>
                    ) : (
                        <button
                            onClick={() => setIsAddingTask(true)}
                            className="text-sm text-indigo-600 hover:text-indigo-700 font-medium"
                        >
                            + Görev Ekle
                        </button>
                    )}
                </div>
            )}
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
