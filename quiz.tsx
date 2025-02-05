"use client"

import { useState } from "react"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Copy } from "lucide-react"
import { parseQuiz, type Question } from "./quiz-parser"
import { ThemeProvider } from "./theme-provider"
import { ThemeToggle } from "./theme-toggle"

const sampleQuiz = `1. What is the capital of France?
a) London
b) Paris
c) Berlin
d) Madrid

2. Which planet is known as the Red Planet?
a) Venus
b) Jupiter
c) Mars
d) Saturn

3. What is the chemical symbol for gold?
a) Au
b) Ag
c) Fe
d) Cu

---
1. b
2. c
3. a`

interface QuizState {
  questions: Question[]
  userAnswers: Record<number, string>
  submitted: boolean
  score?: number
  percentage?: number
}

export default function QuizApp() {
  return (
    <ThemeProvider defaultTheme="light">
      <div className="min-h-screen bg-background text-foreground">
        <Quiz />
      </div>
    </ThemeProvider>
  )
}

function Quiz() {
  const [quizText, setQuizText] = useState("")
  const [quizState, setQuizState] = useState<QuizState>({
    questions: [],
    userAnswers: {},
    submitted: false,
  })
  const [answerKey, setAnswerKey] = useState<Record<number, string>>({})

  const handleQuizSubmit = (text: string) => {
    const { questions, answerKey } = parseQuiz(text)
    const questionsWithoutNumbers = questions.map((question) => ({
      ...question,
      text: question.text.replace(/^\d+\.\s*/, ""), // Remove numbers from display
    }))
    setQuizState({
      questions: questionsWithoutNumbers,
      userAnswers: {},
      submitted: false,
    })
    setAnswerKey(answerKey)
  }

  const handleAnswerSelect = (questionId: number, answer: string) => {
    setQuizState((prev) => ({
      ...prev,
      userAnswers: {
        ...prev.userAnswers,
        [questionId]: answer,
      },
    }))
  }

  const calculateScore = () => {
    const correct = Object.entries(quizState.userAnswers).filter(
      ([id, answer]) => answer === answerKey[Number.parseInt(id)],
    ).length
    const total = quizState.questions.length
    const percentage = (correct / total) * 100

    return {
      score: correct,
      total,
      percentage: Math.round(percentage * 100) / 100,
    }
  }

  const handleSubmit = () => {
    const { score, total, percentage } = calculateScore()
    setQuizState((prev) => ({
      ...prev,
      submitted: true,
      score,
      percentage,
    }))
  }

  const handleStartNewQuiz = () => {
    setQuizState({
      questions: [],
      userAnswers: {},
      submitted: false,
    })
    setAnswerKey({})
    setQuizText("")
  }

  const handleRedoQuiz = () => {
    setQuizState((prev) => ({
      ...prev,
      userAnswers: {},
      submitted: false,
      score: undefined,
      percentage: undefined,
    }))
  }

  const handleShuffleQuiz = () => {
    setQuizState((prev) => {
      const shuffledQuestions = [...prev.questions].sort(() => Math.random() - 0.5)

      const newAnswerKey: Record<number, string> = {}
      const shuffledQuestionsWithOptions = shuffledQuestions.map((question, newIndex) => {
        const optionsWithIndices = question.options.map((option, index) => ({
          option,
          originalIndex: index,
        }))

        const shuffledOptionsWithIndices = [...optionsWithIndices].sort(() => Math.random() - 0.5)

        const correctAnswerLetter = answerKey[question.id]
        const correctAnswerOriginalIndex = correctAnswerLetter.charCodeAt(0) - 97

        const newCorrectAnswerIndex = shuffledOptionsWithIndices.findIndex(
          (opt) => opt.originalIndex === correctAnswerOriginalIndex,
        )

        const newQuestionNumber = newIndex + 1
        newAnswerKey[newQuestionNumber] = String.fromCharCode(97 + newCorrectAnswerIndex)

        return {
          ...question,
          id: newQuestionNumber, // Keep track of number internally
          options: shuffledOptionsWithIndices.map((item) => item.option),
        }
      })

      setAnswerKey(newAnswerKey)

      return {
        ...prev,
        questions: shuffledQuestionsWithOptions,
        userAnswers: {},
        submitted: false,
        score: undefined,
        percentage: undefined,
      }
    })
  }

  const handleCopySample = async () => {
    try {
      await navigator.clipboard.writeText(sampleQuiz)
    } catch (err) {
      console.error("Failed to copy text: ", err)
    }
  }

  if (!quizState.questions.length) {
    return (
      <div className="w-full max-w-6xl mx-auto flex flex-col lg:flex-row gap-6 p-4">
        <Card className="flex-1">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle>Quiz System</CardTitle>
            <ThemeToggle />
          </CardHeader>
          <CardContent>
            <textarea
              className="w-full h-64 p-4 border rounded-md bg-background text-foreground"
              placeholder="Paste your quiz text here..."
              value={quizText}
              onChange={(e) => setQuizText(e.target.value)}
            />
          </CardContent>
          <CardFooter className="flex gap-4">
            <Button onClick={() => handleQuizSubmit(quizText)}>Start Quiz</Button>
            <Button
              onClick={() => {
                handleQuizSubmit(quizText)
                setTimeout(() => handleShuffleQuiz(), 0)
              }}
            >
              Start Shuffled Quiz
            </Button>
          </CardFooter>
        </Card>

        <Card className="lg:w-[400px]">
          <CardHeader>
            <CardTitle className="flex justify-between items-center">
              Sample Quiz Format
              <Button variant="ghost" size="icon" onClick={handleCopySample}>
                <Copy className="h-4 w-4" />
                <span className="sr-only">Copy sample quiz</span>
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="whitespace-pre-wrap text-sm">{sampleQuiz}</pre>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (quizState.submitted) {
    return (
      <ResultsPage
        quizState={quizState}
        answerKey={answerKey}
        onStartNewQuiz={handleStartNewQuiz}
        onRedoQuiz={handleRedoQuiz}
        onShuffleQuiz={handleShuffleQuiz}
      />
    )
  }

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle>Quiz</CardTitle>
        <ThemeToggle />
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[600px] pr-4">
          {quizState.questions.map((question, index) => (
            <div key={question.id} className="mb-8">
              <p className="font-medium mb-4">
                <span className="block text-sm text-muted-foreground mb-1">
                  Question {index + 1} of {quizState.questions.length}
                </span>
                {question.text}
              </p>
              <RadioGroup
                value={quizState.userAnswers[question.id]}
                onValueChange={(value) => handleAnswerSelect(question.id, value)}
                className="space-y-2"
              >
                {question.options.map((option, optionIndex) => (
                  <div key={optionIndex} className="flex items-center space-x-2 p-4 rounded-lg border">
                    <RadioGroupItem
                      value={String.fromCharCode(97 + optionIndex)}
                      id={`q${question.id}-${optionIndex}`}
                    />
                    <Label htmlFor={`q${question.id}-${optionIndex}`}>{option}</Label>
                  </div>
                ))}
              </RadioGroup>
            </div>
          ))}
        </ScrollArea>
      </CardContent>
      <CardFooter>
        <Button onClick={handleSubmit}>Submit Quiz</Button>
      </CardFooter>
    </Card>
  )
}

function ResultsPage({
  quizState,
  answerKey,
  onStartNewQuiz,
  onRedoQuiz,
  onShuffleQuiz,
}: {
  quizState: QuizState
  answerKey: Record<number, string>
  onStartNewQuiz: () => void
  onRedoQuiz: () => void
  onShuffleQuiz: () => void
}) {
  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle>Quiz Results</CardTitle>
        <ThemeToggle />
      </CardHeader>
      <CardContent>
        <div className="mb-6">
          <p className="text-lg font-semibold">
            Score: {quizState.score} / {quizState.questions.length}
          </p>
          <p className="text-lg font-semibold">Percentage: {quizState.percentage}%</p>
        </div>
        <ScrollArea className="h-[400px] pr-4 mb-6">
          {quizState.questions.map((question, index) => (
            <div key={question.id} className="mb-8">
              <p className="font-medium mb-4">
                <span className="block text-sm text-muted-foreground mb-1">
                  Question {index + 1} of {quizState.questions.length}
                </span>
                {question.text}
              </p>
              {question.options.map((option, optionIndex) => {
                const optionLetter = String.fromCharCode(97 + optionIndex)
                const isCorrect = answerKey[question.id] === optionLetter
                const isUserAnswer = quizState.userAnswers[question.id] === optionLetter
                return (
                  <div
                    key={optionIndex}
                    className={`flex items-center space-x-2 p-4 rounded-lg border ${
                      isCorrect
                        ? "bg-green-50 dark:bg-green-900 border-green-200 dark:border-green-700"
                        : isUserAnswer
                          ? "bg-red-50 dark:bg-red-900 border-red-200 dark:border-red-700"
                          : ""
                    }`}
                  >
                    <div className="w-6 h-6 flex items-center justify-center rounded-full border">{optionLetter}</div>
                    <span>{option}</span>
                    {isCorrect && <span className="ml-auto text-green-600 dark:text-green-400">✓</span>}
                    {isUserAnswer && !isCorrect && <span className="ml-auto text-red-600 dark:text-red-400">✗</span>}
                  </div>
                )
              })}
            </div>
          ))}
        </ScrollArea>
        <div className="flex justify-between">
          <Button onClick={onStartNewQuiz}>Start New Quiz</Button>
          <Button onClick={onRedoQuiz}>Redo Quiz</Button>
          <Button onClick={onShuffleQuiz}>Shuffle Quiz</Button>
        </div>
      </CardContent>
    </Card>
  )
}

