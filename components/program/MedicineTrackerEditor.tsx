'use client'

import { useState } from 'react'
import { Plus, Trash2, Clock, Pill, Calendar, Save } from 'lucide-react'
import { createProjectTask } from '@/app/actions/projects'

interface MedicineTrackerEditorProps {
    project: any
    tasks: any[] // These are existing recurring tasks (or regular tasks) for this project
    onUpdate: () => void
}

interface DoseSchedule {
    id: string
    label: string // e.g. "Sabah", "Akşam"
    time: string
    dosage: string
}

export default function MedicineTrackerEditor({ project, tasks, onUpdate }: MedicineTrackerEditorProps) {
    const [step, setStep] = useState(1)
    const [medName, setMedName] = useState('')
    const [frequency, setFrequency] = useState(2) // Default 2x daily
    const [schedules, setSchedules] = useState<DoseSchedule[]>([
        { id: '1', label: 'Sabah', time: '09:00', dosage: '1 adet' },
        { id: '2', label: 'Akşam', time: '21:00', dosage: '1 adet' }
    ])
    const [saving, setSaving] = useState(false)

    // Existing scheduled medicines (derived from tasks)
    // We look for tasks that have metadata type='medicine'
    const activeMedicines = tasks.filter(t => t.metadata?.type === 'medicine')

    // Group by medicine name to show cleaner list
    const groupedMedicines = activeMedicines.reduce((acc, task) => {
        const name = task.metadata?.medicine_name || task.title
        if (!acc[name]) acc[name] = []
        acc[name].push(task)
        return acc
    }, {} as Record<string, any[]>)

    const handleFrequencyChange = (freq: number) => {
        setFrequency(freq)
        // Generate placeholder schedules
        const newSchedules: DoseSchedule[] = []
        for (let i = 0; i < freq; i++) {
            let label = 'Doz ' + (i + 1)
            let time = '12:00'
            if (freq === 1) { label = 'Günlük'; time = '09:00' }
            else if (freq === 2) { label = i === 0 ? 'Sabah' : 'Akşam'; time = i === 0 ? '09:00' : '21:00' }
            else if (freq === 3) {
                const labels = ['Sabah', 'Öğle', 'Akşam'];
                const times = ['09:00', '13:00', '21:00'];
                label = labels[i]; time = times[i]
            }

            newSchedules.push({
                id: Math.random().toString(36).substr(2, 9),
                label,
                time,
                dosage: '1 adet'
            })
        }
        setSchedules(newSchedules)
    }

    const handleScheduleChange = (id: string, field: keyof DoseSchedule, value: string) => {
        setSchedules(prev => prev.map(s => s.id === id ? { ...s, [field]: value } : s))
    }

    const handleSave = async () => {
        if (!medName) return
        setSaving(true)

        // Create recurring tasks for each schedule
        // For MVP, we create a task that repeats daily.
        // We rely on the unified task system's recurring support.
        // If the system supports 'recurrence_rule' column or similar.
        // Assuming we just create a task with metadata for now, and the "Daily View" handles generating instances?
        // Or we create actual 7 tasks for the week?
        // Let's assume we create a base Recurring Task pattern. 
        // Since we don't have a robust recurring backend engine executing CRON jobs yet, 
        // we will create "Active" tasks for today, and rely on the user to "Reset" or we mark them as repeating.
        // Better: We add them as "Recurring Templates" in the project.
        // BUT for this specific request, the user wants "Reminders".
        // Let's create tasks with `recurrence: 'daily'` in metadata, and `TaskHierarchicalEditor` or `TodayView` needs to handle logic.
        // As a quick win: We simply create the task for TODAY. The "Habit/Daily" system needs to roll them over.
        // For now, let's just create standard tasks with special metadata so they show up.

        for (const schedule of schedules) {
            const title = `${medName} (${schedule.label})`
            // Create task
            const { createProjectTask, updateProjectTask } = await import('@/app/actions/projects')
            const res = await createProjectTask(project.id, title)

            if (res.data) {
                // Determine due date (today at specific time)
                const today = new Date().toISOString().split('T')[0]
                const dueAt = `${today}T${schedule.time}:00`

                await updateProjectTask(project.id, res.data.id, {
                    due_date: dueAt,
                    metadata: {
                        type: 'medicine',
                        medicine_name: medName,
                        dosage: schedule.dosage,
                        label: schedule.label,
                        recurrence: 'daily', // Marker for future recurring logic
                        time: schedule.time
                    }
                })
            }
        }

        setSaving(false)
        setStep(1)
        setMedName('')
        onUpdate()
    }

    const handleDeleteMedicine = async (name: string) => {
        if (!confirm(`${name} ilacının tüm dozlarını silmek istiyor musunuz?`)) return

        const tasksToDelete = groupedMedicines[name]
        const { deleteProjectTask } = await import('@/app/actions/projects')

        for (const task of tasksToDelete) {
            await deleteProjectTask(project.id, task.id)
        }
        onUpdate()
    }

    return (
        <div className="max-w-2xl mx-auto space-y-8 p-4">
            {/* Header */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-red-100 flex items-center gap-4">
                <div className="bg-red-100 p-3 rounded-full text-red-600">
                    <Pill size={32} />
                </div>
                <div>
                    <h2 className="text-2xl font-bold text-gray-900">{project.name}</h2>
                    <p className="text-gray-500 text-sm">İlaç Takip ve Hatırlatıcı</p>
                </div>
            </div>

            {/* Active Medicines List */}
            <div className="space-y-4">
                <h3 className="font-bold text-gray-700 uppercase tracking-wider text-sm">Aktif İlaçlar</h3>
                {Object.keys(groupedMedicines).length === 0 ? (
                    <div className="text-center py-8 bg-gray-50 rounded-2xl border border-dashed border-gray-200 text-gray-400">
                        Henüz ilaç eklenmemiş.
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {Object.entries(groupedMedicines).map(([name, tasks]) => (
                            <div key={name} className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm relative group">
                                <button
                                    onClick={() => handleDeleteMedicine(name)}
                                    className="absolute top-2 right-2 text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition p-2"
                                >
                                    <Trash2 size={16} />
                                </button>
                                <h4 className="font-bold text-gray-900 mb-2 flex items-center gap-2">
                                    <span className="w-2 h-2 rounded-full bg-green-500"></span>
                                    {name}
                                </h4>
                                <div className="space-y-2">
                                    {tasks.map((t: any) => (
                                        <div key={t.id} className="flex items-center justify-between text-xs bg-gray-50 p-2 rounded-lg">
                                            <span className="font-medium text-gray-600 flex items-center gap-1">
                                                <Clock size={12} />
                                                {t.metadata?.time || '??:??'}
                                            </span>
                                            <span className="text-gray-500">
                                                {t.metadata?.label}
                                            </span>
                                            <span className="font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">
                                                {t.metadata?.dosage}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Wizard */}
            <div className="bg-white rounded-2xl shadow-lg border border-indigo-50 overflow-hidden">
                <div className="bg-indigo-50/50 p-4 border-b border-indigo-50">
                    <h3 className="font-bold text-indigo-900 flex items-center gap-2">
                        <Plus size={18} />
                        Yeni İlaç Ekle
                    </h3>
                </div>

                <div className="p-6">
                    {step === 1 && (
                        <div className="space-y-4 animate-in slide-in-from-right duration-300">
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1">İlaç Adı</label>
                                <input
                                    type="text"
                                    placeholder="Örn: Antibiyotik, Vitamin..."
                                    className="w-full p-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-500 outline-none"
                                    value={medName}
                                    onChange={e => setMedName(e.target.value)}
                                    autoFocus
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-3">Günlük Kullanım Sıklığı</label>
                                <div className="flex gap-2">
                                    {[1, 2, 3, 4].map(num => (
                                        <button
                                            key={num}
                                            onClick={() => handleFrequencyChange(num)}
                                            className={`flex-1 py-3 rounded-xl font-bold border-2 transition ${frequency === num
                                                    ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                                                    : 'border-gray-100 hover:border-indigo-200 text-gray-500'
                                                }`}
                                        >
                                            {num}x
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <div className="pt-4 flex justify-end">
                                <button
                                    disabled={!medName}
                                    onClick={() => setStep(2)}
                                    className="bg-indigo-600 text-white px-6 py-2 rounded-xl font-bold hover:bg-indigo-700 disabled:opacity-50 transition"
                                >
                                    Devam Et →
                                </button>
                            </div>
                        </div>
                    )}

                    {step === 2 && (
                        <div className="space-y-6 animate-in slide-in-from-right duration-300">
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2">Saat ve Doz Planlaması</label>
                                <p className="text-xs text-gray-500 mb-4">Her kullanım için saati ve alınacak miktarı belirleyin.</p>

                                <div className="space-y-3">
                                    {schedules.map((schedule, index) => (
                                        <div key={schedule.id} className="flex flex-col sm:flex-row gap-3 p-3 bg-gray-50 rounded-xl border border-gray-100">
                                            <div className="flex-1">
                                                <label className="text-[10px] uppercase font-bold text-gray-400 block mb-1">Etiket</label>
                                                <input
                                                    type="text"
                                                    value={schedule.label}
                                                    onChange={(e) => handleScheduleChange(schedule.id, 'label', e.target.value)}
                                                    className="w-full bg-white border border-gray-200 rounded-lg p-2 text-sm font-medium"
                                                />
                                            </div>
                                            <div className="w-32">
                                                <label className="text-[10px] uppercase font-bold text-gray-400 block mb-1">Saat</label>
                                                <input
                                                    type="time"
                                                    value={schedule.time}
                                                    onChange={(e) => handleScheduleChange(schedule.id, 'time', e.target.value)}
                                                    className="w-full bg-white border border-gray-200 rounded-lg p-2 text-sm"
                                                />
                                            </div>
                                            <div className="flex-1">
                                                <label className="text-[10px] uppercase font-bold text-gray-400 block mb-1">Doz/Miktar</label>
                                                <input
                                                    type="text"
                                                    value={schedule.dosage}
                                                    onChange={(e) => handleScheduleChange(schedule.id, 'dosage', e.target.value)}
                                                    className="w-full bg-white border border-gray-200 rounded-lg p-2 text-sm"
                                                    placeholder="Örn: 1 kaşık"
                                                />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="pt-4 flex justify-between">
                                <button
                                    onClick={() => setStep(1)}
                                    className="text-gray-500 font-bold text-sm px-4 hover:text-gray-700"
                                >
                                    ← Geri
                                </button>
                                <button
                                    onClick={handleSave}
                                    disabled={saving}
                                    className="bg-green-600 text-white px-8 py-3 rounded-xl font-bold hover:bg-green-700 shadow-lg shadow-green-200 flex items-center gap-2"
                                >
                                    {saving ? 'Kaydediliyor...' : 'Planı Kaydet ✓'}
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
