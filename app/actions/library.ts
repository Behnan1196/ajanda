'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export interface CreateLibraryItemInput {
    subject_id: string
    topic_id?: string
    task_type_id: string
    title: string
    description?: string
    day_offset: number
    metadata?: any
}

export async function getLibraryItems(subjectId: string) {
    const supabase = await createClient()

    // Get all items for this subject
    const { data, error } = await supabase
        .from('library_items')
        .select(`
            *,
            task_types (
                id,
                name,
                icon
            )
        `)
        .eq('subject_id', subjectId)
        .order('day_offset', { ascending: true })

    if (error) {
        console.error('Error fetching library items:', error)
        return []
    }

    return data
}

export async function createLibraryItem(input: CreateLibraryItemInput) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return { success: false, error: 'Unauthorized' }

    const { error } = await supabase
        .from('library_items')
        .insert({
            ...input,
            created_by: user.id
        })

    if (error) return { success: false, error: error.message }

    revalidatePath(`/coach/library/${input.subject_id}`)
    return { success: true }
}

export async function deleteLibraryItem(id: string, subjectId: string) {
    const supabase = await createClient()

    const { error } = await supabase
        .from('library_items')
        .delete()
        .eq('id', id)

    if (error) return { success: false, error: error.message }

    revalidatePath(`/coach/library/${subjectId}`)
    return { success: true }
}
