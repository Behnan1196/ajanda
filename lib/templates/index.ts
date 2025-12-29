/**
 * Module Templates Index
 * 
 * Import all module templates to register them
 */

// Import all modules to trigger registration and collect them
import { tytMath5Days, tytMath30Days } from './modules/exam'
import { weeklyBalanced } from './modules/nutrition'
import { guitarBeginner } from './modules/music'
import { frontendBasics } from './modules/coding'
import { habit30Days, weeklyGoals } from './modules/general'

// This array ensures the modules are not tree-shaken
const ALL_BUNDLED_TEMPLATES = [
    tytMath5Days, tytMath30Days,
    weeklyBalanced,
    guitarBeginner,
    frontendBasics,
    habit30Days, weeklyGoals
]

// Re-export main functions from unified
export {
    getTemplatesByModule,
    getTemplate,
    getAllTemplates,
    registerTemplate,
    type UnifiedProgramTemplate,
    type UnifiedTaskTemplate
} from './unified'

export { ALL_BUNDLED_TEMPLATES }
