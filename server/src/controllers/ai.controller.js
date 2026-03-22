import { db } from "../db/db.js";
import { ai_quiz_cache, lessons, courses, resources, quizzes, quiz_questions } from "../db/schema.js";
import { eq, and, isNull } from "drizzle-orm";
import { v4 as uuid } from "uuid";
import { createHash } from "crypto";

const DEFAULT_NUM_QUESTIONS = 5;
const MIN_NUM_QUESTIONS = 1;
const MAX_NUM_QUESTIONS = 20;
const DEFAULT_TIMEOUT_MS = 30000;

function buildCacheKey(lessonText, numQuestions) {
  return createHash("sha256")
    .update(`${numQuestions}:${lessonText.trim()}`)
    .digest("hex");
}

function buildPrompt(lessonText, numQuestions) {
  return `You are a helpful quiz generator. Create ${numQuestions} multiple-choice questions based ONLY on the lesson text.

Return STRICT JSON (no markdown, no extra text) in this exact format:
[
  {
    "question": "...",
    "options": ["A) ...", "B) ...", "C) ...", "D) ..."],
    "answer": "A" | "B" | "C" | "D"
  }
]

Rules:
- Exactly ${numQuestions} items.
- 4 options per question.
- Each answer must match the correct option letter.
- Keep questions clear and concise.

Lesson text:
"""
${lessonText}
"""`;
}

function extractJson(text) {
  if (!text || typeof text !== "string") return null;
  const start = text.indexOf("[");
  const end = text.lastIndexOf("]");
  if (start !== -1 && end !== -1 && end > start) {
    const jsonSlice = text.slice(start, end + 1);
    try {
      return JSON.parse(jsonSlice);
    } catch {
      return null;
    }
  }
  const objStart = text.indexOf("{");
  const objEnd = text.lastIndexOf("}");
  if (objStart !== -1 && objEnd !== -1 && objEnd > objStart) {
    try {
      return JSON.parse(text.slice(objStart, objEnd + 1));
    } catch {
      return null;
    }
  }
  return null;
}

function normalizeOptions(options) {
  if (Array.isArray(options)) {
    return options.map((option) => String(option));
  }
  if (options && typeof options === "object") {
    return ["A", "B", "C", "D"].map((key) => String(options[key] ?? ""));
  }
  return [];
}

function normalizeQuiz(quiz, numQuestions) {
  if (!Array.isArray(quiz)) return null;
  const normalized = quiz
    .map((item) => {
      if (!item || typeof item !== "object") return null;
      const question = typeof item.question === "string" ? item.question.trim() : "";
      const options = normalizeOptions(item.options).filter((opt) => opt.trim() !== "");
      const answer = typeof item.answer === "string" ? item.answer.trim().toUpperCase() : "";
      if (!question || options.length !== 4 || !["A", "B", "C", "D"].includes(answer)) {
        return null;
      }
      return { question, options, answer };
    })
    .filter(Boolean);

  if (normalized.length === 0) return null;

  if (normalized.length > numQuestions) {
    return normalized.slice(0, numQuestions);
  }

  return normalized;
}

function coerceQuiz(parsed, numQuestions) {
  if (!Array.isArray(parsed)) return null;

  const ensureOptions = (rawOptions, questionIndex) => {
    let options = normalizeOptions(rawOptions);

    while (options.length < 4) {
      const label = String.fromCharCode(65 + options.length);
      options.push(`${label}) Additional plausible answer for question ${questionIndex + 1}.`);
    }

    if (options.length > 4) {
      options = options.slice(0, 4);
    }

    return options;
  };

  const toAnswerLetter = (rawAnswer) => {
    if (typeof rawAnswer === "string") {
      const trimmed = rawAnswer.trim().toUpperCase();
      if (["A", "B", "C", "D"].includes(trimmed[0])) {
        return trimmed[0];
      }
    }

    if (typeof rawAnswer === "number" && Number.isFinite(rawAnswer)) {
      const idx = rawAnswer <= 3 ? rawAnswer : rawAnswer - 1;
      if (idx >= 0 && idx <= 3) {
        return String.fromCharCode(65 + idx);
      }
    }

    return "A";
  };

  const coerced = parsed
    .map((item, index) => {
      if (!item || typeof item !== "object") return null;

      const question =
        typeof item.question === "string"
          ? item.question.trim()
          : typeof item.q === "string"
          ? item.q.trim()
          : "";

      if (!question) return null;

      const options = ensureOptions(item.options ?? item.choices, index);
      const answer = toAnswerLetter(item.answer ?? item.correct ?? item.correct_option);

      return { question, options, answer };
    })
    .filter(Boolean);

  if (coerced.length === 0) return null;

  return coerced.slice(0, numQuestions);
}

