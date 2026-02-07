import type { Platform, Model } from "@prisma/client";

type Inputs = {
  useCase?: string;
  goal: string;
  context?: string;
  tone?: string;
  audience?: string;
  constraints?: string;
  outputFormat?: string;
  examples?: string;
};

type Schema = {
  role?: string;
  instructions?: string;
  context?: string;
  constraints?: string;
  outputFormat?: string;
  examples?: string[] | string;
};

export function buildPrompt({
  platform,
  model,
  inputs,
  schema
}: {
  platform: Platform;
  model: Model;
  inputs: Inputs;
  schema?: Schema | null;
}) {
  const lines: string[] = [];

  const role = schema?.role ?? "You are a senior prompt strategist.";
  const instructions = schema?.instructions ?? "Craft a high-quality response.";
  const context = [schema?.context, inputs.context].filter(Boolean).join("\n");
  const constraints = [schema?.constraints, inputs.constraints]
    .filter(Boolean)
    .join("\n");
  const outputFormat = schema?.outputFormat || inputs.outputFormat;
  const examples = schema?.examples || inputs.examples;

  if (platform.slug === "midjourney") {
    const promptParts = [
      inputs.useCase && `Use case: ${inputs.useCase}`,
      inputs.goal,
      context && `Context: ${context}`,
      inputs.tone && `Mood/Tone: ${inputs.tone}`,
      inputs.audience && `Audience: ${inputs.audience}`,
      constraints && `Constraints: ${constraints}`,
      outputFormat && `Output: ${outputFormat}`,
      examples && `Examples: ${Array.isArray(examples) ? examples.join("; ") : examples}`
    ].filter(Boolean);

    return `/imagine prompt: ${promptParts.join(", ")} --style raw --v 6`;
  }

  lines.push(`System: ${role}`);
  lines.push(`Model: ${model.name}`);
  if (inputs.useCase) lines.push(`Use Case: ${inputs.useCase}`);
  lines.push(`Goal: ${inputs.goal}`);

  if (instructions) lines.push(`Instructions: ${instructions}`);
  if (context) lines.push(`Context: ${context}`);
  if (inputs.tone) lines.push(`Tone: ${inputs.tone}`);
  if (inputs.audience) lines.push(`Audience: ${inputs.audience}`);
  if (constraints) lines.push(`Constraints: ${constraints}`);
  if (outputFormat) lines.push(`Output Format: ${outputFormat}`);
  if (examples) {
    lines.push(
      `Examples: ${Array.isArray(examples) ? examples.join(" | ") : examples}`
    );
  }

  lines.push("Quality Checklist: Clear goal, defined constraints, output format, tone.");

  return lines.join("\n");
}
