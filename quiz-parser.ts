export interface Question {
  id: number
  text: string
  options: string[]
}

export function parseQuiz(text: string): { questions: Question[]; answerKey: Record<number, string> } {
  const questions: Question[] = []
  const answerKey: Record<number, string> = {}

  const lines = text.split("\n")
  let currentQuestion: Partial<Question> | null = null
  let parsingAnswerKey = false

  for (const line of lines) {
    if (line.trim() === "---") {
      parsingAnswerKey = true
      continue
    }

    if (parsingAnswerKey) {
      const answerKeyMatch = line.match(/^(\d+)\.\s*([a-d])$/)
      if (answerKeyMatch) {
        answerKey[Number.parseInt(answerKeyMatch[1])] = answerKeyMatch[2]
      }
    } else {
      const questionMatch = line.match(/^(\d+)\.\s(.+)/)
      if (questionMatch) {
        if (currentQuestion) {
          questions.push(currentQuestion as Question)
        }
        currentQuestion = {
          id: Number.parseInt(questionMatch[1]),
          text: questionMatch[2].trim(),
          options: [],
        }
      } else if (currentQuestion) {
        const optionMatch = line.match(/^([a-d])\)\s(.+)/)
        if (optionMatch) {
          currentQuestion.options!.push(optionMatch[2].trim())
        }
      }
    }
  }

  if (currentQuestion) {
    questions.push(currentQuestion as Question)
  }

  return { questions, answerKey }
}

