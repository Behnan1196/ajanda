'use client'

import { useState, useEffect } from 'react'
import { Users, Calendar, BarChart3, BookOpen, ArrowLeft } from 'lucide-react'
import TodayView from '../program/TodayView'
import WeeklyView from '../program/WeeklyView'
import ProgressView from '../program/ProgressView'
import ExamResultsView from '../program/ExamResultsView'
import AIPersonaAnalysis from './AIPersonaAnalysis'
import TutorToolsView from './TutorToolsView'
import { getAssignedPersonas } from '@/app/actions/tutor'

interface CoachingAppViewProps {
    onClose: () => void
    userId: string // Coach's ID
}

type CoachingTab = 'weekly' | 'analysis' | 'templates'

export default function CoachingAppView({ onClose, userId }: CoachingAppViewProps) {
    const [personas, setPersonas] = useState<any[]>([])
    const [selectedPersona, setSelectedPersona] = useState<any>(null)
    const [activeTab, setActiveTab] = useState<CoachingTab>('weekly')
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        loadPersonas()
    }, [])

    const loadPersonas = async () => {
        setLoading(true)
        const result = await getAssignedPersonas()
        if (result.success) {
            // Filter out 'Self' if it exists in the action, but we already removed it in tutor.ts
            setPersonas(result.data)
        }
        setLoading(false)
    }

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center p-12 text-gray-500">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mb-4"></div>
                <p className="font-medium">Öğrenci verileri yükleniyor...</p>
            </div>
        )
    }

    // Step 1: Student Selection
    if (!selectedPersona) {
        return (
            <div className="p-6 max-w-4xl mx-auto animate-in fade-in slide-in-from-bottom-4">
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h2 className="text-2xl font-black text-gray-900 tracking-tight">Koçluk Masası</h2>
                        <p className="text-gray-500 text-sm">Yönetmek istediğiniz öğrenciyi seçin.</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-xl font-bold transition flex items-center gap-2"
                    >
                        <ArrowLeft size={18} /> Ana Menü
                    </button>
                </div>

                {personas.length === 0 ? (
                    <div className="text-center py-20 bg-white border-2 border-dashed border-gray-100 rounded-3xl">
                        <span className="text-5xl block mb-4">Empty</span>
                        <p className="text-gray-500 font-medium">Henüz atanmış bir öğrenciniz bulunmuyor.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {personas.map(persona => (
                            <button
                                key={persona.id}
                                onClick={() => setSelectedPersona(persona)}
                                className="flex items-center gap-4 p-5 bg-white border border-gray-100 rounded-2xl hover:border-purple-300 hover:shadow-xl hover:shadow-purple-50 transition-all text-left group"
                            >
                                <div className="h-14 w-14 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center text-2xl font-bold shadow-sm">
                                    {persona.name.charAt(0).toUpperCase()}
                                </div>
                                <div className="flex-1">
                                    <h3 className="font-bold text-gray-900 group-hover:text-purple-600 transition truncate underline-offset-4 decoration-2">
                                        {persona.name}
                                    </h3>
                                    <span className="text-[10px] bg-purple-50 text-purple-600 px-2 py-0.5 rounded-full font-bold uppercase tracking-tight mt-1 inline-block">
                                        {persona.role}
                                    </span>
                                </div>
                                <Users size={20} className="text-purple-300 group-hover:text-purple-600 transition" />
                            </button>
                        ))}
                    </div>
                )}
            </div>
        )
    }

    // Step 2: Student Management Cockpit
    return (
        <div className="flex flex-col h-full animate-in fade-in duration-500">
            {/* Context Header */}
            <div className="bg-purple-600 text-white p-4 sticky top-0 z-40 flex items-center justify-between shadow-md">
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => setSelectedPersona(null)}
                        className="p-2 hover:bg-white/20 rounded-full transition"
                    >
                        <ArrowLeft size={20} />
                    </button>
                    <div>
                        <h3 className="font-bold text-sm leading-none">{selectedPersona.name}</h3>
                        <p className="text-[10px] opacity-75 uppercase font-black tracking-tighter mt-1">Koçluk Yönetimi</p>
                    </div>
                </div>
                <div className="flex bg-white/10 p-1 rounded-xl">
                    <button
                        onClick={() => setActiveTab('weekly')}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${activeTab === 'weekly' ? 'bg-white text-purple-600' : 'hover:bg-white/10'}`}
                    >
                        Plan
                    </button>
                    <button
                        onClick={() => setActiveTab('analysis')}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${activeTab === 'analysis' ? 'bg-white text-purple-600' : 'hover:bg-white/10'}`}
                    >
                        Analiz
                    </button>
                    <button
                        onClick={() => setActiveTab('templates')}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${activeTab === 'templates' ? 'bg-white text-purple-600' : 'hover:bg-white/10'}`}
                    >
                        Şablonlar
                    </button>
                </div>
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-y-auto bg-gray-50 pb-10">
                {activeTab === 'weekly' && (
                    <div className="p-0">
                        <WeeklyView
                            userId={selectedPersona.id}
                            isTutorMode={true}
                            relationshipId={selectedPersona.relationship_id}
                        />
                    </div>
                )}

                {activeTab === 'analysis' && (
                    <div className="p-4 space-y-6 max-w-4xl mx-auto">
                        <AIPersonaAnalysis personaId={selectedPersona.id} />
                        <ProgressView userId={selectedPersona.id} />
                        <ExamResultsView userId={selectedPersona.id} readOnly={false} />
                    </div>
                )}

                {activeTab === 'templates' && (
                    <div className="p-0">
                        <TutorToolsView
                            onSelectTool={() => { }}
                            selectedStudentId={selectedPersona.id}
                        />
                    </div>
                )}
            </div>
        </div>
    )
}
