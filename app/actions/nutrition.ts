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
