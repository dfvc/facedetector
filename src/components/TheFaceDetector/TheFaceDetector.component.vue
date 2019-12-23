<template>
  <div class="wel-face-detector">
    <div
      v-if="currentLoadingMessage.length"
      class="wel-face-detector__loader"
    >
      <div class="wel-face-detector__loader-items">
        <div
          v-for="(message, type) of loadingMessages"
          :key="`${type}Item`"
          :class="{
              'wel-face-detector__loader-item--current': message.loading
            }"
          class="wel-face-detector__loader-item"
        />
      </div>
      <p class="wel-face-detector__loader-message">{{ currentLoadingMessage }}</p>
    </div>

    <img
      ref="bulb"
      src="../../assets/images/light-bulb-off.svg"
      class="wel-face-detector__bulb"
    >

    <p
      v-if="reactions.count && faceDetections.length"
      class="wel-face-detector__counter"
    >
      {{ faceDetections.length }}
    </p>

    <div
      :style="{
        width: `${captureArea.width}px`,
        height: `${captureArea.height}px`,
      }"
      class="wel-face-detector__inner"
    >
      <video
        ref="videoPlayer"
        class="wel-face-detector__video-player"
      />
      <canvas
        v-if="reactions.tagFaces"
        ref="canvas"
        class="wel-face-detector__canvas"
      />
    </div>

    <img
      ref="pulse"
      src="../../assets/images/pulse.svg"
      class="wel-face-detector__pulse"
    >

    <p
      v-if="subtitleSentence.length"
      ref="subtitle"
      class="wel-face-detector__subtitle"
    >
      {{ subtitleSentence }}
    </p>
  </div>
</template>

<script lang="ts">
import { Component, Vue, Watch } from 'vue-property-decorator';
import * as faceapi from 'face-api.js';
import { FaceDetection } from '@/types/face-detection.type';
import { CONFIGS } from '@/constants/configs.consts';
import {
  PERSONS,
  PERSON_DRAW_BOX_OPTIONS,
  UNKNOWN_PERSON,
} from '@/constants/persons.consts';
import { LOADING_MESSAGES } from '@/constants/loading-messages.consts';
import { SWITCHES } from '@/constants/switches.consts';
import { IDrawBoxOptions } from '@/interfaces/draw-box.interface';

@Component({
  name: 'wel-face-detector',
})
export default class WelFaceDetector extends Vue {
  /**
   * Data
   */
  public captureArea = CONFIGS.captureArea;

  public reactions = CONFIGS.reactions;

  public loadingMessages = LOADING_MESSAGES;

  public subtitleSentence = '';

  public faceDetections: FaceDetection[] = [];

  private videoPlayer: HTMLVideoElement;

  private canvas: HTMLCanvasElement;

  private faceDescriptors: faceapi.LabeledFaceDescriptors[];

  private faceMatcher: faceapi.FaceMatcher;

  private faceMatches: faceapi.FaceMatch[];

  private pulse: HTMLImageElement;

  private subtitle: HTMLParagraphElement;

  private bulb: HTMLImageElement;

  /**
   * Computed Properties
   */
  public get currentLoadingMessage(): string {
    let message = '';

    Object.keys(this.loadingMessages).forEach((messageType) => {
      message += this.loadingMessages[messageType].loading
        ? this.loadingMessages[messageType].message
        : '';
    });

    return message;
  }

  /**
   * Lifecycle Events
   */
  public created(): void {
    this.adjustLoadingMessages();
  }

  public mounted(): void {
    this.init();
  }

  /**
   * Watchers
   */
  @Watch('faceDetections')
  private faceDetectionsChanged(): void {
    if (CONFIGS.reactions.switchLights) {
      this.switchLights('livingRoom');
    }
  }

  /**
   * Methods
   */
  private adjustLoadingMessages(): void {
    if (!CONFIGS.recognize) {
      delete this.loadingMessages.descriptors;
      delete this.loadingMessages.matcher;
    }

    if (!CONFIGS.reactions.tagFaces) {
      delete this.loadingMessages.canvas;
    }

    if (!CONFIGS.reactions.speak) {
      delete this.loadingMessages.pulse;
    }

    if (!CONFIGS.reactions.subtitle) {
      delete this.loadingMessages.subtitle;
    }

    if (!CONFIGS.reactions.switchLights) {
      delete this.loadingMessages.bulb;
    }
  }

