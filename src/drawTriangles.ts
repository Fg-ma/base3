import * as THREE from "three";
import { Point2D, Point3D } from "./overlayImageOnLiveVideo";
import textureUrl from "../public/james.png";

export const drawTriangles = (
  srcTrianglesArray: [Point2D, Point2D, Point2D][],
  destTrianglesArray: [Point3D, Point3D, Point3D][],
  canvas: HTMLCanvasElement
) => {
  const canvasWidth = 320;
  const canvasHeight = 320;

  canvas.width = canvasWidth;
  canvas.height = canvasHeight;

  const scene = new THREE.Scene();
  const camera = new THREE.OrthographicCamera(
    0,
    canvasWidth,
    canvasHeight,
    0,
    -1,
    1
  );

  const renderer = new THREE.WebGLRenderer({ canvas });
  renderer.setSize(canvasWidth, canvasHeight);

  const textureLoader = new THREE.TextureLoader();

  const addTriangle = (
    vertices: number[],
    uv: number[],
    material: THREE.Material
  ) => {
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute(
      "position",
      new THREE.Float32BufferAttribute(vertices, 3)
    );
    geometry.setAttribute("uv", new THREE.Float32BufferAttribute(uv, 2));
    geometry.setIndex([0, 1, 2]);
    const mesh = new THREE.Mesh(geometry, material);
    scene.add(mesh);
  };

  const texture = textureLoader.load(textureUrl, (loadedTexture) => {
    loadedTexture.flipY = false;
    loadedTexture.premultiplyAlpha = false;

    srcTrianglesArray.forEach((triangle, index) => {
      const srcVertices: number[] = [];
      const uv: number[] = [];

      triangle.forEach((point) => {
        srcVertices.push(
          Math.floor(point.x * canvasWidth),
          Math.floor((1 - point.y) * canvasHeight),
          0
        );
        // Calculate UV coordinates based on triangle position
        uv.push(point.x, 1 - point.y); // Assuming UV coordinates match vertex positions
      });

      const destTriangle = destTrianglesArray[index];
      if (!destTriangle) {
        return;
      }
      const destVertices: number[] = [];
      destTriangle.forEach((point) => {
        destVertices.push(
          Math.floor(point.x * canvasWidth),
          Math.floor((1 - point.y) * canvasHeight),
          0
        );
      });

      const material = new THREE.MeshBasicMaterial({
        map: texture,
        side: THREE.DoubleSide,
      });
      addTriangle(destVertices, uv, material);
    });

    // Render function
    const render = () => {
      renderer.render(scene, camera);
    };

    render(); // Initial render
  });
};
