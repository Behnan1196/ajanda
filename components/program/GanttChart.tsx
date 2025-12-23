'use client'



interface Task {
    id: string
    title: string
    start_date: string | null
    end_date: string | null
    progress_percent: number
    dependency_ids?: string[]
}

interface GanttChartProps {
    projectId: string
    tasks: Task[]
    onUpdate?: () => void
}

import Link from 'next/link'
import { useMemo, useState, useRef, useEffect } from 'react'
import { updateProjectTask } from '@/app/actions/projects'
import TaskEditorModal from './TaskEditorModal'

// Helper to get local date string YYYY-MM-DD
const toLocalISOString = (date: Date) => {
    const offset = date.getTimezoneOffset()
    const adjusted = new Date(date.getTime() - (offset * 60 * 1000))
    return adjusted.toISOString().split('T')[0]
}

export default function GanttChart({ projectId, tasks, onUpdate }: GanttChartProps) {
    const [editingTask, setEditingTask] = useState<any | null>(null)
    const [draggingTask, setDraggingTask] = useState<{
        id: string
        type: 'move' | 'resize-end'
        startX: number
        initialOffset: number
        initialDuration: number
    } | null>(null)

    const [dragOffset, setDragOffset] = useState(0)
    const [dragDurationOffset, setDragDurationOffset] = useState(0)
    const containerRef = useRef<HTMLDivElement>(null)
    const timelineRef = useRef<HTMLDivElement>(null)

    const getCellWidth = () => {
        if (timelineRef.current) {
            const firstCell = timelineRef.current.children[0] as HTMLElement
            if (firstCell?.offsetWidth) return firstCell.offsetWidth
            // Fallback: calculate from generic container width
            if (timelineRef.current.offsetWidth) {
                return timelineRef.current.offsetWidth / timelineDates.length
            }
        }
        return 60
    }

    // Generate dates for the current week or based on tasks
    const timelineDates = useMemo(() => {
        const dates = []
        const today = new Date()
        today.setHours(0, 0, 0, 0)
        for (let i = -5; i < 30; i++) {
            const date = new Date(today)
            date.setDate(today.getDate() + i)
            dates.push(date)
        }
        return dates
    }, [])

    const getTaskStyle = (task: Task) => {
        const timelineStart = new Date(timelineDates[0])
        timelineStart.setHours(0, 0, 0, 0)

        const start = task.start_date ? new Date(task.start_date) : null
        const end = task.end_date ? new Date(task.end_date) : (start ? new Date(start) : null)

        if (!start) {
            // Unscheduled: display in first column
            return {
                gridColumn: '1 / span 1',
                opacity: 0.5,
                filter: 'grayscale(1)'
            }
        }

        start.setHours(0, 0, 0, 0)
        end!.setHours(0, 0, 0, 0)

        let diffStart = Math.round((start.getTime() - timelineStart.getTime()) / (1000 * 60 * 60 * 24))
        let duration = Math.max(1, Math.round((end!.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1)

        let isDragging = false
        if (draggingTask?.id === task.id) {
            isDragging = true
            if (draggingTask.type === 'move') {
                diffStart += dragOffset
            } else if (draggingTask.type === 'resize-end') {
                duration = Math.max(1, duration + dragDurationOffset)
            }
        }

        const startCol = diffStart + 1
        if (startCol < 1 || startCol > timelineDates.length) {
            return { display: 'none' }
        }

        const span = Math.min(duration, timelineDates.length - startCol + 1)
        if (span < 1) return { display: 'none' }

        return {
            gridColumn: `${startCol} / span ${span}`,
            backgroundColor: isDragging ? '#f97316' : undefined,
            zIndex: isDragging ? 50 : 10,
            transition: 'none'
        }
    }

    const handleDragStart = (e: React.MouseEvent, taskId: string, type: 'move' | 'resize-end') => {
        e.preventDefault()
        setDraggingTask({
            id: taskId,
            type,
            startX: e.clientX,
            initialOffset: 0,
            initialDuration: 0
        })
    }

    useEffect(() => {
        if (!draggingTask) return

        const handleMouseMove = (e: MouseEvent) => {
            e.preventDefault() // Prevent native drag selection
            const cellWidth = getCellWidth()
            const deltaX = e.clientX - draggingTask.startX
            const offset = Math.round(deltaX / cellWidth)

            if (draggingTask.type === 'move') {
                setDragOffset(offset)
            } else {
                setDragDurationOffset(offset)
            }
        }

        const handleMouseUp = async () => {
            const task = tasks.find(t => t.id === draggingTask.id)
            if (task) {
                const today = new Date()
                today.setHours(0, 0, 0, 0)

                const start = task.start_date ? new Date(task.start_date) : today
                const end = task.end_date ? new Date(task.end_date) : new Date(start)

                start.setHours(0, 0, 0, 0)
                end.setHours(0, 0, 0, 0)

                if (draggingTask.type === 'move' && (dragOffset !== 0 || !task.start_date)) {
                    if (!task.start_date) {
                        start.setDate(today.getDate() + dragOffset)
                        end.setTime(start.getTime())
                    } else {
                        start.setDate(start.getDate() + dragOffset)
                        end.setDate(end.getDate() + dragOffset)
                    }

                    await updateProjectTask(projectId, task.id, {
                        start_date: toLocalISOString(start),
                        end_date: toLocalISOString(end)
                    })
                } else if (draggingTask.type === 'resize-end' && dragDurationOffset !== 0) {
                    console.log('Resizing task:', task.title, 'Offset:', dragDurationOffset)
                    end.setDate(end.getDate() + dragDurationOffset)
                    console.log('New End Date:', end)
                    await updateProjectTask(projectId, task.id, {
                        end_date: toLocalISOString(end)
                    })
                }
                onUpdate?.()
            }
            setDraggingTask(null)
            setDragOffset(0)
            setDragDurationOffset(0)
        }

        window.addEventListener('mousemove', handleMouseMove)
        window.addEventListener('mouseup', handleMouseUp)
        return () => {
            window.removeEventListener('mousemove', handleMouseMove)
            window.removeEventListener('mouseup', handleMouseUp)
        }
    }, [draggingTask, dragOffset, dragDurationOffset, projectId, tasks, onUpdate])

    return (
        <div className="flex-1 flex flex-col min-h-0 overflow-hidden bg-white rounded-3xl border border-gray-100 shadow-sm mt-4">
            {/* Timeline Header */}
            <div className="overflow-x-auto no-scrollbar border-b border-gray-50">
                <div
                    ref={timelineRef}
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
                                    className="relative top-3 bottom-3 flex items-center px-1 z-10"
                                    style={getTaskStyle(task)}
                                >
                                    <div
                                        className="w-full h-full bg-indigo-500 rounded-lg shadow-sm relative overflow-hidden group/bar cursor-move hover:bg-indigo-400 transition-colors"
                                        onMouseDown={(e) => handleDragStart(e, task.id, 'move')}
                                    >
                                        {/* Progress Fill */}
                                        <div
                                            className="absolute inset-y-0 left-0 bg-indigo-600 rounded-l-lg transition-all duration-500"
                                            style={{ width: `${task.progress_percent}%` }}
                                        />

                                        <div className="flex items-center justify-between w-full h-full px-2">
                                            <span className="relative z-20 text-[9px] text-white font-bold pointer-events-none">
                                                {task.progress_percent}%
                                            </span>

                                            {/* Edit Icon - Only visible on hover */}
                                            <button
                                                className="opacity-0 group-hover/bar:opacity-100 p-1 hover:bg-white/20 rounded transition-opacity pointer-events-auto"
                                                onClick={(e) => {
                                                    e.stopPropagation()
                                                    setEditingTask(task)
                                                }}
                                                onMouseDown={(e) => {
                                                    e.stopPropagation() // Prevent drag on click
                                                }}
                                            >
                                                <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                                                </svg>
                                            </button>
                                        </div>

                                        {/* Resize Handle */}
                                        <div
                                            className="absolute right-0 top-0 bottom-0 w-2 hover:bg-white/40 cursor-ew-resize z-30"
                                            onMouseDown={(e) => {
                                                e.stopPropagation()
                                                handleDragStart(e, task.id, 'resize-end')
                                            }}
                                        />

                                        {/* Tooltip on hover */}
                                        <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-[10px] py-1 px-2 rounded opacity-0 group-hover/bar:opacity-100 transition-opacity whitespace-nowrap z-40 pointer-events-none">
                                            {task.title} (%{task.progress_percent})
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}

                    {/* Dependency Arrows Overlay */}
                    <svg className="absolute inset-0 pointer-events-none z-0 overflow-visible" style={{ marginLeft: '150px' }}>
                        <defs>
                            <marker id="arrowhead" markerWidth="6" markerHeight="4" refX="5" refY="2" orient="auto">
                                <path d="M0,0 L6,2 L0,4 Z" fill="#94a3b8" />
                            </marker>
                        </defs>
                        {tasks.map(task => {
                            if (!task.dependency_ids) return null
                            return task.dependency_ids.map(depId => {
                                const pred = tasks.find(t => t.id === depId)
                                if (!pred) return null

                                // Calculate coordinates based on grid positions
                                const getPos = (t: Task, edge: 'start' | 'end') => {
                                    const timelineStart = timelineDates[0]
                                    const today = new Date()
                                    today.setHours(0, 0, 0, 0)

                                    const startD = t.start_date ? new Date(t.start_date) : today
                                    const endD = t.end_date ? new Date(t.end_date) : new Date(startD)

                                    startD.setHours(0, 0, 0, 0)
                                    endD.setHours(0, 0, 0, 0)

                                    let diffStart = Math.round((startD.getTime() - timelineStart.getTime()) / (1000 * 60 * 60 * 24))
                                    let duration = Math.round((endD.getTime() - startD.getTime()) / (1000 * 60 * 60 * 24)) + 1

                                    if (draggingTask?.id === t.id) {
                                        if (draggingTask.type === 'move') diffStart += dragOffset
                                        else if (draggingTask.type === 'resize-end') duration = Math.max(1, duration + dragDurationOffset)
                                    }

                                    const colIndex = (edge === 'start' ? diffStart : diffStart + duration - 1)
                                    const rowIndex = tasks.findIndex(taskItem => taskItem.id === t.id)

                                    return {
                                        x: colIndex * 60 + (edge === 'start' ? 2 : -2), // Cell width is 60. Adjust for padding.
                                        y: rowIndex * 56 + 28 // Row height is 56 (h-14). 28 is vertical center.
                                    }
                                }

                                const startPos = getPos(pred, 'end')
                                const endPos = getPos(task, 'start')

                                // Draw a stepped path
                                const midX = startPos.x + (endPos.x - startPos.x) / 2
                                return (
                                    <path
                                        key={`${task.id}-${depId}`}
                                        d={`M ${startPos.x} ${startPos.y} L ${midX} ${startPos.y} L ${midX} ${endPos.y} L ${endPos.x} ${endPos.y}`}
                                        fill="none"
                                        stroke="#94a3b8"
                                        strokeWidth="1"
                                        strokeDasharray="4 2"
                                        markerEnd="url(#arrowhead)"
                                    />
                                )
                            })
                        })}
                    </svg>

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
                <div>Çift tıklayarak veya düzenle ikonuna basarak görev detaylarını görebilirsiniz.</div>
            </div>

            {/* Task Editor Modal */}
            {editingTask && (
                <TaskEditorModal
                    projectId={projectId}
                    task={editingTask}
                    onClose={() => setEditingTask(null)}
                    onUpdate={() => {
                        onUpdate?.()
                        setEditingTask(null)
                    }}
                />
            )}
        </div>
    )
}
