/**
 * Unified Template System
 * 
 * All coaching modules use this standardized template format.
 * Domain-specific data is stored in task.settings JSONB.
 */

export interface UnifiedTaskTemplate {
    title: string
    description?: string
    day: number  // Relative day from program start (1-based)
    duration_minutes: number
    task_type: string  // FK to task_types.slug (exam, nutrition, music, etc.)
    settings: Record<string, any>  // Type-specific data
}

export interface UnifiedProgramTemplate {
    id: string
    name: string
    description: string
    module: 'exam' | 'nutrition' | 'music' | 'coding' | 'general'
    duration_days: number
    tasks: UnifiedTaskTemplate[]
    metadata?: {
        difficulty?: 'beginner' | 'intermediate' | 'advanced'
        tags?: string[]
        targetAudience?: string
    }
}

// Template registry - all templates in one place
const TEMPLATE_REGISTRY: Record<string, UnifiedProgramTemplate[]> = {
    exam: [],
    nutrition: [],
    music: [],
    coding: [],
    general: []
}

/**
 * Register a template
 */
export function registerTemplate(template: UnifiedProgramTemplate) {
    if (!TEMPLATE_REGISTRY[template.module]) {
        TEMPLATE_REGISTRY[template.module] = []
    }
    TEMPLATE_REGISTRY[template.module].push(template)
}

/**
 * Get all templates for a module
 */
export function getTemplatesByModule(module: string): UnifiedProgramTemplate[] {
    return TEMPLATE_REGISTRY[module] || []
}

/**
 * Get template by ID
 */
export function getTemplate(templateId: string): UnifiedProgramTemplate | undefined {
    for (const templates of Object.values(TEMPLATE_REGISTRY)) {
        const found = templates.find(t => t.id === templateId)
        if (found) return found
    }
    return undefined
}

/**
 * Get all templates
 */
export function getAllTemplates(): UnifiedProgramTemplate[] {
    return Object.values(TEMPLATE_REGISTRY).flat()
}

// Export for convenience
export { TEMPLATE_REGISTRY }
