'use client'

import { useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { FiBookOpen, FiTarget, FiCalendar, FiCheckCircle, FiArrowRight } from 'react-icons/fi'
import { Button } from '@/components/ui/Button'

export default function HomePage() {
  const { data: session, status } = useSession()
  const router = useRouter()

  useEffect(() => {
    if (status === 'authenticated') {
      router.push('/dashboard')
    }
  }, [status, router])

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <header className="py-6 px-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center">
              <FiBookOpen className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold text-gray-900">Concursos Prep</span>
          </div>
          <div className="flex items-center space-x-4">
            <Link href="/login">
              <Button variant="text">Entrar</Button>
            </Link>
            <Link href="/cadastro">
              <Button>Começar Grátis</Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="py-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
            Seu Plano de Estudos
            <br />
            <span className="text-blue-600">Personalizado com IA</span>
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            Envie o edital do seu concurso e nossa inteligência artificial cria
            um plano de estudos completo, adaptado ao seu tempo e conhecimento.
          </p>
          <Link href="/cadastro">
            <Button size="lg">
              Criar Meu Plano de Estudos
              <FiArrowRight className="ml-2" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Features */}
      <section className="py-16 px-4">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-2xl font-bold text-gray-900 text-center mb-12">
            Como Funciona
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white rounded-2xl p-8 shadow-lg">
              <div className="w-14 h-14 bg-blue-100 rounded-xl flex items-center justify-center mb-6">
                <FiTarget className="w-7 h-7 text-blue-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">
                1. Envie o Edital
              </h3>
              <p className="text-gray-600">
                Faça upload do PDF do edital do seu concurso. Nossa IA extrai
                automaticamente todas as matérias e tópicos.
              </p>
            </div>

            <div className="bg-white rounded-2xl p-8 shadow-lg">
              <div className="w-14 h-14 bg-green-100 rounded-xl flex items-center justify-center mb-6">
                <FiCalendar className="w-7 h-7 text-green-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">
                2. Configure sua Rotina
              </h3>
              <p className="text-gray-600">
                Informe sua disponibilidade, nível de conhecimento e preferências
                de estudo para personalização máxima.
              </p>
            </div>

            <div className="bg-white rounded-2xl p-8 shadow-lg">
              <div className="w-14 h-14 bg-purple-100 rounded-xl flex items-center justify-center mb-6">
                <FiCheckCircle className="w-7 h-7 text-purple-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">
                3. Siga o Plano
              </h3>
              <p className="text-gray-600">
                Receba um cronograma diário otimizado. Marque tarefas concluídas
                e acompanhe seu progresso até a prova.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-6">
            Comece sua Preparação Agora
          </h2>
          <p className="text-lg text-gray-600 mb-8">
            Milhares de candidatos já estão se preparando de forma mais inteligente.
          </p>
          <Link href="/cadastro">
            <Button size="lg">
              Criar Conta Grátis
              <FiArrowRight className="ml-2" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-4 border-t border-gray-200">
        <div className="max-w-6xl mx-auto text-center text-gray-500 text-sm">
          <p>&copy; 2024 Concursos Prep. Todos os direitos reservados.</p>
        </div>
      </footer>
    </div>
  )
}
