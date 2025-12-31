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
import ProjectListView from './program/ProjectListView'
import ProjectDetailsView from './program/ProjectDetailsView'
import { Project } from '@/app/actions/projects'
import FamilyDashboard from './tutor/FamilyDashboard'
import NutritionManager from './tutor/NutritionManager'
import MusicManager from './tutor/MusicManager'
import CoachingAppView from './tutor/CoachingAppView'

type TabType = 'program' | 'gelisim' | 'iletisim' | 'araclar' | 'projeler'
type ProgramTabType = 'bugun' | 'haftalik' | 'aylik' | 'aliskanliklar' | 'takvim'

interface DashboardTabsProps {
    user: User
    initialTab?: TabType
}

export default function DashboardTabs({ user, initialTab }: DashboardTabsProps) {
    const [activeTab, setActiveTab] = useState<TabType>(initialTab || 'program')
    const [activeProgramTab, setActiveProgramTab] = useState<ProgramTabType>('bugun')
    const [selectedDate, setSelectedDate] = useState<Date | null>(null)
    const [isDropdownOpen, setIsDropdownOpen] = useState(false)
    const dropdownRef = useRef<HTMLDivElement>(null)
    const router = useRouter()
    const supabase = createClient()

    const [userProfile, setUserProfile] = useState<any>(null)
    const [personas, setPersonas] = useState<any[]>([])
    const [loadingPersonas, setLoadingPersonas] = useState(false)
    const [activeTool, setActiveTool] = useState<string | null>(null)
    const [selectedProject, setSelectedProject] = useState<Project | null>(null)

    const themeColor = 'indigo'
    const targetUserId = user.id

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
        async function loadInitialData() {
            const { data: profile } = await supabase
                .from('users')
                .select('roles')
                .eq('id', user.id)
                .single()

            if (profile) {
                setUserProfile(profile)
                if (profile.roles?.includes('coach')) {
                    const { getAssignedPersonas } = await import('@/app/actions/tutor')
                    const result = await getAssignedPersonas()
                    if (result.success) {
                        setPersonas(result.data)
                    }
                }
            }
        }
        loadInitialData()

        const handleOpenProject = (e: CustomEvent) => {
            const project = e.detail.project
            if (project) {
                // If shared project, it might be better to show it in a modal or specific view.
                // DashboardTabs logic for project details is under 'araclar' for personal or 'program > projeler' for students.
                // For a shared project owned by the user (as tutor), it should probably be under 'araclar' -> 'projects' OR 'program' -> 'projeler'

                // Let's try to find where we are.
                // If it's a shared shopping list, we want to open it.
                // The ProjectDetailsView is used in two places.
                // 1. activeTab === 'program' && activeProgramTab === 'projeler' (Student context)
                // 2. activeTab === 'araclar' && activeTool === 'projects' (Personal context)

                // Since these are "Shared" lists created by the tutor/parent, they are technically personal projects of the user.
                // So we should switch to 'araclar' -> 'projects' -> selectedProject.
                // Actually, in our new structure, we have a top-level 'projeler' tab.
                setActiveTab('projeler')
                setSelectedProject(project)
            }
        }

        window.addEventListener('open-project', handleOpenProject as any)

        return () => {
            document.removeEventListener('mousedown', handleClickOutside)
            window.removeEventListener('open-project', handleOpenProject as any)
        }
    }, [user.id])

    const loadPersonas = async () => {
        setLoadingPersonas(true)
        const { getAssignedPersonas } = await import('@/app/actions/tutor')
        const result = await getAssignedPersonas()
        if (result.success) {
            setPersonas(result.data)
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
        <div className="flex flex-col h-screen bg-gray-50 overflow-hidden">
            {/* Header */}
            <header className="fixed top-0 left-0 right-0 h-16 bg-white/80 backdrop-blur-md border-b border-gray-200 px-4 flex items-center justify-between z-50">
                <div className="flex items-center gap-3">
                    <div>
                        <div className="flex items-center gap-2">
                            <h1 className="text-lg font-black text-gray-900 leading-none tracking-tight">
                                {activeTab === 'program' ? 'Ajanda' :
                                    activeTab === 'gelisim' ? 'Gelişim' :
                                        activeTab === 'projeler' ? 'Projeler' :
                                            'Uygulamalar'}
                            </h1>
                            <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-indigo-600 text-white shadow-sm shadow-indigo-100">
                                YAŞAM MERKEZİ
                            </span>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    {/* Contextual Communication Button */}
                    <button
                        onClick={() => alert('Görüntülü görüşme özelliği yakında aktif olacak')}
                        className="flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold transition bg-indigo-100 text-indigo-700 hover:bg-indigo-200"
                    >
                        <span>📹</span>
                        <span className="hidden sm:inline">Görüşme</span>
                    </button>

                    <div className="relative" ref={dropdownRef}>
                        <button
                            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                            className="flex items-center gap-3 hover:bg-gray-50 p-1 rounded-lg transition"
                        >
                            <div className="w-8 h-8 bg-indigo-600 rounded-full flex items-center justify-center text-white text-sm font-medium">
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
                                            setActiveTool('coaching')
                                            setIsDropdownOpen(false)
                                        }}
                                        className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-indigo-50 hover:text-indigo-600 transition flex items-center gap-2"
                                    >
                                        <span>🎓</span> Sınav Koçluğu
                                    </button>
                                )}
                                <button
                                    onClick={() => {
                                        if (confirm('Sistemi sıfırlamak istediğinize emin misiniz? Bu işlem cihazınızdaki önbelleği temizleyecektir.')) {
                                            localStorage.clear()
                                            sessionStorage.clear()
                                            window.location.reload()
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
            </header>

            {/* Content Area */}
            <main className="flex-1 overflow-auto pt-16 pb-20">
                {activeTab === 'projeler' && (
                    <div className="p-4">
                        {selectedProject ? (
                            <ProjectDetailsView project={selectedProject} onBack={() => setSelectedProject(null)} />
                        ) : (
                            <div className="space-y-4">
                                <h2 className="text-xl font-bold text-gray-900">Projelerim</h2>
                                <ProjectListView
                                    onProjectSelect={setSelectedProject}
                                    userId={targetUserId}
                                    filter='personal'
                                />
                            </div>
                        )}
                    </div>
                )}
                {activeTab === 'program' && (
                    <div>
                        <div className="sticky top-0 bg-gray-50/80 backdrop-blur-md z-20 flex gap-1 p-4 pb-0 overflow-x-auto border-b border-gray-100">
                            {[
                                { id: 'bugun', label: 'Bugün' },
                                { id: 'haftalik', label: 'Haftalık' },
                                { id: 'aylik', label: 'Aylık' },
                                { id: 'aliskanliklar', label: 'Alışkanlıklar' }
                            ].map((tab) => (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveProgramTab(tab.id as ProgramTabType)}
                                    className={`py-2 px-3 rounded-t-lg text-sm font-bold transition whitespace-nowrap ${activeProgramTab === tab.id ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-500 hover:bg-gray-50'
                                        }`}
                                >
                                    {tab.label}
                                </button>
                            ))}
                        </div>

                        <div className="bg-white">
                            {activeProgramTab === 'bugun' && (
                                <div className="p-4 pt-0">
                                    <TodayView userId={targetUserId} initialDate={selectedDate} isTutorMode={false} />
                                </div>
                            )}
                            {activeProgramTab === 'haftalik' && (
                                <div className="p-4 pt-0">
                                    <WeeklyView
                                        userId={targetUserId}
                                        onDateSelect={handleDateSelect}
                                        isTutorMode={false}
                                        initialDate={selectedDate}
                                    />
                                </div>
                            )}
                            {activeProgramTab === 'aylik' && (
                                <MonthlyView userId={targetUserId} onDateSelect={handleDateSelect} />
                            )}
                            {activeProgramTab === 'aliskanliklar' && (
                                <div className="p-4 pt-0">
                                    <HabitsView userId={targetUserId} />
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {activeTab === 'gelisim' && (
                    <div className="p-4 space-y-8">
                        <ProgressView userId={targetUserId} />
                        <ExamResultsView userId={targetUserId} readOnly={false} />
                    </div>
                )}

                {activeTab === 'projeler' && (
                    <div className="p-4">
                        {selectedProject ? (
                            <ProjectDetailsView project={selectedProject} onBack={() => setSelectedProject(null)} />
                        ) : (
                            <div className="space-y-4">
                                <h2 className="text-xl font-bold text-gray-900">Projelerim</h2>
                                <ProjectListView
                                    onProjectSelect={setSelectedProject}
                                    userId={targetUserId}
                                    filter='personal'
                                />
                            </div>
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
                                <NutritionManager userId={targetUserId} />
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
                                <MusicManager userId={targetUserId} />
                            </div>
                        )}
                        {activeTool === 'coaching' && (
                            <div className="fixed inset-0 z-[100] bg-white">
                                <CoachingAppView
                                    onClose={() => setActiveTool(null)}
                                    userId={user.id}
                                />
                            </div>
                        )}
                        {!activeTool && (
                            <div className="space-y-6">
                                <div className="text-center py-6">
                                    <h2 className="text-2xl font-black text-gray-900 tracking-tight">Merkez Uygulamaları</h2>
                                    <p className="text-sm text-gray-500 mt-1">İhtiyacınız olan modülü seçin</p>
                                </div>
                                <div className="grid grid-cols-2 gap-4 max-w-lg mx-auto">
                                    {userProfile?.roles?.includes('coach') && (
                                        <button
                                            onClick={() => setActiveTool('coaching')}
                                            className="bg-white border-2 border-transparent hover:border-purple-500 rounded-[2.5rem] p-6 text-center transition-all shadow-sm hover:shadow-xl hover:shadow-purple-50 group active:scale-95"
                                        >
                                            <div className="w-16 h-16 bg-purple-50 rounded-3xl mx-auto mb-3 flex items-center justify-center text-3xl group-hover:scale-110 transition-transform">🎓</div>
                                            <h3 className="font-black text-gray-900 text-sm">Sınav Koçluğu</h3>
                                            <p className="text-[9px] text-gray-400 font-bold uppercase tracking-tighter mt-1">Öğrenci Yönetimi</p>
                                        </button>
                                    )}
                                    <button
                                        onClick={() => setActiveTool('nutrition')}
                                        className="bg-white border-2 border-transparent hover:border-emerald-500 rounded-[2.5rem] p-6 text-center transition-all shadow-sm hover:shadow-xl hover:shadow-emerald-50 group active:scale-95"
                                    >
                                        <div className="w-16 h-16 bg-emerald-50 rounded-3xl mx-auto mb-3 flex items-center justify-center text-3xl group-hover:scale-110 transition-transform">🍏</div>
                                        <h3 className="font-black text-gray-900 text-sm">Beslenme</h3>
                                        <p className="text-[9px] text-gray-400 font-bold uppercase tracking-tighter mt-1">Diyet Takibi</p>
                                    </button>
                                    <button
                                        onClick={() => setActiveTool('music')}
                                        className="bg-white border-2 border-transparent hover:border-amber-500 rounded-[2.5rem] p-6 text-center transition-all shadow-sm hover:shadow-xl hover:shadow-amber-50 group active:scale-95"
                                    >
                                        <div className="w-16 h-16 bg-amber-50 rounded-3xl mx-auto mb-3 flex items-center justify-center text-3xl group-hover:scale-110 transition-transform">🎸</div>
                                        <h3 className="font-black text-gray-900 text-sm">Müzik</h3>
                                        <p className="text-[9px] text-gray-400 font-bold uppercase tracking-tighter mt-1">Enstrüman Pratiği</p>
                                    </button>
                                    <button
                                        disabled
                                        className="bg-gray-50/50 border-2 border-dashed border-gray-200 rounded-[2.5rem] p-6 text-center transition-all opacity-60 grayscale cursor-not-allowed"
                                    >
                                        <div className="w-16 h-16 bg-gray-100 rounded-3xl mx-auto mb-3 flex items-center justify-center text-3xl">💊</div>
                                        <h3 className="font-black text-gray-900 text-sm">İlaç Takibi</h3>
                                        <p className="text-[9px] text-gray-400 font-bold uppercase tracking-tighter mt-1">Çok Yakında</p>
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </main>

            {/* Bottom Tab Bar */}
            <nav className="fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-md border-t border-gray-200 px-4 py-2 safe-area-bottom z-50">
                <div className="flex items-center justify-around max-w-2xl mx-auto">
                    {[
                        { id: 'program', label: 'Ajanda', icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /> },
                        { id: 'gelisim', label: 'Gelişim', icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /> },
                        { id: 'projeler', label: 'Projeler', icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /> },
                        { id: 'araclar', label: 'Araçlar', icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z" /> }
                    ].map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id as TabType)}
                            className={`flex flex-col items-center gap-1 py-1.5 px-3 rounded-xl transition ${activeTab === tab.id ? 'text-indigo-600 bg-indigo-50' : 'text-gray-400 hover:text-gray-600'}`}
                        >
                            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                {tab.icon}
                            </svg>
                            <span className="text-[10px] font-black uppercase tracking-tight">{tab.label}</span>
                        </button>
                    ))}
                </div>
            </nav>
        </div>
    )
}
