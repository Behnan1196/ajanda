'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { deleteUser, getUsers } from '@/app/actions/admin-users'

interface User {
    id: string
    email: string
    name: string
    roles: string[]
    created_at: string
}

export default function AdminUsersPage() {
    const [users, setUsers] = useState<User[]>([])
    const [loading, setLoading] = useState(true)
    // Removed client-side supabase creation

    useEffect(() => {
        loadUsers()
    }, [])

    const loadUsers = async () => {
        setLoading(true)
        try {
            const data = await getUsers()
            setUsers(data as User[])
        } catch (error) {
            console.error('Error loading users:', error)
        }
        setLoading(false)
    }

    const handleDelete = async (userId: string) => {
        if (!confirm('Bu kullanıcıyı silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.')) return

        const result = await deleteUser(userId)
        if (result.success) {
            loadUsers()
        } else {
            alert('Hata: ' + result.error)
        }
    }

    if (loading) {
        return <div className="p-8 text-center text-gray-500">Yükleniyor...</div>
    }

    return (
        <div>
            <div className="flex items-center justify-between mb-6">
                <h1 className="text-2xl font-bold text-gray-900">Kullanıcı Yönetimi</h1>
                <Link
                    href="/admin/users/create"
                    className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition"
                >
                    + Yeni Kullanıcı
                </Link>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <table className="w-full text-left">
                    <thead className="bg-gray-50 border-b border-gray-200">
                        <tr>
                            <th className="px-6 py-3 text-xs font-semibold text-gray-600 uppercase">İsim</th>
                            <th className="px-6 py-3 text-xs font-semibold text-gray-600 uppercase">Email</th>
                            <th className="px-6 py-3 text-xs font-semibold text-gray-600 uppercase">Roller</th>
                            <th className="px-6 py-3 text-xs font-semibold text-gray-600 uppercase">Kayıt Tarihi</th>
                            <th className="px-6 py-3 text-xs font-semibold text-gray-600 uppercase text-right">İşlemler</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {users.map((user) => (
                            <tr key={user.id} className="hover:bg-gray-50">
                                <td className="px-6 py-4">
                                    <div className="font-medium text-gray-900">{user.name}</div>
                                </td>
                                <td className="px-6 py-4 text-gray-600">
                                    {user.email}
                                </td>
                                <td className="px-6 py-4">
                                    <div className="flex gap-1">
                                        {user.roles?.map(role => (
                                            <span key={role} className={`px-2 py-1 text-xs rounded-full ${role === 'admin' ? 'bg-purple-100 text-purple-700' :
                                                role === 'coach' ? 'bg-blue-100 text-blue-700' :
                                                    'bg-green-100 text-green-700'
                                                }`}>
                                                {role === 'admin' ? 'Yönetici' : role === 'coach' ? 'Tutor' : 'Persona'}
                                            </span>
                                        ))}
                                    </div>
                                </td>
                                <td className="px-6 py-4 text-gray-500 text-sm">
                                    {new Date(user.created_at).toLocaleDateString()}
                                </td>
                                <td className="px-6 py-4 text-right">
                                    <div className="flex items-center justify-end gap-2">
                                        <Link
                                            href={`/admin/users/${user.id}`}
                                            className="text-indigo-600 hover:text-indigo-800 text-sm font-medium"
                                        >
                                            Düzenle
                                        </Link>
                                        <button
                                            onClick={() => handleDelete(user.id)}
                                            className="text-red-600 hover:text-red-800 text-sm font-medium"
                                        >
                                            Sil
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                        {users.length === 0 && (
                            <tr>
                                <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                                    Henüz kullanıcı bulunmuyor.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    )
}
