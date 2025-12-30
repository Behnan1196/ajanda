'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export async function getAssignedPersonas() {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
        redirect('/login')
    }

    // Check if user is coach (or admin) and get their own profile
    const { data: userData } = await supabase
        .from('users')
        .select('id, name, email, roles')
        .eq('id', user.id)
        .single()

    if (!userData?.roles?.includes('coach') && !userData?.roles?.includes('admin')) {
        return { error: 'Unauthorized' }
    }

    // Fetch personas assigned to this tutor
    const { data: personas, error } = await supabase
        .from('user_relationships')
        .select(`
            id,
            role_label,
            student:users!student_id (
                id,
                name,
                email
            )
        `)
        .eq('coach_id', user.id)
        .eq('is_active', true)

    if (error) {
        console.error('Error fetching personas:', error)
        return { error: error.message }
    }

    // Flatten the response and group by student ID
    const studentMap = new Map<string, any>()

    personas.forEach((rel: any) => {
        const studentId = rel.student.id
        if (!studentMap.has(studentId)) {
            studentMap.set(studentId, {
                id: studentId,
                name: rel.student.name,
                email: rel.student.email,
                relationshipId: rel.id, // Primary relationship ID
                roles: [rel.role_label || 'Genel Tutor']
            })
        } else {
            const existing = studentMap.get(studentId)
            existing.roles.push(rel.role_label || 'Genel Tutor')
        }
    })

    const mappedPersonas = Array.from(studentMap.values()).map(s => ({
        ...s,
        role: s.roles.join(', ')
    }))

    return {
        success: true,
        data: mappedPersonas
    }
}

export async function getPersonaRelationships(personaId: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Unauthorized' }

    const { data, error } = await supabase
        .from('user_relationships')
        .select('id, role_label')
        .eq('coach_id', user.id)
        .eq('student_id', personaId)
        .eq('is_active', true)

    if (error) {
        console.error('Error fetching relationships:', error)
        return []
    }

    return data.map(r => ({
        id: r.id,
        role: r.role_label || 'Genel Tutor'
    }))
}
