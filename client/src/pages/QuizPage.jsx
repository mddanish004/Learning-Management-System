import { useState, useEffect, useMemo } from 'react'
import { useSearchParams, Link } from 'react-router-dom'
import {
  ArrowLeft,
  Brain,
  Loader2,
  AlertTriangle,
  CheckCircle,
} from 'lucide-react'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'

function QuizPage() {
  const [searchParams] = useSearchParams()
  const lessonId = searchParams.get('lessonId')
  const courseId = searchParams.get('courseId')

  const [loadingSaved, setLoadingSaved] = useState(true)
  const [quizResult, setQuizResult] = useState(null)
  const [apiError, setApiError] = useState('')
  const [showAnswers, setShowAnswers] = useState(false)
  const [selectedOptions, setSelectedOptions] = useState({})
  const [assessmentResult, setAssessmentResult] = useState(null)
  const [submittingAssessment, setSubmittingAssessment] = useState(false)

  const token = typeof sessionStorage !== 'undefined' ? sessionStorage.getItem('accessToken') : null
  const authHeaders = useMemo(
    () => (token ? { Authorization: `Bearer ${token}` } : {}),
    [token]
  )

  useEffect(() => {
    if (!courseId || !token) {
      setLoadingSaved(false)
      return
    }
    let cancelled = false
    async function loadSavedQuiz() {
      setLoadingSaved(true)
      try {
        const res = await fetch(`/api/v1/ai/quiz/${courseId}`, {
          headers: authHeaders,
          credentials: 'include',
        })
        const data = await res.json()
        if (!res.ok) {
          const msg = typeof data?.error === 'string' ? data.error : data?.error?.message
          if (!cancelled) setApiError(msg || 'Failed to load quiz')
          return
        }
        if (!cancelled && data.quiz && data.quiz.length > 0) {
          setQuizResult({ quiz: data.quiz, source: 'saved' })
        } else if (!cancelled) {
          setApiError('No quiz has been created for this course yet. Please check back later.')
        }
      } catch {
        if (!cancelled) setApiError('Network error while loading quiz')
      } finally {
        if (!cancelled) setLoadingSaved(false)
      }
    }
    loadSavedQuiz()
    return () => { cancelled = true }
  }, [courseId, token, authHeaders])

  function handleSelectOption(qIndex, optionIndex) {
    setSelectedOptions((prev) => ({
      ...prev,
      [qIndex]: optionIndex,
    }))
  }

  async function handleSubmitAssessment() {
    if (!hasQuiz || !lessonId || !courseId || !token) return
    const questions = quizResult.quiz || []
    const total = questions.length
    if (total === 0) return

    let correct = 0
    questions.forEach((item, index) => {
      const answerLetter = item.answer || ''
      const answerIndex =
        typeof answerLetter === 'string'
          ? Math.max(0, Math.min(3, answerLetter.toUpperCase().charCodeAt(0) - 65))
          : 0
      const selected = selectedOptions[index]
      if (selected === answerIndex) {
        correct += 1
      }
    })

    const scorePct = Math.round((correct / total) * 100)
    const passed = scorePct >= 80

    setAssessmentResult({
      correct,
      total,
      scorePct,
      passed,
    })

    if (!passed) return

    setSubmittingAssessment(true)
    try {
      await fetch(`/api/v1/lessons/${lessonId}/complete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeaders },
        body: JSON.stringify({}),
        credentials: 'include',
      })
    } finally {
      setSubmittingAssessment(false)
    }
  }

  const hasQuiz = quizResult && Array.isArray(quizResult.quiz) && quizResult.quiz.length > 0

  return (
    <div className="min-h-screen bg-cream flex flex-col">
      <Navbar />

      <div className="bg-white border-b-2 border-black py-3 px-4">
        <div className="max-w-3xl mx-auto flex items-center gap-2 min-w-0">
          <Link
            to={courseId ? `/learn/courses/${courseId}` : '/courses'}
            className="p-2 border-2 border-black rounded-xl hover:bg-gray-100 transition-colors shrink-0"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div className="min-w-0">
            <h1 className="font-heading font-bold text-lg sm:text-xl truncate">Final assessment quiz</h1>
            <p className="text-gray-500 text-xs sm:text-sm truncate">Answer the quiz questions to complete this course.</p>
          </div>
        </div>
      </div>

      <section className="flex-1 py-8 px-4">
        <div className="max-w-3xl mx-auto">
          {loadingSaved && (
            <div className="bg-white border-2 border-black shadow-brutal rounded-2xl p-10 flex items-center justify-center">
              <div className="text-center">
                <Loader2 className="w-10 h-10 animate-spin text-ocean mx-auto mb-3" />
                <p className="font-heading font-bold text-gray-600 text-sm">Loading quiz...</p>
              </div>
            </div>
          )}

          {!loadingSaved && apiError && (
            <div className="bg-white border-2 border-black shadow-brutal rounded-2xl p-10 text-center">
              <AlertTriangle className="w-12 h-12 text-coral mx-auto mb-4" />
              <h2 className="font-heading font-bold text-xl mb-2">Quiz not available</h2>
              <p className="text-gray-600 text-sm">{apiError}</p>
              <Link
                to={courseId ? `/learn/courses/${courseId}` : '/courses'}
                className="mt-6 font-heading font-bold px-6 py-3 bg-charcoal text-white border-2 border-black rounded-xl shadow-brutal-sm hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] transition-all duration-200 inline-flex items-center gap-2"
              >
                <ArrowLeft className="w-4 h-4" /> Back to course
              </Link>
            </div>
          )}

          {!loadingSaved && hasQuiz && (
            <div className="bg-white border-2 border-black shadow-brutal rounded-2xl p-5 sm:p-6 flex flex-col gap-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h2 className="font-heading font-bold text-lg sm:text-xl">Assessment</h2>
                  <p className="text-xs sm:text-sm text-gray-600">
                    Select the correct answer for each question and submit.
                  </p>
                </div>
                <span className="inline-flex items-center gap-1.5 px-3 py-1 border-2 border-black rounded-full bg-lavender text-xs font-heading font-bold">
                  <Brain className="w-3.5 h-3.5" />
                  {quizResult.quiz.length} questions
                </span>
              </div>

              <div className="space-y-4">
                {quizResult.quiz.map((item, index) => {
                  const selected = selectedOptions[index]
                  const answerLetter = item.answer || ''
                  const answerIndex =
                    typeof answerLetter === 'string'
                      ? Math.max(0, Math.min(3, answerLetter.toUpperCase().charCodeAt(0) - 65))
                      : 0
                  return (
                    <div
                      key={`${item.question}-${index}`}
                      className="border-2 border-black rounded-xl p-4 bg-cream"
                    >
                      <div className="flex items-start gap-3 mb-3">
                        <div className="w-7 h-7 rounded-full bg-white border-2 border-black flex items-center justify-center font-heading font-bold text-xs shrink-0">
                          {index + 1}
                        </div>
                        <p className="font-heading font-bold text-sm sm:text-base">{item.question}</p>
                      </div>
                      <div className="space-y-2">
                        {item.options?.map((option, optIndex) => {
                          const isSelected = selected === optIndex
                          const isCorrect = showAnswers && optIndex === answerIndex
                          const base = 'w-full text-left px-3 py-2 border-2 border-black rounded-xl text-xs sm:text-sm transition-all duration-200'
                          let bg = 'bg-white hover:bg-gray-50'
                          if (isSelected && !showAnswers) bg = 'bg-ocean/20'
                          if (isCorrect) bg = 'bg-mint'
                          return (
                            <button
                              key={option}
                              type="button"
                              onClick={() => handleSelectOption(index, optIndex)}
                              className={`${base} ${bg} flex items-center gap-2`}
                            >
                              <span className="font-heading font-bold text-xs shrink-0">
                                {String.fromCharCode(65 + optIndex)}.
                              </span>
                              <span className="flex-1 text-left">{option}</span>
                              {showAnswers && isCorrect && (
                                <CheckCircle className="w-3.5 h-3.5 text-charcoal shrink-0" />
                              )}
                            </button>
                          )
                        })}
                      </div>
                    </div>
                  )
                })}
              </div>

              <div className="pt-2 flex flex-col sm:flex-row flex-wrap gap-3 sm:items-center sm:justify-between">
                <div className="flex flex-wrap gap-3">
                  <button
                    type="button"
                    onClick={handleSubmitAssessment}
                    disabled={submittingAssessment}
                    className="font-heading font-bold px-5 py-2 border-2 border-black rounded-xl bg-mint hover:bg-mint/80 transition-colors text-xs sm:text-sm inline-flex items-center gap-2 disabled:opacity-70"
                  >
                    {submittingAssessment ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>Saving result...</span>
                      </>
                    ) : (
                      <>
                        <CheckCircle className="w-3.5 h-3.5" />
                        <span>Submit assessment</span>
                      </>
                    )}
                  </button>
                  {assessmentResult && (
                    <button
                      type="button"
                      onClick={() => setShowAnswers((v) => !v)}
                      className="font-heading font-bold px-5 py-2 border-2 border-black rounded-xl bg-white hover:bg-gray-100 transition-colors text-xs sm:text-sm inline-flex items-center gap-2"
                    >
                      {showAnswers ? 'Hide answers' : 'Reveal answers'}
                    </button>
                  )}
                </div>
                {assessmentResult && (
                  <div className="text-xs sm:text-sm text-gray-700">
                    <span className="font-heading font-bold">
                      Score: {assessmentResult.scorePct}% ({assessmentResult.correct} of{' '}
                      {assessmentResult.total})
                    </span>
                    <span className="ml-2">
                      {assessmentResult.passed
                        ? 'You passed the assessment. Your course progress will reflect this.'
                        : 'You need at least 80% to pass. Try again.'}
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </section>

      <Footer />
    </div>
  )
}

export default QuizPage
