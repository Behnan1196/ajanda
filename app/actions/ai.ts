'use server'

import { GoogleGenerativeAI } from '@google/generative-ai'
import { createClient } from '@/lib/supabase/server'
import { getStudentExamResults } from './exams'

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GEMINI_API_KEY || '')

export interface AIAnalysisResult {
    analysis: string
    weaknesses: string[]
    strengths: string[]
    suggestions: {
        title: string
        description: string
        task_type: string // 'todo', 'watch', 'test'
        action_data?: any // e.g., subject_id
    }[]
    weekly_schedule?: {
        day: string
        focus: string
        tasks: string[]
    }[]
}

export async function generateStudentAnalysis(studentId: string, coachNotes?: string): Promise<{ data?: AIAnalysisResult, error?: string }> {
    try {
        if (!process.env.GOOGLE_GEMINI_API_KEY) {
            return { error: 'API Key not configured' }
        }

        const supabase = await createClient()

        // 1. Fetch Context Data
        // A. Exam Results
        const examResults = await getStudentExamResults(studentId)

        // B. Recent Tasks (Last 14 days)
        const today = new Date()
        const twoWeeksAgo = new Date(today)
        twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14)

        const { data: recentTasks } = await supabase
            .from('tasks')
            .select('title, is_completed, subjects(name)')
            .eq('user_id', studentId)
            .gte('due_date', twoWeeksAgo.toISOString())

        // 2. Construct Prompt
        const prompt = `
            Act as an expert educational coach. Analyze the following student data and provide insights AND a drafted weekly schedule.
            
            COACH NOTES / FOCUS AREA: "${coachNotes || 'General analysis'}"
            
            Student Data:
            1. Exam Results (Newest first):
            ${JSON.stringify(examResults.slice(0, 3).map(r => ({
            exam: r.exam?.name,
            date: r.created_at,
            total_net: r.total_net,
            details: r.details
        })), null, 2)}

            2. Recent Tasks (Last 14 days):
            Total: ${recentTasks?.length || 0}
            Completed: ${recentTasks?.filter(t => t.is_completed).length || 0}
            Breakdown: ${JSON.stringify(recentTasks?.slice(0, 10), null, 2)}

            Output specific JSON format ONLY (no markdown):
            {
                "analysis": "Brief summary of performance (max 2 sentences). Turkish language.",
                "strengths": ["List of 1-2 strong areas"],
                "weaknesses": ["List of 1-2 weak areas"],
                "suggestions": [
                    {
                        "title": "Actionable Task Title",
                        "description": "Why this task helps",
                        "task_type": "todo" 
                    }
                ],
                "weekly_schedule": [
                    {
                        "day": "Pazartesi",
                        "focus": "Main Focus (e.g. Math)",
                        "tasks": ["Task 1", "Task 2"]
                    },
                    ... (for 7 days)
                ]
            }
            Language: Turkish. Be specific and encouraging.
        `

        // 3. Call Gemini
        const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' })
        const result = await model.generateContent(prompt)
        const response = await result.response
        const text = response.text()

        // 4. Parse JSON
        // Clean markdown code blocks if present
        const jsonStr = text.replace(/```json/g, '').replace(/```/g, '').trim()
        const data = JSON.parse(jsonStr)

        return { data }

    } catch (error: any) {
        console.error('AI Error:', error)
        return { error: 'AI analizi sırasında bir hata oluştu: ' + error.message }
    }
}
