import { GoogleGenerativeAI } from '@google/generative-ai'

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '')

export const geminiModel = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' })

export interface ExtractedEdital {
  title: string
  organization: string
  examDate: string | null
  subjects: {
    name: string
    weight: number | null
    topics: string[]
  }[]
}

export async function extractEditalContent(pdfText: string): Promise<ExtractedEdital> {
  const prompt = `
Você é um especialista em editais de concursos públicos brasileiros.
Analise o seguinte texto extraído de um edital e extraia as informações estruturadas.

IMPORTANTE: Responda APENAS com JSON válido, sem markdown ou explicações.

O JSON deve seguir este formato:
{
  "title": "Nome do concurso",
  "organization": "Órgão responsável",
  "examDate": "YYYY-MM-DD ou null se não encontrado",
  "subjects": [
    {
      "name": "Nome da disciplina/matéria",
      "weight": número ou null,
      "topics": ["tópico 1", "tópico 2", ...]
    }
  ]
}

Extraia TODAS as disciplinas/matérias mencionadas no edital com seus respectivos tópicos.
Se houver pesos ou pontuação por disciplina, inclua essa informação.
Se a data da prova não estiver clara, use null.

TEXTO DO EDITAL:
${pdfText.substring(0, 30000)}
`

  const result = await geminiModel.generateContent(prompt)
  const response = result.response.text()

  // Clean up the response - remove markdown code blocks if present
  let cleanResponse = response.trim()
  if (cleanResponse.startsWith('```json')) {
    cleanResponse = cleanResponse.slice(7)
  }
  if (cleanResponse.startsWith('```')) {
    cleanResponse = cleanResponse.slice(3)
  }
  if (cleanResponse.endsWith('```')) {
    cleanResponse = cleanResponse.slice(0, -3)
  }

  return JSON.parse(cleanResponse.trim())
}

export interface StudyPlanInput {
  examDate: Date
  subjects: {
    id: string
    name: string
    weight: number | null
    knowledgeLevel: number // 1-5
    topics: { id: string; name: string }[]
  }[]
  preferences: {
    hoursWeekday: number
    hoursWeekend: number
    preferredTime: string // morning, afternoon, night
    sessionLength: number // minutes
    studyStyle: string // theory-first, exercise-first
  }
}

export interface GeneratedStudyPlan {
  tasks: {
    date: string // YYYY-MM-DD
    subjectId: string
    topicId: string | null
    title: string
    description: string
    durationMinutes: number
  }[]
}

export async function generateStudyPlan(input: StudyPlanInput): Promise<GeneratedStudyPlan> {
  const today = new Date()
  const daysUntilExam = Math.ceil((input.examDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))

  const subjectsInfo = input.subjects.map(s => ({
    id: s.id,
    name: s.name,
    weight: s.weight,
    knowledgeLevel: s.knowledgeLevel,
    priority: (s.weight || 1) * (6 - s.knowledgeLevel), // Higher priority for low knowledge + high weight
    topics: s.topics
  })).sort((a, b) => b.priority - a.priority)

  const prompt = `
Você é um especialista em planejamento de estudos para concursos públicos brasileiros.
Crie um plano de estudos personalizado com base nas seguintes informações:

DATA DE HOJE: ${today.toISOString().split('T')[0]}
DATA DA PROVA: ${input.examDate.toISOString().split('T')[0]}
DIAS ATÉ A PROVA: ${daysUntilExam}

DISPONIBILIDADE:
- Dias úteis: ${input.preferences.hoursWeekday} horas/dia
- Finais de semana: ${input.preferences.hoursWeekend} horas/dia
- Horário preferido: ${input.preferences.preferredTime}
- Duração das sessões: ${input.preferences.sessionLength} minutos
- Estilo: ${input.preferences.studyStyle === 'theory-first' ? 'Teoria primeiro, depois exercícios' : 'Exercícios primeiro, depois teoria'}

MATÉRIAS (ordenadas por prioridade):
${JSON.stringify(subjectsInfo, null, 2)}

REGRAS:
1. Distribua o estudo ao longo dos ${daysUntilExam} dias
2. Priorize matérias com maior peso e menor nível de conhecimento
3. Inclua revisões periódicas (a cada 7 dias aproximadamente)
4. Respeite a disponibilidade diária do candidato
5. Varie as matérias para evitar monotonia
6. Na última semana, foque em revisão geral

IMPORTANTE: Responda APENAS com JSON válido, sem markdown ou explicações.

O JSON deve seguir este formato:
{
  "tasks": [
    {
      "date": "YYYY-MM-DD",
      "subjectId": "id da matéria",
      "topicId": "id do tópico ou null",
      "title": "Título curto da tarefa",
      "description": "Descrição do que estudar",
      "durationMinutes": número
    }
  ]
}

Gere tarefas para pelo menos os próximos 30 dias ou até a data da prova (o que for menor).
`

  const result = await geminiModel.generateContent(prompt)
  const response = result.response.text()

  // Clean up the response
  let cleanResponse = response.trim()
  if (cleanResponse.startsWith('```json')) {
    cleanResponse = cleanResponse.slice(7)
  }
  if (cleanResponse.startsWith('```')) {
    cleanResponse = cleanResponse.slice(3)
  }
  if (cleanResponse.endsWith('```')) {
    cleanResponse = cleanResponse.slice(0, -3)
  }

  return JSON.parse(cleanResponse.trim())
}
