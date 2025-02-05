export interface Question {
  id: number
  text: string
  options: string[]
}

export interface QuizState {
  questions: Question[]
  userAnswers: Record<number, string>
  submitted: boolean
  score?: number
  percentage?: number
}

