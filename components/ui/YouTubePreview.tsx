'use client'

import { useState, useEffect } from 'react'
import { getVideoMetadata } from '@/app/actions/media'

interface YouTubePreviewProps {
    url: string
}

export default function YouTubePreview({ url }: YouTubePreviewProps) {
    const [isPlaying, setIsPlaying] = useState(false)
    const [metadata, setMetadata] = useState<{ title: string, author_name: string } | null>(null)
    const [isLoading, setIsLoading] = useState(true)

    // Extract video ID regex
    const getYouTubeId = (url: string) => {
        const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/
        const match = url.match(regExp)
        return (match && match[2].length === 11) ? match[2] : null
    }

    const videoId = getYouTubeId(url)

    useEffect(() => {
        if (url) {
            setIsLoading(true)
            getVideoMetadata(url)
                .then(data => {
                    if (data) {
                        setMetadata(data)
                    }
                })
                .finally(() => {
                    setIsLoading(false)
                })
        }
    }, [url])

    if (!videoId) return null

    if (isPlaying) {
        return (
            <div className="relative w-full aspect-video rounded-lg overflow-hidden bg-black mt-2 animate-in fade-in zoom-in duration-300 group">
                <iframe
                    width="100%"
                    height="100%"
                    src={`https://www.youtube.com/embed/${videoId}?autoplay=1`}
                    title="YouTube video player"
                    frameBorder="0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    className="absolute inset-0"
                ></iframe>
                <button
                    onClick={(e) => {
                        e.stopPropagation()
                        setIsPlaying(false)
                    }}
                    className="absolute top-2 right-2 p-1.5 bg-black/60 hover:bg-black/80 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-sm z-10"
                    title="Kapat"
                >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>
            </div>
        )
    }

    return (
        <div
            onClick={(e) => {
                e.stopPropagation() // Prevent drag or parent click issues
                setIsPlaying(true)
            }}
            className="group mt-2 border border-gray-100 bg-gray-50 rounded-lg p-2 pr-3 flex items-center gap-3 cursor-pointer hover:bg-gray-100 hover:border-gray-200 transition-all select-none"
        >
            {/* Thumbnail */}
            <div className="relative w-24 h-16 shrink-0 rounded-md overflow-hidden bg-gray-200">
                <img
                    src={`https://img.youtube.com/vi/${videoId}/mqdefault.jpg`}
                    alt="Video thumbnail"
                    className="w-full h-full object-cover"
                    onLoad={(e) => {
                        // Optional: Handle image load if needed
                    }}
                />
                <div className="absolute inset-0 flex items-center justify-center bg-black/10 group-hover:bg-black/20 transition">
                    <div className="w-8 h-8 bg-black/50 rounded-full flex items-center justify-center backdrop-blur-sm text-white">
                        <svg className="w-4 h-4 ml-0.5" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M8 5v14l11-7z" />
                        </svg>
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0 flex flex-col justify-center gap-1">
                {isLoading ? (
                    <>
                        <div className="h-4 bg-gray-200 rounded w-3/4 animate-pulse" />
                        <div className="h-3 bg-gray-200 rounded w-1/2 animate-pulse mt-1" />
                    </>
                ) : (
                    <>
                        <h4 className="text-sm font-medium text-gray-900 line-clamp-2 leading-tight">
                            {metadata?.title || 'YouTube Video'}
                        </h4>
                        <div className="flex items-center gap-1.5">
                            <svg className="w-3.5 h-3.5 text-red-600" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M19.615 3.184c-3.604-.246-11.631-.245-15.23 0-3.897.266-4.356 2.62-4.385 8.816.029 6.185.484 8.549 4.385 8.816 3.6.245 11.626.246 15.23 0 3.897-.266 4.356-2.62 4.385-8.816-.029-6.185-.484-8.549-4.385-8.816zm-10.615 12.816v-8l8 3.993-8 4.007z" />
                            </svg>
                            <span className="text-xs text-gray-500 font-medium">
                                {metadata?.author_name || 'YouTube'}
                            </span>
                        </div>
                    </>
                )}
            </div>
        </div>
    )
}
