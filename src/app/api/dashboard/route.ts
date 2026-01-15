import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import { differenceInDays, startOfDay } from 'date-fns'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      )
    }

    // Get user with exam and study plan
    const user = await db.user.findWithExamAndPlan(session.user.id)

    if (!user?.exam) {
      return NextResponse.json(
        { error: 'Nenhum concurso cadastrado' },
        { status: 404 }
      )
    }

    const exam = user.exam
    const studyPlan = exam.studyPlan
    const today = startOfDay(new Date())

    // Calculate stats
    const tasks = studyPlan?.tasks || []
    const totalTasks = tasks.length
    const completedTasks = tasks.filter((t) => t.completed).length
    const todayTasks = tasks.filter((t) =>
      startOfDay(new Date(t.date)).getTime() === today.getTime()
    )
    const todayCompleted = todayTasks.filter((t) => t.completed).length

    const daysUntilExam = exam.examDate
      ? differenceInDays(new Date(exam.examDate), today)
      : null

    return NextResponse.json({
      exam: {
        id: exam.id,
        title: exam.title,
        examDate: exam.examDate?.toISOString() || null,
        organization: exam.organization
      },
      studyPlan: studyPlan ? {
        id: studyPlan.id,
        tasks: tasks.map((t) => ({
          id: t.id,
          date: t.date.toISOString(),
          title: t.title,
          description: t.description,
          durationMinutes: t.durationMinutes,
          completed: t.completed,
          subject: {
            id: t.subject.id,
            name: t.subject.name
          },
          topic: t.topic ? {
            id: t.topic.id,
            name: t.topic.name
          } : null
        }))
      } : null,
      stats: {
        totalTasks,
        completedTasks,
        todayTasks: todayTasks.length,
        todayCompleted,
        daysUntilExam
      }
    })
  } catch (error) {
    console.error('Erro ao carregar dashboard:', error)
    return NextResponse.json(
      { error: 'Erro ao carregar dados' },
      { status: 500 }
    )
  }
}