  private async init(): Promise<void> {
    return new Promise(async () => {
      try {
        await this.loadFaceApiModels();
        await this.loadFaceDescriptors();
        await this.loadFaceMatcher();
        await this.loadVideoPlayer();
        await this.loadCanvas();
        await this.loadPulse();
        await this.loadSubtitle();
        await this.loadBulb();
      } catch (err) {
        console.error(`${err.name}: ${err.message}`);
      } finally {
        this.startFaceDetection();
      }
    });
  }

  private async loadFaceApiModels(): Promise<void> {
    this.updateLoadingMessages('models', true);
    await Promise.all([
      faceapi.nets.ssdMobilenetv1.loadFromUri(CONFIGS.modelsPath),
      faceapi.nets.faceLandmark68Net.loadFromUri(CONFIGS.modelsPath),
      faceapi.nets.faceRecognitionNet.loadFromUri(CONFIGS.modelsPath),
    ]);
    this.updateLoadingMessages('models', false);
  }

  private async loadFaceDescriptors(): Promise<void> {
    if (!CONFIGS.recognize) return;

    this.updateLoadingMessages('descriptors', true);
    this.faceDescriptors = await Promise.all(
      Object.keys(PERSONS).map(async person => new faceapi.LabeledFaceDescriptors(
        person,
        await this.loadPersonFaceDescriptors(person),
      )),
    );
    this.updateLoadingMessages('descriptors', false);
  }

  private async loadPersonFaceDescriptors(person: string): Promise<Float32Array[]> {
    const descriptors = [];

    /* eslint-disable no-await-in-loop */
    for (let i = 1; i <= CONFIGS.maxFacesPerPerson; i++) {
      try {
        const faceImage = await faceapi.fetchImage(`${CONFIGS.facesPath}/${person}/${i}.png`);
        const detection = await faceapi
          .detectSingleFace(faceImage)
          .withFaceLandmarks()
          .withFaceDescriptor();

        descriptors.push(detection.descriptor);
        // eslint-disable-next-line no-empty
      } catch {}
    }
    /* eslint-enable no-await-in-loop */

    return descriptors;
  }

  private loadFaceMatcher(): void {
    if (!CONFIGS.recognize) return;

    this.updateLoadingMessages('matcher', true);
    this.faceMatcher = new faceapi.FaceMatcher(
      this.faceDescriptors,
      CONFIGS.faceMatchThreshold,
    );
    this.updateLoadingMessages('matcher', false);
  }

  private async loadVideoPlayer(): Promise<void> {
    this.updateLoadingMessages('video', true);
    const mediaStream = await navigator.mediaDevices.getUserMedia({
      audio: false,
      video: {
        ...CONFIGS.captureArea,
      },
    });

    this.videoPlayer = this.$refs.videoPlayer as HTMLVideoElement;
    this.videoPlayer.srcObject = mediaStream;
    this.videoPlayer.onloadedmetadata = (): void => {
      this.videoPlayer.play();
    };
    this.updateLoadingMessages('video', false);
  }

  private loadCanvas(): void {
    if (!CONFIGS.reactions.tagFaces) return;

    this.updateLoadingMessages('canvas', true);
    this.canvas = this.$refs.canvas as HTMLCanvasElement;
    this.canvas.setAttribute('width', `${CONFIGS.captureArea.width}px`);
    this.canvas.setAttribute('height', `${CONFIGS.captureArea.height}px`);
    this.updateLoadingMessages('canvas', false);
  }

  private loadPulse(): void {
    if (!CONFIGS.reactions.speak) return;

    this.updateLoadingMessages('pulse', true);
    this.pulse = this.$refs.pulse as HTMLImageElement;
    this.updateLoadingMessages('pulse', false);
  }

  private loadSubtitle(): void {
    if (!CONFIGS.reactions.subtitle) return;

    this.updateLoadingMessages('subtitle', true);
    this.subtitle = this.$refs.subtitle as HTMLParagraphElement;
    this.updateLoadingMessages('subtitle', false);
  }

  private loadBulb(): void {
    if (!CONFIGS.reactions.switchLights) return;

    this.updateLoadingMessages('bulb', true);
    this.bulb = this.$refs.bulb as HTMLImageElement;
    this.updateLoadingMessages('bulb', false);
  }

  private updateLoadingMessages(type: string, loading: boolean): void {
    this.loadingMessages[type].loading = loading;
  }

