// Simple in-memory database for MVP demo
// In production, replace with Prisma or another ORM connected to a real database

export interface User {
  id: string
  email: string
  password: string
  name: string | null
  hoursWeekday: number | null
  hoursWeekend: number | null
  preferredTime: string | null
  sessionLength: number | null
  studyStyle: string | null
  createdAt: Date
  updatedAt: Date
}

export interface Exam {
  id: string
  userId: string
  title: string
  organization: string | null
  examDate: Date | null
  editalText: string | null
  createdAt: Date
  updatedAt: Date
}

export interface Subject {
  id: string
  examId: string
  name: string
  weight: number | null
  knowledgeLevel: number | null
  estimatedHours: number | null
  createdAt: Date
  updatedAt: Date
}

export interface Topic {
  id: string
  subjectId: string
  name: string
  estimatedHours: number | null
  createdAt: Date
  updatedAt: Date
}

export interface StudyPlan {
  id: string
  examId: string
  generatedAt: Date
}

export interface StudyTask {
  id: string
  studyPlanId: string
  subjectId: string
  topicId: string | null
  date: Date
  title: string
  description: string | null
  durationMinutes: number
  completed: boolean
  completedAt: Date | null
  createdAt: Date
  updatedAt: Date
}

// In-memory storage
const storage: {
  users: Map<string, User>
  exams: Map<string, Exam>
  subjects: Map<string, Subject>
  topics: Map<string, Topic>
  studyPlans: Map<string, StudyPlan>
  studyTasks: Map<string, StudyTask>
} = {
  users: new Map(),
  exams: new Map(),
  subjects: new Map(),
  topics: new Map(),
  studyPlans: new Map(),
  studyTasks: new Map()
}

// Helper to generate IDs
function generateId(): string {
  return Math.random().toString(36).substring(2) + Date.now().toString(36)
}

