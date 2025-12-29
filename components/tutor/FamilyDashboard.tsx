'use client'

import { useState } from 'react'
import TodayView from '../program/TodayView'
import FamilySummaryCard from './FamilySummaryCard'
import SharedProjectsList from './SharedProjectsList'
import { Plus, Pill, ShoppingCart } from 'lucide-react'

interface FamilyDashboardProps {
    user: any
    students: any[]
    onSelectStudent: (student: any) => void
    selectedStudentId?: string
}

export default function FamilyDashboard({ user, students, onSelectStudent, selectedStudentId }: FamilyDashboardProps) {
    const [viewMode, setViewMode] = useState<'personal' | 'family'>('family')

    return (
        <div className="flex flex-col h-full bg-slate-50">
            {/* Top Deck: Captain's Quarters (Personal Agenda Summary or Selection) */}
            <div className="p-6 pb-0">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-bold text-slate-800">Yönetim Masası</h2>
                    <div className="flex bg-white rounded-lg p-1 shadow-sm border border-slate-200">
                        <button
                            onClick={() => setViewMode('family')}
                            className={`px-3 py-1.5 text-xs font-bold rounded-md transition ${viewMode === 'family' ? 'bg-purple-100 text-purple-700' : 'text-slate-500 hover:bg-slate-50'}`}
                        >
                            👨‍👩‍👧‍👦 Aile
                        </button>
                        <button
                            onClick={() => setViewMode('personal')}
                            className={`px-3 py-1.5 text-xs font-bold rounded-md transition ${viewMode === 'personal' ? 'bg-indigo-100 text-indigo-700' : 'text-slate-500 hover:bg-slate-50'}`}
                        >
                            📅 Ajandam
                        </button>
                    </div>
                </div>

                {/* Family Horizontal Scroll Deck */}
                {viewMode === 'family' && (
                    <div className="space-y-6 mb-6">
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 animate-in slide-in-from-top-4 duration-500">
                            {/* Personal (Captain) Card */}
                            <FamilySummaryCard
                                student={{ name: 'Ben (Kaptan)', role: 'Yönetici', progress: 100, pending_tasks: 0 }}
                                onClick={() => setViewMode('personal')}
                                isSelected={false}
                            />

                            {/* Family Members */}
                            {students.map(student => (
                                <FamilySummaryCard
                                    key={student.id}
                                    student={student}
                                    onClick={() => onSelectStudent(student)}
                                    isSelected={selectedStudentId === student.id}
                                />
                            ))}

                            {/* Add Member Button */}
                            <button
                                className="flex flex-col items-center justify-center p-4 rounded-2xl border-2 border-dashed border-slate-300 text-slate-400 hover:bg-slate-100 hover:border-slate-400 transition gap-2"
                                onClick={() => alert('Yeni aile üyesi ekleme yakında!')}
                            >
                                <div className="bg-slate-200 p-2 rounded-full">
                                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                    </svg>
                                </div>
                                <span className="font-bold text-sm">Üye Ekle</span>
                            </button>
                        </div>

                        {/* Shared Projects (Shopping Lists, Medicine, etc.) */}
                        <div className="animate-in slide-in-from-top-4 duration-700 delay-100">
                            <div className="flex items-center justify-between mb-3">
                                <h3 className="font-bold text-slate-700 text-sm uppercase tracking-wider">Ortak Listeler</h3>
                                <div className="flex gap-2">
                                    <button
                                        onClick={async () => {
                                            const name = prompt('İlaç Listesi adı (örn. Ahmet İlaçlar):')
                                            if (name) {
                                                const { createProject, updateProject } = await import('@/app/actions/projects')
                                                const res = await createProject(name, 'İlaç takip ve hatırlatma')
                                                if (res.data) {
                                                    await updateProject(res.data.id, { settings: { type: 'medicine', module: 'medicine' } })
                                                    window.location.reload()
                                                }
                                            }
                                        }}
                                        className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded-lg font-bold hover:bg-red-200 transition flex items-center gap-1"
                                    >
                                        <Pill size={12} />
                                        <span>+ İlaç</span>
                                    </button>
                                    <button
                                        onClick={async () => {
                                            const name = prompt('Liste adı girin (örn. Market):')
                                            if (name) {
                                                const { createProject, updateProject } = await import('@/app/actions/projects')
                                                const res = await createProject(name, 'Aile ortak alışveriş listesi')
                                                if (res.data) {
                                                    await updateProject(res.data.id, { settings: { type: 'shopping', module: 'shopping' } })
                                                    window.location.reload()
                                                }
                                            }
                                        }}
                                        className="text-xs bg-indigo-100 text-indigo-700 px-2 py-1 rounded-lg font-bold hover:bg-indigo-200 transition flex items-center gap-1"
                                    >
                                        <ShoppingCart size={12} />
                                        <span>+ Liste</span>
                                    </button>
                                </div>
                            </div>
                            <SharedProjectsList userId={user.id} onSelect={(project) => {
                                // Dispatch event for DashboardTabs to handle project selection
                                window.dispatchEvent(new CustomEvent('open-project', { detail: { project } }))
                            }} />
                        </div>
                    </div>
                )}
            </div>

            {/* Main Deck: Detailed View */}
            <div className="flex-1 bg-white rounded-t-3xl shadow-xl overflow-hidden border-t border-slate-200">
                {viewMode === 'personal' ? (
                    <div className="h-full flex flex-col">
                        <div className="p-4 border-b border-indigo-50 bg-indigo-50/30 flex justify-between items-center">
                            <h3 className="font-bold text-indigo-900 flex items-center gap-2">
                                <span className="text-xl">🎓</span> Kişisel Takvimim
                            </h3>
                            <button onClick={() => setViewMode('family')} className="text-xs font-bold text-indigo-400">
                                Aileye Dön
                            </button>
                        </div>
                        <div className="flex-1 overflow-auto p-4">
                            <TodayView userId={user.id} isTutorMode={true} />
                        </div>
                    </div>
                ) : (
                    selectedStudentId ? (
                        <div className="h-full flex flex-col animate-in fade-in duration-300">
                            {/* Selected Student Toolbar */}
                            <div className="p-3 border-b border-purple-50 bg-purple-50/30 flex items-center justify-between">
                                <span className="text-xs font-bold text-purple-900 uppercase tracking-widest">
                                    {students.find(s => s.id === selectedStudentId)?.name} Seçildi
                                </span>
                            </div>
                            {/* We will let the parent component handle rendering the student's program here or show a placeholder if we want FamilyDashboard to be self-contained */}
                            <div className="flex-1 flex flex-col items-center justify-center text-slate-400 p-8 text-center">
                                <p>Yukarıdan bir üye seçtiniz.</p>
                                <p className="text-sm">Detaylı planlamayı görmek için alttaki "Program" sekmesini kullanın.</p>
                            </div>
                        </div>
                    ) : (
                        <div className="h-full flex flex-col items-center justify-center text-slate-400 p-8 text-center animate-in fade-in duration-300">
                            <span className="text-4xl mb-4 block opacity-50">🏠</span>
                            <h3 className="text-xl font-bold text-slate-600 mb-2">Aile Paneli</h3>
                            <p className="max-w-md mx-auto">
                                Tüm aileyi buradan yönetebilirsiniz. Detaylarını görmek veya görev atamak için yukarıdan birini seçin.
                            </p>
                        </div>
                    )
                )}
            </div>
        </div>
    )
}
