import bcrypt from "bcryptjs";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const passwordHash = await bcrypt.hash("PromptlyAdmin123!", 10);
  const userHash = await bcrypt.hash("PromptlyUser123!", 10);

  const admin = await prisma.user.upsert({
    where: { email: "admin@promptly.ai" },
    update: {},
    create: {
      name: "Promptly Admin",
      email: "admin@promptly.ai",
      passwordHash,
      role: "ADMIN"
    }
  });

  const user = await prisma.user.upsert({
    where: { email: "user@promptly.ai" },
    update: {},
    create: {
      name: "Promptly User",
      email: "user@promptly.ai",
      passwordHash: userHash,
      role: "USER"
    }
  });

  const platforms = await Promise.all(
    [
      { name: "OpenAI", slug: "openai" },
      { name: "Gemini", slug: "gemini" },
      { name: "Midjourney", slug: "midjourney" },
      { name: "Claude", slug: "claude" }
    ].map((platform) =>
      prisma.platform.upsert({
        where: { slug: platform.slug },
        update: {},
        create: platform
      })
    )
  );

  const [openai, gemini, midjourney, claude] = platforms;

  const models = await Promise.all([
    prisma.model.upsert({
      where: { platformId_slug: { platformId: openai.id, slug: "gpt-4o" } },
      update: {},
      create: { platformId: openai.id, name: "GPT-4o", slug: "gpt-4o" }
    }),
    prisma.model.upsert({
      where: { platformId_slug: { platformId: openai.id, slug: "gpt-4o-mini" } },
      update: {},
      create: { platformId: openai.id, name: "GPT-4o mini", slug: "gpt-4o-mini" }
    }),
    prisma.model.upsert({
      where: { platformId_slug: { platformId: gemini.id, slug: "gemini-1-5-pro" } },
      update: {},
      create: { platformId: gemini.id, name: "Gemini 1.5 Pro", slug: "gemini-1-5-pro" }
    }),
    prisma.model.upsert({
      where: { platformId_slug: { platformId: gemini.id, slug: "gemini-1-5-flash" } },
      update: {},
      create: { platformId: gemini.id, name: "Gemini 1.5 Flash", slug: "gemini-1-5-flash" }
    }),
    prisma.model.upsert({
      where: { platformId_slug: { platformId: midjourney.id, slug: "v6" } },
      update: {},
      create: { platformId: midjourney.id, name: "Midjourney v6", slug: "v6" }
    }),
    prisma.model.upsert({
      where: { platformId_slug: { platformId: claude.id, slug: "claude-3-5-sonnet" } },
      update: {},
      create: { platformId: claude.id, name: "Claude 3.5 Sonnet", slug: "claude-3-5-sonnet" }
    })
  ]);

  const categories = await Promise.all(
    [
      { name: "Copywriting", slug: "copywriting" },
      { name: "Coding", slug: "coding" },
      { name: "SEO", slug: "seo" },
      { name: "Ads", slug: "ads" },
      { name: "Resume", slug: "resume" },
      { name: "Image Gen", slug: "image-gen" }
    ].map((category) =>
      prisma.category.upsert({
        where: { slug: category.slug },
        update: {},
        create: category
      })
    )
  );

  const tags = await Promise.all(
    [
      { name: "Startup", slug: "startup" },
      { name: "Marketing", slug: "marketing" },
      { name: "Product", slug: "product" },
      { name: "Brand", slug: "brand" },
      { name: "Hiring", slug: "hiring" },
      { name: "Design", slug: "design" }
    ].map((tag) =>
      prisma.tag.upsert({
        where: { slug: tag.slug },
        update: {},
        create: tag
      })
    )
  );

  const [copywriting, coding, seo, ads, resume, imageGen] = categories;
  const [startup, marketing, product, brand, hiring, design] = tags;

  const [gpt4o, gpt4oMini, geminiPro, geminiFlash, midjourneyV6, claudeSonnet] =
    models;

  const templateOne = await prisma.template.upsert({
    where: { id: "tmpl-launch-brief" },
    update: {},
    create: {
      id: "tmpl-launch-brief",
      title: "Product Launch Brief",
      description:
        "Generate a crisp launch brief with positioning, key messages, and a rollout plan.",
      promptSchema: {
        role: "You are a senior product marketer.",
        instructions:
          "Create a launch brief with positioning, key messages, target audience, channels, timeline, and KPIs.",
        context: "The product is a SaaS platform called Promptly.",
        constraints: "Keep it under 500 words and use bullet points.",
        outputFormat: "Markdown",
        examples: []
      },
      authorId: admin.id,
      categoryId: copywriting.id,
      isPublic: true,
      isFeatured: true
    }
  });

  const templateTwo = await prisma.template.upsert({
    where: { id: "tmpl-seo-cluster" },
    update: {},
    create: {
      id: "tmpl-seo-cluster",
      title: "SEO Topic Cluster",
      description:
        "Build a topic cluster with pillar page, supporting articles, and internal linking guidance.",
      promptSchema: {
        role: "You are an SEO strategist.",
        instructions:
          "Create a topic cluster with a pillar page and 8 supporting articles. Provide titles, search intent, and internal links.",
        context: "The product is a B2B analytics tool.",
        constraints: "Use concise titles and practical recommendations.",
        outputFormat: "Table",
        examples: []
      },
      authorId: admin.id,
      categoryId: seo.id,
      isPublic: true,
      isFeatured: true
    }
  });

  const templateThree = await prisma.template.upsert({
    where: { id: "tmpl-mj-studio" },
    update: {},
    create: {
      id: "tmpl-mj-studio",
      title: "Cinematic Studio Portrait",
      description:
        "Craft a Midjourney-ready cinematic portrait with lighting, lens, and mood cues.",
      promptSchema: {
        role: "You are a visual prompt engineer.",
        instructions:
          "Generate a Midjourney prompt for a cinematic studio portrait. Include lighting, lens, color grading, and mood.",
        context: "Subject: modern founder in a minimal studio.",
        constraints: "Avoid overly stylized adjectives. Keep it realistic.",
        outputFormat: "Midjourney",
        examples: []
      },
      authorId: admin.id,
      categoryId: imageGen.id,
      isPublic: true,
      isFeatured: false
    }
  });

  await prisma.templateModel.createMany({
    data: [
      { templateId: templateOne.id, modelId: gpt4o.id },
      { templateId: templateOne.id, modelId: gpt4oMini.id },
      { templateId: templateTwo.id, modelId: geminiPro.id },
      { templateId: templateTwo.id, modelId: geminiFlash.id },
      { templateId: templateThree.id, modelId: midjourneyV6.id },
      { templateId: templateOne.id, modelId: claudeSonnet.id }
    ],
    skipDuplicates: true
  });

  await prisma.templateTag.createMany({
    data: [
      { templateId: templateOne.id, tagId: startup.id },
      { templateId: templateOne.id, tagId: product.id },
      { templateId: templateTwo.id, tagId: marketing.id },
      { templateId: templateTwo.id, tagId: brand.id },
      { templateId: templateThree.id, tagId: design.id },
      { templateId: templateOne.id, tagId: hiring.id }
    ],
    skipDuplicates: true
  });

  await prisma.savedTemplate.upsert({
    where: { userId_templateId: { userId: user.id, templateId: templateOne.id } },
    update: {},
    create: { userId: user.id, templateId: templateOne.id }
  });
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
