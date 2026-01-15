import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import { generateStudyPlan, StudyPlanInput } from '@/lib/gemini'

export async function POST() {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      )
    }

    // Get user with exam and preferences
    const user = await db.user.findWithExamAndPlan(session.user.id)

    if (!user?.exam) {
      return NextResponse.json(
        { error: 'Nenhum concurso cadastrado' },
        { status: 400 }
      )
    }

    const exam = user.exam

    // Delete existing study plan
    await db.studyPlan.deleteByExamId(exam.id)

    // Prepare input for AI
    const subjects = exam.subjects
    const input: StudyPlanInput = {
      examDate: exam.examDate || new Date(Date.now() + 90 * 24 * 60 * 60 * 1000), // Default 90 days
      subjects: subjects.map((s) => ({
        id: s.id,
        name: s.name,
        weight: s.weight,
        knowledgeLevel: s.knowledgeLevel || 3,
        topics: s.topics.map((t) => ({ id: t.id, name: t.name }))
      })),
      preferences: {
        hoursWeekday: user.hoursWeekday || 2,
        hoursWeekend: user.hoursWeekend || 4,
        preferredTime: user.preferredTime || 'night',
        sessionLength: user.sessionLength || 60,
        studyStyle: user.studyStyle || 'theory-first'
      }
    }

    // Generate plan using AI
    const generatedPlan = await generateStudyPlan(input)

    // Create study plan in database
    const studyPlan = await db.studyPlan.create({
      examId: exam.id,
      tasks: generatedPlan.tasks.map((task) => {
        // Find the subject and topic
        const subject = subjects.find((s) => s.id === task.subjectId)
        const validTopicId = subject?.topics.find((t) => t.id === task.topicId)?.id

        return {
          date: new Date(task.date),
          subjectId: task.subjectId,
          topicId: validTopicId,
          title: task.title,
          description: task.description,
          durationMinutes: task.durationMinutes
        }
      })
    })

    return NextResponse.json({
      success: true,
      studyPlan
    })
  } catch (error) {
    console.error('Erro ao gerar plano de estudos:', error)
    return NextResponse.json(
      { error: 'Erro ao gerar plano de estudos. Tente novamente.' },
      { status: 500 }
    )
  }
}
