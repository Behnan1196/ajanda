'use server'

export async function getVideoMetadata(videoUrl: string) {
    try {
        // YouTube oEmbed endpoint
        const oembedUrl = `https://www.youtube.com/oembed?url=${encodeURIComponent(videoUrl)}&format=json`

        const response = await fetch(oembedUrl)

        if (!response.ok) {
            return null
        }

        const data = await response.json()

        return {
            title: data.title,
            author_name: data.author_name,
            thumbnail_url: data.thumbnail_url,
            provider_name: data.provider_name
        }
    } catch (error) {
        console.error('Error fetching video metadata:', error)
        return null
    }
}
