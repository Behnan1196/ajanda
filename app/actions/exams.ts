'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

// --- Types ---
export interface Section {
    key: string
    name: string
    question_count: number
}

// --- Exam Templates ---

export async function createExamTemplate(data: { name: string, sections: Section[] }) {
    const supabase = await createClient()

    // Check admin
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Unauthorized' }

    // Ideally check role here again, but RLS handles security. 
    // Checking role for early exit is good practice though.
    // Simplifying for now relying on RLS rejection if not admin.

    const { error } = await supabase.from('exam_templates').insert({
        name: data.name,
        sections: data.sections
    })

    if (error) {
        return { error: error.message }
    }

    revalidatePath('/admin/exams')
    return { success: true }
}

export async function getExamTemplates() {
    const supabase = await createClient()
    const { data, error } = await supabase.from('exam_templates').select('*').order('created_at', { ascending: false })
    if (error) return []
    return data
}

// --- Exams ---

export async function createExam(data: { name: string, date: string, template_id: string }) {
    const supabase = await createClient()

    const { error } = await supabase.from('exams').insert({
        name: data.name,
        date: data.date,
        template_id: data.template_id
    })

    if (error) {
        return { error: error.message }
    }

    revalidatePath('/admin/exams')
    return { success: true }
}

export async function getExams() {
    const supabase = await createClient()
    // Fetch exams with template info
    const { data, error } = await supabase
        .from('exams')
        .select(`
            *,
            template:exam_templates(name, sections)
        `)
        .order('date', { ascending: false })

    if (error) return []
    return data
}

// --- Exam Results ---

export async function saveExamResult(data: {
    user_id: string,
    exam_id: string,
    details: any,
    total_net: number
}) {
    const supabase = await createClient()

    // Upsert result
    const { error } = await supabase.from('exam_results').upsert({
        user_id: data.user_id,
        exam_id: data.exam_id,
        details: data.details,
        total_net: data.total_net
    }, { onConflict: 'user_id, exam_id' })

    if (error) {
        return { error: error.message }
    }

    revalidatePath(`/coach/students/${data.user_id}`)
    return { success: true }
}

export async function getStudentExamResults(userId: string) {
    const supabase = await createClient()

    const { data, error } = await supabase
        .from('exam_results')
        .select(`
            *,
            exam:exams (
                name,
                date,
                template:exam_templates (
                    name,
                    sections
                )
            )
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false })

    if (error) return []
    return data
}