// User operations
export const db = {
  user: {
    async create(data: { email: string; password: string; name?: string }): Promise<User> {
      const user: User = {
        id: generateId(),
        email: data.email,
        password: data.password,
        name: data.name || null,
        hoursWeekday: null,
        hoursWeekend: null,
        preferredTime: null,
        sessionLength: null,
        studyStyle: null,
        createdAt: new Date(),
        updatedAt: new Date()
      }
      storage.users.set(user.id, user)
      return user
    },

    async findUnique(where: { id?: string; email?: string }): Promise<User | null> {
      if (where.id) {
        return storage.users.get(where.id) || null
      }
      if (where.email) {
        for (const user of storage.users.values()) {
          if (user.email === where.email) {
            return user
          }
        }
      }
      return null
    },

    async update(id: string, data: Partial<User>): Promise<User | null> {
      const user = storage.users.get(id)
      if (!user) return null
      const updated = { ...user, ...data, updatedAt: new Date() }
      storage.users.set(id, updated)
      return updated
    },

    async findWithExamAndPlan(userId: string): Promise<(User & { exam: (Exam & { subjects: (Subject & { topics: Topic[] })[]; studyPlan: (StudyPlan & { tasks: (StudyTask & { subject: Subject; topic: Topic | null })[] }) | null }) | null }) | null> {
      const user = storage.users.get(userId)
      if (!user) return null

      let exam: Exam | null = null
      for (const e of storage.exams.values()) {
        if (e.userId === userId) {
          exam = e
          break
        }
      }

      if (!exam) {
        return { ...user, exam: null }
      }

      const subjects: (Subject & { topics: Topic[] })[] = []
      for (const s of storage.subjects.values()) {
        if (s.examId === exam.id) {
          const topics: Topic[] = []
          for (const t of storage.topics.values()) {
            if (t.subjectId === s.id) {
              topics.push(t)
            }
          }
          subjects.push({ ...s, topics })
        }
      }

      let studyPlan: (StudyPlan & { tasks: (StudyTask & { subject: Subject; topic: Topic | null })[] }) | null = null
      for (const sp of storage.studyPlans.values()) {
        if (sp.examId === exam.id) {
          const tasks: (StudyTask & { subject: Subject; topic: Topic | null })[] = []
          for (const task of storage.studyTasks.values()) {
            if (task.studyPlanId === sp.id) {
              const subject = storage.subjects.get(task.subjectId)!
              const topic = task.topicId ? storage.topics.get(task.topicId) || null : null
              tasks.push({ ...task, subject, topic })
            }
          }
          tasks.sort((a, b) => a.date.getTime() - b.date.getTime())
          studyPlan = { ...sp, tasks }
          break
        }
      }

      return {
        ...user,
        exam: {
          ...exam,
          subjects,
          studyPlan
        }
      }
    }
  },

  exam: {
    async create(data: { userId: string; title: string; organization?: string; examDate?: Date; editalText?: string; subjects: { name: string; weight?: number; topics: string[] }[] }): Promise<Exam & { subjects: (Subject & { topics: Topic[] })[] }> {
      const exam: Exam = {
        id: generateId(),
        userId: data.userId,
        title: data.title,
        organization: data.organization || null,
        examDate: data.examDate || null,
        editalText: data.editalText || null,
        createdAt: new Date(),
        updatedAt: new Date()
      }
      storage.exams.set(exam.id, exam)

      const subjects: (Subject & { topics: Topic[] })[] = []
      for (const subjectData of data.subjects) {
        const subject: Subject = {
          id: generateId(),
          examId: exam.id,
          name: subjectData.name,
          weight: subjectData.weight || null,
          knowledgeLevel: null,
          estimatedHours: null,
          createdAt: new Date(),
          updatedAt: new Date()
        }
        storage.subjects.set(subject.id, subject)

        const topics: Topic[] = []
        for (const topicName of subjectData.topics) {
          const topic: Topic = {
            id: generateId(),
            subjectId: subject.id,
            name: topicName,
            estimatedHours: null,
            createdAt: new Date(),
            updatedAt: new Date()
          }
          storage.topics.set(topic.id, topic)
          topics.push(topic)
        }

        subjects.push({ ...subject, topics })
      }

      return { ...exam, subjects }
    },

    async deleteByUserId(userId: string): Promise<void> {
      for (const [id, exam] of storage.exams) {
        if (exam.userId === userId) {
          // Delete related study plans and tasks
          for (const [spId, sp] of storage.studyPlans) {
            if (sp.examId === id) {
              for (const [taskId, task] of storage.studyTasks) {
                if (task.studyPlanId === spId) {
                  storage.studyTasks.delete(taskId)
                }
              }
              storage.studyPlans.delete(spId)
            }
          }
          // Delete subjects and topics
          for (const [sId, s] of storage.subjects) {
            if (s.examId === id) {
              for (const [tId, t] of storage.topics) {
                if (t.subjectId === sId) {
                  storage.topics.delete(tId)
                }
              }
              storage.subjects.delete(sId)
            }
          }
          storage.exams.delete(id)
        }
      }
    }
  },

  subject: {
    async updateKnowledgeLevel(id: string, knowledgeLevel: number): Promise<Subject | null> {
      const subject = storage.subjects.get(id)
      if (!subject) return null
      subject.knowledgeLevel = knowledgeLevel
      subject.updatedAt = new Date()
      return subject
    }
  },

  studyPlan: {
    async create(data: { examId: string; tasks: { date: Date; subjectId: string; topicId?: string; title: string; description?: string; durationMinutes: number }[] }): Promise<StudyPlan & { tasks: StudyTask[] }> {
      const studyPlan: StudyPlan = {
        id: generateId(),
        examId: data.examId,
        generatedAt: new Date()
      }
      storage.studyPlans.set(studyPlan.id, studyPlan)

      const tasks: StudyTask[] = []
      for (const taskData of data.tasks) {
        const task: StudyTask = {
          id: generateId(),
          studyPlanId: studyPlan.id,
          subjectId: taskData.subjectId,
          topicId: taskData.topicId || null,
          date: taskData.date,
          title: taskData.title,
          description: taskData.description || null,
          durationMinutes: taskData.durationMinutes,
          completed: false,
          completedAt: null,
          createdAt: new Date(),
          updatedAt: new Date()
        }
        storage.studyTasks.set(task.id, task)
        tasks.push(task)
      }

      return { ...studyPlan, tasks }
    },

    async deleteByExamId(examId: string): Promise<void> {
      for (const [spId, sp] of storage.studyPlans) {
        if (sp.examId === examId) {
          for (const [taskId, task] of storage.studyTasks) {
            if (task.studyPlanId === spId) {
              storage.studyTasks.delete(taskId)
            }
          }
          storage.studyPlans.delete(spId)
        }
      }
    }
  },

  studyTask: {
    async findByIdAndUserId(taskId: string, userId: string): Promise<StudyTask | null> {
      const task = storage.studyTasks.get(taskId)
      if (!task) return null

      const studyPlan = storage.studyPlans.get(task.studyPlanId)
      if (!studyPlan) return null

      const exam = storage.exams.get(studyPlan.examId)
      if (!exam || exam.userId !== userId) return null

      return task
    },

    async updateCompleted(id: string, completed: boolean): Promise<StudyTask | null> {
      const task = storage.studyTasks.get(id)
      if (!task) return null
      task.completed = completed
      task.completedAt = completed ? new Date() : null
      task.updatedAt = new Date()
      return task
    }
  }
}
