'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export interface Project {
    id: string
    user_id: string
    name: string
    description: string | null
    status: string
    start_date: string | null
    end_date: string | null
    settings: any
    created_at: string
}

export async function getProjects() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Oturum açılmamış' }

    const { data, error } = await supabase
        .from('projects')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

    if (error) return { error: error.message }
    return { data: data as Project[] }
}

export async function createProject(name: string, description?: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Oturum açılmamış' }

    const { data, error } = await supabase
        .from('projects')
        .insert({
            user_id: user.id,
            name,
            description,
            status: 'active'
        })
        .select()
        .single()

    if (error) return { error: error.message }

    revalidatePath('/projects')
    return { data: data as Project }
}

export async function updateProject(projectId: string, updates: Partial<Project>) {
    const supabase = await createClient()

    const { data, error } = await supabase
        .from('projects')
        .update(updates)
        .eq('id', projectId)
        .select()
        .single()

    if (error) return { error: error.message }

    revalidatePath('/projects')
    revalidatePath(`/projects/${projectId}`)
    return { data: data as Project }
}

export async function deleteProject(projectId: string) {
    const supabase = await createClient()

    const { error } = await supabase
        .from('projects')
        .delete()
        .eq('id', projectId)

    if (error) return { error: error.message }

    revalidatePath('/projects')
    return { success: true }
}

export async function getProjectTasks(projectId: string) {
    const supabase = await createClient()

    const { data, error } = await supabase
        .from('tasks')
        .select(`
            *,
            task_types (
                name,
                slug,
                icon
            ),
            assigned_to_user:users!tasks_assigned_to_fkey (
                name,
                avatar_url
            )
        `)
        .eq('project_id', projectId)
        .order('start_date', { ascending: true, nullsFirst: false })

    if (error) return { error: error.message }
    return { data }
}

export async function createProjectTask(projectId: string, title: string, description?: string, parentId?: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Oturum açılmamış' }

    // Get 'todo' task type ID
    const { data: taskType } = await supabase
        .from('task_types')
        .select('id')
        .eq('slug', 'todo')
        .single()

    if (!taskType) return { error: 'Görev tipi bulunamadı' }

    const { data, error } = await supabase
        .from('tasks')
        .insert({
            project_id: projectId,
            parent_id: parentId,
            user_id: user.id,
            title,
            description,
            task_type_id: taskType.id,
            is_completed: false,
            created_by: user.id,
            assigned_by: user.id,
            due_date: new Date().toISOString() // Default to today
        })
        .select()
        .single()

    if (error) return { error: error.message }

    revalidatePath(`/projects/${projectId}`)
    return { data }
}

export async function updateProjectTask(projectId: string, taskId: string, updates: any) {
    const supabase = await createClient()

    console.log('Updating task:', taskId, updates)

    const { data, error } = await supabase
        .from('tasks')
        .update(updates)
        .eq('id', taskId)
        .select()
        .single()

    if (error) {
        console.error('Update Task Error:', error)
        return { error: error.message }
    }

    console.log('Update Task Success:', data)

    revalidatePath(`/projects/${projectId}`)
    return { data }
}
