'use client'

import { useRouter } from 'next/navigation'
import CoachingAppView from '@/components/tutor/CoachingAppView'

interface TutorPageClientProps {
    userId: string
    initialPersonaId?: string
}

export default function TutorPageClient({ userId, initialPersonaId }: TutorPageClientProps) {
    const router = useRouter()

    return (
        <div className="h-screen bg-white">
            <CoachingAppView
                userId={userId}
                onClose={() => router.push('/')}
                initialPersonaId={initialPersonaId}
            />
        </div>
    )
}
