import { useState, useEffect, useCallback, useMemo } from 'react'
import { X, Save, Trash2, Loader2, AlertTriangle, Video } from 'lucide-react'
import { apiUrl } from '../lib/api'

const TITLE_MIN = 3
const TITLE_MAX = 200
const CONTENT_MAX = 50000
const YOUTUBE_REGEX = /^(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/(?:watch\?v=|embed\/|v\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})(?:\S*)?$/

function youtubeUrlToVideoId(url) {
  if (!url || typeof url !== 'string') return null
  const m = url.trim().match(YOUTUBE_REGEX)
  return m ? m[1] : null
}

function videoIdToUrl(id) {
  return id ? `https://www.youtube.com/watch?v=${id}` : ''
}

export default function LessonEditorModal({ courseId, lessonId, onClose, onSaved, onDeleted }) {
  const isNew = lessonId === 'new' || lessonId == null
  const [lesson, setLesson] = useState(null)
  const [loading, setLoading] = useState(!isNew)
  const [loadError, setLoadError] = useState(null)
  const [formData, setFormData] = useState({
    title: '',
    youtube_url: '',
    content_text: '',
    order_index: '',
  })
  const [formErrors, setFormErrors] = useState({})
  const [serverError, setServerError] = useState('')
  const [saving, setSaving] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const token = typeof sessionStorage !== 'undefined' ? sessionStorage.getItem('accessToken') : null
  const headers = useMemo(
    () => (token ? { Authorization: `Bearer ${token}` } : {}),
    [token]
  )

  const fetchLesson = useCallback(async () => {
    if (isNew) return
    setLoading(true)
    setLoadError(null)
    try {
      const res = await fetch(apiUrl(`/api/v1/courses/${courseId}/lessons/${lessonId}`), { headers, credentials: 'include' })
      if (!res.ok) {
        if (res.status === 404) throw new Error('Lesson not found')
        if (res.status === 403) throw new Error('You do not have permission')
        throw new Error('Failed to load lesson')
      }
      const data = await res.json()
      const l = data.lesson || data
      setLesson(l)
      setFormData({
        title: l.title || '',
        youtube_url: l.embed_url ? `https://www.youtube.com/watch?v=${l.youtube_video_id}` : videoIdToUrl(l.youtube_video_id),
        content_text: l.content_text || '',
        order_index: String(l.order_index ?? ''),
      })
    } catch (err) {
      setLoadError(err.message)
    } finally {
      setLoading(false)
    }
  }, [courseId, lessonId, isNew, headers])

  useEffect(() => {
    fetchLesson()
  }, [fetchLesson])

  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') onClose?.()
    }
    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [onClose])

  function validateForm() {
    const next = {}
    const title = formData.title.trim()
    if (!title) {
      next.title = 'Title is required'
    } else if (title.length < TITLE_MIN) {
      next.title = `Title must be at least ${TITLE_MIN} characters`
    } else if (title.length > TITLE_MAX) {
      next.title = `Title must be at most ${TITLE_MAX} characters`
    }
    if (formData.youtube_url.trim() && !youtubeUrlToVideoId(formData.youtube_url)) {
      next.youtube_url = 'Invalid YouTube URL. Use youtube.com/watch?v=ID or youtu.be/ID'
    }
    if (formData.content_text.length > CONTENT_MAX) {
      next.content_text = `Content must be at most ${CONTENT_MAX} characters`
    }
    if (formData.order_index !== '') {
      const n = parseInt(formData.order_index, 10)
      if (isNaN(n) || n < 0) next.order_index = 'Order must be 0 or greater'
    }
    setFormErrors(next)
    return Object.keys(next).length === 0
  }

  async function handleSave(e) {
    e.preventDefault()
    setServerError('')
    if (!validateForm()) return
    setSaving(true)
    try {
      const body = {
        title: formData.title.trim(),
        youtube_url: formData.youtube_url.trim() || undefined,
        content_text: formData.content_text.trim() || undefined,
      }
      if (formData.order_index !== '') {
        const n = parseInt(formData.order_index, 10)
        if (!isNaN(n) && n >= 0) body.order_index = n
      }
      if (isNew) {
        const res = await fetch(apiUrl(`/api/v1/courses/${courseId}/lessons`), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', ...headers },
          body: JSON.stringify(body),
          credentials: 'include',
        })
        const data = await res.json()
        if (!res.ok) {
          setServerError(data.errors?.join('. ') || data.error || 'Failed to create lesson')
          return
        }
        onSaved?.(data.lesson)
        onClose?.()
      } else {
        const res = await fetch(apiUrl(`/api/v1/courses/${courseId}/lessons/${lessonId}`), {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json', ...headers },
          body: JSON.stringify(body),
          credentials: 'include',
        })
        const data = await res.json()
        if (!res.ok) {
          setServerError(data.errors?.join('. ') || data.error || 'Failed to update lesson')
          return
        }
        onSaved?.(data.lesson)
        onClose?.()
      }
    } catch {
      setServerError('Network error. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete() {
    if (isNew) return
    setDeleting(true)
    try {
      const res = await fetch(apiUrl(`/api/v1/courses/${courseId}/lessons/${lessonId}`), {
        method: 'DELETE',
        headers,
        credentials: 'include',
      })
      if (!res.ok) {
        const data = await res.json()
        setServerError(data.error || 'Failed to delete lesson')
        setDeleteConfirm(false)
        return
      }
      onDeleted?.()
      onClose?.()
    } catch {
      setServerError('Network error')
    } finally {
      setDeleting(false)
    }
  }

  const videoId = youtubeUrlToVideoId(formData.youtube_url) || lesson?.youtube_video_id
  const embedUrl = videoId ? `https://www.youtube.com/embed/${videoId}` : null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 md:p-6">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} aria-hidden="true" />
      <div
        className="relative w-full max-w-2xl max-h-[95vh] sm:max-h-[90vh] bg-cream border-2 border-black shadow-brutal-lg rounded-2xl flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="lesson-editor-title"
      >
        <div className="flex items-center justify-between shrink-0 p-4 sm:p-5 border-b-2 border-black bg-white">
          <h2 id="lesson-editor-title" className="font-heading font-bold text-lg sm:text-xl truncate pr-2">
            {isNew ? 'New lesson' : 'Edit lesson'}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="p-2 border-2 border-black rounded-xl hover:bg-gray-100 transition-colors shrink-0 focus:outline-none focus:shadow-brutal-sm"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 sm:p-5 md:p-6">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-16">
              <Loader2 className="w-10 h-10 animate-spin text-ocean mb-4" />
              <p className="font-heading font-bold text-gray-600">Loading lesson...</p>
            </div>
          ) : loadError ? (
            <div className="bg-coral/10 border-2 border-coral rounded-xl p-6 text-center">
              <AlertTriangle className="w-12 h-12 text-coral mx-auto mb-3" />
              <p className="font-heading font-bold text-lg mb-2">Cannot load lesson</p>
              <p className="text-gray-600 text-sm mb-4">{loadError}</p>
              <button
                type="button"
                onClick={() => fetchLesson()}
                className="font-heading font-bold px-5 py-2.5 bg-coral text-white border-2 border-black rounded-xl shadow-brutal-sm hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] transition-all duration-200"
              >
                Retry
              </button>
            </div>
          ) : (
            <form onSubmit={handleSave} className="space-y-4 sm:space-y-5">
              {serverError && (
                <div className="bg-coral/10 border-2 border-coral rounded-xl p-3 flex items-start gap-2">
                  <AlertTriangle className="w-5 h-5 shrink-0 text-coral mt-0.5" />
                  <span className="text-coral-dark text-sm">{serverError}</span>
                </div>
              )}

              <div>
                <label htmlFor="lesson-title" className="font-heading font-bold text-sm mb-1.5 block">
                  Title <span className="text-coral">*</span>
                </label>
                <input
                  id="lesson-title"
                  type="text"
                  value={formData.title}
                  onChange={(e) => {
                    setFormData((p) => ({ ...p, title: e.target.value }))
                    if (formErrors.title) setFormErrors((p) => ({ ...p, title: undefined }))
                  }}
                  placeholder="Lesson title"
                  maxLength={TITLE_MAX + 10}
                  className={`w-full px-4 py-2.5 border-2 rounded-xl font-body text-sm focus:outline-none focus:shadow-brutal-sm bg-white ${
                    formErrors.title ? 'border-coral' : 'border-black'
                  }`}
                />
                <div className="flex justify-between mt-1">
                  {formErrors.title ? (
                    <p className="text-coral text-xs font-medium">{formErrors.title}</p>
                  ) : (
                    <span />
                  )}
                  <span className="text-xs text-gray-400">{formData.title.trim().length}/{TITLE_MAX}</span>
                </div>
              </div>

              <div>
                <label htmlFor="lesson-youtube" className="font-heading font-bold text-sm mb-1.5 block">
                  YouTube URL
                </label>
                <input
                  id="lesson-youtube"
                  type="url"
                  value={formData.youtube_url}
                  onChange={(e) => {
                    setFormData((p) => ({ ...p, youtube_url: e.target.value }))
                    if (formErrors.youtube_url) setFormErrors((p) => ({ ...p, youtube_url: undefined }))
                  }}
                  placeholder="https://www.youtube.com/watch?v=..."
                  className={`w-full px-4 py-2.5 border-2 rounded-xl font-body text-sm focus:outline-none focus:shadow-brutal-sm bg-white ${
                    formErrors.youtube_url ? 'border-coral' : 'border-black'
                  }`}
                />
                {formErrors.youtube_url ? (
                  <p className="text-coral text-xs font-medium mt-1">{formErrors.youtube_url}</p>
                ) : (
                  <p className="text-gray-400 text-xs mt-1">youtube.com/watch?v=ID or youtu.be/ID</p>
                )}
              </div>

              {embedUrl && (
                <div className="rounded-xl overflow-hidden border-2 border-black shadow-brutal-sm bg-charcoal">
                  <div className="flex items-center gap-2 px-3 py-2 border-b-2 border-black bg-ocean/20">
                    <Video className="w-4 h-4" />
                    <span className="font-heading font-bold text-sm">Preview</span>
                  </div>
                  <div className="relative w-full" style={{ paddingBottom: '56.25%' }}>
                    <iframe
                      title="YouTube preview"
                      src={embedUrl}
                      className="absolute inset-0 w-full h-full"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    />
                  </div>
                </div>
              )}

              <div>
                <label htmlFor="lesson-content" className="font-heading font-bold text-sm mb-1.5 block">
                  Lesson content
                </label>
                <textarea
                  id="lesson-content"
                  value={formData.content_text}
                  onChange={(e) => {
                    setFormData((p) => ({ ...p, content_text: e.target.value }))
                    if (formErrors.content_text) setFormErrors((p) => ({ ...p, content_text: undefined }))
                  }}
                  placeholder="Lesson text or notes"
                  rows={8}
                  maxLength={CONTENT_MAX + 100}
                  className={`w-full px-4 py-2.5 border-2 rounded-xl font-body text-sm focus:outline-none focus:shadow-brutal-sm bg-white resize-y min-h-[140px] sm:min-h-[180px] ${
                    formErrors.content_text ? 'border-coral' : 'border-black'
                  }`}
                />
                <div className="flex justify-between mt-1">
                  {formErrors.content_text ? (
                    <p className="text-coral text-xs font-medium">{formErrors.content_text}</p>
                  ) : (
                    <span />
                  )}
                  <span className="text-xs text-gray-400">{formData.content_text.length}/{CONTENT_MAX}</span>
                </div>
              </div>

              <div>
                <label htmlFor="lesson-order" className="font-heading font-bold text-sm mb-1.5 block">
                  Order index
                </label>
                <input
                  id="lesson-order"
                  type="number"
                  min={0}
                  value={formData.order_index}
                  onChange={(e) => {
                    setFormData((p) => ({ ...p, order_index: e.target.value }))
                    if (formErrors.order_index) setFormErrors((p) => ({ ...p, order_index: undefined }))
                  }}
                  placeholder="Auto"
                  className={`w-24 px-4 py-2.5 border-2 rounded-xl font-body text-sm focus:outline-none focus:shadow-brutal-sm bg-white ${
                    formErrors.order_index ? 'border-coral' : 'border-black'
                  }`}
                />
                {formErrors.order_index && (
                  <p className="text-coral text-xs font-medium mt-1">{formErrors.order_index}</p>
                )}
              </div>

              <div className="flex flex-wrap gap-3 pt-2 border-t-2 border-black/10">
                <button
                  type="submit"
                  disabled={saving}
                  className="font-heading font-bold px-5 py-2.5 bg-coral text-white border-2 border-black rounded-xl shadow-brutal-sm hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] transition-all duration-200 flex items-center gap-2 disabled:opacity-60"
                >
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  {isNew ? 'Create lesson' : 'Save changes'}
                </button>
                {!isNew && (
                  <>
                    {!deleteConfirm ? (
                      <button
                        type="button"
                        onClick={() => setDeleteConfirm(true)}
                        className="font-heading font-bold px-5 py-2.5 bg-white text-coral border-2 border-coral rounded-xl hover:bg-coral/5 transition-colors flex items-center gap-2"
                      >
                        <Trash2 className="w-4 h-4" /> Delete
                      </button>
                    ) : (
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-medium text-gray-600">Delete this lesson?</span>
                        <button
                          type="button"
                          onClick={handleDelete}
                          disabled={deleting}
                          className="font-heading font-bold px-4 py-2 bg-coral text-white border-2 border-black rounded-lg shadow-brutal-sm hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] transition-all duration-200 flex items-center gap-2 disabled:opacity-60 text-sm"
                        >
                          {deleting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Yes, delete'}
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeleteConfirm(false)}
                          disabled={deleting}
                          className="font-heading font-bold px-4 py-2 border-2 border-black rounded-lg hover:bg-gray-100 disabled:opacity-50 text-sm"
                        >
                          Cancel
                        </button>
                      </div>
                    )}
                  </>
                )}
                <button
                  type="button"
                  onClick={onClose}
                  className="font-heading font-bold px-5 py-2.5 border-2 border-black rounded-xl hover:bg-gray-100 transition-colors ml-auto sm:ml-0"
                >
                  Cancel
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
