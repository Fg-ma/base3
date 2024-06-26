import {
  NormalizedLandmark,
  NormalizedLandmarkList,
} from "@mediapipe/face_mesh";
import * as d3 from "d3";
import { Delaunay } from "d3-delaunay";
import imageSrc from "../public/uv2.png";
import { olduvPoints, uvPoints } from "./uvPoints";
import { inv, multiply } from "mathjs";
import { uvMap } from "./uvMap";

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
  const livePoints: Point[] = liveLandmarks.map((l) => ({
    x: l.x,
    y: l.y,
    z: l.z,
  }));

  // Step 2: Calculate Delaunay Triangulation for live points
  const liveDelaunay = Delaunay.from(
    livePoints,
    (p) => p.x,
    (p) => p.y
  );
  const liveTrianglesIndices = liveDelaunay.triangles;

  const overlayDelaunay = Delaunay.from(
    uvPoints,
    (p) => p.u,
    (p) => p.v
  );
  const overlayTrianglesIndices = overlayDelaunay.triangles;

  // Step 4: Extract the points that form each triangle
  const overlayTriangles: [Point, Point, Point][] = [];
  const liveTriangles: [Point, Point, Point][] = [];
  // for (let i = 0; i < overlayTrianglesIndices.length; i += 3) {
  //   if (
  //     uvPoints[overlayTrianglesIndices[i]] &&
  //     uvPoints[overlayTrianglesIndices[i + 1]] &&
  //     uvPoints[overlayTrianglesIndices[i + 2]]
  //   ) {
  //     const triangle: [Point, Point, Point] = [
  //       {
  //         x: uvPoints[overlayTrianglesIndices[i]].u,
  //         y: uvPoints[overlayTrianglesIndices[i]].v,
  //       },
  //       {
  //         x: uvPoints[overlayTrianglesIndices[i + 1]].u,
  //         y: uvPoints[overlayTrianglesIndices[i + 1]].v,
  //       },
  //       {
  //         x: uvPoints[overlayTrianglesIndices[i + 2]].u,
  //         y: uvPoints[overlayTrianglesIndices[i + 2]].v,
  //       },
  //     ];
  //     overlayTriangles.push(triangle);
  //   }
  //   if (
  //     livePoints[liveTrianglesIndices[i]] &&
  //     livePoints[liveTrianglesIndices[i + 1]] &&
  //     livePoints[liveTrianglesIndices[i + 2]]
  //   ) {
  //     const triangle2: [Point, Point, Point] = [
  //       livePoints[liveTrianglesIndices[i]],
  //       livePoints[liveTrianglesIndices[i + 1]],
  //       livePoints[liveTrianglesIndices[i + 2]],
  //     ];
  //     liveTriangles.push(triangle2);
  //   }
  // }

  // drawColorfulTriangles(ctx, overlayTriangles, [0, 0, 1]);
  // drawColorfulTriangles(ctx, liveTriangles, [1, 0, 0]);

  const triangles = [
    [153, 159, 145],
    [145, 159, 160],
    [145, 160, 144],
    [144, 160, 161],
    [144, 161, 163],
  ];

  for (let i = 0; i < triangles.length; i++) {
    const matchingEntry1 = uvMap.find((entry) => entry.ai === triangles[i][0]);
    const matchingEntry2 = uvMap.find((entry) => entry.ai === triangles[i][1]);
    const matchingEntry3 = uvMap.find((entry) => entry.ai === triangles[i][2]);

    if (matchingEntry1 && matchingEntry2 && matchingEntry3) {
      overlayTriangles.push([
        {
          x: olduvPoints[`${matchingEntry1.uv}`].u,
          y: olduvPoints[`${matchingEntry1.uv}`].v,
        },
        {
          x: olduvPoints[`${matchingEntry2.uv}`].u,
          y: olduvPoints[`${matchingEntry2.uv}`].v,
        },
        {
          x: olduvPoints[`${matchingEntry3.uv}`].u,
          y: olduvPoints[`${matchingEntry3.uv}`].v,
        },
      ]);
    }

    // If a matching entry is found, push its 'ai' value to liveTriangles
    liveTriangles.push([
      livePoints[triangles[i][0]],
      livePoints[triangles[i][1]],
      livePoints[triangles[i][2]],
    ]);
  }

  drawColorfulTriangles(ctx, overlayTriangles, [0, 0, 1]);
  // drawColorfulTriangles(ctx, liveTriangles, [1, 0, 0]);
  drawTexturedTriangles(ctx, overlayTriangles, liveTriangles, image);
};

