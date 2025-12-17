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

type TabType = 'program' | 'gelisim' | 'iletisim' | 'araclar'
type ProgramTabType = 'bugun' | 'haftalik' | 'aylik' | 'aliskanliklar'

interface DashboardTabsProps {
    user: User
}

export default function DashboardTabs({ user }: DashboardTabsProps) {
    const [activeTab, setActiveTab] = useState<TabType>('program')
    const [activeProgramTab, setActiveProgramTab] = useState<ProgramTabType>('bugun')
    const [selectedDate, setSelectedDate] = useState<Date | null>(null)
    const [isDropdownOpen, setIsDropdownOpen] = useState(false)
    const dropdownRef = useRef<HTMLDivElement>(null)
    const router = useRouter()
    const supabase = createClient()

    const [userProfile, setUserProfile] = useState<any>(null)

    useEffect(() => {
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

        return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [user.id])

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
            <header className="bg-white border-b border-gray-200 px-4 py-3 relative z-20">
                <div className="flex items-center justify-between">
                    <h1 className="text-xl font-bold text-gray-900">Yaşam Planlayıcı</h1>
                    <div className="relative" ref={dropdownRef}>
                        <button
                            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                            className="flex items-center gap-3 hover:bg-gray-50 p-1 rounded-lg transition"
                        >
                            <span className="text-sm text-gray-600 hidden sm:block">{user.email}</span>
                            <div className="w-8 h-8 bg-indigo-600 rounded-full flex items-center justify-center text-white text-sm font-medium">
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
                                        onClick={() => router.push('/coach')}
                                        className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-indigo-50 hover:text-indigo-600 transition flex items-center gap-2"
                                    >
                                        <span>🎓</span> Koç Paneli
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
                        {/* Program Sub-tabs */}
                        <div className="flex gap-1 p-4 pb-0 overflow-x-auto">
                            <button
                                onClick={() => setActiveProgramTab('bugun')}
                                className={`py-2 px-3 rounded-t-lg text-sm font-medium transition whitespace-nowrap ${activeProgramTab === 'bugun'
                                    ? 'bg-white text-indigo-600 shadow-sm'
                                    : 'text-gray-600 hover:bg-gray-50'
                                    }`}
                            >
                                Bugün
                            </button>
                            <button
                                onClick={() => setActiveProgramTab('haftalik')}
                                className={`py-2 px-3 rounded-t-lg text-sm font-medium transition whitespace-nowrap ${activeProgramTab === 'haftalik'
                                    ? 'bg-white text-indigo-600 shadow-sm'
                                    : 'text-gray-600 hover:bg-gray-50'
                                    }`}
                            >
                                Haftalık
                            </button>
                            <button
                                onClick={() => setActiveProgramTab('aylik')}
                                className={`py-2 px-3 rounded-t-lg text-sm font-medium transition whitespace-nowrap ${activeProgramTab === 'aylik'
                                    ? 'bg-white text-indigo-600 shadow-sm'
                                    : 'text-gray-600 hover:bg-gray-50'
                                    }`}
                            >
                                Aylık
                            </button>
                            <button
                                onClick={() => setActiveProgramTab('aliskanliklar')}
                                className={`py-2 px-3 rounded-t-lg text-sm font-medium transition whitespace-nowrap ${activeProgramTab === 'aliskanliklar'
                                    ? 'bg-white text-indigo-600 shadow-sm'
                                    : 'text-gray-600 hover:bg-gray-50'
                                    }`}
                            >
                                Alışkanlıklar
                            </button>
                        </div>

                        {/* Program Content */}
                        <div className="bg-white">
                            {activeProgramTab === 'bugun' && (
                                <div className="p-4 pt-0">
                                    <TodayView userId={user.id} initialDate={selectedDate} />
                                </div>
                            )}
                            {activeProgramTab === 'haftalik' && (
                                <WeeklyView userId={user.id} onDateSelect={handleDateSelect} />
                            )}
                            {activeProgramTab === 'aylik' && (
                                <MonthlyView userId={user.id} onDateSelect={handleDateSelect} />
                            )}
                            {activeProgramTab === 'aliskanliklar' && (
                                <div className="p-4 pt-0">
                                    <HabitsView userId={user.id} />
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {activeTab === 'gelisim' && (
                    <div className="p-4">
                        <ProgressView userId={user.id} />
                    </div>
                )}

                {activeTab === 'iletisim' && (
                    <div className="p-4 text-center py-12 text-gray-500">
                        İletişim modülü yakında eklenecek
                    </div>
                )}

                {activeTab === 'araclar' && (
                    <div className="p-4 text-center py-12 text-gray-500">
                        Araçlar modülü yakında eklenecek
                    </div>
                )}
            </div>

            {/* Bottom Tab Bar */}
            <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-4 py-2 safe-area-bottom">
                <div className="flex items-center justify-around max-w-2xl mx-auto">
                    <button
                        onClick={() => setActiveTab('program')}
                        className={`flex flex-col items-center gap-1 py-2 px-4 rounded-lg transition ${activeTab === 'program' ? 'text-indigo-600' : 'text-gray-600'
                            }`}
                    >
                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                        </svg>
                        <span className="text-xs font-medium">Program</span>
                    </button>

                    <button
                        onClick={() => setActiveTab('gelisim')}
                        className={`flex flex-col items-center gap-1 py-2 px-4 rounded-lg transition ${activeTab === 'gelisim' ? 'text-indigo-600' : 'text-gray-600'
                            }`}
                    >
                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                        </svg>
                        <span className="text-xs font-medium">Gelişim</span>
                    </button>

                    <button
                        onClick={() => setActiveTab('iletisim')}
                        className={`flex flex-col items-center gap-1 py-2 px-4 rounded-lg transition ${activeTab === 'iletisim' ? 'text-indigo-600' : 'text-gray-600'
                            }`}
                    >
                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                        </svg>
                        <span className="text-xs font-medium">İletişim</span>
                    </button>

                    <button
                        onClick={() => setActiveTab('araclar')}
                        className={`flex flex-col items-center gap-1 py-2 px-4 rounded-lg transition ${activeTab === 'araclar' ? 'text-indigo-600' : 'text-gray-600'
                            }`}
                    >
                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                        </svg>
                        <span className="text-xs font-medium">Araçlar</span>
                    </button>
                </div>
            </nav>
        </div>
    )
}
