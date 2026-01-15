'use client'

import { useEffect, useState } from 'react'
import { useSession, signOut } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import {
  FiBookOpen,
  FiCalendar,
  FiCheck,
  FiClock,
  FiLogOut,
  FiRefreshCw,
  FiTarget,
  FiChevronLeft,
  FiChevronRight
} from 'react-icons/fi'
import { format, addDays, startOfWeek, isSameDay, parseISO, differenceInDays } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { Card, CardContent, CardHeader } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'

interface StudyTask {
  id: string
  date: string
  title: string
  description: string | null
  durationMinutes: number
  completed: boolean
  subject: {
    id: string
    name: string
  }
  topic: {
    id: string
    name: string
  } | null
}

interface DashboardData {
  exam: {
    id: string
    title: string
    examDate: string | null
    organization: string | null
  }
  studyPlan: {
    id: string
    tasks: StudyTask[]
  } | null
  stats: {
    totalTasks: number
    completedTasks: number
    todayTasks: number
    todayCompleted: number
    daysUntilExam: number | null
  }
}

export default function DashboardPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [weekStart, setWeekStart] = useState(startOfWeek(new Date(), { weekStartsOn: 1 }))

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login')
    }
  }, [status, router])

  useEffect(() => {
    if (status === 'authenticated') {
      fetchDashboardData()
    }
  }, [status])

  const fetchDashboardData = async () => {
    try {
      const response = await fetch('/api/dashboard')
      const result = await response.json()

      if (response.ok) {
        setData(result)
      } else if (response.status === 404) {
        // No exam/plan yet, redirect to onboarding
        router.push('/onboarding')
      }
    } catch (error) {
      console.error('Erro ao carregar dashboard:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleToggleTask = async (taskId: string, completed: boolean) => {
    try {
      await fetch(`/api/study-plan/task/${taskId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ completed: !completed })
      })

      // Update local state
      if (data?.studyPlan) {
        setData({
          ...data,
          studyPlan: {
            ...data.studyPlan,
            tasks: data.studyPlan.tasks.map(t =>
              t.id === taskId ? { ...t, completed: !completed } : t
            )
          },
          stats: {
            ...data.stats,
            completedTasks: data.stats.completedTasks + (completed ? -1 : 1),
            todayCompleted: isSameDay(parseISO(data.studyPlan.tasks.find(t => t.id === taskId)!.date), new Date())
              ? data.stats.todayCompleted + (completed ? -1 : 1)
              : data.stats.todayCompleted
          }
        })
      }
    } catch (error) {
      console.error('Erro ao atualizar tarefa:', error)
    }
  }

  const handleRegeneratePlan = async () => {
    setLoading(true)
    try {
      await fetch('/api/study-plan/generate', { method: 'POST' })
      await fetchDashboardData()
    } catch (error) {
      console.error('Erro ao regenerar plano:', error)
    } finally {
      setLoading(false)
    }
  }

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full" />
      </div>
    )
  }

  if (!data) {
    return null
  }

  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i))

  const tasksForDate = (date: Date) =>
    data.studyPlan?.tasks.filter(t => isSameDay(parseISO(t.date), date)) || []

  const selectedDateTasks = tasksForDate(selectedDate)
  const todayTasks = tasksForDate(new Date())

  const progressPercent = data.stats.totalTasks > 0
    ? Math.round((data.stats.completedTasks / data.stats.totalTasks) * 100)
    : 0

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center">
                <FiBookOpen className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-gray-900">Concursos Prep</h1>
                <p className="text-sm text-gray-500">{data.exam.title}</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">
                Olá, {session?.user?.name?.split(' ')[0]}
              </span>
              <button
                onClick={() => signOut({ callbackUrl: '/login' })}
                className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full"
                title="Sair"
              >
                <FiLogOut className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                  <FiTarget className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Progresso Total</p>
                  <p className="text-2xl font-bold text-gray-900">{progressPercent}%</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                  <FiCheck className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Tarefas Concluídas</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {data.stats.completedTasks}/{data.stats.totalTasks}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center">
                  <FiClock className="w-6 h-6 text-orange-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Hoje</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {data.stats.todayCompleted}/{data.stats.todayTasks}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                  <FiCalendar className="w-6 h-6 text-purple-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Dias até a Prova</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {data.stats.daysUntilExam ?? '—'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Calendar */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900">Calendário de Estudos</h2>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setWeekStart(addDays(weekStart, -7))}
                    className="p-2 hover:bg-gray-100 rounded-full"
                  >
                    <FiChevronLeft className="w-5 h-5" />
                  </button>
                  <span className="text-sm text-gray-600">
                    {format(weekStart, "MMMM 'de' yyyy", { locale: ptBR })}
                  </span>
                  <button
                    onClick={() => setWeekStart(addDays(weekStart, 7))}
                    className="p-2 hover:bg-gray-100 rounded-full"
                  >
                    <FiChevronRight className="w-5 h-5" />
                  </button>
                </div>
              </CardHeader>
              <CardContent>
                {/* Week view */}
                <div className="grid grid-cols-7 gap-2 mb-4">
                  {weekDays.map((day) => {
                    const dayTasks = tasksForDate(day)
                    const isToday = isSameDay(day, new Date())
                    const isSelected = isSameDay(day, selectedDate)
                    const completedCount = dayTasks.filter(t => t.completed).length

                    return (
                      <button
                        key={day.toISOString()}
                        onClick={() => setSelectedDate(day)}
                        className={`
                          p-3 rounded-xl text-center transition-all
                          ${isSelected
                            ? 'bg-blue-600 text-white'
                            : isToday
                              ? 'bg-blue-50 border-2 border-blue-600'
                              : 'hover:bg-gray-100'
                          }
                        `}
                      >
                        <p className={`text-xs ${isSelected ? 'text-blue-100' : 'text-gray-500'}`}>
                          {format(day, 'EEE', { locale: ptBR })}
                        </p>
                        <p className={`text-lg font-semibold ${isSelected ? 'text-white' : 'text-gray-900'}`}>
                          {format(day, 'd')}
                        </p>
                        {dayTasks.length > 0 && (
                          <div className={`text-xs mt-1 ${isSelected ? 'text-blue-100' : 'text-gray-500'}`}>
                            {completedCount}/{dayTasks.length}
                          </div>
                        )}
                      </button>
                    )
                  })}
                </div>

                {/* Tasks for selected date */}
                <div className="border-t border-gray-100 pt-4">
                  <h3 className="text-sm font-medium text-gray-700 mb-3">
                    Tarefas de {format(selectedDate, "d 'de' MMMM", { locale: ptBR })}
                  </h3>
                  {selectedDateTasks.length === 0 ? (
                    <p className="text-sm text-gray-500 text-center py-8">
                      Nenhuma tarefa para este dia
                    </p>
                  ) : (
                    <div className="space-y-3">
                      {selectedDateTasks.map((task) => (
                        <div
                          key={task.id}
                          className={`
                            p-4 rounded-xl border-2 transition-all
                            ${task.completed
                              ? 'bg-green-50 border-green-200'
                              : 'bg-white border-gray-200 hover:border-blue-300'
                            }
                          `}
                        >
                          <div className="flex items-start space-x-3">
                            <button
                              onClick={() => handleToggleTask(task.id, task.completed)}
                              className={`
                                w-6 h-6 rounded-full border-2 flex items-center justify-center mt-0.5
                                transition-all
                                ${task.completed
                                  ? 'bg-green-500 border-green-500 text-white'
                                  : 'border-gray-300 hover:border-blue-500'
                                }
                              `}
                            >
                              {task.completed && <FiCheck className="w-4 h-4" />}
                            </button>
                            <div className="flex-1">
                              <div className="flex items-center justify-between">
                                <h4 className={`font-medium ${task.completed ? 'text-gray-500 line-through' : 'text-gray-900'}`}>
                                  {task.title}
                                </h4>
                                <span className="text-sm text-gray-500">
                                  {task.durationMinutes} min
                                </span>
                              </div>
                              <p className="text-sm text-blue-600 mt-0.5">
                                {task.subject.name}
                              </p>
                              {task.description && (
                                <p className="text-sm text-gray-500 mt-1">
                                  {task.description}
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Today's Focus */}
          <div>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900">Foco de Hoje</h2>
                <Button
                  variant="text"
                  size="sm"
                  onClick={handleRegeneratePlan}
                >
                  <FiRefreshCw className="w-4 h-4 mr-1" />
                  Regenerar
                </Button>
              </CardHeader>
              <CardContent>
                {todayTasks.length === 0 ? (
                  <div className="text-center py-8">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <FiCheck className="w-8 h-8 text-gray-400" />
                    </div>
                    <p className="text-gray-500">Nenhuma tarefa para hoje</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {todayTasks.map((task) => (
                      <div
                        key={task.id}
                        className={`
                          p-3 rounded-lg transition-all cursor-pointer
                          ${task.completed
                            ? 'bg-green-50'
                            : 'bg-gray-50 hover:bg-gray-100'
                          }
                        `}
                        onClick={() => handleToggleTask(task.id, task.completed)}
                      >
                        <div className="flex items-center space-x-3">
                          <div
                            className={`
                              w-5 h-5 rounded-full border-2 flex items-center justify-center
                              ${task.completed
                                ? 'bg-green-500 border-green-500 text-white'
                                : 'border-gray-300'
                              }
                            `}
                          >
                            {task.completed && <FiCheck className="w-3 h-3" />}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className={`text-sm font-medium truncate ${task.completed ? 'text-gray-500 line-through' : 'text-gray-900'}`}>
                              {task.title}
                            </p>
                            <p className="text-xs text-gray-500">
                              {task.subject.name} • {task.durationMinutes}min
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}

                    {/* Summary */}
                    <div className="mt-4 pt-4 border-t border-gray-200">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-500">Total de estudo hoje:</span>
                        <span className="font-medium text-gray-900">
                          {Math.round(todayTasks.reduce((acc, t) => acc + t.durationMinutes, 0) / 60)}h {todayTasks.reduce((acc, t) => acc + t.durationMinutes, 0) % 60}min
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Progress by subject */}
            {data.studyPlan && (
              <Card className="mt-6">
                <CardHeader>
                  <h2 className="text-lg font-semibold text-gray-900">Progresso por Matéria</h2>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {Array.from(new Set(data.studyPlan.tasks.map(t => t.subject.id))).map(subjectId => {
                      const subjectTasks = data.studyPlan!.tasks.filter(t => t.subject.id === subjectId)
                      const subjectName = subjectTasks[0].subject.name
                      const completed = subjectTasks.filter(t => t.completed).length
                      const total = subjectTasks.length
                      const percent = Math.round((completed / total) * 100)

                      return (
                        <div key={subjectId}>
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-sm font-medium text-gray-700 truncate">
                              {subjectName}
                            </span>
                            <span className="text-sm text-gray-500">
                              {completed}/{total}
                            </span>
                          </div>
                          <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-blue-600 rounded-full transition-all"
                              style={{ width: `${percent}%` }}
                            />
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
