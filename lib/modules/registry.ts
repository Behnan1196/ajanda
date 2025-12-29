/**
 * Module Registry
 * 
 * Defines all available coaching modules in the system.
 * Each module is a plugin that can be enabled/disabled per user.
 */

export interface ModuleDefinition {
    id: string
    name: string
    nameTR: string
    icon: string
    color: string
    description: string
    category: 'education' | 'health' | 'creative' | 'tech' | 'general'
    requiredRole?: 'coach' | 'admin'
    isPremium?: boolean
    features?: string[]
    route: string
}

export const MODULE_REGISTRY: Record<string, ModuleDefinition> = {
    exam: {
        id: 'exam',
        name: 'Exam Coaching',
        nameTR: 'Sınav Koçluğu',
        icon: '📚',
        color: 'blue',
        description: 'YKS, LGS ve diğer sınavlara hazırlık programları',
        category: 'education',
        features: ['Konu programlama', 'Soru hedefleri', 'Deneme takibi'],
        route: '/tutor/exam-coaching'
    },

    nutrition: {
        id: 'nutrition',
        name: 'Nutrition Coaching',
        nameTR: 'Beslenme Koçluğu',
        icon: '🥗',
        color: 'green',
        description: 'Kilo yönetimi ve sağlıklı beslenme programları',
        category: 'health',
        features: ['Öğün planı', 'Kalori takibi', 'Makro besin hedefleri'],
        route: '/tutor/nutrition'
    },

    music: {
        id: 'music',
        name: 'Music Coaching',
        nameTR: 'Müzik Eğitimi',
        icon: '🎸',
        color: 'purple',
        description: 'Enstrüman eğitimi ve pratik programları',
        category: 'creative',
        features: ['Pratik takibi', 'Eser çalışma', 'Teknik geliştirme'],
        route: '/tutor/music'
    },

    coding: {
        id: 'coding',
        name: 'Coding Education',
        nameTR: 'Yazılım Eğitimi',
        icon: '💻',
        color: 'cyan',
        description: 'Programlama dili ve yazılım geliştirme eğitimi',
        category: 'tech',
        features: ['Kod pratikleri', 'Proje geliştirme', 'Algoritma çalışması'],
        route: '/tutor/coding'
    },

    general: {
        id: 'general',
        name: 'General Coaching',
        nameTR: 'Genel Koçluk',
        icon: '🎯',
        color: 'gray',
        description: 'Özel ihtiyaçlara göre özelleştirilebilir programlar',
        category: 'general',
        features: ['Esnek planlama', 'Özel hedefler', 'Kişisel gelişim'],
        route: '/tutor/general'
    },

    // Future modules (commented out, can be enabled easily)
    /*
    gym: {
      id: 'gym',
      name: 'Fitness Coaching',
      nameTR: 'Fitness Koçluğu',
      icon: '💪',
      color: 'orange',
      description: 'Spor ve fitness programları',
      category: 'health',
      isPremium: true
    },
    
    language: {
      id: 'language',
      name: 'Language Learning',
      nameTR: 'Dil Eğitimi',
      icon: '🌍',
      color: 'indigo',
      description: 'Yabancı dil öğrenme programları',
      category: 'education',
      isPremium: true
    }
    */
}

/**
 * Get all available modules
 */
export function getAllModules(): ModuleDefinition[] {
    return Object.values(MODULE_REGISTRY)
}

/**
 * Get module by ID
 */
export function getModule(moduleId: string): ModuleDefinition | undefined {
    return MODULE_REGISTRY[moduleId]
}

/**
 * Get modules by category
 */
export function getModulesByCategory(category: string): ModuleDefinition[] {
    return Object.values(MODULE_REGISTRY).filter(m => m.category === category)
}

/**
 * Check if module exists
 */
export function moduleExists(moduleId: string): boolean {
    return moduleId in MODULE_REGISTRY
}

/**
 * Get enabled modules for a user
 * @param userId - User ID to check
 * @returns Array of enabled module IDs
 * 
 * NOTE: For now (test mode), returns all modules.
 * Future: Query user_modules table from database.
 */
export async function getEnabledModules(userId: string): Promise<string[]> {
    // TODO: When ready to enable module management:
    // const { data } = await supabase
    //   .from('user_modules')
    //   .select('module_slug')
    //   .eq('user_id', userId)
    //   .eq('enabled', true)
    // 
    // if (!data || data.length === 0) {
    //   return Object.keys(MODULE_REGISTRY) // Default: all modules
    // }
    // 
    // return data.map(m => m.module_slug)

    // Test mode: return all modules
    return Object.keys(MODULE_REGISTRY)
}
