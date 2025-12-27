import { useState, useEffect } from 'react'
import { getProjects } from '@/app/actions/projects'

interface UseProgramsOptions {
    moduleType?: string
    autoLoad?: boolean
}

export function usePrograms(options: UseProgramsOptions = {}) {
    const { moduleType, autoLoad = true } = options
    const [programs, setPrograms] = useState<any[]>([])
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const loadPrograms = async () => {
        setLoading(true)
        setError(null)

        try {
            const result = await getProjects()

            if (result.error) {
                setError(result.error)
                setPrograms([])
            } else if (result.data) {
                // Filter by module type if specified
                const filtered = moduleType
                    ? result.data.filter((p: any) => p.settings?.module_type === moduleType)
                    : result.data

                setPrograms(filtered)
            }
        } catch (e) {
            setError(String(e))
            setPrograms([])
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        if (autoLoad) {
            loadPrograms()
        }
    }, [moduleType, autoLoad])

    return {
        programs,
        loading,
        error,
        reload: loadPrograms
    }
}
