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
import AIStudentAnalysis from './coach/AIStudentAnalysis'
import { subscribeUserToPush } from '@/lib/notifications'
import LifeHubView from './program/LifeHubView'
import CoachToolsView from './coach/CoachToolsView'

type TabType = 'program' | 'gelisim' | 'iletisim' | 'araclar'
type ProgramTabType = 'bugun' | 'haftalik' | 'aylik' | 'aliskanliklar'

interface DashboardTabsProps {
    user: User
    isCoachMode?: boolean
    initialStudentId?: string
    initialTab?: TabType
}

export default function DashboardTabs({ user, isCoachMode = false, initialStudentId, initialTab }: DashboardTabsProps) {
    const [activeTab, setActiveTab] = useState<TabType>(initialTab || 'program')
    const [activeProgramTab, setActiveProgramTab] = useState<ProgramTabType>('bugun')
    const [selectedDate, setSelectedDate] = useState<Date | null>(null)
    const [isDropdownOpen, setIsDropdownOpen] = useState(false)
    const dropdownRef = useRef<HTMLDivElement>(null)
    const router = useRouter()
    const supabase = createClient()

    const [userProfile, setUserProfile] = useState<any>(null)
    const [students, setStudents] = useState<any[]>([])
    const [selectedStudent, setSelectedStudent] = useState<any>(null)
    const [loadingStudents, setLoadingStudents] = useState(false)

    const themeColor = isCoachMode ? 'purple' : 'indigo'
    const targetUserId = selectedStudent ? selectedStudent.id : user.id

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

        if (isCoachMode) {
            loadStudents()
        }

        return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [user.id, isCoachMode])

    const loadStudents = async () => {
        setLoadingStudents(true)
        const { getAssignedStudents } = await import('@/app/actions/coach')
        const result = await getAssignedStudents()
        if (result.success) {
            setStudents(result.data)
            if (initialStudentId) {
                const student = result.data.find((s: any) => s.id === initialStudentId)
                if (student) setSelectedStudent(student)
            }
        }
        setLoadingStudents(false)
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
                        {isCoachMode && selectedStudent && (
                            <button
                                onClick={() => {
                                    setSelectedStudent(null)
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
                                {isCoachMode ? (selectedStudent ? selectedStudent.name : 'Öğrencilerim') : 'Yaşam Planlayıcı'}
                            </h1>
                            {isCoachMode && selectedStudent && (
                                <span className={`text-[10px] font-bold uppercase tracking-wider text-${themeColor}-600`}>
                                    {selectedStudent.role}
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
                                            router.push(isCoachMode ? '/' : '/coach')
                                            setIsDropdownOpen(false)
                                        }}
                                        className={`w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-${themeColor}-50 hover:text-${themeColor}-600 transition flex items-center gap-2`}
                                    >
                                        <span>{isCoachMode ? '📅' : '🎓'}</span> {isCoachMode ? 'Kendi Ajandam' : 'Koç Paneli'}
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
                                    if (isCoachMode && !selectedStudent) return
                                    setActiveProgramTab('bugun')
                                }}
                                className={`py-2 px-3 rounded-t-lg text-sm font-medium transition whitespace-nowrap ${activeProgramTab === 'bugun'
                                    ? `bg-white text-${themeColor}-600 shadow-sm`
                                    : 'text-gray-600 hover:bg-gray-50'
                                    } ${isCoachMode && !selectedStudent ? 'opacity-40 cursor-not-allowed' : ''}`}
                            >
                                Günlük
                            </button>
                            <button
                                onClick={() => {
                                    if (isCoachMode && !selectedStudent) return
                                    setActiveProgramTab('haftalik')
                                }}
                                className={`py-2 px-3 rounded-t-lg text-sm font-medium transition whitespace-nowrap ${activeProgramTab === 'haftalik'
                                    ? `bg-white text-${themeColor}-600 shadow-sm`
                                    : 'text-gray-600 hover:bg-gray-50'
                                    } ${isCoachMode && !selectedStudent ? 'opacity-40 cursor-not-allowed' : ''}`}
                            >
                                Haftalık
                            </button>
                            <button
                                onClick={() => {
                                    if (isCoachMode && !selectedStudent) return
                                    setActiveProgramTab('aylik')
                                }}
                                className={`py-2 px-3 rounded-t-lg text-sm font-medium transition whitespace-nowrap ${activeProgramTab === 'aylik'
                                    ? `bg-white text-${themeColor}-600 shadow-sm`
                                    : 'text-gray-600 hover:bg-gray-50'
                                    } ${isCoachMode && !selectedStudent ? 'opacity-40 cursor-not-allowed' : ''}`}
                            >
                                Aylık
                            </button>
                            <button
                                onClick={() => {
                                    if (isCoachMode && !selectedStudent) return
                                    setActiveProgramTab('aliskanliklar')
                                }}
                                className={`py-2 px-3 rounded-t-lg text-sm font-medium transition whitespace-nowrap ${activeProgramTab === 'aliskanliklar'
                                    ? `bg-white text-${themeColor}-600 shadow-sm`
                                    : 'text-gray-600 hover:bg-gray-50'
                                    } ${isCoachMode && !selectedStudent ? 'opacity-40 cursor-not-allowed' : ''}`}
                            >
                                Alışkanlıklar
                            </button>
                        </div>

                        {/* Program Content */}
                        <div className="bg-white">
                            {isCoachMode && !selectedStudent ? (
                                <div className="p-4 grid grid-cols-1 gap-4">
                                    {loadingStudents ? (
                                        <div className="text-center py-12 text-gray-500">Öğrenciler yükleniyor...</div>
                                    ) : students.length === 0 ? (
                                        <div className="text-center py-12 text-gray-500 bg-gray-50 rounded-lg">
                                            <span className="text-4xl block mb-2">👶</span>
                                            Henüz öğrenciniz yok
                                        </div>
                                    ) : (
                                        students.map(student => (
                                            <button
                                                key={student.id}
                                                onClick={() => setSelectedStudent(student)}
                                                className="flex items-center gap-4 p-4 bg-white border border-gray-200 rounded-xl hover:border-purple-300 hover:shadow-md transition text-left group"
                                            >
                                                <div className="h-12 w-12 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center text-xl font-bold">
                                                    {student.name.charAt(0).toUpperCase()}
                                                </div>
                                                <div className="flex-1">
                                                    <h3 className="font-semibold text-gray-900 group-hover:text-purple-600 transition">
                                                        {student.name}
                                                    </h3>
                                                    <p className="text-xs text-gray-500">{student.role}</p>
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
                                            <TodayView userId={targetUserId} initialDate={selectedDate} />
                                        </div>
                                    )}
                                    {activeProgramTab === 'haftalik' && (
                                        <WeeklyView userId={targetUserId} onDateSelect={handleDateSelect} />
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
                        {isCoachMode && selectedStudent && (
                            <AIStudentAnalysis studentId={targetUserId} />
                        )}
                        <ProgressView userId={targetUserId} />
                        {selectedStudent && (
                            <ExamResultsView userId={targetUserId} readOnly={false} />
                        )}
                    </div>
                )}

                {activeTab === 'iletisim' && (
                    <div className="p-4 text-center py-12 text-gray-500">
                        {isCoachMode && selectedStudent ? (
                            <div className="space-y-4">
                                <div className={`w-16 h-16 bg-${themeColor}-100 text-${themeColor}-600 rounded-full flex items-center justify-center mx-auto text-2xl font-bold`}>
                                    {selectedStudent.name.charAt(0)}
                                </div>
                                <h3 className="text-lg font-medium text-gray-900">{selectedStudent.name} ile İletişim</h3>
                                <p className="text-sm">Mesajlaşma ve görüntülü görüşme modülü yakında eklenecek</p>
                            </div>
                        ) : (
                            "İletişim modülü yakında eklenecek"
                        )}
                    </div>
                )}

                {activeTab === 'araclar' && (
                    <div className="p-4">
                        {isCoachMode ? <CoachToolsView /> : <LifeHubView />}
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
                            if (isCoachMode && !selectedStudent) return
                            setActiveTab('gelisim')
                        }}
                        className={`flex flex-col items-center gap-1 py-2 px-4 rounded-lg transition ${activeTab === 'gelisim' ? `text-${themeColor}-600` : 'text-gray-600'
                            } ${isCoachMode && !selectedStudent ? 'opacity-40 cursor-not-allowed' : ''}`}
                        title={isCoachMode && !selectedStudent ? 'Önce bir öğrenci seçmelisiniz' : ''}
                    >
                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                        </svg>
                        <span className="text-xs font-medium">Gelişim</span>
                    </button>

                    <button
                        onClick={() => {
                            if (isCoachMode && !selectedStudent) return
                            setActiveTab('iletisim')
                        }}
                        className={`flex flex-col items-center gap-1 py-2 px-4 rounded-lg transition ${activeTab === 'iletisim' ? `text-${themeColor}-600` : 'text-gray-600'
                            } ${isCoachMode && !selectedStudent ? 'opacity-40 cursor-not-allowed' : ''}`}
                        title={isCoachMode && !selectedStudent ? 'Önce bir öğrenci seçmelisiniz' : ''}
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
