'use client'

import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useEffect, useState } from 'react'
import SharedHeader from '@/components/SharedHeader'

interface CoachLayoutProps {
    children: React.ReactNode
}

export default function CoachLayout({ children }: CoachLayoutProps) {
    const router = useRouter()
    const [user, setUser] = useState<any>(null)
    const [roles, setRoles] = useState<string[]>([])
    const supabase = createClient()

    useEffect(() => {
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
            setRoles(userData.roles || [])
        }

        checkAuth()
    }, [router, supabase])

    const navItems = [
        { name: 'Öğrencilerim', href: '/coach', icon: '👥' },
        { name: 'Program Kütüphanesi', href: '/coach/subjects', icon: '📚' },
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
        <div className="flex flex-col h-screen bg-gray-100">
            <SharedHeader
                user={user}
                roles={roles}
                title="Koç Paneli"
                extraMenuItems={navItems}
            />

            {/* Main Content */}
            <main className="flex-1 overflow-auto">
                <div className="max-w-7xl mx-auto p-4 md:p-6">
                    {children}
                </div>
            </main>
        </div>
    )
}

