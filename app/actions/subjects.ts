'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export interface CreateSubjectInput {
    name: string
    description?: string
    category?: string
    color?: string
    icon?: string
    topics?: string[]
}

export interface CreateTopicInput {
    subject_id: string
    name: string
    description?: string
}

const SPECIALTY_TEMPLATES: Record<string, { subjects: any[] }> = {
    'spor': {
        subjects: [
            {
                name: 'Antrenman Programı',
                icon: 'dumbbell',
                color: '#EF4444',
                topics: ['Kardiyo', 'Güç Antrenmanı', 'Esneklik', 'Dinlenme']
            },
            {
                name: 'Beslenme Takibi',
                icon: 'apple',
                color: '#10B981',
                topics: ['Kahvaltı', 'Öğle Yemeği', 'Akşam Yemeği', 'Ara Öğünler', 'Su Tüketimi']
            }
        ]
    },
    'matematik': {
        subjects: [
            {
                name: 'Matematik',
                icon: 'calculator',
                color: '#3B82F6',
                topics: ['Sayılar', 'Cebir', 'Denklemler', 'Geometri', 'Trigonometri']
            }
        ]
    },
    'lgs': {
        subjects: [
            {
                name: 'LGS Hazırlık',
                icon: 'book',
                color: '#8B5CF6',
                topics: ['Deneme Sınavları', 'Soru Çözümü', 'Konu Tekrarı', 'Kitap Okuma']
            }
        ]
    }
}

export async function getCoachSubjects() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return []

    const { data } = await supabase
        .from('subjects')
        .select('*, topics(*)')
        .order('created_at', { ascending: false })

    return data || []
}

export async function createSubject(input: CreateSubjectInput) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return { success: false, error: 'Unauthorized' }

    // Separate topics from subject data
    const { topics, ...subjectData } = input

    const { data: subject, error } = await supabase
        .from('subjects')
        .insert({
            ...subjectData,
            category: subjectData.category,
            created_by: user.id,
            is_system: false
        })
        .select()
        .single()

    if (error) return { success: false, error: error.message }

    // Insert topics if provided
    if (topics && topics.length > 0) {
        const topicsPayload = topics.map((name, index) => ({
            subject_id: subject.id,
            name,
            order_index: index,
            created_by: user.id,
            is_system: false
        }))

        const { error: topicError } = await supabase
            .from('topics')
            .insert(topicsPayload)

        if (topicError) {
            console.error('Error creating topics:', topicError)
        }
    }

    revalidatePath('/coach/subjects')
    return { success: true }
}

export async function deleteSubject(subjectId: string) {
    const supabase = await createClient()

    const { error } = await supabase
        .from('subjects')
        .delete()
        .eq('id', subjectId)

    if (error) return { success: false, error: error.message }

    revalidatePath('/coach/subjects')
    return { success: true }
}

export async function updateSubject(id: string, input: Partial<CreateSubjectInput>) {
    const supabase = await createClient()
    const { topics, ...updateData } = input

    const { error } = await supabase
        .from('subjects')
        .update(updateData)
        .eq('id', id)

    if (error) return { success: false, error: error.message }

    revalidatePath('/coach/subjects')
    return { success: true }
}

export async function createTopic(input: CreateTopicInput) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return { success: false, error: 'Unauthorized' }

    const { error } = await supabase.from('topics').insert({
        ...input,
        created_by: user.id,
        is_system: false
    })

    if (error) return { success: false, error: error.message }

    revalidatePath('/coach/subjects')
    return { success: true }
}

export async function deleteTopic(topicId: string) {
    const supabase = await createClient()

    const { error } = await supabase
        .from('topics')
        .delete()
        .eq('id', topicId)

    if (error) return { success: false, error: error.message }

    revalidatePath('/coach/subjects')
    return { success: true }
}

export async function seedSpecialty(templateSlug: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return { success: false, error: 'Unauthorized' }

    const template = SPECIALTY_TEMPLATES[templateSlug]
    if (!template) return { success: false, error: 'Template not found' }

    // Sequential insert to maintain order and relationships
    for (const sub of template.subjects) {
        // Create Subject
        const { data: subject, error: subError } = await supabase
            .from('subjects')
            .insert({
                name: sub.name,
                icon: sub.icon,
                color: sub.color,
                created_by: user.id,
                is_system: false
            })
            .select()
            .single()

        if (subError) {
            console.error('Error seeding subject:', subError)
            continue
        }

        // Create Topics
        if (sub.topics && sub.topics.length > 0) {
            const topicsPayload = sub.topics.map((tName: string, idx: number) => ({
                subject_id: subject.id,
                name: tName,
                order_index: idx,
                created_by: user.id,
                is_system: false
            }))

            await supabase.from('topics').insert(topicsPayload)
        }
    }

    revalidatePath('/coach/subjects')
    return { success: true }
}

export async function getTemplates() {
    return Object.keys(SPECIALTY_TEMPLATES).map(key => ({
        slug: key,
        name: key.charAt(0).toUpperCase() + key.slice(1), // Capitalize
        preview: SPECIALTY_TEMPLATES[key].subjects.map(s => s.name).join(', ')
    }))
}
