'use client'

import { useMemo } from 'react'

interface Task {
    id: string
    title: string
    start_date: string | null
    end_date: string | null
    progress_percent: number
}

interface GanttChartProps {
    tasks: Task[]
}

export default function GanttChart({ tasks }: GanttChartProps) {
    // Generate dates for the current week or based on tasks
    const timelineDates = useMemo(() => {
        const dates = []
        const today = new Date()
        for (let i = -2; i < 12; i++) {
            const date = new Date(today)
            date.setDate(today.getDate() + i)
            dates.push(date)
        }
        return dates
    }, [])

    const getTaskStyle = (task: Task) => {
        const start = task.start_date ? new Date(task.start_date) : new Date()
        const end = task.end_date ? new Date(task.end_date) : new Date(start)
        if (task.end_date === null) end.setDate(start.getDate() + 1)

        const timelineStart = timelineDates[0]
        const diffStart = Math.floor((start.getTime() - timelineStart.getTime()) / (1000 * 60 * 60 * 24))
        const duration = Math.max(1, Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)))

        // Column indexing starts at 1
        const startCol = diffStart + 1

        if (startCol < 1 || startCol > timelineDates.length) return { display: 'none' }

        return {
            gridColumn: `${startCol} / span ${Math.min(duration, timelineDates.length - startCol + 1)}`,
        }
    }

    return (
        <div className="flex-1 flex flex-col min-h-0 overflow-hidden bg-white rounded-3xl border border-gray-100 shadow-sm mt-4">
            {/* Timeline Header */}
            <div className="overflow-x-auto no-scrollbar border-b border-gray-50">
                <div
                    className="grid border-b border-gray-100"
                    style={{
                        gridTemplateColumns: `repeat(${timelineDates.length}, minmax(60px, 1fr))`,
                        marginLeft: '150px' // Offset for task names
                    }}
                >
                    {timelineDates.map((date, i) => {
                        const isToday = date.toDateString() === new Date().toDateString()
                        return (
                            <div key={i} className={`py-3 text-center border-l border-gray-50 text-[10px] font-bold ${isToday ? 'bg-indigo-50 text-indigo-600' : 'text-gray-400'}`}>
                                <div className="uppercase mb-0.5">{date.toLocaleDateString('tr-TR', { weekday: 'short' })}</div>
                                <div className="text-sm">{date.getDate()}</div>
                            </div>
                        )
                    })}
                </div>
            </div>

            {/* Tasks & Rows */}
            <div className="flex-1 overflow-y-auto overflow-x-auto">
                <div className="relative min-w-max">
                    {tasks.map((task) => (
                        <div key={task.id} className="flex border-b border-gray-50 group hover:bg-gray-50/50 transition-colors">
                            {/* Task Name Column */}
                            <div className="w-[150px] p-4 text-xs font-semibold text-gray-700 truncate border-r border-gray-50 sticky left-0 bg-white z-10 group-hover:bg-gray-50">
                                {task.title}
                            </div>

                            {/* Timeline Row */}
                            <div
                                className="grid flex-1 relative h-14"
                                style={{
                                    gridTemplateColumns: `repeat(${timelineDates.length}, minmax(60px, 1fr))`
                                }}
                            >
                                {/* Background Grid */}
                                {timelineDates.map((_, i) => (
                                    <div key={i} className="border-l border-gray-50 h-full" />
                                ))}

                                {/* Task Bar */}
                                <div
                                    className="absolute top-3 bottom-3 flex items-center px-1 z-10"
                                    style={getTaskStyle(task)}
                                >
                                    <div className="w-full h-full bg-indigo-500 rounded-lg shadow-sm relative overflow-hidden group/bar">
                                        {/* Progress Fill */}
                                        <div
                                            className="absolute inset-y-0 left-0 bg-indigo-600 rounded-l-lg transition-all duration-500"
                                            style={{ width: `${task.progress_percent}%` }}
                                        />
                                        <span className="relative z-20 text-[9px] text-white font-bold px-2 pointer-events-none">
                                            {task.progress_percent}%
                                        </span>

                                        {/* Tooltip on hover */}
                                        <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-[10px] py-1 px-2 rounded opacity-0 group-hover/bar:opacity-100 transition-opacity whitespace-nowrap z-30">
                                            {task.title} (%{task.progress_percent})
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}

                    {tasks.length === 0 && (
                        <div className="p-12 text-center text-gray-400 text-sm">
                            Görüntülenecek görev bulunamadı.
                        </div>
                    )}
                </div>
            </div>

            <div className="p-3 bg-gray-50 border-t border-gray-100 flex items-center justify-between text-[10px] text-gray-500">
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-1">
                        <div className="w-2 h-2 rounded-full bg-indigo-500" />
                        <span>Planlanan</span>
                    </div>
                </div>
                <div>Zaman çizelgesi otomatik güncellenir.</div>
            </div>
        </div>
    )
}
