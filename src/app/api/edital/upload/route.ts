import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { extractEditalContent } from '@/lib/gemini'

// Dynamic import for pdf-parse to handle ESM/CJS compatibility
async function parsePDF(buffer: Buffer): Promise<{ text: string }> {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const pdfParse = require('pdf-parse')
  return pdfParse(buffer)
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

    const formData = await request.formData()
    const file = formData.get('file') as File | null

    if (!file) {
      return NextResponse.json(
        { error: 'Nenhum arquivo enviado' },
        { status: 400 }
      )
    }

    if (!file.name.toLowerCase().endsWith('.pdf')) {
      return NextResponse.json(
        { error: 'O arquivo deve ser um PDF' },
        { status: 400 }
      )
    }

    // Convert file to buffer
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    // Extract text from PDF
    const pdfData = await parsePDF(buffer)
    const pdfText = pdfData.text

    if (!pdfText || pdfText.trim().length < 100) {
      return NextResponse.json(
        { error: 'Não foi possível extrair texto do PDF. Verifique se o arquivo não está protegido ou escaneado.' },
        { status: 400 }
      )
    }

    // Use Gemini to extract structured content
    const extractedContent = await extractEditalContent(pdfText)

    return NextResponse.json({
      success: true,
      rawText: pdfText,
      extracted: extractedContent
    })
  } catch (error) {
    console.error('Erro ao processar edital:', error)
    return NextResponse.json(
      { error: 'Erro ao processar o edital. Tente novamente.' },
      { status: 500 }
    )
  }
}
