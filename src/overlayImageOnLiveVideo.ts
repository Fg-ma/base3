import {
  NormalizedLandmark,
  NormalizedLandmarkList,
} from "@mediapipe/face_mesh";
import * as d3 from "d3";
import { Delaunay } from "d3-delaunay";
import imageSrc from "../public/uv2.png";
import { uvPoints } from "./uvPoints";
import { inv, multiply } from "mathjs";

interface Point {
  x: number;
  y: number;
}
const getUVMap = (uvImage: HTMLImageElement) => {
  // Step 1: Get image dimensions
  const width = uvImage.width;
  const height = uvImage.height;

  // Step 2: Prepare canvas for image manipulation
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const tempCtx = canvas.getContext("2d");
  if (!tempCtx) {
    console.error("Failed to get 2D context of the canvas");
    return;
  }

  // Step 3: Draw overlay image onto the canvas
  tempCtx.drawImage(uvImage, 0, 0, width, height);

  // Step 4: Get image data
  const imageData = tempCtx.getImageData(0, 0, width, height);
  const data = imageData.data;

  // Step 5: Define a function to check if a pixel is green
  const isGreen = (r: number, g: number, b: number) => {
    const threshold = 254;
    return g > r + threshold && g > b + threshold;
  };

  // Step 6: Loop through pixels to find centers of green blobs
  const uvPoints2 = [];
  const visited = new Array(width * height).fill(false); // Track visited pixels

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const index = (y * width + x) * 4; // Get index in the RGBA array
      const r = data[index];
      const g = data[index + 1];
      const b = data[index + 2];
      // Check if the pixel is green and hasn't been visited
      if (isGreen(r, g, b) && !visited[y * width + x]) {
        // Perform a flood fill to find all connected green pixels (blob)
        const blobPixels = []; // Array to store all pixels in the current blob
        const queue = [{ x, y }];
        while (queue.length > 0) {
          const shift = queue.shift();
          if (!shift) {
            return;
          }
          const { x, y } = shift;
          const pixelIndex = y * width + x;
          if (visited[pixelIndex]) continue;
          visited[pixelIndex] = true;
          blobPixels.push({ x, y });
          // Check neighboring pixels
          for (let dy = -1; dy <= 1; dy++) {
            for (let dx = -1; dx <= 1; dx++) {
              const nx = x + dx;
              const ny = y + dy;
              if (
                nx >= 0 &&
                nx < width &&
                ny >= 0 &&
                ny < height &&
                !visited[ny * width + nx] &&
                isGreen(
                  data[(ny * width + nx) * 4],
                  data[(ny * width + nx) * 4 + 1],
                  data[(ny * width + nx) * 4 + 2]
                )
              ) {
                queue.push({ x: nx, y: ny });
              }
            }
          }
        }
        // Calculate the center of the blob
        let sumX = 0;
        let sumY = 0;
        for (const { x, y } of blobPixels) {
          sumX += x;
          sumY += y;
        }
        const centerX = sumX / blobPixels.length;
        const centerY = sumY / blobPixels.length;
        // Convert to UV coordinates
        const u = centerX / width;
        const v = centerY / height;
        uvPoints2.push({ u, v });
      }
    }
  }

  // Step 7: Use UV points as needed
};

const overlayImageOnLiveVideo = (
  ctx: CanvasRenderingContext2D,
  liveLandmarks: NormalizedLandmarkList,
  image: HTMLImageElement
) => {
  // Step 1: Convert liveLandmarks to Point[] array
  const livePoints: Point[] = liveLandmarks.map((l) => ({ x: l.x, y: l.y }));

  // Step 2: Calculate Delaunay Triangulation for live points
  const liveDelaunay = Delaunay.from(
    livePoints,
    (p) => p.x,
    (p) => p.y
  );
  const liveTrianglesIndices = liveDelaunay.triangles;

  // Step 4: Extract the points that form each triangle
  const liveTriangles: Point[][] = [];
  for (let i = 0; i < liveTrianglesIndices.length; i += 3) {
    const triangle = [
      livePoints[liveTrianglesIndices[i]],
      livePoints[liveTrianglesIndices[i + 1]],
      livePoints[liveTrianglesIndices[i + 2]],
    ];
    liveTriangles.push(triangle);
  }

  const overlayDelaunay = Delaunay.from(
    uvPoints,
    (p) => p.u,
    (p) => p.v
  );
  const overlayTrianglesIndices = overlayDelaunay.triangles;

  // Step 4: Extract the points that form each triangle
  const overlayTriangles: Point[][] = [];
  for (let i = 0; i < overlayTrianglesIndices.length; i += 3) {
    const triangle = [
      {
        x: uvPoints[overlayTrianglesIndices[i]].u,
        y: uvPoints[overlayTrianglesIndices[i]].v,
      },
      {
        x: uvPoints[overlayTrianglesIndices[i + 1]].u,
        y: uvPoints[overlayTrianglesIndices[i + 1]].v,
      },
      {
        x: uvPoints[overlayTrianglesIndices[i + 2]].u,
        y: uvPoints[overlayTrianglesIndices[i + 2]].v,
      },
    ];
    overlayTriangles.push(triangle);
  }

  // drawColorfulTriangles(ctx, overlayTriangles);
  // drawTexturedTriangles(ctx, overlayTriangles, liveTriangles, image);
};

