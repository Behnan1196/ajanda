'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { User } from '@supabase/supabase-js'

interface MenuItem {
    name: string
    href: string
    icon: string
}

interface SharedHeaderProps {
    user: User
    roles?: string[]
    title: string
    extraMenuItems?: MenuItem[]
}

export default function SharedHeader({ user, roles = [], title, extraMenuItems = [] }: SharedHeaderProps) {
    const [isDropdownOpen, setIsDropdownOpen] = useState(false)
    const dropdownRef = useRef<HTMLDivElement>(null)
    const router = useRouter()
    const supabase = createClient()

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsDropdownOpen(false)
            }
        }
        document.addEventListener('mousedown', handleClickOutside)
        return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [])

    const handleLogout = async () => {
        await supabase.auth.signOut()
        router.replace('/login')
        router.refresh()
    }

    return (
        <header className="bg-white border-b border-gray-200 px-4 pt-12 pb-3 flex items-center justify-between z-30 sticky top-0 relative">
            <h1 className="text-lg md:text-xl font-bold text-gray-900">{title}</h1>

            <div className="relative" ref={dropdownRef}>
                <button
                    onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                    className="flex items-center gap-3 hover:bg-gray-50 p-1 rounded-lg transition"
                >
                    <span className="text-sm text-gray-600 hidden md:block">{user.email}</span>
                    <div className="w-8 h-8 bg-indigo-600 rounded-full flex items-center justify-center text-white text-sm font-medium">
                        {user.email?.[0].toUpperCase()}
                    </div>
                </button>

                {/* Dropdown Menu */}
                {isDropdownOpen && (
                    <div className="absolute right-0 top-full mt-2 w-64 bg-white rounded-lg shadow-lg border border-gray-100 py-1 z-50">
                        <div className="px-4 py-2 border-b border-gray-100 md:hidden">
                            <p className="text-sm text-gray-600 truncate">{user.email}</p>
                        </div>

                        {/* Extra Menu Items (Context Specific) */}
                        {extraMenuItems.length > 0 && (
                            <div className="py-1 border-b border-gray-100">
                                <div className="px-4 py-1 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                                    Modül Menüsü
                                </div>
                                {extraMenuItems.map((item) => (
                                    <button
                                        key={item.href}
                                        onClick={() => {
                                            router.push(item.href)
                                            setIsDropdownOpen(false)
                                        }}
                                        className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-indigo-50 hover:text-indigo-600 transition flex items-center gap-2"
                                    >
                                        <span className="text-lg">{item.icon}</span> {item.name}
                                    </button>
                                ))}
                            </div>
                        )}

                        {/* Common Navigation */}
                        <div className="py-1">
                            <div className="px-4 py-1 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                                Hesap & Diğer
                            </div>
                            <button
                                onClick={() => router.push('/')}
                                className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-indigo-50 hover:text-indigo-600 transition flex items-center gap-2"
                            >
                                <span>🏠</span> Ana Sayfa
                            </button>

                            {roles.includes('admin') && !title.includes('Admin') && (
                                <button
                                    onClick={() => router.push('/admin')}
                                    className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-indigo-50 hover:text-indigo-600 transition flex items-center gap-2"
                                >
                                    <span>📊</span> Admin Paneli
                                </button>
                            )}

                            {roles.includes('coach') && !title.includes('Koç') && (
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
                    </div>
                )}
            </div>
        </header>
    )
}
