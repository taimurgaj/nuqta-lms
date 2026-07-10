import bcrypt from "bcryptjs";
import { randomBytes } from "crypto";
import { after } from "next/server";
import { prisma } from "./prisma";
import { generateClassCode, generateUrduJoinCode } from "./utils";

// Per-visitor ephemeral demo sandboxes: each "پہلے ڈیمو دیکھیں" click gets its
// own isolated org/class/students/assignments instead of everyone sharing
// the same real read-write account.
//
// To avoid making the visitor wait through a synchronous 13-row create (plus
// 5 bcrypt hashes) on click, sandboxes are pre-built into a small pool and
// just claimed — atomically, via `FOR UPDATE SKIP LOCKED` so two concurrent
// visitors can never grab the same one — which is a single fast UPDATE.
// Falls back to a synchronous create only if the pool is ever empty.
//
// Cleanup runs two ways: a lazy sweep at the top of every claim (works
// regardless of hosting plan/cron support) and an optional scheduled
// /api/demo/cleanup hit (also tops the pool back up) for the case where
// nobody visits for a while.
const SANDBOX_TTL_MS = 2 * 60 * 60 * 1000; // 2 hours from claim — long enough for a full evaluation, short enough not to pile up
const POOL_TARGET = 3;

function shortId(): string {
  return randomBytes(4).toString("hex");
}

function randomPassword(): string {
  return randomBytes(9).toString("base64url");
}

const ASSIGNMENTS = [
  {
    title: "سبق ۱: سلام دنیا",
    description: `لکھو() استعمال کرتے ہوئے تین مختلف پیغام اسکرین پر دکھائیں۔

مثال:
لکھو("سلام دنیا")؛
لکھو("میرا نام احمد ہے")؛
لکھو("مجھے نقطہ پروگرامنگ پسند ہے")؛`,
    maxPoints: 10,
    dueInDays: 7,
  },
  {
    title: "سبق ۲: متغیرات",
    description: `رکھو استعمال کرتے ہوئے اپنا نام اور عمر محفوظ کریں اور پھر لکھو() سے دکھائیں۔

مثال:
رکھو نام = "فاطمہ"؛
رکھو عمر = ۱۲؛
لکھو("میرا نام " + نام + " ہے")؛
لکھو("میری عمر " + عمر + " سال ہے")؛`,
    maxPoints: 15,
    dueInDays: 14,
  },
] as const;

const DRAFT_ASSIGNMENT = {
  title: "سبق ۳: اگر/ورنہ",
  description: "ایک عدد رکھیں اور اگر/ورنہ سے جانچیں کہ وہ ۱۰ سے بڑا ہے یا چھوٹا۔",
  maxPoints: 20,
};

/** Deletes one ephemeral org and everything under it, in FK-safe order. Session/Account are skipped — the app uses JWT sessions, so credentials-provider logins never create rows there. */
async function deleteSandboxOrg(orgId: string) {
  const users = await prisma.user.findMany({ where: { orgId }, select: { id: true } });
  const userIds = users.map((u) => u.id);
  const classes = await prisma.class.findMany({ where: { orgId }, select: { id: true } });
  const classIds = classes.map((c) => c.id);

  await prisma.aIMessage.deleteMany({ where: { userId: { in: userIds } } });
  await prisma.submission.deleteMany({ where: { assignment: { classId: { in: classIds } } } });
  await prisma.enrollment.deleteMany({ where: { classId: { in: classIds } } });
  await prisma.assignment.deleteMany({ where: { classId: { in: classIds } } });
  await prisma.class.deleteMany({ where: { orgId } });
  await prisma.user.deleteMany({ where: { orgId } });
  await prisma.organization.delete({ where: { id: orgId } });
}

/** Sweeps every expired (i.e. previously claimed, now past its TTL) sandbox. Pool members (expiresAt still null) are never touched. */
export async function cleanupExpiredSandboxes(): Promise<number> {
  const expired = await prisma.organization.findMany({
    where: { expiresAt: { lt: new Date() } },
    select: { id: true },
  });
  for (const org of expired) {
    await deleteSandboxOrg(org.id);
  }
  return expired.length;
}

