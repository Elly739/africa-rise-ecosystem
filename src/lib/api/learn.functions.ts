import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

// ---------- Public reads ----------

export const listSubjects = createServerFn({ method: "GET" }).handler(async () => {
  const { data, error } = await supabaseAdmin.from("subjects").select("*").order("title");
  if (error) throw error;
  return data ?? [];
});

export const listCourses = createServerFn({ method: "GET" }).handler(async () => {
  const { data, error } = await supabaseAdmin
    .from("courses")
    .select("id,title,slug,summary,level,cover_url,subject_id")
    .order("created_at");
  if (error) throw error;
  return data ?? [];
});

export const getCourse = createServerFn({ method: "GET" })
  .inputValidator(z.object({ courseId: z.string().uuid() }))
  .handler(async ({ data }) => {
    const [course, lessons, quiz] = await Promise.all([
      supabaseAdmin.from("courses").select("*").eq("id", data.courseId).single(),
      supabaseAdmin.from("lessons").select("id,order,title,duration_min").eq("course_id", data.courseId).order("order"),
      supabaseAdmin.from("quizzes").select("id,title,passing_score").eq("course_id", data.courseId).maybeSingle(),
    ]);
    if (course.error) throw course.error;
    return {
      course: course.data,
      lessons: lessons.data ?? [],
      quiz: quiz.data,
    };
  });

export const getLesson = createServerFn({ method: "GET" })
  .inputValidator(z.object({ lessonId: z.string().uuid() }))
  .handler(async ({ data }) => {
    const { data: lesson, error } = await supabaseAdmin
      .from("lessons")
      .select("*")
      .eq("id", data.lessonId)
      .single();
    if (error) throw error;
    const { data: siblings } = await supabaseAdmin
      .from("lessons")
      .select("id,order,title")
      .eq("course_id", lesson.course_id)
      .order("order");
    return { lesson, siblings: siblings ?? [] };
  });

export const getQuiz = createServerFn({ method: "GET" })
  .inputValidator(z.object({ quizId: z.string().uuid() }))
  .handler(async ({ data }) => {
    const [quiz, questions] = await Promise.all([
      supabaseAdmin.from("quizzes").select("*").eq("id", data.quizId).single(),
      supabaseAdmin
        .from("quiz_questions")
        .select("id,order,question,options")
        .eq("quiz_id", data.quizId)
        .order("order"),
    ]);
    if (quiz.error) throw quiz.error;
    return { quiz: quiz.data, questions: questions.data ?? [] };
  });

// ---------- Authenticated reads/writes ----------

export const getDashboard = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const [profile, enrollments, certificates, progress] = await Promise.all([
      supabase.from("profiles").select("*").eq("id", userId).maybeSingle(),
      supabase
        .from("enrollments")
        .select("course_id, enrolled_at, courses(id,title,slug,summary,level)")
        .order("enrolled_at", { ascending: false }),
      supabase
        .from("certificates")
        .select("id,code,issued_at,course_id,courses(title,slug)")
        .order("issued_at", { ascending: false }),
      supabase.from("lesson_progress").select("lesson_id"),
    ]);

    // Compute per-course progress
    const completedLessonIds = new Set((progress.data ?? []).map((p) => p.lesson_id));
    const courseIds = (enrollments.data ?? []).map((e) => e.course_id);
    let lessonsByCourse: Record<string, number> = {};
    let completedByCourse: Record<string, number> = {};
    if (courseIds.length) {
      const { data: lessonRows } = await supabaseAdmin
        .from("lessons")
        .select("id,course_id")
        .in("course_id", courseIds);
      for (const l of lessonRows ?? []) {
        lessonsByCourse[l.course_id] = (lessonsByCourse[l.course_id] ?? 0) + 1;
        if (completedLessonIds.has(l.id))
          completedByCourse[l.course_id] = (completedByCourse[l.course_id] ?? 0) + 1;
      }
    }

    return {
      profile: profile.data,
      enrollments: enrollments.data ?? [],
      certificates: certificates.data ?? [],
      lessonsByCourse,
      completedByCourse,
    };
  });

