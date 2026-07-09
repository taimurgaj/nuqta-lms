import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

// Must match DEMO_PASSWORD in src/components/DemoLoginButtons.tsx — that's
// the "test run" flow linked from the nuqta.dev marketing site.
const DEMO_PASSWORD = "NuqtaDemo2026!";

async function main() {
  console.log("ڈیٹا بیس میں ابتدائی ڈیٹا شامل کر رہے ہیں...");

  // Demo org — tier "demo" means it only sees the 5-lesson set (see
  // src/app/api/curriculum/route.ts), matching learn.nuqta.dev exactly.
  // slug/name/joinCode match the org that already exists in production
  // (created outside this seed file at some point) — upserting on the wrong
  // slug here would create a second, unused duplicate org instead of
  // updating the real one.
  const org = await prisma.organization.upsert({
    where: { slug: "nuqta-demo" },
    update: { tier: "demo" },
    create: {
      name: "نقطہ ڈیمو اسکول",
      slug: "nuqta-demo",
      city: "لاہور",
      joinCode: "SCHOOL01",
      tier: "demo",
    },
  });

  // These are the two accounts the public "test run" demo-login buttons sign
  // into (DemoLoginButtons.tsx) — name deliberately a plain full name, not a
  // "Teacher ___" / "استاد ___" title+name pattern.
  const demoPw = await bcrypt.hash(DEMO_PASSWORD, 12);
  const teacher = await prisma.user.upsert({
    where: { email: "demo-teacher@nuqta.dev" },
    update: { name: "ڈیمو استاد", password: demoPw, orgId: org.id, isOrgAdmin: true },
    create: {
      name: "ڈیمو استاد",
      email: "demo-teacher@nuqta.dev",
      password: demoPw,
      role: "teacher",
      isOrgAdmin: true,
      orgId: org.id,
    },
  });

  const student = await prisma.user.upsert({
    where: { email: "demo-student@nuqta.dev" },
    update: { name: "ڈیمو طالب علم", password: demoPw, orgId: org.id },
    create: {
      name: "ڈیمو طالب علم",
      email: "demo-student@nuqta.dev",
      password: demoPw,
      role: "student",
      orgId: org.id,
    },
  });

  const cls = await prisma.class.upsert({
    where: { code: "URDU01" },
    update: {},
    create: {
      name: "نقطہ پروگرامنگ — ششم جماعت",
      description: "نقطہ زبان میں کوڈنگ سیکھیں",
      subject: "نقطہ پروگرامنگ",
      gradeLevel: "ششم",
      teacherId: teacher.id,
      orgId: org.id,
      code: "URDU01",
    },
  });

  await prisma.enrollment.upsert({
    where: { studentId_classId: { studentId: student.id, classId: cls.id } },
    update: {},
    create: { studentId: student.id, classId: cls.id },
  });

  // Demo assignments — reference the fixed curriculum by lesson title, not by
  // authoring new content (curriculum itself is seeded separately, see
  // prisma/seed-curriculum.ts).
  await prisma.assignment.upsert({
    where: { id: "demo-assignment-1" },
    update: {},
    create: {
      id: "demo-assignment-1",
      title: "سبق ۱: سلام دنیا",
      description: `لکھو() استعمال کرتے ہوئے تین مختلف پیغام اسکرین پر دکھائیں۔

مثال:
لکھو("سلام دنیا")؛
لکھو("میرا نام احمد ہے")؛
لکھو("مجھے نقطہ پروگرامنگ پسند ہے")؛`,
      classId: cls.id,
      creatorId: teacher.id,
      maxPoints: 10,
      type: "ide",
      isPublished: true,
      dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    },
  });

  await prisma.assignment.upsert({
    where: { id: "demo-assignment-2" },
    update: {},
    create: {
      id: "demo-assignment-2",
      title: "سبق ۲: متغیرات",
      description: `رکھو استعمال کرتے ہوئے اپنا نام اور عمر محفوظ کریں اور پھر لکھو() سے دکھائیں۔

مثال:
رکھو نام = "فاطمہ"؛
رکھو عمر = ۱۲؛
لکھو("میرا نام " + نام + " ہے")؛
لکھو("میری عمر " + عمر + " سال ہے")؛`,
      classId: cls.id,
      creatorId: teacher.id,
      maxPoints: 15,
      type: "ide",
      isPublished: true,
      dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
    },
  });

  await prisma.assignment.upsert({
    where: { id: "demo-assignment-3" },
    update: {},
    create: {
      id: "demo-assignment-3",
      title: "سبق ۳: اگر/ورنہ",
      description: `ایک عدد رکھیں اور اگر/ورنہ سے جانچیں کہ وہ ۱۰ سے بڑا ہے یا چھوٹا۔`,
      classId: cls.id,
      creatorId: teacher.id,
      maxPoints: 20,
      type: "ide",
      isPublished: false,
    },
  });

  console.log("ابتدائی ڈیٹا کامیابی سے شامل ہو گیا!");
  console.log("\nڈیمو اکاؤنٹ (ٹیسٹ رن — نقطہ.dev سے منسلک):");
  console.log("ادارہ: نقطہ ڈیمو اسکول (nuqta-demo)");
  console.log(`استاد: demo-teacher@nuqta.dev / ${DEMO_PASSWORD}`);
  console.log(`طالب علم: demo-student@nuqta.dev / ${DEMO_PASSWORD}`);
  console.log("کلاس کوڈ: URDU01");
  console.log(`ادارے کا کوڈ: ${org.joinCode}`);
  console.log("\nنصاب سیڈ کرنے کے لیے چلائیں: npm run db:seed-curriculum");
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
