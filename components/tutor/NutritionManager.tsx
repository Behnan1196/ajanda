'use client'

import { useState, useEffect } from 'react'
import { getMeasurements, addMeasurement, getDietPlans, upsertDietPlan } from '@/app/actions/nutrition'

interface NutritionManagerProps {
    personaId: string
}

export default function NutritionManager({ personaId }: NutritionManagerProps) {
    const [activeSection, setActiveSection] = useState<'measurements' | 'diet'>('measurements')
    const [measurements, setMeasurements] = useState<any[]>([])
    const [dietPlans, setDietPlans] = useState<any[]>([])
    const [loading, setLoading] = useState(true)

    // Form states
    const [weight, setWeight] = useState('')
    const [fat, setFat] = useState('')
    const [waist, setWaist] = useState('')
    const [hip, setHip] = useState('')
    const [notes, setNotes] = useState('')

    useEffect(() => {
        loadData()
    }, [personaId])

    const loadData = async () => {
        setLoading(true)
        const [mRes, dRes] = await Promise.all([
            getMeasurements(personaId),
            getDietPlans(personaId)
        ])
        if (mRes.data) setMeasurements(mRes.data)
        if (dRes.data) setDietPlans(dRes.data)
        setLoading(false)
    }

    const handleAddMeasurement = async (e: React.FormEvent) => {
        e.preventDefault()
        const res = await addMeasurement(
            personaId,
            parseFloat(weight),
            parseFloat(fat),
            parseFloat(waist),
            parseFloat(hip),
            notes
        )
        if (res.success) {
            setWeight(''); setFat(''); setWaist(''); setHip(''); setNotes('')
            loadData()
        } else {
            alert('Hata: ' + res.error)
        }
    }

    if (loading) return <div className="p-8 text-center text-gray-500">Yükleniyor...</div>

    return (
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
            <div className="flex border-b border-gray-200">
                <button
                    onClick={() => setActiveSection('measurements')}
                    className={`flex-1 py-3 text-sm font-semibold transition ${activeSection === 'measurements' ? 'text-purple-600 border-b-2 border-purple-600' : 'text-gray-500 hover:text-gray-700'}`}
                >
                    Ölçüm Takibi
                </button>
                <button
                    onClick={() => setActiveSection('diet')}
                    className={`flex-1 py-3 text-sm font-semibold transition ${activeSection === 'diet' ? 'text-purple-600 border-b-2 border-purple-600' : 'text-gray-500 hover:text-gray-700'}`}
                >
                    Beslenme Planı
                </button>
            </div>

            <div className="p-6">
                {activeSection === 'measurements' ? (
                    <div className="space-y-8">
                        {/* Add Measurement Form */}
                        <form onSubmit={handleAddMeasurement} className="bg-purple-50 rounded-xl p-4 border border-purple-100">
                            <h3 className="text-sm font-bold text-purple-900 mb-4">Yeni Ölçüm Kaydet</h3>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                                <div>
                                    <label className="block text-[10px] font-bold text-purple-700 uppercase mb-1">Kilo (kg)</label>
                                    <input
                                        type="number" step="0.1" required
                                        value={weight} onChange={e => setWeight(e.target.value)}
                                        className="w-full px-3 py-2 bg-white border border-purple-200 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none text-sm"
                                    />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-bold text-purple-700 uppercase mb-1">Yağ (%)</label>
                                    <input
                                        type="number" step="0.1" required
                                        value={fat} onChange={e => setFat(e.target.value)}
                                        className="w-full px-3 py-2 bg-white border border-purple-200 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none text-sm"
                                    />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-bold text-purple-700 uppercase mb-1">Bel (cm)</label>
                                    <input
                                        type="number" step="0.1" required
                                        value={waist} onChange={e => setWaist(e.target.value)}
                                        className="w-full px-3 py-2 bg-white border border-purple-200 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none text-sm"
                                    />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-bold text-purple-700 uppercase mb-1">Kalça (cm)</label>
                                    <input
                                        type="number" step="0.1" required
                                        value={hip} onChange={e => setHip(e.target.value)}
                                        className="w-full px-3 py-2 bg-white border border-purple-200 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none text-sm"
                                    />
                                </div>
                            </div>
                            <div className="mb-4">
                                <label className="block text-[10px] font-bold text-purple-700 uppercase mb-1">Notlar</label>
                                <textarea
                                    value={notes} onChange={e => setNotes(e.target.value)}
                                    className="w-full px-3 py-2 bg-white border border-purple-200 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none text-sm"
                                    rows={2}
                                />
                            </div>
                            <button
                                type="submit"
                                className="w-full py-2 bg-purple-600 text-white rounded-lg font-bold text-sm hover:bg-purple-700 transition"
                            >
                                Ölçümü Kaydet
                            </button>
                        </form>

                        {/* History Table */}
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-sm">
                                <thead className="text-gray-500 border-b">
                                    <tr>
                                        <th className="py-2">Tarih</th>
                                        <th className="py-2">Kilo</th>
                                        <th className="py-2">Yağ %</th>
                                        <th className="py-2">Bel/Kalça</th>
                                        <th className="py-2">Not</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y">
                                    {measurements.map(m => (
                                        <tr key={m.id} className="hover:bg-gray-50 transition">
                                            <td className="py-3 font-medium text-gray-900">
                                                {new Date(m.recorded_at).toLocaleDateString('tr-TR')}
                                            </td>
                                            <td className="py-3 text-purple-700 font-bold">{m.weight} kg</td>
                                            <td className="py-3 text-gray-600">{m.fat_percentage}%</td>
                                            <td className="py-3 text-gray-600">{m.waist_circumference} / {m.hip_circumference}</td>
                                            <td className="py-3 text-gray-400 text-xs italic truncate max-w-[150px]">{m.notes}</td>
                                        </tr>
                                    ))}
                                    {measurements.length === 0 && (
                                        <tr>
                                            <td colSpan={5} className="py-8 text-center text-gray-400 italic">Henüz ölçüm kaydı bulunmuyor.</td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                ) : (
                    <DietPlanEditor personaId={personaId} existingPlans={dietPlans} onUpdate={loadData} />
                )}
            </div>
        </div>
    )
}

function DietPlanEditor({ personaId, existingPlans, onUpdate }: { personaId: string, existingPlans: any[], onUpdate: () => void }) {
    const days = ['Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi', 'Pazar']
    const mealTypes = ['Kahvaltı', 'Öğle', 'Akşam', 'Ara Öğün']

    const [selectedDay, setSelectedDay] = useState(0)
    const [planData, setPlanData] = useState<any>({})
    const [saving, setSaving] = useState(false)

    useEffect(() => {
        const initialData: any = {}
        existingPlans.forEach(p => {
            if (!initialData[p.day_of_week]) initialData[p.day_of_week] = {}
            initialData[p.day_of_week][p.meal_type] = p.content
        })
        setPlanData(initialData)
    }, [existingPlans])

    const handleSave = async (mealType: string) => {
        setSaving(true)
        const content = planData[selectedDay]?.[mealType] || ''
        const res = await upsertDietPlan(personaId, selectedDay, mealType, content)
        setSaving(false)
        if (res.success) onUpdate()
        else alert('Kaydetme hatası: ' + res.error)
    }

    return (
        <div className="space-y-6">
            <div className="flex gap-1 overflow-x-auto pb-2">
                {days.map((day, idx) => (
                    <button
                        key={day}
                        onClick={() => setSelectedDay(idx)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition whitespace-nowrap ${selectedDay === idx ? 'bg-purple-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                    >
                        {day}
                    </button>
                ))}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {mealTypes.map(meal => (
                    <div key={meal} className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                        <div className="flex items-center justify-between mb-2">
                            <h4 className="text-xs font-bold text-gray-900 uppercase tracking-wider">{meal}</h4>
                            <button
                                onClick={() => handleSave(meal)}
                                disabled={saving}
                                className="text-[10px] font-bold text-purple-600 hover:text-purple-700 disabled:opacity-50"
                            >
                                {saving ? '...' : 'Değişikliği Kaydet'}
                            </button>
                        </div>
                        <textarea
                            value={planData[selectedDay]?.[meal] || ''}
                            onChange={(e) => {
                                const newData = { ...planData }
                                if (!newData[selectedDay]) newData[selectedDay] = {}
                                newData[selectedDay][meal] = e.target.value
                                setPlanData(newData)
                            }}
                            className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none text-sm h-32"
                            placeholder={`${meal} için menü detayı girin...`}
                        />
                    </div>
                ))}
            </div>
        </div>
    )
}
