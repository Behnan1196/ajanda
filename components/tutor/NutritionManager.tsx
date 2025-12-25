'use client'

import { useState, useEffect } from 'react'
import { getMeasurements, addMeasurement, getDietPlans, upsertDietPlan } from '@/app/actions/nutrition'
import { getCoachSubjects, deleteSubject } from '@/app/actions/subjects'
import SubjectManager from '@/components/tutor/SubjectManager'
import LibraryItemManager from '@/components/tutor/LibraryItemManager'
import AssignProgramModal from '@/components/tutor/AssignProgramModal'

interface NutritionManagerProps {
    userId: string
}

export default function NutritionManager({ userId }: NutritionManagerProps) {
    const [activeSection, setActiveSection] = useState<'measurements' | 'diet' | 'templates'>('measurements')
    const [measurements, setMeasurements] = useState<any[]>([])
    const [dietPlans, setDietPlans] = useState<any[]>([])
    const [subjects, setSubjects] = useState<any[]>([])
    const [loading, setLoading] = useState(true)

    // Template management states
    const [showSubjectManager, setShowSubjectManager] = useState(false)
    const [showLibrary, setShowLibrary] = useState(false)
    const [showAssignModal, setShowAssignModal] = useState(false)
    const [selectedSubject, setSelectedSubject] = useState<any>(null)
    const [editingSubject, setEditingSubject] = useState<any>(null)

    // Form states
    const [weight, setWeight] = useState('')
    const [fat, setFat] = useState('')
    const [waist, setWaist] = useState('')
    const [hip, setHip] = useState('')
    const [notes, setNotes] = useState('')

    useEffect(() => {
        loadData()
    }, [userId])

    const loadData = async () => {
        setLoading(true)
        const [mRes, dRes, sRes] = await Promise.all([
            getMeasurements(userId),
            getDietPlans(userId),
            getCoachSubjects('nutrition')
        ])
        if (mRes.data) setMeasurements(mRes.data)
        if (dRes.data) setDietPlans(dRes.data)
        setSubjects(sRes)
        setLoading(false)
    }

    const handleDeleteSubject = async (id: string) => {
        if (!confirm('Bu programı silmek istediğinize emin misiniz?')) return
        const res = await deleteSubject(id)
        if (res.success) loadData()
    }

    const handleAddMeasurement = async (e: React.FormEvent) => {
        e.preventDefault()
        const res = await addMeasurement(
            userId,
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
                <button
                    onClick={() => setActiveSection('templates')}
                    className={`flex-1 py-3 text-sm font-semibold transition ${activeSection === 'templates' ? 'text-purple-600 border-b-2 border-purple-600' : 'text-gray-500 hover:text-gray-700'}`}
                >
                    🥗 Şablonlar
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
                ) : activeSection === 'diet' ? (
                    <DietPlanEditor userId={userId} existingPlans={dietPlans} onUpdate={loadData} />
                ) : (
                    <div className="space-y-6">
                        <div className="flex items-center justify-between">
                            <h3 className="text-lg font-bold text-gray-900">Beslenme Programı Kütüphanesi</h3>
                            <button
                                onClick={() => {
                                    setEditingSubject(null)
                                    setShowSubjectManager(true)
                                }}
                                className="px-4 py-2 bg-purple-600 text-white rounded-xl text-sm font-bold hover:bg-purple-700 transition shadow-sm"
                            >
                                + Yeni Şablon Program
                            </button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {subjects.map(subject => (
                                <div key={subject.id} className="group relative p-4 bg-white border border-gray-200 rounded-2xl hover:border-purple-300 hover:shadow-md transition">
                                    <div className="flex items-center justify-between mb-4">
                                        <div className="flex items-center gap-3">
                                            <span className="text-2xl">{subject.icon || '🍏'}</span>
                                            <div>
                                                <h4 className="font-bold text-gray-900">{subject.name}</h4>
                                                <p className="text-[10px] text-gray-400 uppercase font-bold tracking-wider">{subject.category || 'BESLENME'}</p>
                                            </div>
                                        </div>
                                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition">
                                            <button
                                                onClick={() => {
                                                    setSelectedSubject(subject)
                                                    setShowLibrary(true)
                                                }}
                                                className="p-1.5 text-gray-400 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition"
                                                title="Görevleri Düzenle"
                                            >
                                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                                                </svg>
                                            </button>
                                            <button
                                                onClick={() => {
                                                    setSelectedSubject(subject)
                                                    setShowAssignModal(true)
                                                }}
                                                className="p-1.5 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition"
                                                title="Öğrenciye Ata"
                                            >
                                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                                </svg>
                                            </button>
                                            <button
                                                onClick={() => {
                                                    setEditingSubject(subject)
                                                    setShowSubjectManager(true)
                                                }}
                                                className="p-1.5 text-gray-400 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition"
                                                title="Programı Düzenle"
                                            >
                                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                                </svg>
                                            </button>
                                            <button
                                                onClick={() => handleDeleteSubject(subject.id)}
                                                className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition"
                                                title="Sil"
                                            >
                                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                </svg>
                                            </button>
                                        </div>
                                    </div>
                                    <div className="text-xs text-gray-500">
                                        {subject.topics?.length || 0} Alt Başlık • {subject.description || 'Beslenme programı şablonu.'}
                                    </div>
                                </div>
                            ))}
                            {subjects.length === 0 && (
                                <div className="col-span-full py-12 text-center bg-gray-50 rounded-2xl border border-dashed border-gray-200">
                                    <p className="text-gray-400 text-sm">Henüz bir beslenme şablonu oluşturulmadı.</p>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>

            {/* Modals */}
            {showSubjectManager && (
                <SubjectManager
                    editingSubject={editingSubject}
                    onClose={() => setShowSubjectManager(false)}
                    onSuccess={() => {
                        setShowSubjectManager(false)
                        loadData()
                    }}
                />
            )}
            {showLibrary && selectedSubject && (
                <LibraryItemManager
                    subject={selectedSubject}
                    onClose={() => setShowLibrary(false)}
                />
            )}
            {showAssignModal && selectedSubject && (
                <AssignProgramModal
                    subject={selectedSubject}
                    onClose={() => setShowAssignModal(false)}
                    onSuccess={() => setShowAssignModal(false)}
                />
            )}
        </div>
    )
}

function DietPlanEditor({ userId, existingPlans, onUpdate }: { userId: string, existingPlans: any[], onUpdate: () => void }) {
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
        const res = await upsertDietPlan(userId, selectedDay, mealType, content)
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
