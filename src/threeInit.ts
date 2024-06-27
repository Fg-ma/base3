import * as THREE from "three";
import textureUrl from "../public/james2.png";

const threeInit = (canvas: HTMLCanvasElement, video: HTMLVideoElement) => {
  const canvasWidth = video.clientWidth;
  const canvasHeight = video.clientHeight;

  canvas.width = canvasWidth;
  canvas.height = canvasHeight;

  const scene = new THREE.Scene();
  const camera = new THREE.OrthographicCamera(
    0,
    canvasWidth,
    canvasHeight,
    0,
    -10,
    10
  );

  const renderer = new THREE.WebGLRenderer({ canvas });
  renderer.setSize(canvasWidth, canvasHeight);

  const textureLoader = new THREE.TextureLoader();

  // Create a promise for loading the texture
  const texturePromise = new Promise<THREE.Texture>((resolve, reject) => {
    textureLoader.load(
      textureUrl,
      (loadedTexture) => {
        loadedTexture.flipY = false;
        loadedTexture.premultiplyAlpha = false;
        resolve(loadedTexture);
      },
      undefined,
      reject
    );
  });

  return texturePromise.then((texture) => {
    return { canvasWidth, canvasHeight, scene, camera, renderer, texture };
  });
};

export default threeInit;
