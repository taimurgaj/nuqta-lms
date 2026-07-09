import { PrismaClient } from "@prisma/client";
import matter from "gray-matter";
import fs from "fs";
import path from "path";

const prisma = new PrismaClient();

// Canonical source of the fixed Nuqta lesson catalog. Kept outside edtech/ so
// it's the same content whether it's rendered on learn.nuqta.dev (the public
// 5-lesson subset, read directly from content/lessons/) or seeded here as the
// full 20-lesson pilot catalog. Each file's `tier` frontmatter (added
// alongside this restructure) controls who can see it — see
// src/app/api/curriculum/route.ts.
const CURRICULUM_DIR = path.join(__dirname, "..", "..", "content", "pilot-curriculum");

async function main() {
  const files = fs.readdirSync(CURRICULUM_DIR).filter((f) => f.endsWith(".mdx"));
  if (files.length === 0) {
    throw new Error(`No .mdx files found in ${CURRICULUM_DIR} — check the path is correct`);
  }

  console.log(`نصاب سیڈ ہو رہا ہے: ${files.length} فائلیں ملیں`);

  for (const file of files) {
    const raw = fs.readFileSync(path.join(CURRICULUM_DIR, file), "utf-8");
    const { data, content } = matter(raw);

    const slug = (data.slug as string) ?? file.replace(".mdx", "");
    const title = data.title as string;
    const description = (data.description as string) ?? "";
    const order = (data.order as number) ?? 99;
    const tier = (data.tier as string) ?? "pilot";

    if (!title) {
      console.warn(`  ⚠ ${file}: کوئی عنوان نہیں — چھوڑ دیا گیا`);
      continue;
    }

    await prisma.curriculumItem.upsert({
      where: { slug },
      update: { title, description, order, tier, content },
      create: { slug, title, description, order, tier, content },
    });
    console.log(`  ✓ ${slug} (${tier}, سبق ${order})`);
  }

  const demoCount = await prisma.curriculumItem.count({ where: { tier: "demo" } });
  const pilotCount = await prisma.curriculumItem.count();
  console.log(`\nنصاب مکمل: ${demoCount} ٹیسٹ رن کے لیے، ${pilotCount} پائلٹ کے لیے`);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
