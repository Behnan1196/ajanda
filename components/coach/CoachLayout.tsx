'use client'

import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useEffect, useState } from 'react'

interface CoachLayoutProps {
    children: React.ReactNode
}

export default function CoachLayout({ children }: CoachLayoutProps) {
    const pathname = usePathname()
    const router = useRouter()
    const [user, setUser] = useState<any>(null)
    const [isSidebarOpen, setIsSidebarOpen] = useState(false)
    const supabase = createClient()

    useEffect(() => {
        checkAuth()
    }, [])

    const checkAuth = async () => {
        const { data: { user } } = await supabase.auth.getUser()

        if (!user) {
            router.push('/login')
            return
        }

        const { data: userData } = await supabase
            .from('users')
            .select('roles')
            .eq('id', user.id)
            .single()

        if (!userData?.roles?.includes('coach') && !userData?.roles?.includes('admin')) {
            router.push('/')
            return
        }

        setUser(user)
    }

    const handleLogout = async () => {
        await supabase.auth.signOut()
        router.push('/login')
    }

    const navItems = [
        { name: 'Öğrencilerim', href: '/coach', icon: '👥' },
        { name: 'Konu Kütüphanesi', href: '/coach/subjects', icon: '📚' },
        // { name: 'Mesajlar', href: '/coach/messages', icon: '💬' },
    ]

    if (!user) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
            </div>
        )
    }

    return (
        <div className="flex h-screen bg-gray-100 overflow-hidden">
            {/* Mobile Header */}
            <header className="md:hidden fixed top-0 left-0 right-0 h-16 bg-white border-b border-gray-200 flex items-center px-4 z-30 justify-between">
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => setIsSidebarOpen(true)}
                        className="p-2 -ml-2 text-gray-600 hover:bg-gray-100 rounded-lg"
                    >
                        <span className="text-2xl">☰</span>
                    </button>
                    <h1 className="text-lg font-bold text-gray-900">Koç Paneli</h1>
                </div>
            </header>

            {/* Mobile Sidebar Overlay */}
            {isSidebarOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-40 md:hidden animate-fadeIn"
                    onClick={() => setIsSidebarOpen(false)}
                />
            )}

            {/* Sidebar */}
            <aside className={`
                fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-gray-200 flex flex-col transition-transform duration-300 ease-in-out
                md:relative md:translate-x-0
                ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
            `}>
                <div className="p-6 border-b border-gray-200 flex items-center justify-between">
                    <div>
                        <h1 className="text-xl font-bold text-gray-900">Koç Paneli</h1>
                        <p className="text-sm text-gray-600 mt-1 truncate max-w-[180px]">{user.email}</p>
                    </div>
                    {/* Close button for mobile */}
                    <button
                        onClick={() => setIsSidebarOpen(false)}
                        className="md:hidden text-gray-500 hover:text-gray-700"
                    >
                        ✕
                    </button>
                </div>

                <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
                    {navItems.map((item) => (
                        <a
                            key={item.href}
                            href={item.href}
                            onClick={() => setIsSidebarOpen(false)}
                            className={`flex items-center gap-3 px-4 py-3 rounded-lg transition ${pathname === item.href
                                ? 'bg-indigo-50 text-indigo-600 font-medium'
                                : 'text-gray-700 hover:bg-gray-50'
                                }`}
                        >
                            <span className="text-xl">{item.icon}</span>
                            <span>{item.name}</span>
                        </a>
                    ))}
                </nav>

                <div className="p-4 border-t border-gray-200">
                    <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-gray-50 rounded-lg transition"
                    >
                        <span className="text-xl">🚪</span>
                        <span>Çıkış Yap</span>
                    </button>

                    <a
                        href="/"
                        className="w-full flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-gray-50 rounded-lg transition mt-2"
                    >
                        <span className="text-xl">🏠</span>
                        <span>Ana Sayfa</span>
                    </a>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 overflow-auto pt-16 md:pt-0">
                <div className="max-w-7xl mx-auto p-4 md:p-6">
                    {children}
                </div>
            </main>
        </div>
    )
}
