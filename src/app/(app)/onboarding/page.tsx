'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { FiBookOpen, FiArrowLeft, FiArrowRight } from 'react-icons/fi'
import { Card, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Stepper } from '@/components/ui/Stepper'
import { FileUpload } from '@/components/ui/FileUpload'
import { Input } from '@/components/ui/Input'
import { Slider } from '@/components/ui/Slider'
import { Select } from '@/components/ui/Select'

const steps = [
  { title: 'Edital', description: 'Upload do PDF' },
  { title: 'Confirmar', description: 'Revisar dados' },
  { title: 'Conhecimento', description: 'Auto-avaliação' },
  { title: 'Disponibilidade', description: 'Preferências' },
  { title: 'Plano', description: 'Gerar plano' }
]

interface ExtractedSubject {
  name: string
  weight: number | null
  topics: string[]
  knowledgeLevel?: number
}

interface ExtractedData {
  title: string
  organization: string
  examDate: string | null
  subjects: ExtractedSubject[]
}

export default function OnboardingPage() {
  const router = useRouter()
  const { data: session, status } = useSession()
  const [currentStep, setCurrentStep] = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // Step 1: File upload
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [rawText, setRawText] = useState('')

  // Step 2: Extracted data (editable)
  const [extractedData, setExtractedData] = useState<ExtractedData | null>(null)

  // Step 3: Knowledge levels (stored in extractedData.subjects)

  // Step 4: Preferences
  const [preferences, setPreferences] = useState({
    hoursWeekday: 2,
    hoursWeekend: 4,
    preferredTime: 'night',
    sessionLength: 60,
    studyStyle: 'theory-first'
  })

  // Redirect if not authenticated
  if (status === 'unauthenticated') {
    router.push('/login')
    return null
  }

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full" />
      </div>
    )
  }

  const handleFileSelect = async (file: File) => {
    setSelectedFile(file)
    setError('')
  }

  const handleUploadEdital = async () => {
    if (!selectedFile) return

    setLoading(true)
    setError('')

    try {
      const formData = new FormData()
      formData.append('file', selectedFile)

      const response = await fetch('/api/edital/upload', {
        method: 'POST',
        body: formData
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao processar edital')
      }

      setRawText(data.rawText)
      setExtractedData({
        ...data.extracted,
        subjects: data.extracted.subjects.map((s: ExtractedSubject) => ({
          ...s,
          knowledgeLevel: 3 // Default middle value
        }))
      })
      setCurrentStep(1)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao processar edital')
    } finally {
      setLoading(false)
    }
  }

  const handleSaveEdital = async () => {
    if (!extractedData) return

    setLoading(true)
    setError('')

    try {
      const response = await fetch('/api/edital/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...extractedData,
          editalText: rawText
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao salvar edital')
      }

      // Update extractedData with IDs from saved exam
      setExtractedData({
        ...extractedData,
        subjects: data.exam.subjects.map((s: { id: string; name: string; weight: number | null; topics: { id: string; name: string }[] }, index: number) => ({
          ...extractedData.subjects[index],
          id: s.id,
          topics: s.topics.map((t: { id: string; name: string }, tIndex: number) => ({
            id: t.id,
            name: extractedData.subjects[index].topics[tIndex]
          }))
        }))
      })

      setCurrentStep(2)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao salvar edital')
    } finally {
      setLoading(false)
    }
  }

  const handleUpdateKnowledge = (index: number, level: number) => {
    if (!extractedData) return
    const newSubjects = [...extractedData.subjects]
    newSubjects[index] = { ...newSubjects[index], knowledgeLevel: level }
    setExtractedData({ ...extractedData, subjects: newSubjects })
  }

  const handleSavePreferences = async () => {
    setLoading(true)
    setError('')

    try {
      // Save user preferences
      await fetch('/api/user/preferences', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(preferences)
      })

      // Save knowledge levels
      await fetch('/api/edital/knowledge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subjects: extractedData?.subjects.map(s => ({
            id: (s as ExtractedSubject & { id?: string }).id,
            knowledgeLevel: s.knowledgeLevel
          }))
        })
      })

      setCurrentStep(4)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao salvar preferências')
    } finally {
      setLoading(false)
    }
  }

  const handleGeneratePlan = async () => {
    setLoading(true)
    setError('')

    try {
      const response = await fetch('/api/study-plan/generate', {
        method: 'POST'
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao gerar plano')
      }

      router.push('/dashboard')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao gerar plano')
    } finally {
      setLoading(false)
    }
  }

  const knowledgeLabels = [
    'Nunca estudei',
    'Básico',
    'Intermediário',
    'Avançado',
    'Domino'
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8 px-4">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 bg-blue-600 rounded-full mb-3">
            <FiBookOpen className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">
            Configure seu Plano de Estudos
          </h1>
          <p className="text-gray-600 mt-1">
            Olá, {session?.user?.name?.split(' ')[0] || 'Candidato'}! Vamos personalizar sua preparação.
          </p>
        </div>

        {/* Stepper */}
        <div className="mb-8">
          <Stepper steps={steps} currentStep={currentStep} />
        </div>

        {/* Error message */}
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
            {error}
          </div>
        )}

        {/* Step Content */}
        <Card elevation={2}>
          <CardContent>
            {/* Step 0: Upload Edital */}
            {currentStep === 0 && (
              <div>
                <h2 className="text-xl font-semibold text-gray-900 mb-2">
                  Envie o Edital do Concurso
                </h2>
                <p className="text-gray-600 mb-6">
                  Faça upload do PDF do edital. Nossa IA irá extrair automaticamente
                  as matérias, tópicos e datas importantes.
                </p>

                <FileUpload onFileSelect={handleFileSelect} />

                <div className="mt-6 flex justify-end">
                  <Button
                    onClick={handleUploadEdital}
                    disabled={!selectedFile}
                    loading={loading}
                  >
                    Processar Edital
                    <FiArrowRight className="ml-2" />
                  </Button>
                </div>
              </div>
            )}

            {/* Step 1: Confirm extracted data */}
            {currentStep === 1 && extractedData && (
              <div>
                <h2 className="text-xl font-semibold text-gray-900 mb-2">
                  Confirme os Dados Extraídos
                </h2>
                <p className="text-gray-600 mb-6">
                  Revise e corrija as informações extraídas do edital, se necessário.
                </p>

                <div className="space-y-4">
                  <Input
                    label="Nome do Concurso"
                    value={extractedData.title}
                    onChange={(e) => setExtractedData({ ...extractedData, title: e.target.value })}
                  />

                  <Input
                    label="Órgão / Instituição"
                    value={extractedData.organization}
                    onChange={(e) => setExtractedData({ ...extractedData, organization: e.target.value })}
                  />

                  <Input
                    type="date"
                    label="Data da Prova"
                    value={extractedData.examDate || ''}
                    onChange={(e) => setExtractedData({ ...extractedData, examDate: e.target.value })}
                  />

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Matérias Identificadas ({extractedData.subjects.length})
                    </label>
                    <div className="space-y-2 max-h-60 overflow-y-auto">
                      {extractedData.subjects.map((subject, index) => (
                        <div
                          key={index}
                          className="p-3 bg-gray-50 rounded-lg"
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-medium text-gray-900">
                              {subject.name}
                            </span>
                            {subject.weight && (
                              <span className="text-sm text-gray-500">
                                Peso: {subject.weight}
                              </span>
                            )}
                          </div>
                          {subject.topics.length > 0 && (
                            <p className="text-sm text-gray-500 mt-1">
                              {subject.topics.length} tópicos
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="mt-6 flex justify-between">
                  <Button
                    variant="outlined"
                    onClick={() => setCurrentStep(0)}
                  >
                    <FiArrowLeft className="mr-2" />
                    Voltar
                  </Button>
                  <Button
                    onClick={handleSaveEdital}
                    loading={loading}
                  >
                    Confirmar e Continuar
                    <FiArrowRight className="ml-2" />
                  </Button>
                </div>
              </div>
            )}

            {/* Step 2: Knowledge assessment */}
            {currentStep === 2 && extractedData && (
              <div>
                <h2 className="text-xl font-semibold text-gray-900 mb-2">
                  Avalie seu Conhecimento
                </h2>
                <p className="text-gray-600 mb-6">
                  Para cada matéria, indique seu nível atual de conhecimento.
                  Isso nos ajuda a priorizar seu plano de estudos.
                </p>

                <div className="space-y-6">
                  {extractedData.subjects.map((subject, index) => (
                    <div key={index} className="p-4 bg-gray-50 rounded-lg">
                      <div className="flex items-center justify-between mb-3">
                        <span className="font-medium text-gray-900">
                          {subject.name}
                        </span>
                        <span className="text-sm text-blue-600 font-medium">
                          {knowledgeLabels[(subject.knowledgeLevel || 3) - 1]}
                        </span>
                      </div>
                      <Slider
                        value={subject.knowledgeLevel || 3}
                        onChange={(value) => handleUpdateKnowledge(index, value)}
                        min={1}
                        max={5}
                        labels={knowledgeLabels}
                      />
                    </div>
                  ))}
                </div>

                <div className="mt-6 flex justify-between">
                  <Button
                    variant="outlined"
                    onClick={() => setCurrentStep(1)}
                  >
                    <FiArrowLeft className="mr-2" />
                    Voltar
                  </Button>
                  <Button onClick={() => setCurrentStep(3)}>
                    Continuar
                    <FiArrowRight className="ml-2" />
                  </Button>
                </div>
              </div>
            )}

            {/* Step 3: Availability and preferences */}
            {currentStep === 3 && (
              <div>
                <h2 className="text-xl font-semibold text-gray-900 mb-2">
                  Sua Disponibilidade
                </h2>
                <p className="text-gray-600 mb-6">
                  Configure quanto tempo você pode dedicar aos estudos e suas preferências.
                </p>

                <div className="space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Horas por dia (dias úteis)
                      </label>
                      <div className="flex items-center space-x-3">
                        <Slider
                          value={preferences.hoursWeekday}
                          onChange={(value) => setPreferences({ ...preferences, hoursWeekday: value })}
                          min={1}
                          max={8}
                        />
                        <span className="text-lg font-semibold text-blue-600 w-8">
                          {preferences.hoursWeekday}h
                        </span>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Horas por dia (fins de semana)
                      </label>
                      <div className="flex items-center space-x-3">
                        <Slider
                          value={preferences.hoursWeekend}
                          onChange={(value) => setPreferences({ ...preferences, hoursWeekend: value })}
                          min={1}
                          max={10}
                        />
                        <span className="text-lg font-semibold text-blue-600 w-8">
                          {preferences.hoursWeekend}h
                        </span>
                      </div>
                    </div>
                  </div>

                  <Select
                    label="Horário preferido para estudar"
                    value={preferences.preferredTime}
                    onChange={(value) => setPreferences({ ...preferences, preferredTime: value })}
                    options={[
                      { value: 'morning', label: 'Manhã (6h - 12h)' },
                      { value: 'afternoon', label: 'Tarde (12h - 18h)' },
                      { value: 'night', label: 'Noite (18h - 23h)' }
                    ]}
                  />

                  <Select
                    label="Duração das sessões de estudo"
                    value={String(preferences.sessionLength)}
                    onChange={(value) => setPreferences({ ...preferences, sessionLength: Number(value) })}
                    options={[
                      { value: '25', label: 'Pomodoro (25 minutos)' },
                      { value: '45', label: 'Sessão curta (45 minutos)' },
                      { value: '60', label: 'Sessão padrão (1 hora)' },
                      { value: '90', label: 'Sessão longa (1h30)' },
                      { value: '120', label: 'Sessão estendida (2 horas)' }
                    ]}
                  />

                  <Select
                    label="Estilo de estudo preferido"
                    value={preferences.studyStyle}
                    onChange={(value) => setPreferences({ ...preferences, studyStyle: value })}
                    options={[
                      { value: 'theory-first', label: 'Teoria primeiro, depois exercícios' },
                      { value: 'exercise-first', label: 'Exercícios primeiro, depois teoria' }
                    ]}
                  />
                </div>

                <div className="mt-6 flex justify-between">
                  <Button
                    variant="outlined"
                    onClick={() => setCurrentStep(2)}
                  >
                    <FiArrowLeft className="mr-2" />
                    Voltar
                  </Button>
                  <Button
                    onClick={handleSavePreferences}
                    loading={loading}
                  >
                    Continuar
                    <FiArrowRight className="ml-2" />
                  </Button>
                </div>
              </div>
            )}

            {/* Step 4: Generate plan */}
            {currentStep === 4 && (
              <div className="text-center py-8">
                <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <FiBookOpen className="w-10 h-10 text-blue-600" />
                </div>
                <h2 className="text-xl font-semibold text-gray-900 mb-2">
                  Tudo Pronto!
                </h2>
                <p className="text-gray-600 mb-8 max-w-md mx-auto">
                  Vamos usar inteligência artificial para criar um plano de estudos
                  personalizado baseado no seu edital, conhecimento e disponibilidade.
                </p>

                <Button
                  size="lg"
                  onClick={handleGeneratePlan}
                  loading={loading}
                >
                  {loading ? 'Gerando seu plano...' : 'Gerar Meu Plano de Estudos'}
                </Button>

                <div className="mt-6">
                  <Button
                    variant="text"
                    onClick={() => setCurrentStep(3)}
                  >
                    <FiArrowLeft className="mr-2" />
                    Voltar e ajustar
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
