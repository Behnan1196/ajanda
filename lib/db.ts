import Dexie, { Table } from 'dexie';

export interface LocalTask {
    id: string;
    user_id: string;
    task_type_id: string;
    title: string;
    description: string | null;
    metadata: any;
    due_date: string | null;
    due_time: string | null;
    is_completed: boolean;
    completed_at: string | null;
    subject_id: string | null;
    topic_id: string | null;
    project_id: string | null;
    is_private: boolean;
    sort_order: number;
    relationship_id: string | null;
    // Sync metadata
    is_dirty: number; // 0: synced, 1: pending
    last_synced_at: string | null;
}

export interface LocalTaskType {
    id: string;
    name: string;
    slug: string;
    icon: string | null;
}

export interface LocalSubject {
    id: string;
    name: string;
    icon: string | null;
    color: string;
}

export interface LocalTopic {
    id: string;
    subject_id: string;
    name: string;
}

export interface LocalHabit {
    id: string;
    user_id: string;
    subject_id: string | null;
    topic_id: string | null;
    name: string;
    description: string | null;
    frequency: string;
    frequency_days: number[] | null;
    target_type: string | null;
    target_count: number | null;
    target_duration: number | null;
    color: string;
    icon: string;
    current_streak: number;
    longest_streak: number;
    total_completions: number;
    start_date: string;
    end_date: string | null;
    is_active: boolean;
    sort_order: number;
    // Sync metadata
    is_dirty: number;
    last_synced_at: string | null;
}

export interface LocalHabitCompletion {
    id: string;
    habit_id: string;
    user_id: string;
    completed_at: string;
    completed_date: string;
    count: number;
    duration: number | null;
    notes: string | null;
    // Sync metadata
    is_dirty: number;
    last_synced_at: string | null;
}

export class AppDatabase extends Dexie {
    tasks!: Table<LocalTask>;
    habits!: Table<LocalHabit>;
    habit_completions!: Table<LocalHabitCompletion>;
    task_types!: Table<LocalTaskType>;
    subjects!: Table<LocalSubject>;
    topics!: Table<LocalTopic>;

    constructor() {
        super('AjandaLocalDB');
        this.version(2).stores({
            tasks: 'id, user_id, due_date, is_dirty',
            habits: 'id, user_id, is_dirty',
            habit_completions: 'id, habit_id, user_id, completed_date, is_dirty',
            task_types: 'id, slug',
            subjects: 'id',
            topics: 'id, subject_id'
        });
    }
}

export const db = new AppDatabase();
