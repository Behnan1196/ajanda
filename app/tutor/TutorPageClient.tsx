'use client'

import { useRouter } from 'next/navigation'
import CoachingAppView from '@/components/tutor/CoachingAppView'

interface TutorPageClientProps {
    userId: string
}

export default function TutorPageClient({ userId }: TutorPageClientProps) {
    const router = useRouter()

    return (
        <div className="h-screen bg-white">
            <CoachingAppView
                userId={userId}
                onClose={() => router.push('/')}
            />
        </div>
    )
}
