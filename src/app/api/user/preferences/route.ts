import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'

interface PreferencesRequest {
  hoursWeekday: number
  hoursWeekend: number
  preferredTime: string
  sessionLength: number
  studyStyle: string
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

    const data: PreferencesRequest = await request.json()

    const user = await db.user.update(session.user.id, {
      hoursWeekday: data.hoursWeekday,
      hoursWeekend: data.hoursWeekend,
      preferredTime: data.preferredTime,
      sessionLength: data.sessionLength,
      studyStyle: data.studyStyle
    })

    if (!user) {
      return NextResponse.json(
        { error: 'Usuário não encontrado' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        hoursWeekday: user.hoursWeekday,
        hoursWeekend: user.hoursWeekend,
        preferredTime: user.preferredTime,
        sessionLength: user.sessionLength,
        studyStyle: user.studyStyle
      }
    })
  } catch (error) {
    console.error('Erro ao salvar preferências:', error)
    return NextResponse.json(
      { error: 'Erro ao salvar preferências' },
      { status: 500 }
    )
  }
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      )
    }

    const user = await db.user.findUnique({ id: session.user.id })

    if (!user) {
      return NextResponse.json(
        { error: 'Usuário não encontrado' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      hoursWeekday: user.hoursWeekday,
      hoursWeekend: user.hoursWeekend,
      preferredTime: user.preferredTime,
      sessionLength: user.sessionLength,
      studyStyle: user.studyStyle
    })
  } catch (error) {
    console.error('Erro ao buscar preferências:', error)
    return NextResponse.json(
      { error: 'Erro ao buscar preferências' },
      { status: 500 }
    )
  }
}