  private startFaceDetection(): void {
    setInterval(async () => {
      const detections = await faceapi
        .detectAllFaces(this.videoPlayer)
        .withFaceLandmarks()
        .withFaceDescriptors();

      this.faceDetections = faceapi.resizeResults(detections, CONFIGS.captureArea);

      if (CONFIGS.recognize) {
        this.updateFaceMatches();
      }

      this.reactToDetections();
    }, CONFIGS.faceDetectionRate);
  }

  private updateFaceMatches(): void {
    this.faceMatches = this.faceDetections.map(
      desc => this.faceMatcher.findBestMatch(desc.descriptor),
    );
  }

  private reactToDetections(): void {
    if (CONFIGS.reactions.tagFaces) {
      this.drawTags();
    }

    if (CONFIGS.reactions.speak || CONFIGS.reactions.subtitle) {
      this.communicate();
    }
  }

  private drawTags(): void {
    this.clearCanvas();

    if (CONFIGS.recognize) {
      this.drawMatchTags();
    } else {
      this.drawDetectionTags();
    }
  }

  private clearCanvas(): void {
    this.canvas
      .getContext('2d')
      .clearRect(0, 0, CONFIGS.captureArea.width, CONFIGS.captureArea.height);
  }

  private drawDetectionTags(): void {
    this.faceDetections.forEach((detection, i) => {
      const { box } = detection.detection;
      const drawBox = new faceapi.draw.DrawBox(
        box,
        this.getDrawBoxOptionsFor('unknown'),
      );

      drawBox.draw(this.canvas);
    });
  }

  private drawMatchTags(): void {
    this.faceMatches.forEach((match, i) => {
      const { box } = this.faceDetections[i].detection;
      const drawBox = new faceapi.draw.DrawBox(
        box,
        this.getDrawBoxOptionsFor(match.label),
      );

      drawBox.draw(this.canvas);
    });
  }

  private getDrawBoxOptionsFor(personName: string): IDrawBoxOptions {
    const person = personName === 'unknown'
      ? UNKNOWN_PERSON
      : PERSONS[personName];

    return {
      ...PERSON_DRAW_BOX_OPTIONS,
      boxColor: person.color,
      label: person.name,
    };
  }

  private communicate(): void {
    if (CONFIGS.recognize) {
      this.faceMatches.forEach((match) => {
        if (this.canCommunicateTo(match.label)) {
          const sentence = match.label !== 'unknown'
            ? this.getSentenceFor(match.label)
            : this.getSentenceForUnknown();

          if (CONFIGS.reactions.speak) this.say(sentence);
          if (CONFIGS.reactions.subtitle) this.writeSubtitle(sentence);
        }
      });
    } else if (this.canCommunicateTo('unknown')) {
      const sentence = this.getSentenceForUnknown();

      if (CONFIGS.reactions.speak) this.say(sentence);
      if (CONFIGS.reactions.subtitle) this.writeSubtitle(sentence);
    }
  }

  private canCommunicateTo(personName: string): boolean {
    const currTimestamp = Math.floor(Date.now() / 1000);

    return personName === 'unknown'
      ? UNKNOWN_PERSON.sentences.salutations.nextTime <= currTimestamp
      : PERSONS[personName].sentences.salutations.nextTime <= currTimestamp;
  }

  private getSentenceFor(personName: string): string {
    const randSalutationIndex = Math.floor(
      Math.random() * PERSONS[personName].sentences.salutations.items.length,
    );

    const currTimestamp = Math.floor(Date.now() / 1000);
    const sentenceTimeout = PERSONS[personName].sentences.salutations.timeout;
    PERSONS[personName].sentences.salutations.nextTime = currTimestamp + sentenceTimeout;

    return PERSONS[personName]
      .sentences.salutations.items[randSalutationIndex]
      .replace('%name', PERSONS[personName].shortName);
  }

  private getSentenceForUnknown(): string {
    const randSalutationIndex = Math.floor(
      Math.random() * UNKNOWN_PERSON.sentences.salutations.items.length,
    );

    const currTimestamp = Math.floor(Date.now() / 1000);
    const sentenceTimeout = UNKNOWN_PERSON.sentences.salutations.timeout;
    UNKNOWN_PERSON.sentences.salutations.nextTime = currTimestamp + sentenceTimeout;

    return UNKNOWN_PERSON
      .sentences.salutations.items[randSalutationIndex]
      .replace('%name', '');
  }

