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
import NutritionManager from './tutor/NutritionManager'
import NutritionDiary from './program/NutritionDiary'
import MusicManager from './tutor/MusicManager'
import MusicDiary from './program/MusicDiary'
import DailyPracticeCard from './program/DailyPracticeCard'
import { useOfflineSync } from '@/hooks/useOfflineSync'
import ProjectListView from './program/ProjectListView'
import ProjectDetailsView from './program/ProjectDetailsView'
import { Project } from '@/app/actions/projects'

type TabType = 'program' | 'gelisim' | 'iletisim' | 'araclar'
type ProgramTabType = 'bugun' | 'haftalik' | 'aylik' | 'aliskanliklar'

interface DashboardTabsProps {
    user: User
    isTutorMode?: boolean
    initialPersonaId?: string
    initialTab?: TabType
}

export default function DashboardTabs({ user, isTutorMode = false, initialPersonaId, initialTab }: DashboardTabsProps) {
    const [activeTab, setActiveTab] = useState<TabType>(initialTab || 'program')
    const [activeProgramTab, setActiveProgramTab] = useState<ProgramTabType>('bugun')
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
        setActiveProgramTab('bugun')
    }

    return (
        <div className="flex flex-col h-screen">
            {/* Header */}
            <header className="bg-white border-b border-gray-200 px-4 pt-12 pb-3 relative z-30">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        {isTutorMode && selectedPersona && (
                            <button
                                onClick={() => {
                                    setSelectedPersona(null)
                                    if (activeTab === 'gelisim' || activeTab === 'iletisim') {
                                        setActiveTab('program')
                                    }
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
                                {isTutorMode ? (selectedPersona ? selectedPersona.name : 'Personalarım') : 'Yaşam Planlayıcı'}
                            </h1>
                            {isTutorMode && selectedPersona && (
                                <span className={`text-[10px] font-bold uppercase tracking-wider text-${themeColor}-600`}>
                                    {selectedPersona.role}
                                </span>
                            )}
                        </div>
                    </div>
                    <div className="relative" ref={dropdownRef}>
                        <button
                            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                            className="flex items-center gap-3 hover:bg-gray-50 p-1 rounded-lg transition"
                        >
                            <span className="text-sm text-gray-600 hidden sm:block">{user.email}</span>
                            <div className={`w-8 h-8 bg-${themeColor}-600 rounded-full flex items-center justify-center text-white text-sm font-medium`}>
                                {user.email?.[0].toUpperCase()}
                            </div>
                        </button>

                        {/* Dropdown Menu */}
                        {isDropdownOpen && (
                            <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-100 py-1">
                                <div className="px-4 py-2 border-b border-gray-100 sm:hidden">
                                    <p className="text-sm text-gray-600 truncate">{user.email}</p>
                                </div>
                                {userProfile?.roles?.includes('admin') && (
                                    <button
                                        onClick={() => router.push('/admin')}
                                        className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-indigo-50 hover:text-indigo-600 transition flex items-center gap-2"
                                    >
                                        <span>📊</span> Admin Paneli
                                    </button>
                                )}
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
                                    onClick={() => alert('Ayarlar sayfası yakında eklenecek')}
                                    className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-indigo-50 hover:text-indigo-600 transition flex items-center gap-2"
                                >
                                    <span>⚙️</span> Ayarlar
                                </button>
                                <button
                                    onClick={handleLogout}
                                    className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition flex items-center gap-2"
                                >
                                    <span>🚪</span> Çıkış Yap
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </header>

            {/* Content Area */}
            <div className="flex-1 overflow-auto pb-20">
                {activeTab === 'program' && (
                    <div>
                        {/* Program Sub-tabs (Sticky) */}
                        <div className="sticky top-0 bg-gray-50/80 backdrop-blur-md z-20 flex gap-1 p-4 pb-0 overflow-x-auto border-b border-gray-100">
                            <button
                                onClick={() => {
                                    if (isTutorMode && !selectedPersona) return
                                    setActiveProgramTab('bugun')
                                }}
                                className={`py-2 px-3 rounded-t-lg text-sm font-medium transition whitespace-nowrap ${activeProgramTab === 'bugun'
                                    ? `bg-white text-${themeColor}-600 shadow-sm`
                                    : 'text-gray-600 hover:bg-gray-50'
                                    } ${isTutorMode && !selectedPersona ? 'opacity-40 cursor-not-allowed' : ''}`}
                            >
                                Günlük
                            </button>
                            <button
                                onClick={() => {
                                    if (isTutorMode && !selectedPersona) return
                                    setActiveProgramTab('haftalik')
                                }}
                                className={`py-2 px-3 rounded-t-lg text-sm font-medium transition whitespace-nowrap ${activeProgramTab === 'haftalik'
                                    ? `bg-white text-${themeColor}-600 shadow-sm`
                                    : 'text-gray-600 hover:bg-gray-50'
                                    } ${isTutorMode && !selectedPersona ? 'opacity-40 cursor-not-allowed' : ''}`}
                            >
                                Haftalık
                            </button>
                            <button
                                onClick={() => {
                                    if (isTutorMode && !selectedPersona) return
                                    setActiveProgramTab('aylik')
                                }}
                                className={`py-2 px-3 rounded-t-lg text-sm font-medium transition whitespace-nowrap ${activeProgramTab === 'aylik'
                                    ? `bg-white text-${themeColor}-600 shadow-sm`
                                    : 'text-gray-600 hover:bg-gray-50'
                                    } ${isTutorMode && !selectedPersona ? 'opacity-40 cursor-not-allowed' : ''}`}
                            >
                                Aylık
                            </button>
                            <button
                                onClick={() => {
                                    if (isTutorMode && !selectedPersona) return
                                    setActiveProgramTab('aliskanliklar')
                                }}
                                className={`py-2 px-3 rounded-t-lg text-sm font-medium transition whitespace-nowrap ${activeProgramTab === 'aliskanliklar'
                                    ? `bg-white text-${themeColor}-600 shadow-sm`
                                    : 'text-gray-600 hover:bg-gray-50'
                                    } ${isTutorMode && !selectedPersona ? 'opacity-40 cursor-not-allowed' : ''}`}
                            >
                                Alışkanlıklar
                            </button>
                        </div>

                        {/* Program Content */}
                        <div className="bg-white">
                            {isTutorMode && !selectedPersona ? (
                                <div className="p-4 grid grid-cols-1 gap-4">
                                    {loadingPersonas ? (
                                        <div className="text-center py-12 text-gray-500">Personalar yükleniyor...</div>
                                    ) : personas.length === 0 ? (
                                        <div className="text-center py-12 text-gray-500 bg-gray-50 rounded-lg">
                                            <span className="text-4xl block mb-2">👶</span>
                                            Henüz personanız yok
                                        </div>
                                    ) : (
                                        personas.map((persona, index) => (
                                            <button
                                                key={`${persona.id}-${index}`}
                                                onClick={() => setSelectedPersona(persona)}
                                                className="flex items-center gap-4 p-4 bg-white border border-gray-200 rounded-xl hover:border-purple-300 hover:shadow-md transition text-left group"
                                            >
                                                <div className="h-12 w-12 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center text-xl font-bold">
                                                    {persona.name.charAt(0).toUpperCase()}
                                                </div>
                                                <div className="flex-1">
                                                    <h3 className="font-semibold text-gray-900 group-hover:text-purple-600 transition">
                                                        {persona.name}
                                                    </h3>
                                                    <p className="text-xs text-gray-500">{persona.role}</p>
                                                </div>
                                                <div className="text-purple-600 opacity-0 group-hover:opacity-100 transition mr-2">
                                                    →
                                                </div>
                                            </button>
                                        ))
                                    )}
                                </div>
                            ) : (
                                <>
                                    {activeProgramTab === 'bugun' && (
                                        <div className="p-4 pt-0">
                                            <TodayView userId={targetUserId} initialDate={selectedDate} isTutorMode={isTutorMode} />
                                            <div className="mt-4">
                                                <DailyPracticeCard userId={targetUserId} date={selectedDate || new Date()} />
                                            </div>
                                        </div>
                                    )}
                                    {activeProgramTab === 'haftalik' && (
                                        <WeeklyView userId={targetUserId} onDateSelect={handleDateSelect} isTutorMode={isTutorMode} />
                                    )}
                                    {activeProgramTab === 'aylik' && (
                                        <MonthlyView userId={targetUserId} onDateSelect={handleDateSelect} />
                                    )}
                                    {activeProgramTab === 'aliskanliklar' && (
                                        <div className="p-4 pt-0">
                                            <HabitsView userId={targetUserId} />
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
                                {isTutorMode ? (
                                    selectedPersona ? <NutritionManager userId={selectedPersona.id} /> : <div className="text-center py-12 text-gray-500 text-sm">Önce bir persona seçmelisiniz.</div>
                                ) : (
                                    <NutritionDiary userId={user.id} />
                                )}
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
                                {isTutorMode ? (
                                    selectedPersona ? <MusicManager userId={selectedPersona.id} /> : <div className="text-center py-12 text-gray-500 text-sm">Önce bir persona seçmelisiniz.</div>
                                ) : (
                                    <MusicDiary userId={user.id} />
                                )}
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
                                    <ProjectListView onProjectSelect={setSelectedProject} />
                                )}
                            </div>
                        )}
                        {!activeTool && (
                            isTutorMode ? <TutorToolsView onSelectTool={(tool) => setActiveTool(tool)} /> : <div className="space-y-4">
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
                <div className="flex items-center justify-around max-w-2xl mx-auto">
                    <button
                        onClick={() => setActiveTab('program')}
                        className={`flex flex-col items-center gap-1 py-2 px-4 rounded-lg transition ${activeTab === 'program' ? `text-${themeColor}-600` : 'text-gray-600'
                            }`}
                    >
                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                        </svg>
                        <span className="text-xs font-medium">Program</span>
                    </button>

                    <button
                        onClick={() => {
                            if (isTutorMode && !selectedPersona) return
                            setActiveTab('gelisim')
                        }}
                        className={`flex flex-col items-center gap-1 py-2 px-4 rounded-lg transition ${activeTab === 'gelisim' ? `text-${themeColor}-600` : 'text-gray-600'
                            } ${isTutorMode && !selectedPersona ? 'opacity-40 cursor-not-allowed' : ''}`}
                        title={isTutorMode && !selectedPersona ? 'Önce bir persona seçmelisiniz' : ''}
                    >
                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                        </svg>
                        <span className="text-xs font-medium">Gelişim</span>
                    </button>

                    <button
                        onClick={() => {
                            if (isTutorMode && !selectedPersona) return
                            setActiveTab('iletisim')
                        }}
                        className={`flex flex-col items-center gap-1 py-2 px-4 rounded-lg transition ${activeTab === 'iletisim' ? `text-${themeColor}-600` : 'text-gray-600'
                            } ${isTutorMode && !selectedPersona ? 'opacity-40 cursor-not-allowed' : ''}`}
                        title={isTutorMode && !selectedPersona ? 'Önce bir persona seçmelisiniz' : ''}
                    >
                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                        </svg>
                        <span className="text-xs font-medium">İletişim</span>
                    </button>

                    <button
                        onClick={() => setActiveTab('araclar')}
                        className={`flex flex-col items-center gap-1 py-2 px-4 rounded-lg transition ${activeTab === 'araclar' ? `text-${themeColor}-600` : 'text-gray-600'
                            }`}
                    >
                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                        </svg>
                        <span className="text-xs font-medium">Araçlar</span>
                    </button>
                </div>
            </nav>
        </div >
    )
}
