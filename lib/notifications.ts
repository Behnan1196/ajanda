'use client'

export async function requestNotificationPermission() {
    if (!('Notification' in window)) {
        console.log('This browser does not support notifications.')
        return false
    }

    if (Notification.permission === 'granted') {
        return true
    }

    if (Notification.permission !== 'denied') {
        const permission = await Notification.requestPermission()
        return permission === 'granted'
    }

    return false
}

export function sendLocalNotification(title: string, body: string) {
    if ('Notification' in window && Notification.permission === 'granted') {
        new Notification(title, {
            body,
            icon: '/icons/icon-512x512.png'
        })
    }
}