  private say(sentence: string): void {
    const speaker = new SpeechSynthesisUtterance();
    speaker.volume = CONFIGS.speakerVolume;
    speaker.text = sentence;
    window.speechSynthesis.speak(speaker);
    this.animatePulse();
  }

  private animatePulse(): void {
    this.pulse.classList.add('wel-face-detector__pulse--visible');
    setTimeout(() => {
      this.pulse.classList.remove('wel-face-detector__pulse--visible');
    }, CONFIGS.spellPulseDuration);
  }

  private writeSubtitle(sentence: string): void {
    this.subtitleSentence = sentence;

    setTimeout(() => {
      this.subtitleSentence = '';
    }, CONFIGS.spellPulseDuration);
  }

  private switchLights(switchId: string): void {
    let url = '';

    if (this.faceDetections.length && !SWITCHES[switchId].on) {
      url = SWITCHES[switchId].requestOn;
    }

    if (!this.faceDetections.length && SWITCHES[switchId].on) {
      url = SWITCHES[switchId].requestOff;
    }

    if (url.length) {
      const Http = new XMLHttpRequest();

      Http.open('GET', url);
      // Http.send();
      SWITCHES[switchId].on = !SWITCHES[switchId].on;
      this.animateBulb(switchId);
    }
  }

  private animateBulb(switchId: string): void {
    // this.bulb.classList.add('wel-face-detector__bulb--visible');
    // setTimeout(() => {
    //   this.bulb.classList.remove('wel-face-detector__bulb--visible');
    // }, CONFIGS.switchBulbDuration);
  }
}
</script>

<style lang="scss" scoped>
  $color-primary-dark: #606060;
  $color-primary-regular: #242424;

  $loader-current-item-color: #fff;
  $loader-item-size: 26px;
  $loader-item-margin: 4px;

  $subtitle-text-color: #fff;

  $counter-bg-color: lighten($color-primary-dark, 5%);
  $counter-text-color: $color-primary-dark;

  .wel-face-detector {
    display: flex;
    justify-content: center;
    align-items: center;
    width: 100vw;
    height: 100vh;
    background-color: $color-primary-dark;

    &__loader {
      position: absolute;
      z-index: 10;
      display: flex;
      justify-content: center;
      align-items: center;
      flex-direction: column;
      width: 100%;
      height: 100%;
      font-size: 14px;
      color: $loader-current-item-color;
      background: $color-primary-dark;
    }

    &__loader-items {
      display: flex;
    }

    &__loader-item {
      margin: $loader-item-margin;
      border: 1px solid $color-primary-regular;
      width: $loader-item-size;
      height: $loader-item-size;
      background-color: $color-primary-regular;

      &--current {
        border-color: $loader-current-item-color;
        width: $loader-item-size;
        background-color: $loader-current-item-color;
      }
    }

    &__loader-message {
      margin: $loader-item-margin * 2 0 0;
      min-height: 40px;
    }

    &__inner {
      position: relative;
      box-sizing: content-box;
      border: 5px solid $color-primary-regular;
    }

    &__video-player,
    &__canvas {
      position: absolute;
      top: 0;
      left: 0;
    }

    &__pulse {
      position: absolute;
      left: -140px;
      bottom: -140px;
      width: 280px;
      opacity: 0;
      transition: opacity 1s ease;

      &--visible {
        opacity: 1;
      }
    }

    &__subtitle {
      position: absolute;
      left: 0;
      right: 0;
      bottom: 0;
      margin: 0 160px 40px 160px;
      line-height: 1;
      font-size: 50px;
      text-align: center;
      color: $subtitle-text-color;
    }

    &__counter {
      position: absolute;
      right: -140px;
      top: -140px;
      display: flex;
      justify-content: flex-start;
      align-items: flex-end;
      margin: 0;
      padding: 20px 60px;
      width: 280px;
      height: 280px;
      line-height: 1;
      font-size: 100px;
      color: $counter-text-color;
      background-color: $counter-bg-color;
      border-radius: 50%;
    }

    &__bulb {
      position: absolute;
      left: 0;
      top: 0;
      height: 280px;
      opacity: 0;
      transition: opacity 1s ease;

      &--visible {
        opacity: 1;
      }
    }
  }
</style>
