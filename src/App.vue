<template>
  <div id="app">
    <WelFaceDetector/>
  </div>
</template>

<script lang="ts">
import { Component, Vue } from 'vue-property-decorator';
import WelFaceDetector from './components/TheFaceDetector/TheFaceDetector.component.vue';

@Component({
  components: {
    WelFaceDetector,
  },
})
export default class App extends Vue {}
</script>
