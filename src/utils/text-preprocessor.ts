/**
 * Korean and English text preprocessing for TTS optimization
 * Based on the preprocessing logic from SKILL.md
 */

export function preprocessTextForTTS(text: string): string {
  let processed = text;

  // 1. Remove markdown headers (##, ###, etc.)
  processed = processed.replace(/#{1,6}\s+/g, '');

  // 2. Remove bold/italic formatting
  processed = processed.replace(/\*\*(.+?)\*\*/g, '$1'); // Bold (**)
  processed = processed.replace(/\*(.+?)\*/g, '$1'); // Italic (*)
  processed = processed.replace(/__(.+?)__/g, '$1'); // Bold (__)
  processed = processed.replace(/_(.+?)_/g, '$1'); // Italic (_)

  // 3. Handle code blocks
  processed = processed.replace(/```[\s\S]*?```/g, ' 코드 예시 '); // Code blocks
  processed = processed.replace(/`([^`]+)`/g, '$1'); // Inline code

  // 4. Handle markdown links [text](url) -> text
  processed = processed.replace(/\[([^\]]+)\]\([^)]+\)/g, '$1');

  // 5. Remove URLs and emails
  processed = processed.replace(/https?:\/\/[^\s]+/g, '');
  processed = processed.replace(/www\.[^\s]+/g, '');
  processed = processed.replace(/[\w.-]+@[\w.-]+\.\w+/g, '');

  // 6. Remove HTML tags
  processed = processed.replace(/<[^>]+>/g, '');

  // 7. Remove list markers (-, *, +, 1. etc.)
  processed = processed.replace(/^\s*[-*+]\s+/gm, '');
  processed = processed.replace(/^\s*\d+\.\s+/gm, '');

  // 8. Remove brackets (preserve Korean text)
  processed = processed.replace(/[\[\]{}]/g, '');

  // 9. Clean up multiple spaces and newlines
  processed = processed.replace(/ {2,}/g, ' ');
  processed = processed.replace(/\n{2,}/g, '\n');

  // 10. Remove Obsidian-specific syntax
  processed = processed.replace(/!\[\[.*?\]\]/g, ''); // Embeds
  processed = processed.replace(/\[\[([^\]|]+)\|?([^\]]*)\]\]/g, '$2$1'); // Wiki links

  // 11. Remove YAML frontmatter if present
  processed = processed.replace(/^---[\s\S]*?---\n?/g, '');

  // 12. Clean up any remaining special characters that don't help TTS
  processed = processed.replace(/[|~^]/g, '');

  return processed.trim();
}

/**
 * Extract word count from text
 */
export function getWordCount(text: string): number {
  // Handle both Korean and English
  const koreanChars = (text.match(/[\uAC00-\uD7AF]/g) || []).length;
  const englishWords = text
    .replace(/[\uAC00-\uD7AF]/g, ' ')
    .split(/\s+/)
    .filter((word) => word.length > 0).length;

  // Approximate: Korean characters / 2 (average syllables per word) + English words
  return Math.round(koreanChars / 2) + englishWords;
}

/**
 * Estimate audio duration based on word count
 * Average speaking rate: ~150 words per minute
 */
export function estimateAudioDuration(wordCount: number): number {
  return Math.max(1, Math.round(wordCount / 150));
}
