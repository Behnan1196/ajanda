export type Json =
    | string
    | number
    | boolean
    | null
    | { [key: string]: Json | undefined }
    | Json[]

export type Database = {
    public: {
        Tables: {
            users: {
                Row: {
                    id: string
                    email: string
                    name: string
                    avatar_url: string | null
                    roles: string[]
                    organization_id: string | null
                    preferences: Json
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    id?: string
                    email: string
                    name: string
                    avatar_url?: string | null
                    roles?: string[]
                    organization_id?: string | null
                    preferences?: Json
                    created_at?: string
                    updated_at?: string
                }
                Update: {
                    id?: string
                    email?: string
                    name?: string
                    avatar_url?: string | null
                    roles?: string[]
                    organization_id?: string | null
                    preferences?: Json
                    created_at?: string
                    updated_at?: string
                }
            }
            organizations: {
                Row: {
                    id: string
                    name: string
                    slug: string
                    settings: Json
                    is_active: boolean
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    id?: string
                    name: string
                    slug: string
                    settings?: Json
                    is_active?: boolean
                    created_at?: string
                    updated_at?: string
                }
                Update: {
                    id?: string
                    name?: string
                    slug?: string
                    settings?: Json
                    is_active?: boolean
                    created_at?: string
                    updated_at?: string
                }
            }
            user_relationships: {
                Row: {
                    id: string
                    coach_id: string
                    student_id: string
                    is_active: boolean
                    notes: string | null
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    id?: string
                    coach_id: string
                    student_id: string
                    is_active?: boolean
                    notes?: string | null
                    created_at?: string
                    updated_at?: string
                }
                Update: {
                    id?: string
                    coach_id?: string
                    student_id?: string
                    is_active?: boolean
                    notes?: string | null
                    created_at?: string
                    updated_at?: string
                }
            }
            task_types: {
                Row: {
                    id: string
                    name: string
                    slug: string
                    icon: string | null
                    description: string | null
                    schema: Json
                    is_system: boolean
                    is_active: boolean
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    id?: string
                    name: string
                    slug: string
                    icon?: string | null
                    description?: string | null
                    schema: Json
                    is_system?: boolean
                    is_active?: boolean
                    created_at?: string
                    updated_at?: string
                }
                Update: {
                    id?: string
                    name?: string
                    slug?: string
                    icon?: string | null
                    description?: string | null
                    schema?: Json
                    is_system?: boolean
                    is_active?: boolean
                    created_at?: string
                    updated_at?: string
                }
            }
            tasks: {
                Row: {
                    id: string
                    user_id: string
                    task_type_id: string
                    title: string
                    description: string | null
                    metadata: Json
                    due_date: string | null
                    due_time: string | null
                    is_completed: boolean
                    completed_at: string | null
                    created_by: string
                    assigned_by: string | null
                    is_recurring: boolean
                    recurrence_rule: string | null
                    tags: string[] | null
                    priority: number
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    id?: string
                    user_id: string
                    task_type_id: string
                    title: string
                    description?: string | null
                    metadata?: Json
                    due_date?: string | null
                    due_time?: string | null
                    is_completed?: boolean
                    completed_at?: string | null
                    created_by: string
                    assigned_by?: string | null
                    is_recurring?: boolean
                    recurrence_rule?: string | null
                    tags?: string[] | null
                    priority?: number
                    created_at?: string
                    updated_at?: string
                }
                Update: {
                    id?: string
                    user_id?: string
                    task_type_id?: string
                    title?: string
                    description?: string | null
                    metadata?: Json
                    due_date?: string | null
                    due_time?: string | null
                    is_completed?: boolean
                    completed_at?: string | null
                    created_by?: string
                    assigned_by?: string | null
                    is_recurring?: boolean
                    recurrence_rule?: string | null
                    tags?: string[] | null
                    priority?: number
                    created_at?: string
                    updated_at?: string
                }
            }
            reminders: {
                Row: {
                    id: string
                    task_id: string
                    remind_at: string
                    notification_type: string
                    is_sent: boolean
                    sent_at: string | null
                    created_at: string
                }
                Insert: {
                    id?: string
                    task_id: string
                    remind_at: string
                    notification_type?: string
                    is_sent?: boolean
                    sent_at?: string | null
                    created_at?: string
                }
                Update: {
                    id?: string
                    task_id?: string
                    remind_at?: string
                    notification_type?: string
                    is_sent?: boolean
                    sent_at?: string | null
                    created_at?: string
                }
            }
        }
        Views: {
            [_ in never]: never
        }
        Functions: {
            [_ in never]: never
        }
        Enums: {
            [_ in never]: never
        }
    }
}