/** Builds one full sandbox (org, teacher, 4 students, class, assignments, a realistic submission mix) and leaves it unclaimed in the pool — expiresAt stays null until someone claims it. */
async function createPooledSandbox(): Promise<void> {
  const id = shortId();

  const teacherPw = randomPassword();
  const studentPws = Array.from({ length: 4 }, () => randomPassword());
  const [teacherHash, ...studentHashes] = await Promise.all([
    bcrypt.hash(teacherPw, 12),
    ...studentPws.map((p) => bcrypt.hash(p, 12)),
  ]);

  const org = await prisma.organization.create({
    data: {
      name: "نقطہ ڈیمو اسکول",
      slug: `demo-${id}`,
      city: "لاہور",
      joinCode: generateUrduJoinCode(),
      tier: "demo",
      // expiresAt / claimedAt stay null — this sandbox isn't "in use" yet.
    },
  });

  const teacher = await prisma.user.create({
    data: {
      name: "ڈیمو استاد",
      email: `demo-teacher-${id}@ephemeral.nuqta.dev`,
      password: teacherHash,
      pendingPassword: teacherPw,
      role: "teacher",
      isOrgAdmin: true,
      orgId: org.id,
    },
  });

  const students = await Promise.all(
    studentHashes.map((hash, i) =>
      prisma.user.create({
        data: {
          name: `ڈیمو طالب علم ${["۱", "۲", "۳", "۴"][i]}`,
          email: `demo-student-${id}-${i}@ephemeral.nuqta.dev`,
          password: hash,
          pendingPassword: i === 0 ? studentPws[0] : null, // only student[0] is ever handed out as the "student" persona
          role: "student",
          orgId: org.id,
        },
      })
    )
  );

  const cls = await prisma.class.create({
    data: {
      name: "نقطہ پروگرامنگ — ششم جماعت",
      description: "نقطہ زبان میں کوڈنگ سیکھیں",
      subject: "نقطہ پروگرامنگ",
      gradeLevel: "ششم",
      teacherId: teacher.id,
      orgId: org.id,
      code: generateClassCode(),
    },
  });

  await prisma.enrollment.createMany({
    data: students.map((s) => ({ studentId: s.id, classId: cls.id })),
  });

  const assignments = await Promise.all(
    ASSIGNMENTS.map((a) =>
      prisma.assignment.create({
        data: {
          title: a.title,
          description: a.description,
          classId: cls.id,
          creatorId: teacher.id,
          maxPoints: a.maxPoints,
          type: "ide",
          isPublished: true,
          dueDate: new Date(Date.now() + a.dueInDays * 24 * 60 * 60 * 1000),
        },
      })
    )
  );
  await prisma.assignment.create({
    data: {
      title: DRAFT_ASSIGNMENT.title,
      description: DRAFT_ASSIGNMENT.description,
      classId: cls.id,
      creatorId: teacher.id,
      maxPoints: DRAFT_ASSIGNMENT.maxPoints,
      type: "ide",
      isPublished: false,
    },
  });

  const [a1, a2] = assignments;
  const submissionContent = 'لکھو("سلام دنیا")؛\nلکھو("میرا نام احمد ہے")؛';

  // Student 0: one graded (with feedback), one still open — the persona a
  // student-mode visitor gets, so they see a finished example and can also
  // try the submit flow themselves.
  await prisma.submission.create({
    data: {
      assignmentId: a1.id, studentId: students[0].id, content: submissionContent,
      grade: 9, feedback: "بہت اچھا کام! لکھو() کا استعمال بالکل درست ہے۔",
      status: "graded", gradedAt: new Date(),
    },
  });

  // Student 1: both graded.
  await prisma.submission.create({
    data: {
      assignmentId: a1.id, studentId: students[1].id, content: submissionContent,
      grade: 7, feedback: "ٹھیک ہے، لیکن پیغامات میں تھوڑی مزید تفصیل ہو سکتی تھی۔",
      status: "graded", gradedAt: new Date(),
    },
  });
  await prisma.submission.create({
    data: {
      assignmentId: a2.id, studentId: students[1].id,
      content: 'رکھو نام = "زینب"؛\nلکھو("میرا نام " + نام + " ہے")؛',
      grade: 14, feedback: "کمال! بالکل درست۔",
      status: "graded", gradedAt: new Date(),
    },
  });

  // Student 2: submitted, not yet graded — gives the teacher something to grade.
  await prisma.submission.create({
    data: { assignmentId: a1.id, studentId: students[2].id, content: submissionContent, status: "submitted" },
  });

  // Student 3: nothing submitted — shows up as missing in the gradebook.
}

