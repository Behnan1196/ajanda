'use client'

import { createClient } from '@/lib/supabase/client'
import { useEffect, useState } from 'react'

export default function DebugRelationships() {
    const [relationships, setRelationships] = useState<any[]>([])
    const [user, setUser] = useState<any>(null)

    useEffect(() => {
        const load = async () => {
            const supabase = createClient()
            const { data: { user } } = await supabase.auth.getUser()
            setUser(user)

            if (user) {
                const { data: rels } = await supabase
                    .from('user_relationships')
                    .select('*, student:users!student_id(id, name, email)')

                setRelationships(rels || [])
            }
        }
        load()
    }, [])

    return (
        <div className="p-8 font-mono text-xs">
            <h1 className="text-2xl font-bold mb-4">Debug Relationships</h1>

            <div className="mb-4">
                <strong>Current User:</strong> {user?.id} ({user?.email})
            </div>

            <h2 className="text-xl font-bold mt-8 mb-2">User Relationships ({relationships.length})</h2>
            <div className="space-y-4">
                {relationships.map(r => (
                    <div key={r.id} className="border p-2 rounded bg-gray-50">
                        <div><strong>ID:</strong> {r.id}</div>
                        <div><strong>Coach ID:</strong> {r.coach_id}</div>
                        <div><strong>Student ID:</strong> {r.student_id}</div>
                        <div><strong>Student Name:</strong> {r.student?.name}</div>
                        <div><strong>Is Active:</strong> {JSON.stringify(r.is_active)}</div>
                        <div className={r.coach_id === user?.id ? "text-green-600 font-bold" : "text-red-400"}>
                            Matches Current User? {r.coach_id === user?.id ? "YES" : "NO"}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
}
