'use client'

import { useState, useEffect, useMemo } from 'react'
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
                {activeTab === 'timeline' && <TimelineTab project={project} tasks={tasks} />}
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
function TimelineTab({ project, tasks }: { project: Project; tasks: any[] }) {
    // Filter milestones and their tasks
    const milestones = tasks.filter(t => t.metadata?.project_type === 'milestone' && !t.parent_id)
    const allTasks = tasks.filter(t => t.metadata?.project_type === 'task')

    // Calculate date range
    const dateRange = useMemo(() => {
        if (milestones.length === 0) return null

        const allDates = [...milestones, ...allTasks]
            .map(t => t.due_date || t.created_at)
            .filter(Boolean)
            .map(d => new Date(d))

        if (allDates.length === 0) {
            const start = new Date()
            const end = new Date()
            end.setMonth(end.getMonth() + 3)
            return { start, end }
        }

        const start = new Date(Math.min(...allDates.map(d => d.getTime())))
        const end = new Date(Math.max(...allDates.map(d => d.getTime())))

        start.setDate(start.getDate() - 7)
        end.setDate(end.getDate() + 7)

        return { start, end }
    }, [milestones, allTasks])

    // Generate month columns
    const monthColumns = useMemo(() => {
        if (!dateRange) return []

        const columns = []
        const current = new Date(dateRange.start)
        current.setDate(1)

        while (current <= dateRange.end) {
            columns.push({
                date: new Date(current),
                label: current.toLocaleDateString('tr-TR', { month: 'short', year: 'numeric' })
            })
            current.setMonth(current.getMonth() + 1)
        }

        return columns
    }, [dateRange])

    const getBarStyle = (startDate: string | null, endDate: string | null) => {
        if (!dateRange || !startDate) return { display: 'none' }

        const start = new Date(startDate)
        const end = endDate ? new Date(endDate) : new Date(start.getTime() + 7 * 24 * 60 * 60 * 1000)

        const totalDuration = dateRange.end.getTime() - dateRange.start.getTime()
        const barStart = start.getTime() - dateRange.start.getTime()
        const barDuration = end.getTime() - start.getTime()

        const left = (barStart / totalDuration) * 100
        const width = (barDuration / totalDuration) * 100

        return {
            left: `${Math.max(0, left)}%`,
            width: `${Math.min(100 - left, width)}%`
        }
    }

    const getTodayPosition = () => {
        if (!dateRange) return null

        const today = new Date()
        const totalDuration = dateRange.end.getTime() - dateRange.start.getTime()
        const todayOffset = today.getTime() - dateRange.start.getTime()

        if (todayOffset < 0 || todayOffset > totalDuration) return null

        return (todayOffset / totalDuration) * 100
    }

    const todayPosition = getTodayPosition()

    if (!dateRange || milestones.length === 0) {
        return (
            <div className="bg-white rounded-2xl p-12 border border-gray-200 text-center">
                <div className="text-6xl mb-4">📅</div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">Henüz Kilometre Taşı Yok</h3>
                <p className="text-gray-500">Gantt chart görüntülemek için Görevler tab'ından kilometre taşları ekleyin</p>
            </div>
        )
    }

    return (
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
            <div className="p-4 border-b border-gray-200 bg-gray-50">
                <h3 className="text-lg font-bold text-gray-900">Zaman Çizelgesi</h3>
                <p className="text-sm text-gray-500 mt-1">
                    {dateRange.start.toLocaleDateString('tr-TR')} - {dateRange.end.toLocaleDateString('tr-TR')}
                </p>
            </div>

            <div className="overflow-x-auto">
                <div className="min-w-[800px]">
                    <div className="flex border-b border-gray-200 bg-gray-50">
                        <div className="w-48 p-3 font-bold text-sm text-gray-700 border-r border-gray-200">Görev</div>
                        <div className="flex-1 flex">
                            {monthColumns.map((col, idx) => (
                                <div key={idx} className="flex-1 p-3 text-center text-sm font-bold text-gray-700 border-r border-gray-200 last:border-r-0">
                                    {col.label}
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="relative">
                        {todayPosition !== null && (
                            <div className="absolute top-0 bottom-0 w-0.5 bg-red-500 z-10 pointer-events-none" style={{ left: `calc(12rem + ${todayPosition}%)` }}>
                                <div className="absolute -top-1 -left-2 w-4 h-4 bg-red-500 rounded-full"></div>
                            </div>
                        )}

                        {milestones.map((milestone) => {
                            const milestoneTasks = allTasks.filter(t => t.parent_id === milestone.id)

                            return (
                                <div key={milestone.id} className="border-b border-gray-100 last:border-b-0">
                                    <div className="flex items-center hover:bg-gray-50 transition-colors">
                                        <div className="w-48 p-3 border-r border-gray-200">
                                            <div className="font-bold text-sm text-gray-900 truncate">📌 {milestone.title}</div>
                                        </div>
                                        <div className="flex-1 relative h-12 px-2">
                                            <div
                                                className="absolute top-1/2 -translate-y-1/2 h-6 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-lg shadow-md flex items-center px-2"
                                                style={getBarStyle(milestone.created_at, milestone.due_date)}
                                            >
                                                <span className="text-[10px] font-bold text-white truncate">{milestone.title}</span>
                                            </div>
                                        </div>
                                    </div>

                                    {milestoneTasks.map((task) => (
                                        <div key={task.id} className="flex items-center hover:bg-gray-50 transition-colors bg-gray-50/50">
                                            <div className="w-48 p-3 border-r border-gray-200 pl-8">
                                                <div className="text-sm text-gray-700 truncate flex items-center gap-2">
                                                    <input type="checkbox" checked={task.is_completed} readOnly className="w-3 h-3 rounded border-gray-300 text-indigo-600" />
                                                    {task.title}
                                                </div>
                                            </div>
                                            <div className="flex-1 relative h-10 px-2">
                                                {task.due_date && (
                                                    <div
                                                        className={`absolute top-1/2 -translate-y-1/2 h-4 rounded flex items-center px-2 ${task.is_completed ? 'bg-emerald-200 border border-emerald-400' : 'bg-gray-200 border border-gray-400'
                                                            }`}
                                                        style={getBarStyle(task.created_at, task.due_date)}
                                                    >
                                                        <span className="text-[9px] font-bold text-gray-700 truncate">{task.title}</span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )
                        })}
                    </div>
                </div>
            </div>

            <div className="p-4 border-t border-gray-200 bg-gray-50 flex items-center gap-6 text-xs">
                <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-gradient-to-r from-indigo-500 to-purple-500 rounded"></div>
                    <span className="text-gray-600">Kilometre Taşı</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-gray-200 border border-gray-400 rounded"></div>
                    <span className="text-gray-600">Görev</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-emerald-200 border border-emerald-400 rounded"></div>
                    <span className="text-gray-600">Tamamlandı</span>
                </div>
                {todayPosition !== null && (
                    <div className="flex items-center gap-2">
                        <div className="w-0.5 h-4 bg-red-500"></div>
                        <span className="text-gray-600">Bugün</span>
                    </div>
                )}
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
    const [resources, setResources] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [isAdding, setIsAdding] = useState(false)
    const [resourceType, setResourceType] = useState<'link' | 'document' | 'note'>('link')
    const [name, setName] = useState('')
    const [url, setUrl] = useState('')
    const [content, setContent] = useState('')

    useEffect(() => {
        loadResources()
    }, [project.id])

    const loadResources = async () => {
        setLoading(true)
        const supabase = createClient()
        const { data, error } = await supabase
            .from('project_resources')
            .select('*')
            .eq('project_id', project.id)
            .order('created_at', { ascending: false })

        if (!error && data) {
            setResources(data)
        }
        setLoading(false)
    }

    const handleAddResource = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!name.trim()) return

        const supabase = createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return

        const { error } = await supabase
            .from('project_resources')
            .insert({
                project_id: project.id,
                name: name.trim(),
                type: resourceType,
                url: resourceType === 'link' ? url : null,
                content: resourceType === 'note' ? content : null,
                created_by: user.id
            })

        if (!error) {
            setName('')
            setUrl('')
            setContent('')
            setIsAdding(false)
            loadResources()
        } else {
            alert('Kaynak eklenemedi: ' + error.message)
        }
    }

    const handleDelete = async (id: string) => {
        if (!confirm('Bu kaynağı silmek istediğinize emin misiniz?')) return

        const supabase = createClient()
        const { error } = await supabase
            .from('project_resources')
            .delete()
            .eq('id', id)

        if (!error) {
            loadResources()
        }
    }

    const getIcon = (type: string) => {
        switch (type) {
            case 'link': return '🔗'
            case 'document': return '📄'
            case 'note': return '📝'
            default: return '📎'
        }
    }

    return (
        <div className="space-y-4">
            {/* Add Resource Button */}
            <div className="flex justify-between items-center">
                <h2 className="text-lg font-bold text-gray-900">Kaynaklar</h2>
                {!isAdding && (
                    <button
                        onClick={() => setIsAdding(true)}
                        className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition"
                    >
                        + Kaynak Ekle
                    </button>
                )}
            </div>

            {/* Add Resource Form */}
            {isAdding && (
                <div className="bg-indigo-50 p-4 rounded-xl border border-indigo-100">
                    <form onSubmit={handleAddResource}>
                        {/* Resource Type Selection */}
                        <div className="flex gap-2 mb-3">
                            <button
                                type="button"
                                onClick={() => setResourceType('link')}
                                className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition ${resourceType === 'link'
                                    ? 'bg-indigo-600 text-white'
                                    : 'bg-white text-gray-600 hover:bg-gray-100'
                                    }`}
                            >
                                🔗 Link
                            </button>
                            <button
                                type="button"
                                onClick={() => setResourceType('document')}
                                className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition ${resourceType === 'document'
                                    ? 'bg-indigo-600 text-white'
                                    : 'bg-white text-gray-600 hover:bg-gray-100'
                                    }`}
                            >
                                📄 Döküman
                            </button>
                            <button
                                type="button"
                                onClick={() => setResourceType('note')}
                                className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition ${resourceType === 'note'
                                    ? 'bg-indigo-600 text-white'
                                    : 'bg-white text-gray-600 hover:bg-gray-100'
                                    }`}
                            >
                                📝 Not
                            </button>
                        </div>

                        {/* Name Input */}
                        <input
                            type="text"
                            placeholder="Kaynak adı (Örn: API Dokümantasyonu)"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="w-full p-3 rounded-lg border-0 shadow-sm focus:ring-2 focus:ring-indigo-500 mb-3"
                            autoFocus
                        />

                        {/* URL Input (for link/document) */}
                        {(resourceType === 'link' || resourceType === 'document') && (
                            <input
                                type="url"
                                placeholder="URL (https://...)"
                                value={url}
                                onChange={(e) => setUrl(e.target.value)}
                                className="w-full p-3 rounded-lg border-0 shadow-sm focus:ring-2 focus:ring-indigo-500 mb-3"
                            />
                        )}

                        {/* Content Input (for note) */}
                        {resourceType === 'note' && (
                            <textarea
                                placeholder="Not içeriği..."
                                value={content}
                                onChange={(e) => setContent(e.target.value)}
                                className="w-full p-3 rounded-lg border-0 shadow-sm focus:ring-2 focus:ring-indigo-500 mb-3 min-h-[100px]"
                            />
                        )}

                        <div className="flex gap-2">
                            <button
                                type="submit"
                                className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition"
                            >
                                Ekle
                            </button>
                            <button
                                type="button"
                                onClick={() => {
                                    setIsAdding(false)
                                    setName('')
                                    setUrl('')
                                    setContent('')
                                }}
                                className="px-4 py-2 bg-white text-gray-600 rounded-lg text-sm font-medium hover:bg-gray-100 transition"
                            >
                                Vazgeç
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* Resources List */}
            {loading ? (
                <div className="flex justify-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
                </div>
            ) : resources.length === 0 ? (
                <div className="bg-white rounded-2xl p-12 border-2 border-dashed border-gray-200 text-center">
                    <div className="text-4xl mb-3">📁</div>
                    <p className="text-gray-500 text-sm">Henüz kaynak eklenmemiş</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {resources.map((resource) => (
                        <div
                            key={resource.id}
                            className="bg-white rounded-xl border border-gray-200 p-4 hover:shadow-lg transition-shadow"
                        >
                            <div className="flex items-start justify-between mb-2">
                                <div className="flex items-center gap-2">
                                    <span className="text-2xl">{getIcon(resource.type)}</span>
                                    <div>
                                        <h3 className="font-bold text-gray-900">{resource.name}</h3>
                                        <span className="text-xs text-gray-500 capitalize">{resource.type}</span>
                                    </div>
                                </div>
                                <button
                                    onClick={() => handleDelete(resource.id)}
                                    className="p-1 text-gray-400 hover:text-red-500 transition"
                                >
                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                    </svg>
                                </button>
                            </div>

                            {/* URL for links/documents */}
                            {resource.url && (
                                <a
                                    href={resource.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-sm text-indigo-600 hover:text-indigo-700 underline block mb-2 truncate"
                                >
                                    {resource.url}
                                </a>
                            )}

                            {/* Content for notes */}
                            {resource.content && (
                                <p className="text-sm text-gray-600 line-clamp-3">{resource.content}</p>
                            )}

                            <div className="text-xs text-gray-400 mt-2">
                                {new Date(resource.created_at).toLocaleDateString('tr-TR')}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}

// Notes Tab Component
function NotesTab({ project }: { project: Project }) {
    const [notes, setNotes] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [isAdding, setIsAdding] = useState(false)
    const [editingNote, setEditingNote] = useState<any | null>(null)
    const [title, setTitle] = useState('')
    const [content, setContent] = useState('')

    useEffect(() => {
        loadNotes()
    }, [project.id])

    const loadNotes = async () => {
        setLoading(true)
        const supabase = createClient()
        const { data, error } = await supabase
            .from('project_resources')
            .select('*')
            .eq('project_id', project.id)
            .eq('type', 'note')
            .is('task_id', null) // Only project-level notes
            .order('created_at', { ascending: false })

        if (!error && data) {
            setNotes(data)
        }
        setLoading(false)
    }

    const handleSaveNote = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!title.trim() || !content.trim()) return

        const supabase = createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return

        if (editingNote) {
            // Update existing note
            const { error } = await supabase
                .from('project_resources')
                .update({
                    name: title.trim(),
                    content: content.trim()
                })
                .eq('id', editingNote.id)

            if (!error) {
                setTitle('')
                setContent('')
                setEditingNote(null)
                setIsAdding(false)
                loadNotes()
            }
        } else {
            // Create new note
            const { error } = await supabase
                .from('project_resources')
                .insert({
                    project_id: project.id,
                    name: title.trim(),
                    type: 'note',
                    content: content.trim(),
                    created_by: user.id
                })

            if (!error) {
                setTitle('')
                setContent('')
                setIsAdding(false)
                loadNotes()
            } else {
                alert('Not eklenemedi: ' + error.message)
            }
        }
    }

    const handleEdit = (note: any) => {
        setEditingNote(note)
        setTitle(note.name)
        setContent(note.content || '')
        setIsAdding(true)
    }

    const handleDelete = async (id: string) => {
        if (!confirm('Bu notu silmek istediğinize emin misiniz?')) return

        const supabase = createClient()
        const { error } = await supabase
            .from('project_resources')
            .delete()
            .eq('id', id)

        if (!error) {
            loadNotes()
        }
    }

    const handleCancel = () => {
        setIsAdding(false)
        setEditingNote(null)
        setTitle('')
        setContent('')
    }

    return (
        <div className="space-y-4">
            {/* Header */}
            <div className="flex justify-between items-center">
                <h2 className="text-lg font-bold text-gray-900">Proje Notları</h2>
                {!isAdding && (
                    <button
                        onClick={() => setIsAdding(true)}
                        className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition"
                    >
                        + Not Ekle
                    </button>
                )}
            </div>

            {/* Add/Edit Note Form */}
            {isAdding && (
                <div className="bg-indigo-50 p-4 rounded-xl border border-indigo-100">
                    <form onSubmit={handleSaveNote}>
                        <input
                            type="text"
                            placeholder="Not başlığı (Örn: Toplantı Notları - 31 Aralık)"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            className="w-full p-3 rounded-lg border-0 shadow-sm focus:ring-2 focus:ring-indigo-500 mb-3 font-bold"
                            autoFocus
                        />
                        <textarea
                            placeholder="Not içeriği...&#10;&#10;İpucu: Markdown formatını kullanabilirsiniz:&#10;- **Kalın** için **metin**&#10;- *İtalik* için *metin*&#10;- Liste için - veya 1.&#10;- Başlık için # veya ##"
                            value={content}
                            onChange={(e) => setContent(e.target.value)}
                            className="w-full p-3 rounded-lg border-0 shadow-sm focus:ring-2 focus:ring-indigo-500 mb-3 min-h-[200px] font-mono text-sm"
                        />
                        <div className="flex gap-2">
                            <button
                                type="submit"
                                className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition"
                            >
                                {editingNote ? 'Güncelle' : 'Kaydet'}
                            </button>
                            <button
                                type="button"
                                onClick={handleCancel}
                                className="px-4 py-2 bg-white text-gray-600 rounded-lg text-sm font-medium hover:bg-gray-100 transition"
                            >
                                Vazgeç
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* Notes List */}
            {loading ? (
                <div className="flex justify-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
                </div>
            ) : notes.length === 0 ? (
                <div className="bg-white rounded-2xl p-12 border-2 border-dashed border-gray-200 text-center">
                    <div className="text-4xl mb-3">📝</div>
                    <p className="text-gray-500 text-sm">Henüz not eklenmemiş</p>
                    <p className="text-gray-400 text-xs mt-2">Toplantı notları, kararlar ve changelog için not ekleyin</p>
                </div>
            ) : (
                <div className="space-y-4">
                    {notes.map((note) => (
                        <div
                            key={note.id}
                            className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-lg transition-shadow"
                        >
                            <div className="flex items-start justify-between mb-3">
                                <div className="flex-1">
                                    <h3 className="text-lg font-bold text-gray-900 mb-1">{note.name}</h3>
                                    <div className="text-xs text-gray-400">
                                        {new Date(note.created_at).toLocaleDateString('tr-TR', {
                                            day: 'numeric',
                                            month: 'long',
                                            year: 'numeric',
                                            hour: '2-digit',
                                            minute: '2-digit'
                                        })}
                                    </div>
                                </div>
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => handleEdit(note)}
                                        className="p-2 text-gray-400 hover:text-indigo-600 transition"
                                        title="Düzenle"
                                    >
                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                                        </svg>
                                    </button>
                                    <button
                                        onClick={() => handleDelete(note.id)}
                                        className="p-2 text-gray-400 hover:text-red-500 transition"
                                        title="Sil"
                                    >
                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                        </svg>
                                    </button>
                                </div>
                            </div>
                            <div className="prose prose-sm max-w-none">
                                <pre className="whitespace-pre-wrap font-sans text-sm text-gray-700 leading-relaxed">{note.content}</pre>
                            </div>
                        </div>
                    ))}
                </div>
            )}
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
