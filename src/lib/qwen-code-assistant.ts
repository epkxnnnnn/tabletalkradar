// Qwen3 Code Assistant for TableTalk Radar
// Helps analyze, debug, and fix code issues

interface CodeIssue {
  file: string
  line?: number
  type: 'error' | 'warning' | 'suggestion'
  message: string
  code?: string
  fix?: string
}

interface ProjectContext {
  framework: 'Next.js 15'
  language: 'TypeScript'
  database: 'Supabase'
  styling: 'Tailwind CSS'
  auth: 'Supabase Auth'
  deployment: 'Vercel'
}

export class QwenCodeAssistant {
  private apiKey: string
  private baseURL: string
  private context: ProjectContext

  constructor() {
    // Support both RunPod and Alibaba Cloud endpoints
    this.apiKey = process.env.QWEN3_API_KEY || process.env.RUNPOD_API_KEY || ''
    this.baseURL = process.env.QWEN3_ENDPOINT || 
                   process.env.RUNPOD_ENDPOINT || 
                   'https://dashscope.aliyuncs.com/api/v1/services/aigc/text-generation/generation'
    
    this.context = {
      framework: 'Next.js 15',
      language: 'TypeScript',
      database: 'Supabase',
      styling: 'Tailwind CSS',
      auth: 'Supabase Auth',
      deployment: 'Vercel'
    }
  }

