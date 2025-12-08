import { Plugin, Notice, TFile, Menu, Editor, MarkdownView } from 'obsidian';
import { AudioGeneratorSettings, DEFAULT_SETTINGS } from './src/types/settings';
import { AudioGeneratorSettingTab } from './src/ui/settings-tab';
import { createAIClient } from './src/services/ai/ai-client';
import { ElevenLabsService } from './src/services/tts/elevenlabs-service';
import { preprocessTextForTTS, getWordCount } from './src/utils/text-preprocessor';
import { parseNote, updateNoteWithAudio } from './src/utils/note-parser';

export default class AudioGeneratorPlugin extends Plugin {
  settings: AudioGeneratorSettings;

  async onload(): Promise<void> {
    console.log('Loading Audio Generator Plugin');

    // Load settings
    await this.loadSettings();

    // Add settings tab
    this.addSettingTab(new AudioGeneratorSettingTab(this.app, this));

    // Register command palette command
    this.addCommand({
      id: 'generate-audio-from-note',
      name: 'Generate audio from current note',
      editorCallback: async (editor: Editor, view: MarkdownView) => {
        if (view.file) {
          await this.generateAudioFromNote(view.file);
        }
      },
    });

    // Register file menu (right-click) option
    this.registerEvent(
      this.app.workspace.on('file-menu', (menu: Menu, file: TFile) => {
        if (file.extension === 'md') {
          menu.addItem((item) => {
            item
              .setTitle('Generate Audio')
              .setIcon('volume-2')
              .onClick(async () => {
                await this.generateAudioFromNote(file);
              });
          });
        }
      })
    );

    // Register editor menu (right-click in editor)
    this.registerEvent(
      this.app.workspace.on('editor-menu', (menu: Menu, editor: Editor, view: MarkdownView) => {
        menu.addItem((item) => {
          item
            .setTitle('Generate Audio from Note')
            .setIcon('volume-2')
            .onClick(async () => {
              if (view.file) {
                await this.generateAudioFromNote(view.file);
              }
            });
        });
      })
    );
  }

  async onunload(): Promise<void> {
    console.log('Unloading Audio Generator Plugin');
  }

  async loadSettings(): Promise<void> {
    this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
  }

  async saveSettings(): Promise<void> {
    await this.saveData(this.settings);
  }