function buildStaticFallback(lessonText, numQuestions) {
  const snippet = lessonText.slice(0, 200).replace(/\s+/g, " ").trim();
  const questions = [];
  for (let i = 0; i < numQuestions; i += 1) {
    questions.push({
      question: `Which statement best reflects the lesson content? (${i + 1})`,
      options: [
        `A) ${snippet || "It introduces a core concept."}`,
        "B) It discusses an unrelated topic.",
        "C) It focuses on fictional characters only.",
        "D) It contains no educational value.",
      ],
      answer: "A",
    });
  }
  return questions;
}

async function callHuggingFace({ prompt, timeoutMs }) {
  const token = process.env.HF_API_TOKEN;
  const model = process.env.HF_GPT_OSS_MODEL || "openai/gpt-oss-120b";
  if (!token) {
    const error = new Error("Missing Hugging Face API token");
    error.code = "MISSING_TOKEN";
    throw error;
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch("https://router.huggingface.co/v1/responses", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        input: prompt,
        max_output_tokens: 800,
        temperature: 0.2,
      }),
      signal: controller.signal,
    });

    if (!response.ok) {
      const errorText = await response.text();
      const error = new Error(`Hugging Face API error: ${response.status}`);
      error.details = errorText;
      throw error;
    }

    const payload = await response.json();

    if (typeof payload?.output_text === "string" && payload.output_text.trim().length > 0) {
      return payload.output_text;
    }

    if (Array.isArray(payload?.output) && payload.output.length > 0) {
      const first = payload.output[0];
      if (typeof first?.content === "string" && first.content.trim().length > 0) {
        return first.content;
      }
      if (Array.isArray(first?.content)) {
        const textPart = first.content.find(
          (part) =>
            (part.type === "output_text" || part.type === "text" || !part.type) &&
            typeof part.text === "string"
        );
        if (textPart?.text?.trim().length > 0) {
          return textPart.text;
        }
      }
    }

    throw new Error("Unexpected Hugging Face response format");
  } finally {
    clearTimeout(timeoutId);
  }
}