const drawTexturedTriangles = (
  ctx: CanvasRenderingContext2D,
  srcTrianglesArray: [Point, Point, Point][],
  destTrianglesArray: [Point, Point, Point][],
  image: HTMLImageElement
) => {
  for (
    let i = 0;
    i < Math.min(srcTrianglesArray.length, destTrianglesArray.length);
    i++
  ) {
    const srcTriangle = srcTrianglesArray[i];
    const destTriangle = destTrianglesArray[i];

    const transformMatrix = computeTransformMatrix(srcTriangle, destTriangle);
    drawTriangle(ctx, image, srcTriangle, destTriangle, transformMatrix);
  }
};

const computeTransformMatrix = (
  src: [Point, Point, Point],
  dest: [Point, Point, Point]
) => {
  const [x0, y0] = [src[0].x, src[0].y];
  const [x1, y1] = [src[1].x, src[1].y];
  const [x2, y2] = [src[2].x, src[2].y];

  const [u0, v0] = [dest[0].x, dest[0].y];
  const [u1, v1] = [dest[1].x, dest[1].y];
  const [u2, v2] = [dest[2].x, dest[2].y];

  const A = [
    [x0, y0, 1, 0, 0, 0, -u0 * x0, -u0 * y0],
    [0, 0, 0, x0, y0, 1, -v0 * x0, -v0 * y0],
    [x1, y1, 1, 0, 0, 0, -u1 * x1, -u1 * y1],
    [0, 0, 0, x1, y1, 1, -v1 * x1, -v1 * y1],
    [x2, y2, 1, 0, 0, 0, -u2 * x2, -u2 * y2],
    [0, 0, 0, x2, y2, 1, -v2 * x2, -v2 * y2],
  ];

  const B = [u0, v0, u1, v1, u2, v2];

  const H = solveSystem(A, B);

  return [
    [H[0], H[1], H[2]],
    [H[3], H[4], H[5]],
    [H[6], H[7], 1],
  ];
};

const solveSystem = (A: number[][], B: number[]) => {
  // Use Gaussian elimination to solve the system of linear equations
  const AB = A.map((row, i) => [...row, B[i]]);
  const n = AB.length;

  for (let i = 0; i < n; i++) {
    let maxRow = i;
    for (let k = i + 1; k < n; k++) {
      if (Math.abs(AB[k][i]) > Math.abs(AB[maxRow][i])) {
        maxRow = k;
      }
    }

    [AB[i], AB[maxRow]] = [AB[maxRow], AB[i]];

    for (let k = i + 1; k < n; k++) {
      const factor = AB[k][i] / AB[i][i];
      for (let j = i; j < n + 1; j++) {
        AB[k][j] -= factor * AB[i][j];
      }
    }
  }

  const X = new Array(n).fill(0);
  for (let i = n - 1; i >= 0; i--) {
    X[i] = AB[i][n] / AB[i][i];
    for (let k = i - 1; k >= 0; k--) {
      AB[k][n] -= AB[k][i] * X[i];
    }
  }

  return X;
};

const drawTriangle = (
  ctx: CanvasRenderingContext2D,
  image: HTMLImageElement,
  srcTriangle: [Point, Point, Point],
  destTriangle: [Point, Point, Point],
  transformMatrix: number[][]
) => {
  ctx.save();
  ctx.setTransform(
    transformMatrix[0][0],
    transformMatrix[1][0],
    transformMatrix[0][1],
    transformMatrix[1][1],
    transformMatrix[0][2],
    transformMatrix[1][2]
  );
  ctx.beginPath();
  ctx.moveTo(destTriangle[0].x, destTriangle[0].y);
  ctx.lineTo(destTriangle[1].x, destTriangle[1].y);
  ctx.lineTo(destTriangle[2].x, destTriangle[2].y);
  ctx.closePath();
  ctx.clip();
  ctx.drawImage(image, 0, 0);
  ctx.restore();
};

const drawColorfulTriangles = (
  ctx: CanvasRenderingContext2D,
  trianglesArray: Point[][],
  rgb: number[]
) => {
  for (let i = 0; i < trianglesArray.length; i++) {
    const triangle = trianglesArray[i];

    // Define a unique color for each triangle (e.g., random colors)
    const color = `rgb(${rgb[0] * 255}, ${rgb[1] * 255}, ${rgb[2] * 255})`;
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
