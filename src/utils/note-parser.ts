import { Vault, TFile } from 'obsidian';

export interface ParsedNote {
  frontmatter: Record<string, unknown>;
  body: string;
  rawContent: string;
}

/**
 * Parse note content into frontmatter and body
 */
export function parseNote(content: string): ParsedNote {
  const frontmatterRegex = /^---\n([\s\S]*?)\n---\n?/;
  const match = content.match(frontmatterRegex);

  let frontmatter: Record<string, unknown> = {};
  let body = content;

  if (match) {
    try {
      const yamlContent = match[1];
      frontmatter = parseSimpleYaml(yamlContent);
      body = content.slice(match[0].length);
    } catch (e) {
      console.warn('Failed to parse frontmatter:', e);
    }
  }

  return {
    frontmatter,
    body,
    rawContent: content,
  };
}

/**
 * Simple YAML parser for frontmatter
 */
function parseSimpleYaml(yaml: string): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  const lines = yaml.split('\n');

  for (const line of lines) {
    const colonIndex = line.indexOf(':');
    if (colonIndex > 0) {
      const key = line.slice(0, colonIndex).trim();
      let value: string | string[] = line.slice(colonIndex + 1).trim();

      // Remove quotes if present
      if (
        (value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))
      ) {
        value = value.slice(1, -1);
      }

      // Handle arrays (simple case)
      if (value === '') {
        // Check if next lines are array items
        const arrayItems: string[] = [];
        const lineIndex = lines.indexOf(line);
        for (let i = lineIndex + 1; i < lines.length; i++) {
          const nextLine = lines[i];
          if (nextLine.trim().startsWith('- ')) {
            arrayItems.push(nextLine.trim().slice(2));
          } else if (nextLine.trim() && !nextLine.startsWith(' ')) {
            break;
          }
        }
        if (arrayItems.length > 0) {
          result[key] = arrayItems;
          continue;
        }
      }

      result[key] = value;
    }
  }

  return result;
}

/**
 * Update note with audio player after generation
 */
export async function updateNoteWithAudio(
  vault: Vault,
  file: TFile,
  audioPath: string,
  wordCount: number
): Promise<void> {
  const content = await vault.read(file);
  const { rawContent } = parseNote(content);

  const estimatedMinutes = Math.max(1, Math.round(wordCount / 150));

  // Create audio section
  const audioSection = `## 🎙️ 오디오 버전 듣기

<audio controls style="width: 100%; margin: 15px 0 20px 0;">
  <source src="${audioPath}" type="audio/mpeg">
  Your browser does not support the audio element.
</audio>

**이 노트의 요약을 음성으로 들을 수 있습니다** (${wordCount}단어, 약 ${estimatedMinutes}분 소요)

---

`;

  // Update frontmatter with audio_file field
  const timestamp = new Date().toISOString().replace('Z', '+09:00');
  let newContent: string;

  if (rawContent.startsWith('---')) {
    // Has existing frontmatter
    const frontmatterEnd = rawContent.indexOf('---', 3);
    if (frontmatterEnd > 0) {
      let existingFrontmatter = rawContent.slice(0, frontmatterEnd + 3);
      const bodyContent = rawContent.slice(frontmatterEnd + 3).trimStart();

      // Add audio_file field if not exists
      if (!existingFrontmatter.includes('audio_file:')) {
        existingFrontmatter =
          existingFrontmatter.slice(0, -3) + `audio_file: "${audioPath}"\n---`;
      }

      // Update last_modified if exists
      if (existingFrontmatter.includes('last_modified:')) {
        existingFrontmatter = existingFrontmatter.replace(
          /last_modified:.*\n/,
          `last_modified: "${timestamp}"\n`
        );
      }

      newContent = existingFrontmatter + '\n\n' + audioSection + bodyContent;
    } else {
      newContent = rawContent + '\n\n' + audioSection;
    }
  } else {
    // No frontmatter
    newContent = audioSection + rawContent;
  }

  await vault.modify(file, newContent);
}
