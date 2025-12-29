/**
 * Unified Tasks Actions
 * 
 * Generic CRUD operations for all task types
 */

'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { revalidatePath } from 'next/cache'

export interface CreateTaskInput {
    project_id?: string | null
    task_type: string  // slug from task_types
    title: string
    description?: string
    start_date?: string
    due_date?: string
    duration_minutes?: number
    settings?: Record<string, any>
    assigned_to?: string  // user_id to assign to
}

/**
 * Create a new task
 */
export async function createTask(input: CreateTaskInput) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Oturum açılmamış' }

    try {
        // Get task type ID
        const { data: taskType } = await supabase
            .from('task_types')
            .select('id')
            .eq('slug', input.task_type)
            .single()

        if (!taskType) {
            return { error: 'Geçersiz task type' }
        }

        // Determine target user (assignee or self)
        const targetUserId = input.assigned_to || user.id

        // Use admin client if assigning to someone else
        const client = targetUserId === user.id ? supabase : createAdminClient()

        const { data: task, error } = await client
            .from('tasks')
            .insert({
                project_id: input.project_id || null,
                user_id: targetUserId,
                task_type_id: taskType.id,
                title: input.title,
                description: input.description,
                start_date: input.start_date || new Date().toISOString().split('T')[0],
                due_date: input.due_date || input.start_date || new Date().toISOString().split('T')[0],
                duration_minutes: input.duration_minutes || 0,
                settings: input.settings || {},
                created_by: user.id,
                assigned_to: targetUserId,
                assigned_by: user.id
            })
            .select()
            .single()

        if (error) {
            console.error('Task creation error:', error)
            return { error: error.message }
        }

        revalidatePath('/')
        return { data: task }
    } catch (e) {
        console.error('createTask error:', e)
        return { error: String(e) }
    }
}

/**
 * Get tasks for a user
 */
export async function getTasks(filters?: {
    project_id?: string
    task_type?: string
    user_id?: string
    start_date?: string
    end_date?: string
}) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Oturum açılmamış' }

    let query = supabase
        .from('tasks')
        .select(`
      *,
      task_type:task_types(*)
    `)
        .eq('user_id', filters?.user_id || user.id)

    if (filters?.project_id) {
        query = query.eq('project_id', filters.project_id)
    }

    if (filters?.task_type) {
        const { data: taskType } = await supabase
            .from('task_types')
            .select('id')
            .eq('slug', filters.task_type)
            .single()

        if (taskType) {
            query = query.eq('task_type_id', taskType.id)
        }
    }

    if (filters?.start_date) {
        query = query.gte('start_date', filters.start_date)
    }

    if (filters?.end_date) {
        query = query.lte('due_date', filters.end_date)
    }

    const { data, error } = await query.order('start_date', { ascending: true })

    if (error) {
        return { error: error.message }
    }

    return { data }
}

/**
 * Update task
 */
export async function updateTask(taskId: string, updates: Partial<CreateTaskInput>) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Oturum açılmamış' }

    const updateData: any = {}

    if (updates.title) updateData.title = updates.title
    if (updates.description !== undefined) updateData.description = updates.description
    if (updates.start_date) updateData.start_date = updates.start_date
    if (updates.due_date) updateData.due_date = updates.due_date
    if (updates.duration_minutes !== undefined) updateData.duration_minutes = updates.duration_minutes
    if (updates.settings) updateData.settings = updates.settings

    const { data, error } = await supabase
        .from('tasks')
        .update(updateData)
        .eq('id', taskId)
        .select()
        .single()

    if (error) {
        return { error: error.message }
    }

    revalidatePath('/')
    return { data }
}

/**
 * Complete/uncomplete task
 */
export async function toggleTaskCompletion(taskId: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Oturum açılmamış' }

    // Get current state
    const { data: task } = await supabase
        .from('tasks')
        .select('is_completed')
        .eq('id', taskId)
        .single()

    if (!task) {
        return { error: 'Task not found' }
    }

    const { data, error } = await supabase
        .from('tasks')
        .update({
            is_completed: !task.is_completed,
            completed_at: !task.is_completed ? new Date().toISOString() : null
        })
        .eq('id', taskId)
        .select()
        .single()

    if (error) {
        return { error: error.message }
    }

    revalidatePath('/')
    return { data }
}

/**
 * Delete task
 */
export async function deleteTask(taskId: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Oturum açılmamış' }

    const { error } = await supabase
        .from('tasks')
        .delete()
        .eq('id', taskId)

    if (error) {
        return { error: error.message }
    }

    revalidatePath('/')
    return { success: true }
}

export interface BulkTaskInput {
    user_id: string
    title: string
    description?: string
    due_date: string
    task_type: 'todo' | 'watch' | 'test'
    is_completed: boolean
    relationship_id?: string
}

// Legacy function for backwards compatibility
export async function createBulkTasks(tasks: BulkTaskInput[]) {
    const results = []
    for (const task of tasks) {
        const result = await createTask({
            title: task.title,
            description: task.description,
            due_date: task.due_date,
            task_type: task.task_type,
            assigned_to: task.user_id,
            settings: { relationship_id: task.relationship_id }
        })
        results.push(result)
    }
    return { success: true, results }
}
