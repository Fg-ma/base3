import * as THREE from "three";
import { Point2D, Point3D } from "./overlayImageOnLiveVideo";

export const drawTriangles = (
  srcTrianglesArray: [Point2D, Point2D, Point2D][],
  destTrianglesArray: [Point3D, Point3D, Point3D][],
  canvasWidth: number,
  canvasHeight: number,
  scene: THREE.Scene,
  camera: THREE.OrthographicCamera,
  renderer: THREE.WebGLRenderer,
  texture: THREE.Texture
) => {
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
};