const calculateTransform = (src: Point[], dest: Point[]) => {
  const a1 = src[0].x,
    b1 = src[0].y,
    a2 = src[1].x,
    b2 = src[1].y,
    a3 = src[2].x,
    b3 = src[2].y;

  const A = [
    [a1, a2, a3],
    [b1, b2, b3],
    [1, 1, 1],
  ];

  const B = [
    [dest[0].x, dest[1].x, dest[2].x],
    [dest[0].y, dest[1].y, dest[2].y],
    [1, 1, 1],
  ];

  const A_inv = inv(A);
  const transformMatrix = multiply(B, A_inv);

  return transformMatrix;
};

const applyTransform = (ctx: CanvasRenderingContext2D, matrix: number[][]) => {
  ctx.setTransform(
    matrix[0][0],
    matrix[1][0],
    matrix[0][1],
    matrix[1][1],
    matrix[0][2],
    matrix[1][2]
  );
};

const drawTexturedTriangles = (
  ctx: CanvasRenderingContext2D,
  trianglesArray: Point[][],
  positionTriangles: Point[][],
  image: HTMLImageElement
) => {
  for (let i = 0; i < trianglesArray.length; i++) {
    const srcTriangle = trianglesArray[i];
    const destTriangle = positionTriangles[i];

    // Calculate the transformation matrix
    const transformMatrix = calculateTransform(srcTriangle, destTriangle);

    ctx.save();

    // Define the destination triangle path
    ctx.beginPath();
    ctx.moveTo(
      destTriangle[0].x * ctx.canvas.width,
      destTriangle[0].y * ctx.canvas.height
    );
    ctx.lineTo(
      destTriangle[1].x * ctx.canvas.width,
      destTriangle[1].y * ctx.canvas.height
    );
    ctx.lineTo(
      destTriangle[2].x * ctx.canvas.width,
      destTriangle[2].y * ctx.canvas.height
    );
    ctx.closePath();
    ctx.clip();

    // Apply the transformation and draw the image
    applyTransform(ctx, transformMatrix);
    ctx.drawImage(image, 0, 0);

    ctx.restore();
  }
};

const drawColorfulTriangles = (
  ctx: CanvasRenderingContext2D,
  trianglesArray: Point[][]
) => {
  for (let i = 0; i < trianglesArray.length; i++) {
    const triangle = trianglesArray[i];

    // Define a unique color for each triangle (e.g., random colors)
    const color = `rgb(${Math.random() * 255}, ${Math.random() * 255}, ${
      Math.random() * 255
    })`;
    ctx.fillStyle = color;

    // Draw the triangle
    ctx.beginPath();
    ctx.moveTo(
      triangle[0].x * ctx.canvas.width,
      triangle[0].y * ctx.canvas.height
    );
    ctx.lineTo(
      triangle[1].x * ctx.canvas.width,
      triangle[1].y * ctx.canvas.height
    );
    ctx.lineTo(
      triangle[2].x * ctx.canvas.width,
      triangle[2].y * ctx.canvas.height
    );
    ctx.closePath();
    ctx.fill();

    // Label the triangle with its index (i + 1)
    ctx.font = "12px Arial";
    ctx.fillStyle = "white";
    ctx.fillText(`${i + 1}`, triangle[0].x, triangle[0].y);
  }
};

export default overlayImageOnLiveVideo;
