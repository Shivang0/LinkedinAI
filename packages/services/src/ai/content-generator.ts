import OpenAI from 'openai';
import type { GenerationParams, ProfileAnalysis, GeneratedContent } from '@linkedin-ai/shared';
import { buildSystemPrompt, buildUserPrompt, buildEnhancePrompt } from './prompt-builder';
import { validateAndCleanContent, type ContentValidationResult } from './content-rules';

export interface ContentGeneratorConfig {
  apiKey: string;
  model?: string;
  maxRetries?: number;
}

export interface GenerationResult extends GeneratedContent {
  validation: ContentValidationResult;
}

/**
 * AI Content Generator using OpenAI GPT-4o
 * Implements natural writing rules to avoid AI detection
 */
export class ContentGenerator {
  private openai: OpenAI;
  private model: string;
  private maxRetries: number;

  constructor(config: ContentGeneratorConfig) {
    this.openai = new OpenAI({ apiKey: config.apiKey });
    this.model = config.model || 'gpt-4o';
    this.maxRetries = config.maxRetries || 2;
  }

  /**
   * Generates a LinkedIn post based on parameters
   */
  async generate(
    params: GenerationParams,
    profile?: ProfileAnalysis | null
  ): Promise<GenerationResult> {
    let attempts = 0;
    let lastResult: GenerationResult | null = null;

    while (attempts < this.maxRetries) {
      attempts++;

      const systemPrompt = buildSystemPrompt(profile);
      const userPrompt = buildUserPrompt(params);

      // If retry, add context about what to fix
      const retryContext: string =
        lastResult && !lastResult.validation.isValid
          ? `\n\nPREVIOUS ATTEMPT HAD ISSUES:\n${lastResult.validation.issues.map((i: { message: string }) => `- ${i.message}`).join('\n')}\nPlease fix these issues in this attempt.`
          : '';

      const response = await this.openai.chat.completions.create({
        model: this.model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt + retryContext },
        ],
        temperature: 0.85, // Higher for creativity but not too random
        max_tokens: 1500,
        presence_penalty: 0.1, // Slight penalty to encourage new topics
        frequency_penalty: 0.3, // Reduce repetition
      });

      const content = response.choices[0]?.message?.content || '';
      const validation = validateAndCleanContent(content);

      lastResult = {
        content: validation.cleaned,
        validation,
        metadata: {
          model: this.model,
          tokensUsed: response.usage?.total_tokens || 0,
          generatedAt: new Date(),
        },
      };

      // If valid or no more retries, return
      if (validation.isValid || attempts >= this.maxRetries) {
        return lastResult;
      }
    }

    return lastResult!;
  }

  /**
   * Generates multiple variations of a post
   */
  async generateVariations(
    params: GenerationParams,
    count: number = 3,
    profile?: ProfileAnalysis | null
  ): Promise<GenerationResult[]> {
    const variations: GenerationResult[] = [];

    // Generate with different hook styles for variety
    const hookStyles: Array<GenerationParams['hookStyle']> = [
      'question',
      'bold-statement',
      'personal-story',
      'statistic',
      'contrarian',
    ];

    for (let i = 0; i < count; i++) {
      const variationParams: GenerationParams = {
        ...params,
        hookStyle: hookStyles[i % hookStyles.length],
      };

      const result = await this.generate(variationParams, profile);
      variations.push(result);
    }

    return variations;
  }

  /**
   * Improves existing content based on instructions
   */
  async enhance(
    existingContent: string,
    instructions: string,
    profile?: ProfileAnalysis | null
  ): Promise<GenerationResult> {
    const systemPrompt = buildSystemPrompt(profile);
    const userPrompt = buildEnhancePrompt(existingContent, instructions);

    const response = await this.openai.chat.completions.create({
      model: this.model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.7, // Slightly lower for more controlled enhancement
      max_tokens: 1500,
    });

    const content = response.choices[0]?.message?.content || '';
    const validation = validateAndCleanContent(content);

    return {
      content: validation.cleaned,
      validation,
      metadata: {
        model: this.model,
        tokensUsed: response.usage?.total_tokens || 0,
        generatedAt: new Date(),
      },
    };
  }

  /**
   * Shortens content while maintaining key message
   */
  async shorten(content: string, targetLength: 'short' | 'medium' = 'short'): Promise<GenerationResult> {
    const targetWords = targetLength === 'short' ? '100-150' : '150-250';

    return this.enhance(content, `Make this post shorter (${targetWords} words) while keeping the core message and hook impactful.`);
  }

  /**
   * Makes content more engaging
   */
  async makeMoreEngaging(content: string): Promise<GenerationResult> {
    return this.enhance(
      content,
      'Make this post more engaging. Add a stronger hook, include a question for readers, and make the ending more compelling. Keep it conversational.'
    );
  }

  /**
   * Changes the tone of content
   */
  async changeTone(
    content: string,
    newTone: 'professional' | 'casual' | 'inspirational'
  ): Promise<GenerationResult> {
    const toneInstructions: Record<string, string> = {
      professional: 'Rewrite in a more professional tone - clear, direct, expert but still approachable',
      casual: 'Rewrite in a more casual tone - friendly, conversational, like talking to a friend',
      inspirational: 'Rewrite in an inspirational tone - authentic vulnerability, lessons learned, motivating',
    };

    return this.enhance(content, toneInstructions[newTone]);
  }
}

/**
 * Creates a ContentGenerator instance with default configuration
 */
export function createContentGenerator(apiKey?: string): ContentGenerator {
  const key = apiKey || process.env.OPENAI_API_KEY;
  if (!key) {
    throw new Error('OpenAI API key is required');
  }

  return new ContentGenerator({ apiKey: key });
}