async function fetchYouTubeDescription(videoId) {
  if (!videoId) return null;

  const controller = new AbortController();
  const timeoutMs = Number(process.env.YT_DESCRIPTION_TIMEOUT_MS) || DEFAULT_TIMEOUT_MS;
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(`https://www.youtube.com/watch?v=${videoId}`, {
      method: "GET",
      signal: controller.signal,
    });

    if (!response.ok) {
      return null;
    }

    const html = await response.text();
    const match =
      html.match(
        /<meta[^>]+(?:name|property)=["'](?:description|og:description)["'][^>]*content=["']([^"']*)["'][^>]*>/i
      ) || html.match(/<meta[^>]+content=["']([^"']*)["'][^>]*(?:name|property)=["']description["'][^>]*>/i);

    if (!match || !match[1]) {
      return null;
    }

    const text = match[1].trim();
    return text.length > 0 ? text : null;
  } catch {
    return null;
  } finally {
    clearTimeout(timeoutId);
  }
}

async function getLessonTextFromLesson(lessonId) {
  const lesson = await db.query.lessons.findFirst({
    where: eq(lessons.id, lessonId),
  });

  if (!lesson) {
    return null;
  }

  let combinedText = "";

  if (lesson.youtube_video_id) {
    const description = await fetchYouTubeDescription(lesson.youtube_video_id);
    if (description) {
      combinedText = description;
    }
  }

  if (!combinedText && typeof lesson.content_text === "string" && lesson.content_text.trim().length > 0) {
    combinedText = lesson.content_text;
  }

  const trimmed = combinedText.trim();
  return trimmed.length > 0 ? trimmed : null;
}

export async function generateQuiz(req, res) {
  const { lesson_text: lessonTextRaw, lesson_id: lessonId, course_id: courseId, num_questions: numQuestionsRaw } = req.body;

  let lessonText = lessonTextRaw;

  if (courseId) {
    const course = await db.query.courses.findFirst({
      where: and(eq(courses.id, courseId), isNull(courses.deleted_at)),
    });

    if (course) {
      const resourceRows = await db.query.resources.findMany({
        where: eq(resources.course_id, courseId),
        orderBy: (r, { asc: ascOrder }) => [ascOrder(r.created_at)],
      });

      const parts = [];

      if (course.title) {
        parts.push(`Course title: ${course.title}`);
      }

      if (typeof course.description === "string" && course.description.trim().length > 0) {
        parts.push(`Course description: ${course.description.trim()}`);
      }

      if (resourceRows.length > 0) {
        parts.push("Course resources:");
        resourceRows.forEach((resource, index) => {
          parts.push(`${index + 1}. ${resource.file_name}`);
        });
      }

      const combined = parts.join("\n").trim();
      if (combined.length > 0) {
        lessonText = combined;
      }
    }
  }

  if (lessonId) {
    const derivedText = await getLessonTextFromLesson(lessonId);
    if (derivedText) {
      lessonText = derivedText;
    }
  }

  if (!lessonText || typeof lessonText !== "string" || lessonText.trim().length === 0) {
    lessonText =
      "This lesson introduces an important concept and explains the key ideas in a structured way.";
  }

  const parsedNum = Number.isFinite(Number(numQuestionsRaw)) ? Number(numQuestionsRaw) : DEFAULT_NUM_QUESTIONS;
  const numQuestions = Math.max(
    MIN_NUM_QUESTIONS,
    Math.min(MAX_NUM_QUESTIONS, Math.round(parsedNum))
  );

  const cacheKey = buildCacheKey(lessonText, numQuestions);

  const cached = await db.query.ai_quiz_cache.findFirst({
    where: eq(ai_quiz_cache.cache_key, cacheKey),
  });

  if (cached) {
    return res.json({
      source: "cache",
      quiz: JSON.parse(cached.quiz_json),
    });
  }

  const prompt = buildPrompt(lessonText, numQuestions);
  const timeoutMs = Number(process.env.HF_TIMEOUT_MS) || DEFAULT_TIMEOUT_MS;

  try {
    const generatedText = await callHuggingFace({ prompt, timeoutMs });
    const parsed = extractJson(generatedText);
    const normalized =
      normalizeQuiz(parsed, numQuestions) ??
      coerceQuiz(parsed, numQuestions);

    if (!normalized) {
      throw new Error("Failed to parse AI response");
    }

    await db.insert(ai_quiz_cache).values({
      id: uuid(),
      cache_key: cacheKey,
      lesson_text: lessonText.trim(),
      num_questions: numQuestions,
      quiz_json: JSON.stringify(normalized),
    });

    return res.json({
      source: "huggingface",
      quiz: normalized,
    });
  } catch (error) {
    console.error("[generateQuiz] Hugging Face error:", {
      message: error?.message,
      code: error?.code,
      details: error?.details,
      name: error?.name,
    });

    const cachedFallback = await db.query.ai_quiz_cache.findFirst({
      where: eq(ai_quiz_cache.cache_key, cacheKey),
    });

    if (cachedFallback) {
      return res.json({
        source: "cache",
        quiz: JSON.parse(cachedFallback.quiz_json),
        warning: "AI service unavailable. Returned cached quiz.",
        error: error?.message ?? "Unknown AI error",
      });
    }

    const fallbackQuiz = buildStaticFallback(lessonText, numQuestions);
    return res.status(200).json({
      source: "fallback",
      quiz: fallbackQuiz,
      warning: "AI service unavailable. Returned static fallback quiz.",
      error: error?.message ?? "Unknown AI error",
    });
  }
}

export async function saveQuiz(req, res) {
  const { course_id: courseId, quiz } = req.body;

  const course = await db.query.courses.findFirst({
    where: and(eq(courses.id, courseId), isNull(courses.deleted_at)),
  });

  if (!course) {
    return res.status(404).json({ error: "Course not found" });
  }

  if (req.user.role !== "admin" && course.instructor_id !== req.user.sub) {
    return res.status(403).json({ error: "You can only save quizzes for your own courses" });
  }

  const existing = await db.query.quizzes.findFirst({
    where: eq(quizzes.course_id, courseId),
  });

  if (existing) {
    await db.delete(quiz_questions).where(eq(quiz_questions.quiz_id, existing.id));
    await db.delete(quizzes).where(eq(quizzes.id, existing.id));
  }

  const quizId = uuid();
  await db.insert(quizzes).values({
    id: quizId,
    course_id: courseId,
    generated_by: "llm",
  });

  const questionRows = quiz.map((item) => ({
    id: uuid(),
    quiz_id: quizId,
    question: item.question,
    options: JSON.stringify(item.options),
    answer: item.answer,
  }));

  await db.insert(quiz_questions).values(questionRows);

  return res.json({ saved: true, quiz_id: quizId, question_count: quiz.length });
}

export async function getSavedQuiz(req, res) {
  const { courseId } = req.params;

  const savedQuiz = await db.query.quizzes.findFirst({
    where: eq(quizzes.course_id, courseId),
    with: { questions: true },
  });

  if (!savedQuiz || !savedQuiz.questions || savedQuiz.questions.length === 0) {
    return res.json({ quiz: null });
  }

  const formatted = savedQuiz.questions.map((q) => ({
    question: q.question,
    options: typeof q.options === "string" ? JSON.parse(q.options) : q.options,
    answer: q.answer,
  }));

  return res.json({ quiz: formatted, quiz_id: savedQuiz.id });
}
