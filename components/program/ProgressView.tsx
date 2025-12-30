'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell,
    LineChart,
    Line
} from 'recharts'

interface ProgressViewProps {
    userId: string
}

export default function ProgressView({ userId }: ProgressViewProps) {
    const [loading, setLoading] = useState(true)
    const [weeklyData, setWeeklyData] = useState<any[]>([])
    const [subjectData, setSubjectData] = useState<any[]>([])
    const [habitData, setHabitData] = useState<any[]>([])
    const [nutritionData, setNutritionData] = useState<any[]>([])
    const [practiceData, setPracticeData] = useState<any[]>([])

    const supabase = createClient()
    const COLORS = ['#6366F1', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899']

    const summaryMetrics = [
        { label: 'Haftalık Tamamlama', value: `${Math.round((weeklyData.reduce((acc, curr) => acc + curr.Tamamlanan, 0) / (weeklyData.reduce((acc, curr) => acc + curr.Tamamlanan + curr.Bekleyen, 0) || 1)) * 100)}%`, icon: '📈', color: 'indigo' },
        { label: 'En İyi Seri', value: `${Math.max(...habitData.map(h => h.current_streak), 0)} Gün`, icon: '🔥', color: 'orange' },
        { label: 'Ort. Beslenme', value: `${Math.round(nutritionData.reduce((acc, curr) => acc + curr.Kalori, 0) / (nutritionData.length || 1))} kcal`, icon: '🍏', color: 'emerald' },
        { label: 'Müzik Pratiği', value: `${practiceData.reduce((acc, curr) => acc + curr.Dakika, 0)} dk`, icon: '🎸', color: 'purple' },
    ]

    useEffect(() => {
        loadMetrics()
    }, [userId])

    const loadMetrics = async () => {
        setLoading(true)
        await Promise.all([
            loadWeeklyCompletion(),
            loadSubjectDistribution(),
            loadHabitStats(),
            loadNutritionStats(),
            loadPracticeHistory()
        ])
        setLoading(false)
    }

    const loadWeeklyCompletion = async () => {
        const today = new Date()
        const last7Days = []
        for (let i = 6; i >= 0; i--) {
            const d = new Date(today)
            d.setDate(d.getDate() - i)
            last7Days.push(d.toISOString().split('T')[0])
        }

        const { data: tasks } = await supabase
            .from('tasks')
            .select('due_date, is_completed')
            .eq('user_id', userId)
            .gte('due_date', last7Days[0])
            .lte('due_date', last7Days[6])

        const chartData = last7Days.map(date => {
            const dayTasks = tasks?.filter(t => t.due_date === date) || []
            const completed = dayTasks.filter(t => t.is_completed).length
            const pending = dayTasks.length - completed
            const dayName = new Date(date).toLocaleDateString('tr-TR', { weekday: 'short' })

            return {
                name: dayName,
                Tamamlanan: completed,
                Bekleyen: pending
            }
        })

        setWeeklyData(chartData)
    }

    const loadSubjectDistribution = async () => {
        const { data: tasks } = await supabase
            .from('tasks')
            .select(`
                settings,
                task_types!inner(slug)
            `)
            .eq('user_id', userId)
            .eq('task_types.slug', 'exam')

        const distribution = new Map()
        tasks?.forEach((task: any) => {
            const subjectName = task.settings?.subject || 'Diğer'
            distribution.set(subjectName, (distribution.get(subjectName) || 0) + 1)
        })

        const chartData = Array.from(distribution.entries()).map(([name, value]) => ({
            name,
            value
        }))

        setSubjectData(chartData)
    }

    const loadNutritionStats = async () => {
        // In unified architecture, nutrition logs are tasks with task_type nutrition
        const { data: tasks } = await supabase
            .from('tasks')
            .select(`
                start_date,
                settings,
                task_types!inner(slug)
            `)
            .eq('user_id', userId)
            .eq('task_types.slug', 'nutrition')
            .eq('is_completed', true)
            .order('start_date', { ascending: true })
            .limit(20)

        // Map calories from settings if available
        const chartData = tasks?.map(t => ({
            date: new Date(t.start_date).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' }),
            Kalori: t.settings?.calories || 0,
            Protein: t.settings?.protein || 0
        })).filter(d => d.Kalori > 0) || []

        setNutritionData(chartData)
    }

    const loadHabitStats = async () => {
        const { data: habits } = await supabase
            .from('habits')
            .select('name, current_streak, total_completions, icon')
            .eq('user_id', userId)
            .eq('is_active', true)
            .order('current_streak', { ascending: false })
            .limit(5)

        setHabitData(habits || [])
    }

    const loadPracticeHistory = async () => {
        const { data: tasks } = await supabase
            .from('tasks')
            .select(`
                start_date,
                duration_minutes,
                task_types!inner(slug)
            `)
            .eq('user_id', userId)
            .eq('task_types.slug', 'music')
            .eq('is_completed', true)
            .order('start_date', { ascending: true })
            .limit(14)

        const chartData = tasks?.map(t => ({
            date: new Date(t.start_date).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' }),
            Dakika: t.duration_minutes || 0
        })) || []

        setPracticeData(chartData)
    }

    if (loading) {
        return (
            <div className="flex justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
            </div>
        )
    }

    return (
        <div className="space-y-8 pb-12">
            <div className="flex flex-col gap-1">
                <h2 className="text-2xl font-black text-gray-900 tracking-tight">Gelişim Analizi</h2>
                <p className="text-sm text-gray-500 font-medium uppercase tracking-wider">KİŞİSEL ÖZETİM</p>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {summaryMetrics.map((metric, i) => (
                    <div key={i} className={`bg-white p-4 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow`}>
                        <div className="text-2xl mb-2">{metric.icon}</div>
                        <div className="text-xs font-black text-gray-400 uppercase tracking-widest mb-1">{metric.label}</div>
                        <div className="text-xl font-black text-gray-900">{metric.value}</div>
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Weekly Completion Chart */}
                <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
                    <h3 className="text-sm font-black text-gray-400 uppercase tracking-widest mb-6">Son 7 Gün Görev Durumu</h3>
                    <div className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={weeklyData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F3F4F6" />
                                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fontWeight: 700, fill: '#9CA3AF' }} />
                                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fontWeight: 700, fill: '#9CA3AF' }} />
                                <Tooltip
                                    cursor={{ fill: '#F9FAFB' }}
                                    contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                                />
                                <Bar dataKey="Tamamlanan" stackId="a" fill="#6366F1" radius={[0, 0, 0, 0]} />
                                <Bar dataKey="Bekleyen" stackId="a" fill="#E5E7EB" radius={[6, 6, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Subject Distribution Chart */}
                <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
                    <h3 className="text-sm font-black text-gray-400 uppercase tracking-widest mb-6">Ders Bazlı Çalışma Dağılımı</h3>
                    {subjectData.length > 0 ? (
                        <div className="h-[300px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={subjectData}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={60}
                                        outerRadius={100}
                                        paddingAngle={5}
                                        dataKey="value"
                                    >
                                        {subjectData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} stroke="rgba(0,0,0,0)" />
                                        ))}
                                    </Pie>
                                    <Tooltip
                                        contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                                    />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                    ) : (
                        <div className="h-[300px] flex flex-col items-center justify-center text-gray-400 bg-gray-50/50 rounded-2xl border border-dashed border-gray-200">
                            <span className="text-3xl mb-2">📚</span>
                            <p className="text-sm font-bold">Henüz veri yok</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Nutrition Chart */}
            <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
                <h3 className="text-sm font-black text-gray-400 uppercase tracking-widest mb-6">Beslenme ve Kalori Takibi</h3>
                {nutritionData.length > 0 ? (
                    <div className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={nutritionData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F3F4F6" />
                                <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 11, fontWeight: 700, fill: '#9CA3AF' }} />
                                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fontWeight: 700, fill: '#9CA3AF' }} />
                                <Tooltip
                                    contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                                />
                                <Line type="monotone" dataKey="Kalori" stroke="#6366F1" strokeWidth={4} dot={{ r: 4, fill: '#6366F1', strokeWidth: 2, stroke: '#fff' }} activeDot={{ r: 6, strokeWidth: 0 }} />
                                <Line type="monotone" dataKey="Protein" stroke="#10B981" strokeWidth={2} strokeDasharray="5 5" dot={false} />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                ) : (
                    <div className="h-[200px] flex flex-col items-center justify-center text-gray-400 bg-gray-50/50 rounded-2xl border border-dashed border-gray-200">
                        <span className="text-3xl mb-2">🥗</span>
                        <p className="text-sm font-bold">Henüz beslenme kaydı yok</p>
                    </div>
                )}
            </div>

            {/* Music Practice Chart */}
            <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
                <h3 className="text-sm font-black text-gray-400 uppercase tracking-widest mb-6">Müzik Pratik Süresi</h3>
                {practiceData.length > 0 ? (
                    <div className="h-[250px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={practiceData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F3F4F6" />
                                <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 11, fontWeight: 700, fill: '#9CA3AF' }} />
                                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fontWeight: 700, fill: '#9CA3AF' }} />
                                <Tooltip
                                    cursor={{ fill: '#F9FAFB' }}
                                    contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                                />
                                <Bar dataKey="Dakika" fill="#8B5CF6" radius={[6, 6, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                ) : (
                    <div className="h-[150px] flex flex-col items-center justify-center text-gray-400 bg-gray-50/50 rounded-2xl border border-dashed border-gray-200">
                        <span className="text-3xl mb-2">🎵</span>
                        <p className="text-sm font-bold">Henüz pratik kaydı yok</p>
                    </div>
                )}
            </div>

            {/* Habit Stats */}
            <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
                <h3 className="text-sm font-black text-gray-400 uppercase tracking-widest mb-6">En İyi Alışkanlık Zincirleri</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {habitData.map((habit, index) => (
                        <div key={index} className="flex items-center gap-4 p-4 bg-gray-50/50 rounded-2xl border border-gray-100 group hover:bg-white hover:shadow-md transition-all">
                            <div className="text-3xl group-hover:scale-110 transition-transform">{habit.icon}</div>
                            <div>
                                <h4 className="font-black text-gray-900 leading-tight">{habit.name}</h4>
                                <div className="flex items-center gap-2 mt-1">
                                    <span className="text-xs font-black text-orange-500 bg-orange-50 px-2 py-0.5 rounded-full">🔥 {habit.current_streak} Gün</span>
                                    <span className="text-[10px] font-bold text-gray-400 uppercase">Toplam {habit.total_completions}</span>
                                </div>
                            </div>
                        </div>
                    ))}
                    {habitData.length === 0 && (
                        <div className="col-span-full py-12 flex flex-col items-center justify-center text-gray-400 bg-gray-50/50 rounded-2xl border border-dashed border-gray-200">
                            <span className="text-3xl mb-2">⛓️</span>
                            <p className="text-sm font-bold">Henüz aktif alışkanlık yok</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
