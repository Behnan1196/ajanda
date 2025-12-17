'use client'

import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useEffect, useState } from 'react'

interface AdminLayoutProps {
    children: React.ReactNode
}

export default function AdminLayout({ children }: AdminLayoutProps) {
    const pathname = usePathname()
    const router = useRouter()
    const [user, setUser] = useState<any>(null)
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

        // Check if user is admin
        const { data: userData } = await supabase
            .from('users')
            .select('roles')
            .eq('id', user.id)
            .single()

        if (!userData?.roles?.includes('admin')) {
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
        { name: 'Dashboard', href: '/admin', icon: '📊' },
        { name: 'Kullanıcılar', href: '/admin/users', icon: '👥' },
        { name: 'Sınav Yönetimi', href: '/admin/exams', icon: '📝' },
        { name: 'Ana Konular', href: '/admin/subjects', icon: '📚' },
        { name: 'Alt Konular', href: '/admin/topics', icon: '📖' },
        { name: 'Kaynaklar', href: '/admin/resources', icon: '🔗' },
    ]

    if (!user) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
            </div>
        )
    }

    return (
        <div className="flex h-screen bg-gray-100">
            {/* Sidebar */}
            <aside className="w-64 bg-white border-r border-gray-200 flex flex-col">
                <div className="p-6 border-b border-gray-200">
                    <h1 className="text-xl font-bold text-gray-900">Admin Panel</h1>
                    <p className="text-sm text-gray-600 mt-1">{user.email}</p>
                </div>

                <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
                    {navItems.map((item) => (
                        <a
                            key={item.href}
                            href={item.href}
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
            <main className="flex-1 overflow-auto">
                <div className="max-w-7xl mx-auto p-6">
                    {children}
                </div>
            </main>
        </div>
    )
}
