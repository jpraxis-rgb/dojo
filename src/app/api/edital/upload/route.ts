import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { extractEditalContent } from '@/lib/gemini'

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
    let pdfText: string
    try {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const pdfParse = require('pdf-parse')
      const pdfData = await pdfParse(buffer)
      pdfText = pdfData.text
    } catch (pdfError) {
      console.error('Erro ao extrair PDF:', pdfError)
      return NextResponse.json(
        { error: 'Erro ao ler o PDF. Tente um arquivo diferente ou verifique se não está protegido.' },
        { status: 400 }
      )
    }

    if (!pdfText || pdfText.trim().length < 100) {
      return NextResponse.json(
        { error: 'Não foi possível extrair texto do PDF. O arquivo pode estar escaneado ou protegido.' },
        { status: 400 }
      )
    }

    // Use Gemini to extract structured content
    let extractedContent
    try {
      extractedContent = await extractEditalContent(pdfText)
    } catch (aiError) {
      console.error('Erro na API Gemini:', aiError)
      return NextResponse.json(
        { error: 'Erro ao analisar o edital com IA. Verifique sua chave de API do Gemini.' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      rawText: pdfText,
      extracted: extractedContent
    })
  } catch (error) {
    console.error('Erro geral ao processar edital:', error)
    return NextResponse.json(
      { error: 'Erro inesperado ao processar o edital.' },
      { status: 500 }
    )
  }
}
