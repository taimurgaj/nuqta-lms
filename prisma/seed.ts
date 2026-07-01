import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("ڈیٹا بیس میں ابتدائی ڈیٹا شامل کر رہے ہیں...");

  // Demo organisation — required for the login flow (org search step)
  const org = await prisma.organization.upsert({
    where: { slug: "demo-school" },
    update: {},
    create: {
      name: "نمونہ اسکول",
      slug: "demo-school",
      city: "لاہور",
      joinCode: "SCHOOL01",
    },
  });

  // Demo teacher
  const teacherPw = await bcrypt.hash("teacher123", 12);
  const teacher = await prisma.user.upsert({
    where: { email: "teacher@urduedtech.pk" },
    update: {},
    create: {
      name: "احمد علی",
      email: "teacher@urduedtech.pk",
      password: teacherPw,
      role: "teacher",
      isOrgAdmin: true,
      orgId: org.id,
    },
  });

  // Demo student
  const studentPw = await bcrypt.hash("student123", 12);
  const student = await prisma.user.upsert({
    where: { email: "student@urduedtech.pk" },
    update: {},
    create: {
      name: "فاطمہ زہرا",
      email: "student@urduedtech.pk",
      password: studentPw,
      role: "student",
      orgId: org.id,
    },
  });

  // Demo class — programming, not literature
  const cls = await prisma.class.upsert({
    where: { code: "URDU01" },
    update: {},
    create: {
      name: "اردو پروگرامنگ — ششم جماعت",
      description: "اردو زبان میں کوڈنگ سیکھیں",
      subject: "اردو پروگرامنگ",
      gradeLevel: "ششم",
      teacherId: teacher.id,
      orgId: org.id,
      code: "URDU01",
    },
  });

  // Enroll student
  await prisma.enrollment.upsert({
    where: { studentId_classId: { studentId: student.id, classId: cls.id } },
    update: {},
    create: { studentId: student.id, classId: cls.id },
  });

  // Demo assignments — programming tasks
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
لکھو("مجھے اردو پروگرامنگ پسند ہے")؛`,
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
      title: "سبق ۴: اگر/وگرنہ",
      description: `ایک عدد رکھیں اور اگر/وگرنہ سے جانچیں کہ وہ ۱۰ سے بڑا ہے یا چھوٹا۔`,
      classId: cls.id,
      creatorId: teacher.id,
      maxPoints: 20,
      type: "ide",
      isPublished: false,
    },
  });

  // Demo curriculum items — programming lessons
  await prisma.curriculumItem.upsert({
    where: { id: "demo-curriculum-1" },
    update: {},
    create: {
      id: "demo-curriculum-1",
      title: "اردو پروگرامنگ — بنیادی الفاظ",
      description: "اردو زبان کے کوڈنگ کلیدی الفاظ کا تعارف",
      subject: "اردو پروگرامنگ",
      gradeLevel: "ششم",
      type: "lesson",
      content: `اردو پروگرامنگ زبان کے بنیادی الفاظ:

━━━━━━━━━━━━━━━━━━━━━━━━
لکھو("...")؛          ← اسکرین پر پیغام دکھائیں
رکھو نام = قدر؛      ← متغیر بنائیں
پڑھو()               ← صارف سے ان پٹ لیں
━━━━━━━━━━━━━━━━━━━━━━━━

اگر (شرط) {          ← اگر شرط سچ ہو تو
  ...
} وگرنہ {            ← ورنہ
  ...
}

جب تک (شرط) {        ← جب تک شرط سچ ہو دہراتے رہو
  ...
}

فنکشن نام() {        ← دوبارہ قابل استعمال کوڈ
  واپس قدر؛
}
━━━━━━━━━━━━━━━━━━━━━━━━

مثال — پہلا پروگرام:

لکھو("سلام دنیا")؛`,
      isPublic: true,
      creatorId: teacher.id,
      tags: JSON.stringify(["اردو پروگرامنگ", "بنیادی", "ابتدائی"]),
    },
  });

  await prisma.curriculumItem.upsert({
    where: { id: "demo-curriculum-2" },
    update: {},
    create: {
      id: "demo-curriculum-2",
      title: "اردو پروگرامنگ — متغیرات اور ان پٹ",
      description: "رکھو اور پڑھو() کا استعمال",
      subject: "اردو پروگرامنگ",
      gradeLevel: "ششم",
      type: "lesson",
      content: `متغیرات سے ڈیٹا محفوظ کریں اور صارف سے ان پٹ لیں:

رکھو نام = "احمد"؛
رکھو عمر = ۱۵؛
لکھو("ہیلو " + نام)؛

صارف سے ان پٹ لینا (Flask IDE میں):
رکھو نام = پڑھو()؛
لکھو("آپ کا نام " + نام + " ہے")؛

اعداد کے ساتھ حساب:
رکھو الف = ۵؛
رکھو ب = ۳؛
لکھو(الف + ب)؛
لکھو(الف - ب)؛
لکھو(الف * ب)؛`,
      isPublic: true,
      creatorId: teacher.id,
      tags: JSON.stringify(["متغیرات", "ان پٹ", "پڑھو"]),
    },
  });

  console.log("ابتدائی ڈیٹا کامیابی سے شامل ہو گیا!");
  console.log("\nڈیمو اکاؤنٹ:");
  console.log("ادارہ: نمونہ اسکول (demo-school)  ← لاگ ان پر پہلے یہ تلاش کریں");
  console.log("استاد: teacher@urduedtech.pk / teacher123");
  console.log("طالب علم: student@urduedtech.pk / student123");
  console.log("کلاس کوڈ: URDU01");
  console.log("ادارے کا کوڈ: SCHOOL01");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