/** Ensures at least POOL_TARGET unclaimed sandboxes are sitting ready. Safe to call concurrently — worst case briefly overshoots the target by a few, which cleanup doesn't care about since they're not expired. */
export async function topUpPool(target: number = POOL_TARGET): Promise<number> {
  const [{ count }] = await prisma.$queryRawUnsafe<Array<{ count: bigint }>>(
    `SELECT COUNT(*) as count FROM "Organization" o
     WHERE o.slug LIKE 'demo-%' AND o."claimedAt" IS NULL
       AND EXISTS (
         SELECT 1 FROM "User" u
         WHERE u."orgId" = o.id AND u.role = 'teacher' AND u."pendingPassword" IS NOT NULL
       )`
  );
  const current = Number(count);
  const need = Math.max(0, target - current);
  for (let i = 0; i < need; i++) {
    await createPooledSandbox();
  }
  return need;
}

export interface ClaimedSandboxSession {
  userId: string;
  name: string;
  email: string;
  role: "teacher" | "student";
  orgId: string;
  isOrgAdmin: boolean;
  orgName: string;
  orgSlug: string;
  orgTier: "demo";
}

/** Atomically claims one pooled sandbox (or synchronously builds one if the pool is empty) and returns everything needed to mint a session directly — no separate signIn()/credentials round trip, since we already know this account is legitimate (we just built it). Kept to the minimum possible round trips — every extra sequential query here is latency the visitor feels directly. Expired-sandbox cleanup is intentionally NOT run on this path; it only runs from /api/demo/cleanup (cron-triggered), so a visitor never pays for someone else's sweep. */
export async function claimDemoSandbox(role: "teacher" | "student"): Promise<ClaimedSandboxSession> {
  const expiresAt = new Date(Date.now() + SANDBOX_TTL_MS);

  // The EXISTS check guards against any org that superficially looks like an
  // unclaimed pool member (claimedAt IS NULL) but isn't actually a valid one
  // — e.g. a stray row from before pendingPassword existed.
  const claimed = await prisma.$queryRawUnsafe<Array<{ id: string }>>(
    `UPDATE "Organization"
     SET "claimedAt" = now(), "expiresAt" = $1
     WHERE id = (
       SELECT o.id FROM "Organization" o
       WHERE o.slug LIKE 'demo-%' AND o."claimedAt" IS NULL
         AND EXISTS (
           SELECT 1 FROM "User" u
           WHERE u."orgId" = o.id AND u.role = 'teacher' AND u."pendingPassword" IS NOT NULL
         )
       ORDER BY o."createdAt" ASC
       LIMIT 1
       FOR UPDATE SKIP LOCKED
     )
     RETURNING id`,
    expiresAt
  );

  let orgId: string;
  if (claimed.length > 0) {
    orgId = claimed[0].id;
  } else {
    // Pool was empty — build one synchronously (slower, but always works) and claim it immediately.
    await createPooledSandbox();
    const fresh = await prisma.organization.findFirst({
      where: { slug: { startsWith: "demo-" }, claimedAt: null },
      orderBy: { createdAt: "desc" },
      select: { id: true },
    });
    if (!fresh) throw new Error("sandbox creation failed");
    await prisma.organization.update({ where: { id: fresh.id }, data: { claimedAt: new Date(), expiresAt } });
    orgId = fresh.id;
  }

  // One query (org + its users nested) instead of separate round trips —
  // fetches everything a session needs in a single hop. Students are created
  // concurrently in createPooledSandbox, so createdAt order doesn't reliably
  // match array index — identify "the designated student" by which one
  // actually has credentials, not by age.
  const org = await prisma.organization.findUnique({
    where: { id: orgId },
    select: {
      name: true,
      slug: true,
      users: {
        where: { OR: [{ role: "teacher" }, { role: "student", pendingPassword: { not: null } }] },
        select: { id: true, role: true, name: true, email: true, pendingPassword: true },
      },
    },
  });
  const teacher = org?.users.find((u) => u.role === "teacher");
  const student0 = org?.users.find((u) => u.role === "student");
  if (!org || !teacher?.pendingPassword || !student0?.pendingPassword) throw new Error("claimed sandbox missing credentials");

  const person = role === "teacher" ? teacher : student0;

  // One-time use — clear the plaintext after responding, not before; the
  // visitor doesn't need to wait on this.
  after(() =>
    prisma.user.updateMany({ where: { id: { in: [teacher.id, student0.id] } }, data: { pendingPassword: null } })
      .catch((e) => console.error("pendingPassword clear failed:", e))
  );

  return {
    userId: person.id,
    name: person.name,
    email: person.email,
    role,
    orgId,
    isOrgAdmin: role === "teacher",
    orgName: org.name,
    orgSlug: org.slug,
    orgTier: "demo",
  };
}
