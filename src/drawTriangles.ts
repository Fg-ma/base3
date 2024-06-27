import * as THREE from "three";
import { Point2D, Point3D } from "./overlayImageOnLiveVideo";

const drawTriangles = (
  srcTrianglesArray: [Point2D, Point2D, Point2D][],
  destTrianglesArray: [Point3D, Point3D, Point3D][],
  canvasWidth: number,
  canvasHeight: number,
  scene: THREE.Scene,
  camera: THREE.OrthographicCamera,
  renderer: THREE.WebGLRenderer,
  texture: THREE.Texture
) => {
  const positions: number[] = [];
  const uvs: number[] = [];
  const indices: number[] = [];

  let indexOffset = 0;

  srcTrianglesArray.forEach((triangle, triangleIndex) => {
    const srcVertices: number[] = [];
    const uv: number[] = [];

    triangle.forEach((point) => {
      srcVertices.push(point.x * canvasWidth, (1 - point.y) * canvasHeight, 0);
      uv.push(point.x, point.y);
    });

    const destTriangle = destTrianglesArray[triangleIndex];
    if (!destTriangle) {
      return;
    }
    const destVertices: number[] = [];
    destTriangle.forEach((point) => {
      destVertices.push(
        point.x * canvasWidth,
        (1 - point.y) * canvasHeight,
        point.z
      );
    });

    positions.push(...destVertices);
    uvs.push(...uv);
    indices.push(indexOffset, indexOffset + 1, indexOffset + 2);
    indexOffset += 3;
  });

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute(
    "position",
    new THREE.Float32BufferAttribute(positions, 3)
  );
  geometry.setAttribute("uv", new THREE.Float32BufferAttribute(uvs, 2));
  geometry.setIndex(indices);

  const material = new THREE.MeshBasicMaterial({
    map: texture,
    side: THREE.DoubleSide,
  });

  const mesh = new THREE.Mesh(geometry, material);
  scene.add(mesh);

  // Render function
  const render = () => {
    renderer.render(scene, camera);
  };

  render(); // Initial render
};

export default drawTriangles;
