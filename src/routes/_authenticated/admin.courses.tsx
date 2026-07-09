import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { listCoursesAdmin } from "@/lib/api/admin.functions";
import { Route as AdminRoute } from "./admin";

export const Route = createFileRoute("/_authenticated/admin/courses")({
  head: () => ({ meta: [{ title: "Courses · Admin · SkillBridge Africa" }] }),
  component: AdminCourses,
});

function AdminCourses() {
  const { roles } = AdminRoute.useRouteContext();
  const isTeacher = roles.includes("admin") || roles.includes("teacher");

  const listFn = useServerFn(listCoursesAdmin);
  const { data, isLoading } = useQuery({ queryKey: ["admin-courses"], queryFn: () => listFn() });

  return (
    <div className="space-y-4">
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold">Courses</h1>
          <p className="text-sm text-brand-navy/60">Manage courses, lessons, and quizzes.</p>
        </div>
        {isTeacher && (
          <Link to="/courses" className="px-4 py-2 rounded-full bg-brand-navy text-white text-sm font-semibold hover:bg-brand-navy/90">
            Browse catalogue
          </Link>
        )}
      </header>

      {isLoading ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-40 rounded-2xl bg-brand-navy/5 animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {data?.courses.map((course: any) => (
            <div key={course.id} className="p-4 rounded-2xl bg-white border border-brand-navy/5 hover:shadow-md transition-shadow">
              <div className="flex items-start gap-3">
                {course.cover_url ? (
                  <img src={course.cover_url} alt="" className="size-12 rounded-xl object-cover" />
                ) : (
                  <div className="size-12 rounded-xl bg-brand-clay flex items-center justify-center text-lg font-bold">{course.title?.[0] ?? "?"}</div>
                )}
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-brand-orange">{course.subjects?.title ?? "General"}</p>
                  <p className="font-display font-bold mt-0.5">{course.title}</p>
                  <p className="text-xs text-brand-navy/60 mt-1">{course.level} · {course.lessons?.[0]?.count ?? 0} lessons · {course.quizzes?.[0]?.count ?? 0} quizzes</p>
                </div>
              </div>
              <p className="text-sm text-brand-navy/60 mt-3 line-clamp-2">{course.summary ?? "No summary provided."}</p>
              <div className="mt-4 flex gap-2">
                <Link
                  to="/courses/$courseId"
                  params={{ courseId: course.id }}
                  className="px-3 py-1.5 rounded-lg bg-brand-navy/5 text-brand-navy text-xs font-semibold hover:bg-brand-navy/10"
                >
                  View
                </Link>
              </div>
            </div>
          ))}
          {data?.courses.length === 0 && <p className="text-brand-navy/50 text-sm col-span-full">No courses yet.</p>}
        </div>
      )}
    </div>
  );
}
