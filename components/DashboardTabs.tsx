'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { User } from '@supabase/supabase-js'
import TodayView from './program/TodayView'
import MonthlyView from './program/MonthlyView'
import HabitsView from './program/HabitsView'
import WeeklyView from './program/WeeklyView'
import ProgressView from './program/ProgressView'
import ExamResultsView from './program/ExamResultsView'
import AIPersonaAnalysis from './tutor/AIPersonaAnalysis'
import { subscribeUserToPush } from '@/lib/notifications'
import LifeHubView from './program/LifeHubView'
import TutorToolsView from './tutor/TutorToolsView'
import { useOfflineSync } from '@/hooks/useOfflineSync'
import ProjectListView from './program/ProjectListView'
import ProjectDetailsView from './program/ProjectDetailsView'
import { Project } from '@/app/actions/projects'

type TabType = 'students' | 'program' | 'gelisim' | 'iletisim' | 'araclar'
type ProgramTabType = 'bugun' | 'haftalik' | 'aylik' | 'aliskanliklar' | 'takvim' | 'projeler'

interface DashboardTabsProps {
    user: User
    isTutorMode?: boolean
    initialPersonaId?: string
    initialTab?: TabType
}

export default function DashboardTabs({ user, isTutorMode = false, initialPersonaId, initialTab }: DashboardTabsProps) {
    const [activeTab, setActiveTab] = useState<TabType>(initialTab || (isTutorMode ? 'students' : 'program'))
    const [activeProgramTab, setActiveProgramTab] = useState<ProgramTabType>(isTutorMode ? 'haftalik' : 'bugun')
    const [selectedDate, setSelectedDate] = useState<Date | null>(null)
    const [isDropdownOpen, setIsDropdownOpen] = useState(false)
    const dropdownRef = useRef<HTMLDivElement>(null)
    const router = useRouter()
    const supabase = createClient()

    const [userProfile, setUserProfile] = useState<any>(null)
    const [personas, setPersonas] = useState<any[]>([])
    const [selectedPersona, setSelectedPersona] = useState<any>(null)
    const [loadingPersonas, setLoadingPersonas] = useState(false)
    const [activeTool, setActiveTool] = useState<string | null>(null)
    const [selectedProject, setSelectedProject] = useState<Project | null>(null)

    const themeColor = isTutorMode ? 'purple' : 'indigo'
    const targetUserId = selectedPersona ? selectedPersona.id : user.id

    // Initialize background sync for the persona's own data
    useOfflineSync(user.id)

    useEffect(() => {
        // Refresh push subscription if permission is granted
        if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
            subscribeUserToPush()
        }

        function handleClickOutside(event: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsDropdownOpen(false)
            }
        }
        document.addEventListener('mousedown', handleClickOutside)

        // Fetch user profile for roles
        async function loadProfile() {
            const { data } = await supabase
                .from('users')
                .select('roles')
                .eq('id', user.id)
                .single()
            setUserProfile(data)
        }
        loadProfile()

        if (isTutorMode) {
            loadPersonas()
        }

        return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [user.id, isTutorMode])

    const loadPersonas = async () => {
        setLoadingPersonas(true)
        const { getAssignedPersonas } = await import('@/app/actions/tutor')
        const result = await getAssignedPersonas()
        if (result.success) {
            setPersonas(result.data)
            if (initialPersonaId) {
                const persona = result.data.find((s: any) => s.id === initialPersonaId)
                if (persona) setSelectedPersona(persona)
            }
        }
        setLoadingPersonas(false)
    }

    const handleLogout = async () => {
        await supabase.auth.signOut()
        router.refresh()
        router.replace('/login')
    }

    const handleDateSelect = (date: Date) => {
        setSelectedDate(date)
        if (isTutorMode) {
            setActiveProgramTab('haftalik')
        } else {
            setActiveProgramTab('bugun')
        }
    }

    return (
        <div className={`flex flex-col h-screen ${isTutorMode ? 'bg-slate-50' : 'bg-gray-50'}`}>
            {/* Header */}
            <header className={`bg-white border-b border-gray-200 px-4 pt-12 pb-3 relative z-30 ${isTutorMode ? 'border-purple-100' : 'border-indigo-100'}`}>
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        {isTutorMode && selectedPersona && (
                            <button
                                onClick={() => {
                                    setSelectedPersona(null)
                                    setActiveTab('program')
                                }}
                                className="p-1 hover:bg-gray-100 rounded-full transition"
                            >
                                <svg className="w-6 h-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                                </svg>
                            </button>
                        )}
                        <div>
                            <h1 className="text-xl font-bold text-gray-900 leading-none">
                                {isTutorMode ? (selectedPersona ? selectedPersona.name : 'Yönetim Masası') : 'Haftalık Planım'}
                            </h1>
                            {isTutorMode && selectedPersona && (
                                <span className={`text-[10px] font-bold uppercase tracking-wider text-${themeColor}-600`}>
                                    {selectedPersona.role}
                                </span>
                            )}
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        {/* Contextual Communication Button */}
                        {(isTutorMode ? selectedPersona : true) && (
                            <button
                                onClick={() => alert('Görüntülü görüşme özelliği yakında aktif olacak')}
                                className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold transition ${isTutorMode
                                    ? 'bg-purple-100 text-purple-700 hover:bg-purple-200'
                                    : 'bg-indigo-100 text-indigo-700 hover:bg-indigo-200'
                                    }`}
                            >
                                <span>📹</span>
                                <span className="hidden sm:inline">Görüşme</span>
                            </button>
                        )}

                        <div className="relative" ref={dropdownRef}>
                            <button
                                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                                className="flex items-center gap-3 hover:bg-gray-50 p-1 rounded-lg transition"
                            >
                                <div className={`w-8 h-8 bg-${themeColor}-600 rounded-full flex items-center justify-center text-white text-sm font-medium`}>
                                    {user.email?.[0].toUpperCase()}
                                </div>
                            </button>

                            {isDropdownOpen && (
                                <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-100 py-1">
                                    <div className="px-4 py-2 border-b border-gray-100">
                                        <p className="text-[10px] text-gray-400 uppercase font-bold tracking-wider">Hesabım</p>
                                        <p className="text-sm text-gray-600 truncate">{user.email}</p>
                                    </div>
                                    {userProfile?.roles?.includes('coach') && (
                                        <button
                                            onClick={() => {
                                                router.push(isTutorMode ? '/' : '/tutor')
                                                setIsDropdownOpen(false)
                                            }}
                                            className={`w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-${themeColor}-50 hover:text-${themeColor}-600 transition flex items-center gap-2`}
                                        >
                                            <span>{isTutorMode ? '📅' : '🎓'}</span> {isTutorMode ? 'Kendi Ajandam' : 'Tutor Paneli'}
                                        </button>
                                    )}
                                    <button
                                        onClick={async () => {
                                            if (confirm('Sistemi sıfırlamak istediğinize emin misiniz? Bu işlem cihazınızdaki önbelleği temizleyecektir.')) {
                                                const { resetDatabase } = await import('@/lib/db')
                                                await resetDatabase()
                                            }
                                        }}
                                        className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition flex items-center gap-2 border-t border-gray-50 mt-1"
                                    >
                                        <span>🔄</span> Verileri Sıfırla
                                    </button>
                                    <button
                                        onClick={handleLogout}
                                        className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition flex items-center gap-2 border-t border-gray-50 mt-1"
                                    >
                                        <span>🚪</span> Çıkış Yap
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </header>

            {/* Content Area */}
            <div className="flex-1 overflow-auto pb-20">
                {activeTab === 'students' && isTutorMode && (
                    <div className="p-4 space-y-4">
                        <header className="mb-6">
                            <h2 className="text-xl font-bold text-gray-900">Öğrencilerim</h2>
                            <p className="text-xs text-gray-500 font-medium">Planlama yapmak için bir öğrenci seçin.</p>
                        </header>
                        <div className="grid grid-cols-1 gap-4">
                            {loadingPersonas ? (
                                <div className="text-center py-12 text-gray-500">Öğrenci listesi yükleniyor...</div>
                            ) : personas.length === 0 ? (
                                <div className="text-center py-12 text-gray-500 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
                                    <span className="text-4xl block mb-2">👶</span>
                                    Henüz atanmış bir öğrenciniz yok.
                                </div>
                            ) : (
                                personas.map((persona, index) => (
                                    <button
                                        key={`${persona.id}-${index}`}
                                        onClick={() => {
                                            setSelectedPersona(persona)
                                            setActiveTab('program')
                                        }}
                                        className="flex items-center gap-4 p-4 bg-white border border-gray-200 rounded-2xl hover:border-purple-300 hover:shadow-xl transition-all text-left group"
                                    >
                                        <div className="h-12 w-12 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center text-xl font-bold shadow-sm">
                                            {persona.name.charAt(0).toUpperCase()}
                                        </div>
                                        <div className="flex-1">
                                            <h3 className="font-bold text-gray-900 group-hover:text-purple-600 transition">
                                                {persona.name}
                                            </h3>
                                            <div className="flex items-center gap-2 mt-0.5">
                                                <span className="text-[10px] bg-purple-50 text-purple-600 px-2 py-0.5 rounded-full font-bold uppercase tracking-tight">
                                                    {persona.role}
                                                </span>
                                            </div>
                                        </div>
                                        <div className="text-purple-600 opacity-0 group-hover:opacity-100 transition translate-x-1 group-hover:translate-x-0 mr-2">
                                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M9 5l7 7-7 7" />
                                            </svg>
                                        </div>
                                    </button>
                                ))
                            )}
                        </div>
                    </div>
                )}

                {activeTab === 'program' && (
                    <div>
                        {/* Program Sub-tabs (Sticky) */}
                        <div className="sticky top-0 bg-gray-50/80 backdrop-blur-md z-20 flex gap-1 p-4 pb-0 overflow-x-auto border-b border-gray-100">
                            {!isTutorMode && (
                                <button
                                    onClick={() => setActiveProgramTab('bugun')}
                                    className={`py-2 px-3 rounded-t-lg text-sm font-bold transition whitespace-nowrap ${activeProgramTab === 'bugun'
                                        ? `bg-white text-indigo-600 shadow-sm`
                                        : 'text-gray-500 hover:bg-gray-50'
                                        }`}
                                >
                                    Bugün
                                </button>
                            )}
                            <button
                                onClick={() => setActiveProgramTab('haftalik')}
                                className={`py-2 px-3 rounded-t-lg text-sm font-bold transition whitespace-nowrap ${activeProgramTab === 'haftalik'
                                    ? `bg-white text-${themeColor}-600 shadow-sm`
                                    : 'text-gray-500 hover:bg-gray-50'
                                    }`}
                            >
                                Haftalık
                            </button>
                            <button
                                onClick={() => setActiveProgramTab('aylik')}
                                className={`py-2 px-3 rounded-t-lg text-sm font-bold transition whitespace-nowrap ${activeProgramTab === 'aylik'
                                    ? `bg-white text-${themeColor}-600 shadow-sm`
                                    : 'text-gray-500 hover:bg-gray-50'
                                    }`}
                            >
                                {isTutorMode ? 'Takvim' : 'Aylık'}
                            </button>
                            {isTutorMode && (
                                <button
                                    onClick={() => setActiveProgramTab('projeler')}
                                    className={`py-2 px-3 rounded-t-lg text-sm font-bold transition whitespace-nowrap ${activeProgramTab === 'projeler'
                                        ? `bg-white text-${themeColor}-600 shadow-sm`
                                        : 'text-gray-500 hover:bg-gray-50'
                                        }`}
                                >
                                    Projeler
                                </button>
                            )}
                            {!isTutorMode && (
                                <button
                                    onClick={() => setActiveProgramTab('aliskanliklar')}
                                    className={`py-2 px-3 rounded-t-lg text-sm font-bold transition whitespace-nowrap ${activeProgramTab === 'aliskanliklar'
                                        ? `bg-white text-indigo-600 shadow-sm`
                                        : 'text-gray-500 hover:bg-gray-50'
                                        }`}
                                >
                                    Alışkanlıklar
                                </button>
                            )}
                        </div>

                        {/* Program Content */}
                        <div className="bg-white">
                            {isTutorMode && !selectedPersona ? (
                                <div className="p-12 text-center text-gray-500 font-medium">
                                    <span className="text-4xl block mb-4 opacity-20">📅</span>
                                    Planlamayı görmek için lütfen önce bir öğrenci seçin.
                                </div>
                            ) : (
                                <>
                                    {activeProgramTab === 'bugun' && (
                                        <div className="p-4 pt-0">
                                            <TodayView userId={targetUserId} initialDate={selectedDate} isTutorMode={isTutorMode} />
                                        </div>
                                    )}
                                    {activeProgramTab === 'haftalik' && (
                                        <WeeklyView
                                            userId={targetUserId}
                                            onDateSelect={handleDateSelect}
                                            isTutorMode={isTutorMode}
                                            initialDate={selectedDate}
                                            relationshipId={selectedPersona?.relationship_id}
                                        />
                                    )}
                                    {activeProgramTab === 'aylik' && (
                                        <MonthlyView userId={targetUserId} onDateSelect={handleDateSelect} />
                                    )}
                                    {activeProgramTab === 'aliskanliklar' && (
                                        <div className="p-4 pt-0">
                                            <HabitsView userId={targetUserId} />
                                        </div>
                                    )}
                                    {activeProgramTab === 'projeler' && (
                                        <div className="p-4 pt-0">
                                            {selectedProject ? (
                                                <ProjectDetailsView project={selectedProject} onBack={() => setSelectedProject(null)} />
                                            ) : (
                                                <ProjectListView
                                                    onProjectSelect={setSelectedProject}
                                                    userId={selectedPersona?.id}
                                                    filter="coach"
                                                />
                                            )}
                                        </div>
                                    )}
                                </>
                            )}
                        </div>
                    </div>
                )}

                {activeTab === 'gelisim' && (
                    <div className="p-4 space-y-8">
                        {isTutorMode && selectedPersona && (
                            <AIPersonaAnalysis personaId={targetUserId} />
                        )}
                        <ProgressView userId={targetUserId} />
                        {selectedPersona && (
                            <ExamResultsView userId={targetUserId} readOnly={false} />
                        )}
                    </div>
                )}

                {activeTab === 'araclar' && (
                    <div className="p-4">
                        {activeTool === 'nutrition' && (
                            <div className="space-y-4">
                                <button
                                    onClick={() => setActiveTool(null)}
                                    className="flex items-center gap-2 text-sm font-bold text-gray-500 hover:text-gray-700 mb-4"
                                >
                                    ← Araçlara Dön
                                </button>
                                <div className="p-8 text-center bg-white rounded-2xl border-2 border-dashed border-gray-200">
                                    <p className="text-gray-600 font-bold mb-2">🥗 Beslenme Günlüğü Güncelleniyor</p>
                                    <p className="text-sm text-gray-400">Yeni birleşik mimariye geçiş nedeniyle bu bölüm geçici olarak devre dışıdır. Görevlerinizi "Program" sekmesinden takip edebilirsiniz.</p>
                                </div>
                            </div>
                        )}
                        {activeTool === 'music' && (
                            <div className="space-y-4">
                                <button
                                    onClick={() => setActiveTool(null)}
                                    className="flex items-center gap-2 text-sm font-bold text-gray-500 hover:text-gray-700 mb-4"
                                >
                                    ← Araçlara Dön
                                </button>
                                <div className="p-8 text-center bg-white rounded-2xl border-2 border-dashed border-gray-200">
                                    <p className="text-gray-600 font-bold mb-2">🎸 Müzik Günlüğü Güncelleniyor</p>
                                    <p className="text-sm text-gray-400">Yeni birleşik mimariye geçiş nedeniyle bu bölüm geçici olarak devre dışıdır. Görevlerinizi "Program" sekmesinden takip edebilirsiniz.</p>
                                </div>
                            </div>
                        )}
                        {activeTool === 'projects' && (
                            <div className="space-y-4">
                                <button
                                    onClick={() => {
                                        if (selectedProject) setSelectedProject(null)
                                        else setActiveTool(null)
                                    }}
                                    className="flex items-center gap-2 text-sm font-bold text-gray-500 hover:text-gray-700 mb-4"
                                >
                                    ← {selectedProject ? 'Projelere Dön' : 'Araçlara Dön'}
                                </button>
                                {selectedProject ? (
                                    <ProjectDetailsView project={selectedProject} onBack={() => setSelectedProject(null)} />
                                ) : (
                                    <ProjectListView
                                        onProjectSelect={setSelectedProject}
                                        userId={selectedPersona?.id}
                                        filter="personal"
                                    />
                                )}
                            </div>
                        )}
                        {!activeTool && (
                            isTutorMode ? <TutorToolsView
                                onSelectTool={(tool) => setActiveTool(tool)}
                                selectedStudentId={selectedPersona?.id}
                            /> : <div className="space-y-4">
                                <h2 className="text-xl font-bold text-gray-900">Araçlarım</h2>
                                <div className="grid grid-cols-2 gap-4">
                                    <button
                                        onClick={() => setActiveTool('nutrition')}
                                        className="bg-white border border-gray-200 rounded-2xl p-6 text-center hover:border-indigo-500 transition shadow-sm group"
                                    >
                                        <span className="text-3xl block mb-2 group-hover:scale-110 transition">🍏</span>
                                        <h3 className="font-bold text-gray-900">Diyet Günlüğüm</h3>
                                        <p className="text-[10px] text-gray-500 mt-1">Ölçüm ve yemek takibi</p>
                                    </button>
                                    <button
                                        onClick={() => setActiveTool('music')}
                                        className="bg-white border border-gray-200 rounded-2xl p-6 text-center hover:border-indigo-500 transition shadow-sm group"
                                    >
                                        <span className="text-3xl block mb-2 group-hover:scale-110 transition">🎸</span>
                                        <h3 className="font-bold text-gray-900">Enstrüman Günlüğüm</h3>
                                        <p className="text-[10px] text-gray-500 mt-1">Repertuvar ve pratik takibi</p>
                                    </button>
                                    <button
                                        onClick={() => setActiveTool('projects')}
                                        className="bg-white border border-gray-200 rounded-2xl p-6 text-center hover:border-indigo-500 transition shadow-sm group"
                                    >
                                        <span className="text-3xl block mb-2 group-hover:scale-110 transition">🏗️</span>
                                        <h3 className="font-bold text-gray-900">Projelerim</h3>
                                        <p className="text-[10px] text-gray-500 mt-1">Hedef ve süreç yönetimi</p>
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Bottom Tab Bar */}
            <nav className={`fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-4 py-2 safe-area-bottom z-30`}>
                <div className={`flex items-center justify-around ${isTutorMode ? 'max-w-4xl' : 'max-w-2xl'} mx-auto`}>
                    {isTutorMode && (
                        <button
                            onClick={() => setActiveTab('students')}
                            className={`flex flex-col items-center gap-1 py-1.5 px-3 rounded-xl transition ${activeTab === 'students' ? 'text-purple-600 bg-purple-50' : 'text-gray-400 hover:text-gray-600'}`}
                        >
                            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                            </svg>
                            <span className="text-[10px] font-black uppercase tracking-tight">Öğrencilerim</span>
                        </button>
                    )}

                    <button
                        onClick={() => {
                            if (isTutorMode && !selectedPersona) {
                                setActiveTab('students')
                                return
                            }
                            setActiveTab('program')
                        }}
                        className={`flex flex-col items-center gap-1 py-1.5 px-3 rounded-xl transition ${activeTab === 'program' ? `text-${themeColor}-600 bg-${themeColor}-50` : 'text-gray-400 hover:text-gray-600'
                            } ${isTutorMode && !selectedPersona ? 'opacity-30' : ''}`}
                    >
                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        <span className="text-[10px] font-black uppercase tracking-tight">{isTutorMode ? 'Planlama' : 'Program'}</span>
                    </button>

                    <button
                        onClick={() => {
                            if (isTutorMode && !selectedPersona) {
                                setActiveTab('students')
                                return
                            }
                            setActiveTab('gelisim')
                        }}
                        className={`flex flex-col items-center gap-1 py-1.5 px-3 rounded-xl transition ${activeTab === 'gelisim' ? `text-${themeColor}-600 bg-${themeColor}-50` : 'text-gray-400 hover:text-gray-600'
                            } ${isTutorMode && !selectedPersona ? 'opacity-30' : ''}`}
                    >
                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                        </svg>
                        <span className="text-[10px] font-black uppercase tracking-tight">{isTutorMode ? 'Analiz' : 'Gelişim'}</span>
                    </button>

                    <button
                        onClick={() => setActiveTab('araclar')}
                        className={`flex flex-col items-center gap-1 py-1.5 px-3 rounded-xl transition ${activeTab === 'araclar' ? `text-${themeColor}-600 bg-${themeColor}-50` : 'text-gray-400 hover:text-gray-600'
                            }`}
                    >
                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        <span className="text-[10px] font-black uppercase tracking-tight">{isTutorMode ? 'Yönetim' : 'Araçlar'}</span>
                    </button>
                </div>
            </nav>
        </div >
    )
}
