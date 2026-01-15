import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'

interface SaveEditalRequest {
  title: string
  organization: string
  examDate: string | null
  editalText: string
  subjects: {
    name: string
    weight: number | null
    topics: string[]
  }[]
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      )
    }

    const data: SaveEditalRequest = await request.json()

    // Delete existing exam for user (MVP: one exam at a time)
    await db.exam.deleteByUserId(session.user.id)

    // Create new exam with subjects and topics
    const exam = await db.exam.create({
      userId: session.user.id,
      title: data.title,
      organization: data.organization,
      examDate: data.examDate ? new Date(data.examDate) : undefined,
      editalText: data.editalText,
      subjects: data.subjects.map(subject => ({
        name: subject.name,
        weight: subject.weight || undefined,
        topics: subject.topics
      }))
    })

    return NextResponse.json({
      success: true,
      exam
    })
  } catch (error) {
    console.error('Erro ao salvar edital:', error)
    return NextResponse.json(
      { error: 'Erro ao salvar o edital. Tente novamente.' },
      { status: 500 }
    )
  }
}
