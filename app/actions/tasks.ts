'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export interface CreateTaskInput {
    user_id: string
    title: string
    description?: string
    due_date: string
    task_type: 'todo' | 'watch' | 'test'
    is_completed: boolean
    relationship_id?: string // Optional context
}

export async function createBulkTasks(tasks: CreateTaskInput[]) {
    const supabase = await createClient()

    // 1. Get Current User (Coach)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Oturum açılmamış' }

    // 2. Get Task Type ID for 'todo'
    const { data: taskType } = await supabase
        .from('task_types')
        .select('id')
        .eq('slug', 'todo')
        .single()

    if (!taskType) return { error: 'Görev tipi bulunamadı' }

    // 3. Prepare Payloads
    const payload = tasks.map(t => ({
        user_id: t.user_id,
        title: t.title,
        description: t.description,
        due_date: t.due_date,
        task_type_id: taskType.id, // Map string to ID
        is_completed: t.is_completed,
        created_by: user.id, // Required by DB
        assigned_by: user.id, // Required by RLS
        relationship_id: t.relationship_id // Store context
    }))

    const { error } = await supabase
        .from('tasks')
        .insert(payload)

    if (error) {
        console.error('Bulk create error:', error)
        return { error: 'Görevler oluşturulurken hata oluştu: ' + error.message }
    }

    revalidatePath('/coach')
    revalidatePath('/program')
    return { success: true }
}
