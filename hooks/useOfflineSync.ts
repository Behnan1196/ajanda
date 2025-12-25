import { useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { db, LocalTask, LocalHabit, LocalHabitCompletion } from '@/lib/db'

export function useOfflineSync(userId: string | undefined) {
    const supabase = createClient()

    const syncTasks = async () => {
        if (!userId) return

        // 1. Push dirty tasks to Supabase
        const dirtyTasks = await db.tasks.where('is_dirty').equals(1).toArray()
        for (const task of dirtyTasks) {
            const { is_dirty, last_synced_at, ...supabaseData } = task
            const { error } = await supabase
                .from('tasks')
                .upsert(supabaseData)

            if (!error) {
                await db.tasks.update(task.id, { is_dirty: 0, last_synced_at: new Date().toISOString() })
            }
        }

        // 2. Pull latest tasks from Supabase
        const { data: remoteTasks, error } = await supabase
            .from('tasks')
            .select('*')
            .eq('user_id', userId)

        if (!error && remoteTasks) {
            for (const remote of remoteTasks) {
                const local = await db.tasks.get(remote.id)
                if (!local || local.is_dirty === 0) {
                    await db.tasks.put({
                        ...remote,
                        is_dirty: 0,
                        last_synced_at: new Date().toISOString()
                    })
                }
            }
        }
    }

    const syncHabits = async () => {
        if (!userId) return

        // 1. Push dirty habits
        const dirtyHabits = await db.habits.where('is_dirty').equals(1).toArray()
        for (const habit of dirtyHabits) {
            const { is_dirty, last_synced_at, ...supabaseData } = habit
            const { error } = await supabase
                .from('habits')
                .upsert(supabaseData)

            if (!error) {
                await db.habits.update(habit.id, { is_dirty: 0, last_synced_at: new Date().toISOString() })
            }
        }

        // 2. Pull latest habits
        const { data: remoteHabits, error: hError } = await supabase
            .from('habits')
            .select('*')
            .eq('user_id', userId)

        if (!hError && remoteHabits) {
            for (const remote of remoteHabits) {
                const local = await db.habits.get(remote.id)
                if (!local || local.is_dirty === 0) {
                    await db.habits.put({
                        ...remote,
                        is_dirty: 0,
                        last_synced_at: new Date().toISOString()
                    })
                }
            }
        }

        // 3. Push/Pull Habit Completions
        const dirtyCompletions = await db.habit_completions.where('is_dirty').equals(1).toArray()
        for (const comp of dirtyCompletions) {
            const { is_dirty, last_synced_at, ...supabaseData } = comp
            const { error } = await supabase
                .from('habit_completions')
                .upsert(supabaseData)

            if (!error) {
                await db.habit_completions.update(comp.id, { is_dirty: 0, last_synced_at: new Date().toISOString() })
            }
        }

        const { data: remoteComps, error: cError } = await supabase
            .from('habit_completions')
            .select('*')
            .eq('user_id', userId)

        if (!cError && remoteComps) {
            for (const remote of remoteComps) {
                const local = await db.habit_completions.get(remote.id)
                if (!local || local.is_dirty === 0) {
                    await db.habit_completions.put({
                        ...remote,
                        is_dirty: 0,
                        last_synced_at: new Date().toISOString()
                    })
                }
            }
        }
    }

    const syncMetadata = async () => {
        // Pull Task Types
        const { data: types, error: tError } = await supabase.from('task_types').select('*')
        if (!tError && types) {
            for (const t of types) await db.task_types.put(t)
        }

        // Pull Subjects
        const { data: subjects, error: sError } = await supabase.from('subjects').select('*')
        if (!sError && subjects) {
            for (const s of subjects) await db.subjects.put(s)
        }

        // Pull Topics
        const { data: topics, error: toError } = await supabase.from('topics').select('*')
        if (!toError && topics) {
            for (const to of topics) await db.topics.put(to)
        }
    }

    const fullSync = async () => {
        try {
            await syncMetadata()
            await syncTasks()
            await syncHabits()
            console.log('Sync completed successfully')
        } catch (err) {
            console.error('Sync failed:', err)
        }
    }

    useEffect(() => {
        if (userId) {
            fullSync()

            // Sync when coming back online
            const handleOnline = () => fullSync()
            window.addEventListener('online', handleOnline)

            // Periodic sync every 5 minutes
            const interval = setInterval(fullSync, 5 * 60 * 1000)

            return () => {
                window.removeEventListener('online', handleOnline)
                clearInterval(interval)
            }
        }
    }, [userId])

    return { fullSync }
}
