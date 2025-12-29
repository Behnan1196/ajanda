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
    const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d']

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
        <div className="space-y-6 pb-12">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Gelişim Analizi</h2>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Weekly Completion Chart */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4">Son 7 Gün Görev Durumu</h3>
                    <div className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={weeklyData}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="name" />
                                <YAxis />
                                <Tooltip />
                                <Legend />
                                <Bar dataKey="Tamamlanan" stackId="a" fill="#10B981" />
                                <Bar dataKey="Bekleyen" stackId="a" fill="#E5E7EB" />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Subject Distribution Chart */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4">Ders Bazlı Çalışma Dağılımı</h3>
                    {subjectData.length > 0 ? (
                        <div className="h-[300px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={subjectData}
                                        cx="50%"
                                        cy="50%"
                                        labelLine={false}
                                        label={({ name, percent }: any) => `${name} ${(percent * 100).toFixed(0)}%`}
                                        outerRadius={80}
                                        fill="#8884d8"
                                        dataKey="value"
                                    >
                                        {subjectData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                    ) : (
                        <div className="h-[300px] flex items-center justify-center text-gray-400">
                            Henüz sınav bazlı çalışma verisi yok
                        </div>
                    )}
                </div>
            </div>

            {/* Nutrition Chart */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Beslenme ve Kalori Takibi 🥗</h3>
                {nutritionData.length > 0 ? (
                    <div className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={nutritionData}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="date" />
                                <YAxis yAxisId="left" orientation="left" stroke="#8884d8" />
                                <Tooltip />
                                <Legend />
                                <Line yAxisId="left" type="monotone" dataKey="Kalori" stroke="#8884d8" strokeWidth={3} dot={{ r: 6 }} activeDot={{ r: 8 }} />
                                <Line yAxisId="left" type="monotone" dataKey="Protein" stroke="#10B981" strokeWidth={2} strokeDasharray="5 5" />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                ) : (
                    <div className="h-[200px] flex flex-col items-center justify-center text-gray-400 bg-gray-50 rounded-lg border border-dashed border-gray-200">
                        <span className="text-3xl mb-2">📊</span>
                        <p className="text-sm">Henüz tamamlanmış beslenme kaydı bulunmuyor.</p>
                    </div>
                )}
            </div>

            {/* Music Practice Chart */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Müzik Pratik Süresi 🎸</h3>
                {practiceData.length > 0 ? (
                    <div className="h-[250px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={practiceData}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="date" />
                                <YAxis />
                                <Tooltip />
                                <Bar dataKey="Dakika" fill="#8B5CF6" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                ) : (
                    <div className="h-[150px] flex flex-col items-center justify-center text-gray-400 bg-gray-50 rounded-lg border border-dashed border-gray-200">
                        <span className="text-2xl mb-2">🎵</span>
                        <p className="text-sm">Henüz pratik kaydı bulunmuyor.</p>
                    </div>
                )}
            </div>

            {/* Habit Stats */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">En İyi Alışkanlık Zincirleri 🔥</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                    {habitData.map((habit, index) => (
                        <div key={index} className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg border border-gray-100">
                            <div className="text-2xl">{habit.icon}</div>
                            <div>
                                <h4 className="font-medium text-gray-900">{habit.name}</h4>
                                <div className="text-sm text-gray-500">
                                    <span className="font-bold text-orange-500">{habit.current_streak} gün</span> zincir
                                </div>
                                <div className="text-xs text-gray-400">
                                    Toplam {habit.total_completions} kez
                                </div>
                            </div>
                        </div>
                    ))}
                    {habitData.length === 0 && (
                        <div className="text-gray-500 italic">Henüz aktif alışkanlık yok.</div>
                    )}
                </div>
            </div>
        </div>
    )
}
