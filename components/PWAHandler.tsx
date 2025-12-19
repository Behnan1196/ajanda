'use client'

import { useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { sendLocalNotification } from '@/lib/notifications'

export default function PWAHandler() {
    const supabase = createClient()
    const notifiedTasks = useRef<Set<string>>(new Set())

    useEffect(() => {
        // Register Service Worker
        if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
            navigator.serviceWorker
                .register('/sw.js')
                .then((registration) => {
                    console.log('Service Worker registered')
                })
        }

        // Client-side Reminder Checker
        const checkReminders = async () => {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) return

            const now = new Date()

            // local HH:MM
            const hour = now.getHours().toString().padStart(2, '0')
            const minute = now.getMinutes().toString().padStart(2, '0')
            const currentTimeString = `${hour}:${minute}`

            // local yyyy-mm-dd
            const offset = now.getTimezoneOffset()
            const localNow = new Date(now.getTime() - (offset * 60 * 1000))
            const today = localNow.toISOString().split('T')[0]

            // Clear notifiedTasks set if the day has changed (simple reset)
            // Or just check tasks for today.

            const { data: tasks, error } = await supabase
                .from('tasks')
                .select('id, title, due_time')
                .eq('user_id', user.id)
                .eq('due_date', today)
                .eq('is_completed', false)
                .eq('due_time', currentTimeString)

            if (error) {
                console.error('Error fetching tasks for notifications:', error)
                return
            }

            if (tasks && tasks.length > 0) {
                tasks.forEach(task => {
                    if (!notifiedTasks.current.has(task.id)) {
                        console.log('Triggering notification for task:', task.title)
                        sendLocalNotification('Görev Zamanı!', task.title)
                        notifiedTasks.current.add(task.id)
                    }
                })
            }
        }

        // Check every 20 seconds for higher precision
        const interval = setInterval(checkReminders, 20000)
        // Initial check
        checkReminders()

        return () => clearInterval(interval)
    }, [supabase])

    return null
}
