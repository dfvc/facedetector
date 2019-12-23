import * as faceapi from 'face-api.js';

export type FaceDetection = faceapi.WithFaceDescriptor<
  faceapi.WithFaceLandmarks<
    { detection: faceapi.FaceDetection; },
    faceapi.FaceLandmarks68
  >
>;