export const getMyCourseState = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator(z.object({ courseId: z.string().uuid() }))
  .handler(async ({ context, data }) => {
    const { supabase, userId } = context;
    const [enrollment, lessons, certificate] = await Promise.all([
      supabase.from("enrollments").select("id").eq("course_id", data.courseId).maybeSingle(),
      supabaseAdmin.from("lessons").select("id").eq("course_id", data.courseId),
      supabase.from("certificates").select("code").eq("course_id", data.courseId).maybeSingle(),
    ]);
    const lessonIds = (lessons.data ?? []).map((l) => l.id);
    let completed: string[] = [];
    if (lessonIds.length) {
      const { data: p } = await supabase
        .from("lesson_progress")
        .select("lesson_id")
        .in("lesson_id", lessonIds);
      completed = (p ?? []).map((r) => r.lesson_id);
    }
    return {
      enrolled: !!enrollment.data,
      completedLessonIds: completed,
      totalLessons: lessonIds.length,
      certificateCode: certificate.data?.code ?? null,
      userId,
    };
  });

export const enrollInCourse = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(z.object({ courseId: z.string().uuid() }))
  .handler(async ({ context, data }) => {
    const { supabase, userId } = context;
    const { error } = await supabase
      .from("enrollments")
      .upsert({ user_id: userId, course_id: data.courseId }, { onConflict: "user_id,course_id" });
    if (error) throw error;
    return { ok: true };
  });

export const completeLesson = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(z.object({ lessonId: z.string().uuid() }))
  .handler(async ({ context, data }) => {
    const { supabase, userId } = context;
    const { error } = await supabase
      .from("lesson_progress")
      .upsert(
        { user_id: userId, lesson_id: data.lessonId },
        { onConflict: "user_id,lesson_id" }
      );
    if (error) throw error;
    return { ok: true };
  });

export const submitQuiz = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    z.object({
      quizId: z.string().uuid(),
      answers: z.array(z.object({ questionId: z.string().uuid(), choice: z.number().int() })),
    })
  )
  .handler(async ({ context, data }) => {
    const { supabase, userId } = context;
    const { data: quiz } = await supabaseAdmin
      .from("quizzes")
      .select("id, course_id, passing_score")
      .eq("id", data.quizId)
      .single();
    if (!quiz) throw new Error("Quiz not found");
    const { data: qs } = await supabaseAdmin
      .from("quiz_questions")
      .select("id, correct_index, explanation, question, options")
      .eq("quiz_id", data.quizId);

    const qMap = new Map((qs ?? []).map((q) => [q.id, q]));
    const total = qMap.size || 1;
    let correct = 0;
    const breakdown = data.answers.map((a) => {
      const q = qMap.get(a.questionId);
      const isCorrect = q ? q.correct_index === a.choice : false;
      if (isCorrect) correct++;
      return {
        questionId: a.questionId,
        userChoice: a.choice,
        correctIndex: q?.correct_index ?? -1,
        explanation: q?.explanation ?? null,
        isCorrect,
      };
    });
    const score = Math.round((correct / total) * 100);
    const passed = score >= quiz.passing_score;

    await supabase.from("quiz_attempts").insert({
      user_id: userId,
      quiz_id: data.quizId,
      score,
      passed,
    });

    let certificateCode: string | null = null;
    if (passed) {
      const code = `SBA-${Math.random().toString(36).slice(2, 8).toUpperCase()}-${Date.now().toString(36).toUpperCase()}`;
      const { data: cert, error } = await supabase
        .from("certificates")
        .upsert(
          { user_id: userId, course_id: quiz.course_id, code },
          { onConflict: "user_id,course_id", ignoreDuplicates: false }
        )
        .select("code")
        .single();
      if (!error && cert) certificateCode = cert.code;
    }

    return { score, passed, total, correct, certificateCode, breakdown };
  });
