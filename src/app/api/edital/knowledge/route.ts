import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'

interface KnowledgeRequest {
  subjects: {
    id: string
    knowledgeLevel: number
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

    const data: KnowledgeRequest = await request.json()

    // Update knowledge levels for each subject
    await Promise.all(
      data.subjects.map(subject =>
        db.subject.updateKnowledgeLevel(subject.id, subject.knowledgeLevel)
      )
    )

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Erro ao salvar níveis de conhecimento:', error)
    return NextResponse.json(
      { error: 'Erro ao salvar níveis de conhecimento' },
      { status: 500 }
    )
  }
}
