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
            ),
            dependency_ids
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

    // Dependency Validation: If updating dates, check predecessors
    if (updates.start_date || updates.end_date) {
        const { data: currentTask } = await supabase
            .from('tasks')
            .select('dependency_ids, start_date, end_date')
            .eq('id', taskId)
            .single()

        const depIds = updates.dependency_ids || currentTask?.dependency_ids
        if (depIds && depIds.length > 0) {
            const { data: predecessors } = await supabase
                .from('tasks')
                .select('title, end_date')
                .in('id', depIds)

            const newStart = updates.start_date ? new Date(updates.start_date) : (currentTask?.start_date ? new Date(currentTask.start_date) : null)

            if (newStart && predecessors) {
                for (const pred of predecessors) {
                    if (pred.end_date && new Date(pred.end_date) > newStart) {
                        return { error: `Bağımlılık Hatası: "${pred.title}" bitmeden bu görev başlayamaz.` }
                    }
                }
            }
        }
    }

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

    // Automatic Rollup: If this task has a parent, update parent's progress
    if (data.parent_id) {
        await recalculateParentProgress(projectId, data.parent_id)
    }

    return { data }
}

async function recalculateParentProgress(projectId: string, parentId: string) {
    const supabase = await createClient()

    // Get all subtasks of this parent
    const { data: subtasks } = await supabase
        .from('tasks')
        .select('progress_percent, is_completed')
        .eq('parent_id', parentId)

    if (!subtasks || subtasks.length === 0) return

    // Calculate average progress
    const totalProgress = subtasks.reduce((sum, task) => sum + (task.progress_percent || 0), 0)
    const averageProgress = Math.round(totalProgress / subtasks.length)
    const allCompleted = subtasks.every(t => t.is_completed)

    // Update parent
    await supabase
        .from('tasks')
        .update({
            progress_percent: averageProgress,
            is_completed: allCompleted,
            completed_at: allCompleted ? new Date().toISOString() : null
        })
        .eq('id', parentId)

    // Recursively update upwards if parent also has a parent
    const { data: parentTask } = await supabase
        .from('tasks')
        .select('parent_id')
        .eq('id', parentId)
        .single()

    if (parentTask?.parent_id) {
        await recalculateParentProgress(projectId, parentTask.parent_id)
    }
}
