import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "غیر مجاز" }, { status: 401 });

  const user = session.user as { id: string; role: string };

  if (user.role !== "teacher") return NextResponse.json({ error: "رسائی منع" }, { status: 403 });

  const [classes, assignments, submissions] = await Promise.all([
    prisma.class.findMany({
      where: { teacherId: user.id },
      include: { enrollments: true },
    }),
    prisma.assignment.findMany({
      where: { class: { teacherId: user.id } },
      include: { submissions: true },
    }),
    prisma.submission.findMany({
      where: { assignment: { class: { teacherId: user.id } } },
      include: { student: { select: { name: true } }, assignment: { select: { title: true, maxPoints: true } } },
    }),
  ]);

  const totalStudents = new Set(
    classes.flatMap((c) => c.enrollments.map((e) => e.studentId))
  ).size;

  const gradedSubmissions = submissions.filter((s) => s.grade !== null);
  const avgGrade =
    gradedSubmissions.length > 0
      ? gradedSubmissions.reduce((sum, s) => sum + (s.grade || 0), 0) / gradedSubmissions.length
      : 0;

  const submissionRate =
    assignments.length > 0
      ? (submissions.length / (assignments.length * Math.max(totalStudents, 1))) * 100
      : 0;

  const recentActivity = submissions
    .sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime())
    .slice(0, 10)
    .map((s) => ({
      student: s.student.name,
      assignment: s.assignment.title,
      assignmentId: s.assignmentId,
      grade: s.grade,
      status: s.status,
      date: s.submittedAt,
    }));

  const classStats = classes.map((c) => ({
    id: c.id,
    name: c.name,
    students: c.enrollments.length,
    assignments: assignments.filter((a) => a.classId === c.id).length,
    submissions: submissions.filter((s) => assignments.find((a) => a.id === s.assignmentId && a.classId === c.id)).length,
  }));

  return NextResponse.json({
    totalClasses: classes.length,
    totalStudents,
    totalAssignments: assignments.length,
    totalSubmissions: submissions.length,
    avgGrade: Math.round(avgGrade * 10) / 10,
    submissionRate: Math.round(submissionRate),
    recentActivity,
    classStats,
  });
}
