# Obsidian Audio Generator

Obsidian 노트에서 AI 요약과 ElevenLabs TTS를 사용하여 고품질 오디오를 생성하는 플러그인입니다.

## 기능

- **멀티 AI 제공업체 지원**: XAI (Grok), OpenAI, Anthropic (Claude), Google Gemini
- **ElevenLabs TTS**: 한국어 최적화된 음성 합성
- **자동 요약**: 긴 노트를 500-1000단어로 자동 요약
- **한국어 텍스트 전처리**: TTS에 최적화된 텍스트 정제
- **오디오 플레이어 임베딩**: 노트에 자동으로 오디오 플레이어 추가

## 설치

1. Obsidian 설정 → 커뮤니티 플러그인 → "Audio Generator" 검색
2. 또는 수동 설치:
   - 이 폴더를 `VaultFolder/.obsidian/plugins/obsidian-audio-generator/`에 복사
   - Obsidian 재시작 후 플러그인 활성화

## 설정

### AI 제공업체 설정

플러그인 설정에서 사용할 AI 제공업체를 선택하고 API 키를 입력하세요:

- **xAI (Grok)**: https://console.x.ai
- **OpenAI**: https://platform.openai.com/api-keys
- **Anthropic**: https://console.anthropic.com/settings/keys
- **Google Gemini**: https://aistudio.google.com/app/apikey

### ElevenLabs 설정

- **API Key**: https://elevenlabs.io 에서 발급
- **Voice ID**: 기본값 `4JJwo477JUAx3HV0T7n7` (한국어 최적화 음성)
- **Model**: `eleven_turbo_v2_5` (한국어 지원, 빠른 속도)

## 사용법

### 명령 팔레트

1. `Ctrl/Cmd + P` 로 명령 팔레트 열기
2. "Generate audio from current note" 선택

### 우클릭 메뉴

- 파일 탐색기에서 마크다운 파일 우클릭 → "Generate Audio"
- 에디터에서 우클릭 → "Generate Audio from Note"

## 오디오 저장 위치

생성된 오디오 파일은 `Audio/` 폴더에 저장됩니다:
```
Obsidian Vault/
├── Audio/
│   └── 노트이름.mp3
└── ...
```

## 자동 요약

다음 조건에서 자동으로 요약이 적용됩니다:
- 노트 단어 수 > 2000단어 (설정에서 변경 가능)
- 노트 타입이 `가이드`, `리소스`, `유튜브학습노트`, `회고`인 경우

## 트러블슈팅

### API 키 오류
- 설정에서 API 키가 올바르게 입력되었는지 확인
- ElevenLabs와 선택한 AI 제공업체 모두 API 키 필요

### 오디오 생성 실패
- 네트워크 연결 확인
- ElevenLabs API 할당량 확인
- 노트 내용이 너무 짧지 않은지 확인 (최소 50자)

## 라이선스

MIT License

## 버전

- **1.0.1**: 모델 업데이트 (2026-02-16)
  - Claude 모델명 수정 (claude-sonnet-4 → claude-sonnet-4-5-20250929)
  - 최신 AI 모델 지원 추가
    - Anthropic: Claude Opus 4.6, Sonnet 4.5, Haiku 4.5
    - xAI: Grok 4.1 Fast Reasoning, Grok 4.1 Fast Non-Reasoning
    - Gemini: 2.5 Flash, 2.5 Pro
  - 버그 수정: 잘못된 모델 ID로 인한 API 오류 해결
- **1.0.0**: 초기 릴리스
  - 4개 AI 제공업체 지원 (XAI, OpenAI, Anthropic, Gemini)
  - ElevenLabs TTS 통합
  - 한국어 텍스트 전처리
  - 자동 요약 기능
