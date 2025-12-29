'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

/**
 * MEASUREMENTS
 */

export async function getMeasurements(userId: string) {
    const supabase = await createClient()
    const { data, error } = await supabase
        .from('nutrition_measurements')
        .select('*')
        .eq('user_id', userId)
        .order('recorded_at', { ascending: false })

    return { data, error: error?.message }
}

export async function addMeasurement(userId: string, weight: number, fatPerc: number, waist: number, hip: number, notes?: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Authentication required' }

    const { error } = await supabase
        .from('nutrition_measurements')
        .insert({
            user_id: userId,
            weight,
            fat_percentage: fatPerc,
            waist_circumference: waist,
            hip_circumference: hip,
            notes,
            recorded_by: user.id
        })

    revalidatePath('/')
    return { success: !error, error: error?.message }
}

/**
 * DIET PLANS
 */

export async function getDietPlans(userId: string) {
    const supabase = await createClient()
    const { data, error } = await supabase
        .from('nutrition_diet_plans')
        .select('*')
        .eq('user_id', userId)
        .eq('is_active', true)
        .order('day_of_week', { ascending: true })

    return { data, error: error?.message }
}

export async function upsertDietPlan(userId: string, dayOfWeek: number, mealType: string, content: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Authentication required' }

    const { error } = await supabase
        .from('nutrition_diet_plans')
        .upsert({
            user_id: userId,
            day_of_week: dayOfWeek,
            meal_type: mealType,
            content,
            is_active: true,
            created_by: user.id
        }, {
            onConflict: 'user_id,day_of_week,meal_type'
        })

    revalidatePath('/')
    return { success: !error, error: error?.message }
}

/**
 * DAILY LOGS
 */

export async function getDailyLog(userId: string, date: string) {
    const supabase = await createClient()
    const { data, error } = await supabase
        .from('nutrition_daily_logs')
        .select('*')
        .eq('user_id', userId)
        .eq('log_date', date)
        .single()

    return { data, error: error?.message }
}

export async function updateDailyLog(userId: string, date: string, updates: { water_ml?: number, step_count?: number, meal_confirmations?: any }) {
    const supabase = await createClient()

    const { error } = await supabase
        .from('nutrition_daily_logs')
        .upsert({
            user_id: userId,
            log_date: date,
            ...updates
        }, {
            onConflict: 'user_id,log_date'
        })

    revalidatePath('/')
    return { success: !error, error: error?.message }
}

/**
 * NUTRITION PROGRAMS (Project-based)
 */

/**
 * NUTRITION PROGRAMS (Project-based) - Deprecated in favor of Unified System
 */

export async function completeMealTask(
    taskId: string,
    actualCalories: number,
    notes?: string
) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Oturum açılmamış' }

    try {
        // Task'ı al
        const { data: task } = await supabase
            .from('tasks')
            .select('custom_fields')
            .eq('id', taskId)
            .single()

        if (!task) return { error: 'Görev bulunamadı' }

        // Custom fields'ı güncelle
        const updatedFields = {
            ...task.custom_fields,
            actual_calories: actualCalories,
            completion_notes: notes,
            completed_at: new Date().toISOString()
        }

        // Task'ı tamamla
        await supabase
            .from('tasks')
            .update({
                is_completed: true,
                completed_at: new Date().toISOString(),
                custom_fields: updatedFields
            })
            .eq('id', taskId)

        revalidatePath('/')
        return { success: true }
    } catch (e) {
        console.error('Complete meal task error:', e)
        return { error: String(e) }
    }
}

export async function getDailyNutritionSummary(
    projectId: string,
    date: string
) {
    const supabase = await createClient()

    try {
        // Projenin hedef kalorisini al
        const { data: project } = await supabase
            .from('projects')
            .select('settings')
            .eq('id', projectId)
            .single()

        if (!project) return { error: 'Program bulunamadı' }

        const targetCalories = project.settings?.target_calories || 0

        // O günün task'larını al
        const { data: tasks } = await supabase
            .from('tasks')
            .select('*')
            .eq('project_id', projectId)
            .eq('start_date', date)
            .order('custom_fields->suggested_time', { ascending: true })

        if (!tasks) return { error: 'Görevler bulunamadı' }

        // Toplam gerçekleşen kaloriyi hesapla
        const actualCalories = tasks.reduce((sum, task) => {
            const actual = task.custom_fields?.actual_calories || 0
            return sum + actual
        }, 0)

        // Öğün özetleri
        const meals = tasks.map(task => ({
            id: task.id,
            title: task.title,
            type: task.custom_fields?.meal_type,
            time: task.custom_fields?.suggested_time,
            targetCalories: task.custom_fields?.calories || 0,
            actualCalories: task.custom_fields?.actual_calories || 0,
            completed: task.is_completed,
            foods: task.custom_fields?.foods || []
        }))

        return {
            data: {
                target: targetCalories,
                actual: actualCalories,
                meals
            }
        }
    } catch (e) {
        console.error('Daily nutrition summary error:', e)
        return { error: String(e) }
    }
}
