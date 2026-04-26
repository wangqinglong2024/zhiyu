import { useEffect, useState, type JSX } from 'react';
import { Button, Card, EmptyState, Grid, Spinner } from '@zhiyu/ui';
import { Link } from '@tanstack/react-router';
import { useT } from '@zhiyu/i18n/client';
import { learning, type CourseCard, type Enrollment } from '../lib/api.js';

function pickI18n(map: Record<string, string> | undefined, lang: string): string {
  if (!map) return '';
  return map[lang] ?? map['en'] ?? Object.values(map)[0] ?? '';
}

export function LearnPage(): JSX.Element {
  const { t, i18n } = useT('common');
  const lang = i18n.language ?? 'en';
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [courses, setCourses] = useState<CourseCard[]>([]);
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [busyId, setBusyId] = useState<string | null>(null);

  async function load(): Promise<void> {
    setLoading(true);
    setError(null);
    try {
      const [cs, es] = await Promise.all([
        learning.courses(),
        learning.myEnrollments().catch(() => ({ items: [] as Enrollment[] })),
      ]);
      setCourses(cs.items);
      setEnrollments(es.items);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  async function handleEnroll(course: CourseCard): Promise<void> {
    setBusyId(course.id);
    try {
      await learning.enroll(course.id);
      await load();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusyId(null);
    }
  }

  if (loading) {
    return (
      <div className="pt-2 flex items-center justify-center min-h-[40vh]" data-testid="learn-loading">
        <Spinner />
      </div>
    );
  }

  const enrolledCourseIds = new Set(enrollments.filter((e) => e.status === 'active').map((e) => e.course_id));

  return (
    <div className="pt-2" data-testid="learn-page">
      <header className="mb-6">
        <h1 className="text-h1">{t('nav.courses')}</h1>
        <p className="text-body text-text-secondary">日常 / 电商 / 工厂 / HSK 桥梁课程。点击「Enroll」开始学习。</p>
      </header>

      {error && (
        <div className="mb-4 rounded-md border border-red-300 bg-red-50 p-3 text-sm text-red-700" data-testid="learn-error">
          {error}
        </div>
      )}

      {enrollments.length > 0 && (
        <section className="mb-8" data-testid="my-enrollments">
          <h2 className="text-h2 mb-3">我的学习</h2>
          <Grid cols={2} gap={4}>
            {enrollments.map((en) => {
              const course = courses.find((c) => c.id === en.course_id);
              const title =
                pickI18n(course?.i18n_title, lang) ||
                pickI18n(en.course_title, lang) ||
                en.course_slug ||
                en.course_id;
              return (
                <Card key={en.id}>
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="text-h3">{title}</h3>
                    <span className="rounded-full bg-surface-2 px-2 py-0.5 text-micro text-text-secondary">
                      {en.status}
                    </span>
                  </div>
                  <div className="mt-2 h-2 w-full rounded-full bg-surface-2">
                    <div
                      className="h-2 rounded-full bg-primary transition-all"
                      style={{ width: `${Math.round(en.progress_percent)}%` }}
                    />
                  </div>
                  <p className="mt-1 text-micro text-text-tertiary">{Math.round(en.progress_percent)}%</p>
                  <div className="mt-3 flex gap-2">
                    {en.current_lesson_id && (
                      <Link
                        to="/lesson/$lessonId"
                        params={{ lessonId: en.current_lesson_id }}
                        className="inline-flex items-center rounded-md bg-primary px-3 py-1.5 text-sm text-white"
                        data-testid={`continue-${en.id}`}
                      >
                        继续学习
                      </Link>
                    )}
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={async () => {
                        if (!confirm('Reset progress for this course?')) return;
                        setBusyId(en.id);
                        try {
                          await learning.resetEnrollment(en.id);
                          await load();
                        } finally {
                          setBusyId(null);
                        }
                      }}
                      disabled={busyId === en.id}
                    >
                      重置
                    </Button>
                  </div>
                </Card>
              );
            })}
          </Grid>
        </section>
      )}

      <section data-testid="course-catalog">
        <h2 className="text-h2 mb-3">课程目录</h2>
        {courses.length === 0 ? (
          <EmptyState illustration="search" title={t('states.coming_soon')} description="尚未发布课程，请联系管理员添加。" />
        ) : (
          <Grid cols={2} gap={4}>
            {courses.map((c) => {
              const enrolled = enrolledCourseIds.has(c.id);
              return (
                <Card key={c.id}>
                  <h3 className="text-h3">{pickI18n(c.i18n_title, lang)}</h3>
                  <p className="mt-1 text-body text-text-secondary">{pickI18n(c.i18n_summary, lang)}</p>
                  <p className="mt-2 text-micro text-text-tertiary">
                    HSK {c.hsk_level} · {c.track}
                  </p>
                  <div className="mt-3">
                    <Button
                      size="sm"
                      onClick={() => void handleEnroll(c)}
                      disabled={enrolled || busyId === c.id}
                      data-testid={`enroll-${c.slug}`}
                    >
                      {enrolled ? '已加入' : busyId === c.id ? '处理中…' : 'Enroll'}
                    </Button>
                  </div>
                </Card>
              );
            })}
          </Grid>
        )}
      </section>
    </div>
  );
}