  private async callQwen3(prompt: string): Promise<string> {
    if (!this.apiKey) {
      throw new Error('QWEN3_API_KEY or RUNPOD_API_KEY not configured')
    }

    const systemMessage = `You are an expert full-stack developer specializing in:
- Next.js 15 with TypeScript
- Supabase (database, auth, edge functions)
- Tailwind CSS
- Vercel deployment
- React Server Components
- Modern web development best practices

You help debug issues, suggest fixes, and write production-ready code. Always provide specific, actionable solutions.`

    // Check if it's a RunPod endpoint (usually contains runpod.io)
    const isRunPod = this.baseURL.includes('runpod.io') || process.env.RUNPOD_ENDPOINT

    let requestBody: any
    let headers: any

    if (isRunPod) {
      // RunPod format (OpenAI-compatible)
      headers = {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json'
      }
      requestBody = {
        model: 'Qwen/Qwen2.5-Coder-32B-Instruct',
        messages: [
          {
            role: 'system',
            content: systemMessage
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.1,
        max_tokens: 3000,
        top_p: 0.9
      }
    } else {
      // Alibaba Cloud DashScope format
      headers = {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
        'X-DashScope-SSE': 'disable'
      }
      requestBody = {
        model: 'qwen2.5-72b-instruct',
        input: {
          messages: [
            {
              role: 'system',
              content: systemMessage
            },
            {
              role: 'user',
              content: prompt
            }
          ]
        },
        parameters: {
          temperature: 0.1,
          max_tokens: 3000,
          top_p: 0.9
        }
      }
    }

    const response = await fetch(this.baseURL, {
      method: 'POST',
      headers,
      body: JSON.stringify(requestBody)
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`Qwen3 API error: ${response.statusText} - ${errorText}`)
    }

    const data = await response.json()
    
    if (isRunPod) {
      // OpenAI-compatible response format
      return data.choices?.[0]?.message?.content || 'No response from Qwen3'
    } else {
      // Alibaba Cloud response format
      return data.output?.text || 'No response from Qwen3'
    }
  }

  async analyzeError(error: string, context?: string): Promise<string> {
    const prompt = `
PROBLEM: ${error}

PROJECT CONTEXT:
- Framework: ${this.context.framework}
- Language: ${this.context.language}
- Database: ${this.context.database}
- Styling: ${this.context.styling}
- Auth: ${this.context.auth}

${context ? `ADDITIONAL CONTEXT:\n${context}` : ''}

Please analyze this error and provide:
1. Root cause explanation
2. Step-by-step fix
3. Code examples if needed
4. Prevention tips

Be specific and actionable.`

    return await this.callQwen3(prompt)
  }

  async suggestCodeFix(filePath: string, codeSnippet: string, issue: string): Promise<string> {
    const prompt = `
FILE: ${filePath}
ISSUE: ${issue}

CURRENT CODE:
\`\`\`typescript
${codeSnippet}
\`\`\`

PROJECT TECH STACK:
- ${this.context.framework} with ${this.context.language}
- ${this.context.database} for backend
- ${this.context.styling} for styling
- ${this.context.auth} for authentication

Please provide:
1. Fixed code snippet
2. Explanation of changes
3. Any additional files/imports needed
4. Testing suggestions

Return the fixed code in a code block.`

    return await this.callQwen3(prompt)
  }

  async optimizeComponent(componentCode: string, componentName: string): Promise<string> {
    const prompt = `
COMPONENT: ${componentName}

CURRENT CODE:
\`\`\`typescript
${componentCode}
\`\`\`

PROJECT CONTEXT: ${this.context.framework} with ${this.context.language}

Please optimize this component for:
1. Performance (React optimization patterns)
2. TypeScript best practices  
3. Accessibility
4. Code maintainability
5. Next.js 15 best practices

Provide the optimized code and explain improvements.`

    return await this.callQwen3(prompt)
  }

  async debugAuthIssue(authCode: string, errorMessage: string): Promise<string> {
    const prompt = `
AUTH ISSUE: ${errorMessage}

SUPABASE AUTH CODE:
\`\`\`typescript
${authCode}
\`\`\`

CONTEXT: Using ${this.context.auth} with ${this.context.framework}

This is a TableTalk Radar app with:
- Super Admin dashboard access
- Client management system
- Google My Business integration
- Production domain: https://tabletalkradar.com

Please diagnose and fix:
1. Authentication flow issues
2. Session management problems
3. Redirect issues
4. Environment variable problems
5. RLS policy conflicts

Provide working code solution.`

    return await this.callQwen3(prompt)
  }

  async debugSupabaseIssue(query: string, error: string, context?: string): Promise<string> {
    const prompt = `
SUPABASE ERROR: ${error}

QUERY/CODE:
\`\`\`typescript
${query}
\`\`\`

PROJECT CONTEXT:
- Database: ${this.context.database}
- Tables: clients, profiles, agencies, client_locations, reviews
- RLS enabled with policies for Super Admin access
- Edge Functions for Google My Business API

${context ? `ADDITIONAL INFO:\n${context}` : ''}

Please provide:
1. Error explanation
2. Fixed query/code
3. RLS policy fixes if needed
4. Database schema adjustments
5. Testing approach

Focus on production-ready solutions.`

    return await this.callQwen3(prompt)
  }

  async suggestArchitectureImprovement(currentSetup: string, pain_points: string[]): Promise<string> {
    const prompt = `
CURRENT ARCHITECTURE:
${currentSetup}

PAIN POINTS:
${pain_points.map((point, i) => `${i + 1}. ${point}`).join('\n')}

PROJECT TECH STACK:
- ${this.context.framework}
- ${this.context.database}
- ${this.context.deployment}

Please suggest architectural improvements:
1. Better code organization
2. Performance optimizations
3. Scalability improvements
4. Developer experience enhancements
5. Production stability fixes

Provide specific, implementable solutions.`

    return await this.callQwen3(prompt)
  }

  async generateTestCode(componentPath: string, componentCode: string): Promise<string> {
    const prompt = `
COMPONENT FILE: ${componentPath}

COMPONENT CODE:
\`\`\`typescript
${componentCode}
\`\`\`

PROJECT SETUP: ${this.context.framework} with Jest and React Testing Library

Generate comprehensive test code covering:
1. Component rendering
2. User interactions
3. API calls (mocked)
4. Error states
5. Edge cases

Follow testing best practices for React components.`

    return await this.callQwen3(prompt)
  }
}

// Singleton instance
export const qwenAssistant = new QwenCodeAssistant()

// Helper functions for common debugging tasks
export const debugHelpers = {
  async analyzeAuthError(error: string, authCode?: string): Promise<string> {
    if (authCode) {
      return await qwenAssistant.debugAuthIssue(authCode, error)
    }
    return await qwenAssistant.analyzeError(error, 'Supabase Authentication Issue')
  },

  async fixSupabaseQuery(query: string, error: string): Promise<string> {
    return await qwenAssistant.debugSupabaseIssue(query, error)
  },

  async optimizeReactComponent(code: string, name: string): Promise<string> {
    return await qwenAssistant.optimizeComponent(code, name)
  },

  async fixBuildError(error: string, context?: string): Promise<string> {
    return await qwenAssistant.analyzeError(error, `Next.js Build Error${context ? ': ' + context : ''}`)
  },

  async fixTypeScriptError(error: string, code: string, file: string): Promise<string> {
    return await qwenAssistant.suggestCodeFix(file, code, `TypeScript Error: ${error}`)
  }
}