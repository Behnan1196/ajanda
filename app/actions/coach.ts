'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export async function getAssignedStudents() {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
        redirect('/login')
    }

    // Check if user is coach (or admin)
    const { data: userData } = await supabase
        .from('users')
        .select('roles')
        .eq('id', user.id)
        .single()

    if (!userData?.roles?.includes('coach') && !userData?.roles?.includes('admin')) {
        return { error: 'Unauthorized' }
    }

    // Fetch students assigned to this coach
    const { data: students, error } = await supabase
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
        console.error('Error fetching students:', error)
        return { error: error.message }
    }

    // Flatten the response
    return {
        success: true,
        data: students.map((rel: any) => ({
            id: rel.student.id,
            name: rel.student.name,
            email: rel.student.email,
            relationshipId: rel.id,
            role: rel.role_label || 'Genel Koç'
        }))
    }
}

export async function getStudentRelationships(studentId: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Unauthorized' }

    const { data, error } = await supabase
        .from('user_relationships')
        .select('id, role_label')
        .eq('coach_id', user.id)
        .eq('student_id', studentId)
        .eq('is_active', true)

    if (error) {
        console.error('Error fetching relationships:', error)
        return []
    }

    return data.map(r => ({
        id: r.id,
        role: r.role_label || 'Genel Koç'
    }))
}
