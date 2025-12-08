import { App, PluginSettingTab, Setting } from 'obsidian';
import type AudioGeneratorPlugin from '../../main';
import { AIProvider, PROVIDER_METADATA } from '../types/settings';

export class AudioGeneratorSettingTab extends PluginSettingTab {
  plugin: AudioGeneratorPlugin;

  constructor(app: App, plugin: AudioGeneratorPlugin) {
    super(app, plugin);
    this.plugin = plugin;
  }

  display(): void {
    const { containerEl } = this;
    containerEl.empty();

    // Header
    containerEl.createEl('h1', { text: 'Audio Generator Settings' });

    // ========== AI Provider Section ==========
    containerEl.createEl('h2', { text: 'AI Summarization' });

    // Enable/Disable summarization
    new Setting(containerEl)
      .setName('Enable Summarization')
      .setDesc('Automatically summarize long notes before audio generation')
      .addToggle((toggle) =>
        toggle.setValue(this.plugin.settings.enableSummarization).onChange(async (value) => {
          this.plugin.settings.enableSummarization = value;
          await this.plugin.saveSettings();
        })
      );

    // Summarization threshold
    new Setting(containerEl)
      .setName('Summarization Threshold')
      .setDesc('Word count above which summarization is applied')
      .addText((text) =>
        text
          .setPlaceholder('2000')
          .setValue(String(this.plugin.settings.summarizationThreshold))
          .onChange(async (value) => {
            const num = parseInt(value, 10);
            if (!isNaN(num) && num > 0) {
              this.plugin.settings.summarizationThreshold = num;
              await this.plugin.saveSettings();
            }
          })
      );

    // Active provider selection
    new Setting(containerEl)
      .setName('Active AI Provider')
      .setDesc('Select which AI provider to use for summarization')
      .addDropdown((dropdown) => {
        PROVIDER_METADATA.forEach((provider) => {
          dropdown.addOption(provider.id, provider.label);
        });
        dropdown.setValue(this.plugin.settings.ai.activeProvider).onChange(async (value: string) => {
          this.plugin.settings.ai.activeProvider = value as AIProvider;
          await this.plugin.saveSettings();
          this.display();
        });
      });

    // Provider-specific settings
    containerEl.createEl('h3', { text: 'Provider Configuration' });

    PROVIDER_METADATA.forEach((provider) => {
      const isActive = this.plugin.settings.ai.activeProvider === provider.id;
      const providerConfig = this.plugin.settings.ai.providers[provider.id];

      const providerContainer = containerEl.createDiv({
        cls: `provider-settings ${isActive ? 'active' : 'inactive'}`,
      });

      if (isActive) {
        providerContainer.style.backgroundColor = 'var(--background-secondary)';
        providerContainer.style.padding = '10px';
        providerContainer.style.borderRadius = '8px';
        providerContainer.style.marginBottom = '10px';
      }

      providerContainer.createEl('h4', {
        text: `${provider.label} ${isActive ? '(Active)' : ''}`,
      });

      // API Key
      new Setting(providerContainer)
        .setName(`${provider.label} API Key`)
        .setDesc(`Get your API key from ${provider.docsUrl}`)
        .addText((text) =>
          text
            .setPlaceholder(provider.placeholderKey)
            .setValue(providerConfig.apiKey)
            .onChange(async (value) => {
              this.plugin.settings.ai.providers[provider.id].apiKey = value;
              await this.plugin.saveSettings();
            })
        )
        .addExtraButton((button) =>
          button
            .setIcon('external-link')
            .setTooltip('Open API key page')
            .onClick(() => {
              window.open(provider.docsUrl, '_blank');
            })
        );

      // Model selection
      new Setting(providerContainer)
        .setName(`${provider.label} Model`)
        .setDesc('Select or enter model name')
        .addDropdown((dropdown) => {
          provider.models.forEach((model) => {
            dropdown.addOption(model, model);
          });
          dropdown.setValue(providerConfig.model).onChange(async (value) => {
            this.plugin.settings.ai.providers[provider.id].model = value;
            await this.plugin.saveSettings();
          });
        });
    });

    // ========== ElevenLabs Section ==========
    containerEl.createEl('h2', { text: 'ElevenLabs TTS' });

    // ElevenLabs API Key
    new Setting(containerEl)
      .setName('ElevenLabs API Key')
      .setDesc('Get your API key from https://elevenlabs.io')
      .addText((text) =>
        text
          .setPlaceholder('Enter your ElevenLabs API key')
          .setValue(this.plugin.settings.elevenlabs.apiKey)
          .onChange(async (value) => {
            this.plugin.settings.elevenlabs.apiKey = value;
            await this.plugin.saveSettings();
          })
      )
      .addExtraButton((button) =>
        button
          .setIcon('external-link')
          .setTooltip('Open ElevenLabs')
          .onClick(() => {
            window.open('https://elevenlabs.io', '_blank');
          })
      );

    // Voice ID
    new Setting(containerEl)
      .setName('Voice ID')
      .setDesc('Default: 4JJwo477JUAx3HV0T7n7 (Korean-optimized multilingual)')
      .addText((text) =>
        text
          .setPlaceholder('4JJwo477JUAx3HV0T7n7')
          .setValue(this.plugin.settings.elevenlabs.voiceId)
          .onChange(async (value) => {
            this.plugin.settings.elevenlabs.voiceId = value || '4JJwo477JUAx3HV0T7n7';
            await this.plugin.saveSettings();
          })
      );

    // Model (display - mandatory)
    new Setting(containerEl)
      .setName('TTS Model')
      .setDesc('eleven_turbo_v2_5 (Required for Korean support)')
      .addText((text) => text.setValue(this.plugin.settings.elevenlabs.model).setDisabled(true));

    // Output format (display)
    new Setting(containerEl)
      .setName('Output Format')
      .setDesc('mp3_44100_192 (High quality 192kbps)')
      .addText((text) => text.setValue(this.plugin.settings.elevenlabs.outputFormat).setDisabled(true));
  }
}
