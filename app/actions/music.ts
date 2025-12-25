'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

/**
 * REPERTOIRE
 */

export async function getRepertoire(userId: string) {
    const supabase = await createClient()
    const { data, error } = await supabase
        .from('music_repertoire')
        .select('*')
        .eq('user_id', userId)
        .order('status', { ascending: true })

    return { data, error: error?.message }
}

export async function upsertRepertoireItem(userId: string, item: any) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Authentication required' }

    const { error } = await supabase
        .from('music_repertoire')
        .upsert({
            ...item,
            user_id: userId,
            created_by: user.id
        })

    revalidatePath('/')
    return { success: !error, error: error?.message }
}

/**
 * EXERCISES
 */

export async function getExercises(userId: string) {
    const supabase = await createClient()
    const { data, error } = await supabase
        .from('music_exercises')
        .select('*')
        .eq('user_id', userId)

    return { data, error: error?.message }
}

export async function upsertExercise(userId: string, exercise: any) {
    const supabase = await createClient()
    const { error } = await supabase
        .from('music_exercises')
        .upsert({
            ...exercise,
            user_id: userId
        })

    revalidatePath('/')
    return { success: !error, error: error?.message }
}

/**
 * PRACTICE LOGS
 */

export async function getPracticeLogs(userId: string) {
    const supabase = await createClient()
    const { data, error } = await supabase
        .from('music_practice_logs')
        .select('*')
        .eq('user_id', userId)
        .order('log_date', { ascending: false })

    return { data, error: error?.message }
}

export async function recordPractice(userId: string, log: { duration_minutes: number, content: string, log_date?: string }) {
    const supabase = await createClient()
    const { error } = await supabase
        .from('music_practice_logs')
        .insert({
            ...log,
            user_id: userId
        })

    revalidatePath('/')
    return { success: !error, error: error?.message }
}