  async generateAudioFromNote(file: TFile | null): Promise<void> {
    if (!file) {
      new Notice('No file selected');
      return;
    }

    // Validation checks
    if (!this.validateSettings()) {
      new Notice('Please configure API keys in settings');
      return;
    }

    try {
      new Notice('Starting audio generation...');

      // Step 1: Read and parse note
      const content = await this.app.vault.read(file);
      const { frontmatter, body } = parseNote(content);

      // Step 2: Check for existing audio
      const audioFile = frontmatter.audio_file as string | undefined;
      if (audioFile && (await this.audioFileExists(audioFile))) {
        new Notice('Audio already exists for this note. Skipping generation.');
        return;
      }

      // Step 3: Determine if summarization is needed
      const wordCount = getWordCount(body);
      const noteType = frontmatter.type as string | undefined;
      const needsSummarization =
        wordCount > this.settings.summarizationThreshold ||
        ['가이드', '리소스', '유튜브학습노트', '회고'].includes(noteType || '');

      // Step 4: Get text for TTS (with optional summarization)
      let textForTTS: string;
      if (needsSummarization && this.settings.enableSummarization) {
        new Notice('Generating summary...');
        textForTTS = await this.summarizeContent(body, noteType || '기본');
      } else {
        textForTTS = body;
      }

      // Step 5: Preprocess text for TTS
      const cleanedText = preprocessTextForTTS(textForTTS);

      if (cleanedText.length < 50) {
        new Notice('Note content is too short to generate audio');
        return;
      }

      // Step 6: Generate audio with ElevenLabs
      new Notice('Generating audio with ElevenLabs...');
      const audioPath = await this.generateAudio(cleanedText, file);

      // Step 7: Update note with audio player
      const finalWordCount = getWordCount(cleanedText);
      await updateNoteWithAudio(this.app.vault, file, audioPath, finalWordCount);

      new Notice(`Audio generated successfully: ${audioPath}`);
    } catch (error) {
      console.error('Audio generation failed:', error);
      new Notice(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private validateSettings(): boolean {
    const hasAIKey = this.getActiveAIApiKey() !== '';
    const hasElevenLabsKey = this.settings.elevenlabs.apiKey !== '';
    return hasAIKey && hasElevenLabsKey;
  }

  private getActiveAIApiKey(): string {
    const provider = this.settings.ai.activeProvider;
    return this.settings.ai.providers[provider]?.apiKey || '';
  }

  private async audioFileExists(audioPath: string): Promise<boolean> {
    const file = this.app.vault.getAbstractFileByPath(audioPath);
    return file !== null;
  }

  private async summarizeContent(content: string, noteType: string): Promise<string> {
    const provider = this.settings.ai.activeProvider;
    const config = this.settings.ai.providers[provider];

    const client = createAIClient({
      provider: provider,
      apiKey: config.apiKey,
      model: config.model,
    });

    const prompts = this.getSummarizationPrompt(content, noteType);
    return await client.generateText(prompts.userPrompt, prompts.systemPrompt);
  }

  private getSummarizationPrompt(
    content: string,
    noteType: string
  ): { systemPrompt: string; userPrompt: string } {
    const systemPrompt = `You are an expert content summarizer. Create beginner-friendly summaries optimized for audio listening.
Write in Korean using natural spoken language. Remove all markdown formatting, code blocks, and URLs.
Focus on key concepts and practical insights. Target 500-1000 words.`;

    let userPrompt: string;

    switch (noteType) {
      case '가이드':
      case '리소스':
        userPrompt = `다음 기술 가이드 문서를 초보자가 이해하기 쉽도록 500-1000단어로 요약해주세요.
음성으로 듣기에 적합한 형태로 작성하되, 다음 요소를 포함해주세요:

1. 이 가이드가 다루는 핵심 개념 설명
2. 주요 기능이나 단계를 순서대로 설명
3. 초보자가 알아야 할 중요한 포인트 강조
4. 실용적인 활용 예시나 팁

주의사항:
- 마크다운 문법 제거 (##, **, - 등)
- 코드 블록은 "코드 예시"로 간단히 언급
- 구어체로 자연스럽게 작성
- 기술 용어는 한국어로 설명 추가

원문:
${content}`;
        break;

      case '유튜브학습노트':
        userPrompt = `다음 유튜브 학습 노트를 초보자가 이해하기 쉽도록 500-1000단어로 요약해주세요.
음성으로 듣기에 적합한 형태로 작성하되, 다음 요소를 포함해주세요:

1. 영상의 주제와 전체적인 내용 소개
2. 핵심 학습 내용을 3-5개 포인트로 정리
3. 실습이나 예제가 있다면 간단히 설명
4. 이 내용을 학습하면 무엇을 할 수 있는지 설명

주의사항:
- 마크다운 문법 제거
- 타임스탬프나 URL은 생략
- 구어체로 자연스럽게 작성
- 학습 순서를 논리적으로 재구성

원문:
${content}`;
        break;

      case '회고':
        userPrompt = `다음 회고 노트를 초보자가 이해하기 쉽도록 500-1000단어로 요약해주세요.
음성으로 듣기에 적합한 형태로 작성하되, 다음 요소를 포함해주세요:

1. 회고의 주요 주제와 배경
2. 핵심 발견사항 3-5개 포인트
3. 중요한 인사이트나 교훈
4. 실무 적용 계획이나 다음 액션

주의사항:
- 마크다운 문법 제거
- 구어체로 자연스럽게 작성
- 개인적인 통찰을 중심으로 정리
- 긍정적이고 건설적인 톤 유지

원문:
${content}`;
        break;

      default:
        userPrompt = `다음 문서를 초보자가 이해하기 쉽도록 500-1000단어로 요약해주세요.
음성으로 듣기에 적합한 형태로 작성해주세요:

1. 문서의 주제와 목적
2. 핵심 내용을 3-5개 포인트로 정리
3. 중요한 개념이나 용어 설명
4. 실용적인 활용 방법

주의사항:
- 마크다운 문법 제거
- 구어체로 자연스럽게 작성
- 한국어로 작성

원문:
${content}`;
    }

    return { systemPrompt, userPrompt };
  }

  private async generateAudio(text: string, file: TFile): Promise<string> {
    const service = new ElevenLabsService({
      apiKey: this.settings.elevenlabs.apiKey,
      voiceId: this.settings.elevenlabs.voiceId,
      model: this.settings.elevenlabs.model,
      outputFormat: this.settings.elevenlabs.outputFormat,
    });

    const audioBuffer = await service.textToSpeech(text);

    // Save audio file in Audio folder at vault root
    const noteName = file.basename;
    const audioFileName = `${noteName}.mp3`;
    const audioFolderPath = 'Audio';
    const audioPath = `${audioFolderPath}/${audioFileName}`;

    // Create Audio folder if it doesn't exist
    const audioFolder = this.app.vault.getAbstractFileByPath(audioFolderPath);
    if (!audioFolder) {
      await this.app.vault.createFolder(audioFolderPath);
    }

    // Check if file already exists and delete it
    const existingFile = this.app.vault.getAbstractFileByPath(audioPath);
    if (existingFile) {
      await this.app.vault.delete(existingFile);
    }

    await this.app.vault.createBinary(audioPath, audioBuffer);

    return audioPath;
  }
}
