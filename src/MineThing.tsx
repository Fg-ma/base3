import React, { useEffect, useRef } from "react";
import imageSrc from "../public/stallone.png";
import {
  FaceMesh,
  NormalizedLandmarkList,
  Results,
} from "@mediapipe/face_mesh";
import { Camera } from "@mediapipe/camera_utils";
import { drawConnectors, drawLandmarks } from "@mediapipe/drawing_utils";
import { FACEMESH_TESSELATION } from "@mediapipe/face_mesh";
import overlayImageOnLiveVideo from "./overlayImageOnLiveVideo";
import { uvPoints } from "./uvPoints";

export default function MineThing() {
  const liveVideoRef = useRef<HTMLVideoElement>(null);
  const overlayImageRef = useRef<HTMLImageElement>(null);
  const liveVideoCanvasRef = useRef<HTMLCanvasElement>(null);
  const overlayImageCanvasRef = useRef<HTMLCanvasElement>(null);
  const liveVideoCtx = useRef<CanvasRenderingContext2D | null>(null);
  const overlayImageCtx = useRef<CanvasRenderingContext2D | null>(null);

  const overlayLandmarksArray: NormalizedLandmarkList[] = [];

  useEffect(() => {
    // Setup FaceMesh
    const overlayFaceMesh = new FaceMesh({
      locateFile: (file) =>
        `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${file}`,
    });

    overlayFaceMesh.setOptions({
      maxNumFaces: 1,
      refineLandmarks: true,
      minDetectionConfidence: 0.5,
      minTrackingConfidence: 0.5,
    });

    overlayFaceMesh.onResults(onOverlayResults);

    // Load and process target image
    const img = new Image();
    img.src = imageSrc;
    img.onload = async () => {
      if (overlayImageCanvasRef.current) {
        overlayImageCanvasRef.current.width = img.width;
        overlayImageCanvasRef.current.height = img.height;
        overlayImageCtx.current =
          overlayImageCanvasRef.current.getContext("2d");
        if (overlayImageCtx.current) {
          overlayImageCtx.current.drawImage(img, 0, 0, img.width, img.height);
          await overlayFaceMesh.send({ image: img });
        }
      }
    };
  }, []);

  const init = async () => {
    // Setup video capture
    const stream = await navigator.mediaDevices.getUserMedia({ video: true });

    if (liveVideoRef.current) {
      liveVideoRef.current.srcObject = stream;
      await liveVideoRef.current.play().then(() => {
        if (liveVideoRef.current) {
          liveVideoRef.current.onloadedmetadata = () => {
            if (liveVideoCanvasRef.current) {
              liveVideoCanvasRef.current.width =
                liveVideoRef.current!.videoWidth;
              liveVideoCanvasRef.current.height =
                liveVideoRef.current!.videoHeight;
              liveVideoCtx.current =
                liveVideoCanvasRef.current.getContext("2d");
            }
          };
        }

        // Setup FaceMesh
        const liveFaceMesh = new FaceMesh({
          locateFile: (file) =>
            `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${file}`,
        });

        liveFaceMesh.setOptions({
          maxNumFaces: 1,
          refineLandmarks: true,
          minDetectionConfidence: 0.5,
          minTrackingConfidence: 0.5,
        });

        liveFaceMesh.onResults(onLiveResults);

        if (liveVideoRef.current) {
          const camera = new Camera(liveVideoRef.current, {
            onFrame: async () => {
              if (liveVideoRef.current) {
                await liveFaceMesh.send({ image: liveVideoRef.current });
              }
            },
            width: 640,
            height: 480,
          });
          camera.start();
        }
      });
    }
  };

  useEffect(() => {
    init();
  }, []);

  const onLiveResults = (results: Results) => {
    if (liveVideoCanvasRef.current && liveVideoRef.current) {
      liveVideoCanvasRef.current.width = liveVideoRef.current.videoWidth;
      liveVideoCanvasRef.current.height = liveVideoRef.current.videoHeight;
      liveVideoCtx.current = liveVideoCanvasRef.current.getContext("2d");
    }

    if (
      !liveVideoCanvasRef.current ||
      !liveVideoRef.current ||
      !overlayImageRef.current ||
      !liveVideoCtx.current
    ) {
      return;
    }

    liveVideoCtx.current.clearRect(
      0,
      0,
      liveVideoCanvasRef.current.width,
      liveVideoCanvasRef.current.height
    );
    liveVideoCtx.current.drawImage(
      liveVideoRef.current,
      0,
      0,
      liveVideoCanvasRef.current.width,
      liveVideoCanvasRef.current.height
    );

    const specificPointIndices = [
      { ai: 10, uv: 1 },
      { ai: 109, uv: 2 },
      { ai: 338, uv: 3 },
      { ai: 67, uv: 4 },
      { ai: 297, uv: 5 },
      { ai: 103, uv: 6 },
      { ai: 332, uv: 7 },
      { ai: 108, uv: 8 },
      { ai: 337, uv: 9 },
      { ai: 69, uv: 10 },
      { ai: 299, uv: 11 },
      { ai: 151, uv: 12 },
      { ai: 54, uv: 13 },
      { ai: 284, uv: 14 },
      { ai: 104, uv: 15 },
      { ai: 333, uv: 16 },
      { ai: 68, uv: 17 },
      { ai: 298, uv: 18 },
      { ai: 21, uv: 19 },
      { ai: 251, uv: 20 },
      { ai: 66, uv: 21 },
      { ai: 105, uv: 22 },
      { ai: 296, uv: 23 },
      { ai: 334, uv: 24 },
      { ai: 107, uv: 25 },
      { ai: 336, uv: 26 },
      { ai: 9, uv: 27 },
      { ai: 63, uv: 28 },
      { ai: 293, uv: 29 },
      { ai: 71, uv: 30 },
      { ai: 301, uv: 31 },
      { ai: 65, uv: 32 },
      { ai: 295, uv: 33 },
      { ai: 52, uv: 34 },
      { ai: 282, uv: 35 },
      { ai: 53, uv: 36 },
      { ai: 283, uv: 37 },
      { ai: 300, uv: 38 },
      { ai: 70, uv: 39 },
      { ai: 55, uv: 40 },
      { ai: 285, uv: 41 },
      { ai: 8, uv: 42 },
      { ai: 46, uv: 43 },
      { ai: 276, uv: 44 },
      { ai: 389, uv: 45 },
      { ai: 162, uv: 46 },
      { ai: 223, uv: 47 },
      { ai: 443, uv: 48 },
      { ai: 444, uv: 49 },
      { ai: 224, uv: 50 },
      { ai: 222, uv: 51 },
      { ai: 442, uv: 52 },
      { ai: 445, uv: 53 },
      { ai: 139, uv: 54 },
      { ai: 225, uv: 55 },
      { ai: 368, uv: 56 },
      { ai: 441, uv: 57 },
      { ai: 221, uv: 58 },
      { ai: 156, uv: 59 },
      { ai: 383, uv: 60 },
      { ai: 27, uv: 61 },
      { ai: 257, uv: 62 },
      { ai: 28, uv: 63 },
      { ai: 258, uv: 64 },
      { ai: 29, uv: 65 },
      { ai: 259, uv: 66 },
      { ai: 124, uv: 67 },
      { ai: 353, uv: 68 },
      { ai: 168, uv: 69 },
      { ai: 417, uv: 70 },
      { ai: 193, uv: 71 },
      { ai: 30, uv: 72 },
      { ai: 56, uv: 73 },
      { ai: 286, uv: 74 },
      { ai: 260, uv: 75 },
      { ai: 113, uv: 76 },
      { ai: 159, uv: 77 },
      { ai: 386, uv: 78 },
      { ai: 342, uv: 79 },
      { ai: 158, uv: 80 },
      { ai: 385, uv: 81 },
      { ai: 160, uv: 82 },
      { ai: 387, uv: 83 },
      { ai: 413, uv: 84 },
      { ai: 189, uv: 85 },
      { ai: 157, uv: 86 },
      { ai: 384, uv: 87 },
      { ai: 161, uv: 88 },
      { ai: 388, uv: 89 },
      { ai: 467, uv: 90 },
      { ai: 247, uv: 91 },
      { ai: 466, uv: 92 },
      { ai: 246, uv: 93 },
      { ai: 190, uv: 94 },
      { ai: 414, uv: 95 },
      { ai: 173, uv: 96 },
      { ai: 398, uv: 97 },
      { ai: 33, uv: 98 },
      { ai: 263, uv: 99 },
      { ai: 130, uv: 100 },
      { ai: 359, uv: 101 },
      { ai: 7, uv: 102 },
      { ai: 249, uv: 103 },
      { ai: 226, uv: 104 },
      { ai: 446, uv: 105 },
      { ai: 163, uv: 106 },
      { ai: 133, uv: 107 },
      { ai: 362, uv: 108 },
      { ai: 390, uv: 109 },
      { ai: 25, uv: 110 },
      { ai: 255, uv: 111 },
      { ai: 243, uv: 112 },
      { ai: 463, uv: 113 },
      { ai: 35, uv: 114 },
      { ai: 155, uv: 115 },
      { ai: 382, uv: 116 },
      { ai: 265, uv: 117 },
      { ai: 154, uv: 118 },
      { ai: 464, uv: 119 },
      { ai: 381, uv: 120 },
      { ai: 373, uv: 121 },
      { ai: 144, uv: 122 },
      { ai: 244, uv: 123 },
      { ai: 372, uv: 124 },
      { ai: 143, uv: 125 },
      { ai: 110, uv: 126 },
      { ai: 153, uv: 127 },
      { ai: 112, uv: 128 },
      { ai: 341, uv: 129 },
      { ai: 380, uv: 130 },
      { ai: 339, uv: 131 },
      { ai: 34, uv: 132 },
      { ai: 465, uv: 133 },
      { ai: 145, uv: 134 },
      { ai: 245, uv: 135 },
      { ai: 6, uv: 136 },
      { ai: 374, uv: 137 },
      { ai: 264, uv: 138 },
      { ai: 127, uv: 139 },
      { ai: 356, uv: 140 },
      { ai: 26, uv: 141 },
      { ai: 256, uv: 142 },
      { ai: 351, uv: 143 },
      { ai: 122, uv: 144 },
      { ai: 24, uv: 145 },
      { ai: 22, uv: 146 },
      { ai: 453, uv: 147 },
      { ai: 252, uv: 148 },
      { ai: 254, uv: 149 },
      { ai: 31, uv: 150 },
      { ai: 233, uv: 151 },
      { ai: 261, uv: 152 },
      { ai: 23, uv: 153 },
      { ai: 253, uv: 154 },
      { ai: 232, uv: 155 },
      { ai: 452, uv: 156 },
      { ai: 357, uv: 157 },
      { ai: 128, uv: 158 },
      { ai: 188, uv: 159 },
      { ai: 412, uv: 160 },
      { ai: 448, uv: 161 },
      { ai: 228, uv: 162 },
      { ai: 231, uv: 163 },
      { ai: 451, uv: 164 },
      { ai: 350, uv: 165 },
      { ai: 229, uv: 166 },
      { ai: 121, uv: 167 },
      { ai: 449, uv: 168 },
      { ai: 230, uv: 169 },
      { ai: 450, uv: 170 },
      { ai: 111, uv: 171 },
      { ai: 340, uv: 172 },
      { ai: 343, uv: 173 },
      { ai: 114, uv: 174 },
      { ai: 197, uv: 175 },
      { ai: 196, uv: 176 },
      { ai: 419, uv: 177 },
      { ai: 120, uv: 178 },
      { ai: 349, uv: 179 },
      { ai: 174, uv: 180 },
      { ai: 399, uv: 181 },
      { ai: 47, uv: 182 },
      { ai: 277, uv: 183 },
      { ai: 346, uv: 184 },
      { ai: 116, uv: 185 },
      { ai: 117, uv: 186 },
      { ai: 345, uv: 187 },
      { ai: 348, uv: 188 },
      { ai: 119, uv: 189 },
      { ai: 437, uv: 190 },
      { ai: 217, uv: 191 },
      { ai: 118, uv: 192 },
      { ai: 347, uv: 193 },
      { ai: 447, uv: 194 },
      { ai: 227, uv: 195 },
      { ai: 195, uv: 196 },
      { ai: 3, uv: 197 },
      { ai: 248, uv: 198 },
      { ai: 329, uv: 199 },
      { ai: 100, uv: 200 },
      { ai: 456, uv: 201 },
      { ai: 236, uv: 202 },
      { ai: 234, uv: 203 },
      { ai: 454, uv: 204 },
      { ai: 355, uv: 205 },
      { ai: 126, uv: 206 },
      { ai: 198, uv: 207 },
      { ai: 420, uv: 208 },
      { ai: 101, uv: 209 },
      { ai: 330, uv: 210 },
      { ai: 5, uv: 211 },
      { ai: 51, uv: 212 },
      { ai: 281, uv: 213 },
      { ai: 363, uv: 214 },
      { ai: 134, uv: 215 },
      { ai: 371, uv: 216 },
      { ai: 142, uv: 217 },
      { ai: 209, uv: 218 },
      { ai: 429, uv: 219 },
      { ai: 131, uv: 220 },
      { ai: 360, uv: 221 },
      { ai: 123, uv: 222 },
      { ai: 352, uv: 223 },
      { ai: 45, uv: 224 },
      { ai: 4, uv: 225 },
      { ai: 275, uv: 226 },
      { ai: 220, uv: 227 },
      { ai: 440, uv: 228 },
      { ai: 50, uv: 229 },
      { ai: 280, uv: 230 },
      { ai: 36, uv: 231 },
      { ai: 49, uv: 232 },
      { ai: 279, uv: 233 },
      { ai: 266, uv: 234 },
      { ai: 344, uv: 235 },
      { ai: 115, uv: 236 },
      { ai: 366, uv: 237 },
      { ai: 137, uv: 238 },
      { ai: 237, uv: 239 },
      { ai: 457, uv: 240 },
      { ai: 102, uv: 241 },
      { ai: 274, uv: 242 },
      { ai: 331, uv: 243 },
      { ai: 44, uv: 244 },
      { ai: 1, uv: 245 },
      { ai: 438, uv: 246 },
      { ai: 129, uv: 247 },
      { ai: 48, uv: 248 },
      { ai: 218, uv: 249 },
      { ai: 278, uv: 250 },
      { ai: 358, uv: 251 },
      { ai: 239, uv: 252 },
      { ai: 459, uv: 253 },
      { ai: 79, uv: 254 },
      { ai: 309, uv: 255 },
      { ai: 219, uv: 256 },
      { ai: 439, uv: 257 },
      { ai: 93, uv: 258 },
      { ai: 323, uv: 259 },
      { ai: 125, uv: 260 },
      { ai: 354, uv: 261 },
      { ai: 64, uv: 262 },
      { ai: 241, uv: 263 },
      { ai: 19, uv: 264 },
      { ai: 461, uv: 265 },
      { ai: 294, uv: 266 },
      { ai: 238, uv: 267 },
      { ai: 458, uv: 268 },
      { ai: 392, uv: 269 },
      { ai: 166, uv: 270 },
      { ai: 455, uv: 271 },
      { ai: 235, uv: 272 },
      { ai: 205, uv: 273 },
      { ai: 425, uv: 274 },
      { ai: 59, uv: 275 },
      { ai: 289, uv: 276 },
      { ai: 203, uv: 277 },
      { ai: 203, uv: 277 },
      { ai: 20, uv: 278 },
      { ai: 250, uv: 279 },
      { ai: 423, uv: 280 },
      { ai: 462, uv: 281 },
      { ai: 242, uv: 282 },
      { ai: 75, uv: 283 },
      { ai: 141, uv: 284 },
      { ai: 94, uv: 285 },
      { ai: 370, uv: 286 },
      { ai: 305, uv: 287 },
      { ai: 240, uv: 288 },
      { ai: 460, uv: 289 },
      { ai: 60, uv: 290 },
      { ai: 290, uv: 291 },
      { ai: 98, uv: 292 },
      { ai: 327, uv: 293 },
      { ai: 376, uv: 294 },
      { ai: 147, uv: 295 },
      { ai: 99, uv: 296 },
      { ai: 328, uv: 297 },
      { ai: 411, uv: 298 },
      { ai: 187, uv: 299 },
      { ai: 97, uv: 300 },
      { ai: 326, uv: 301 },
      { ai: 2, uv: 302 },
      { ai: 206, uv: 303 },
      { ai: 426, uv: 304 },
      { ai: 177, uv: 305 },
      { ai: 401, uv: 306 },
      { ai: 164, uv: 307 },
      { ai: 167, uv: 308 },
      { ai: 393, uv: 309 },
      { ai: 207, uv: 310 },
      { ai: 427, uv: 311 },
      { ai: 165, uv: 312 },
      { ai: 391, uv: 313 },
      { ai: 92, uv: 314 },
      { ai: 322, uv: 315 },
      { ai: 132, uv: 316 },
      { ai: 436, uv: 317 },
      { ai: 361, uv: 318 },
      { ai: 216, uv: 319 },
      { ai: 213, uv: 320 },
      { ai: 433, uv: 321 },
      { ai: 37, uv: 322 },
      { ai: 267, uv: 323 },
      { ai: 0, uv: 324 },
      { ai: 39, uv: 325 },
      { ai: 269, uv: 326 },
      { ai: 186, uv: 327 },
      { ai: 410, uv: 328 },
      { ai: 40, uv: 329 },
      { ai: 72, uv: 330 },
      { ai: 11, uv: 331 },
      { ai: 302, uv: 332 },
      { ai: 270, uv: 333 },
      { ai: 73, uv: 334 },
      { ai: 303, uv: 335 },
      { ai: 304, uv: 336 },
      { ai: 74, uv: 337 },
      { ai: 185, uv: 338 },
      { ai: 409, uv: 339 },
      { ai: 12, uv: 340 },
      { ai: 41, uv: 341 },
      { ai: 38, uv: 342 },
      { ai: 268, uv: 343 },
      { ai: 184, uv: 344 },
      { ai: 271, uv: 345 },
      { ai: 408, uv: 346 },
      { ai: 215, uv: 347 },
      { ai: 42, uv: 348 },
      { ai: 272, uv: 349 },
      { ai: 435, uv: 350 },
      { ai: 192, uv: 351 },
      { ai: 416, uv: 352 },
      { ai: 407, uv: 353 },
      { ai: 183, uv: 354 },
      { ai: 191, uv: 355 },
      { ai: 80, uv: 356 },
      { ai: 81, uv: 357 },
      { ai: 82, uv: 358 },
      { ai: 13, uv: 359 },
      { ai: 312, uv: 360 },
      { ai: 311, uv: 361 },
      { ai: 310, uv: 362 },
      { ai: 415, uv: 363 },
      { ai: 308, uv: 364 },
      { ai: 306, uv: 365 },
      { ai: 61, uv: 366 },
      { ai: 76, uv: 367 },
      { ai: 62, uv: 368 },
      { ai: 78, uv: 369 },
      { ai: 292, uv: 370 },
      { ai: 291, uv: 371 },
      { ai: 95, uv: 372 },
      { ai: 88, uv: 373 },
      { ai: 178, uv: 374 },
      { ai: 87, uv: 375 },
      { ai: 14, uv: 376 },
      { ai: 317, uv: 377 },
      { ai: 402, uv: 378 },
      { ai: 318, uv: 379 },
      { ai: 324, uv: 380 },
      { ai: 287, uv: 381 },
      { ai: 57, uv: 382 },
      { ai: 96, uv: 383 },
      { ai: 325, uv: 384 },
      { ai: 212, uv: 385 },
      { ai: 89, uv: 386 },
      { ai: 319, uv: 387 },
      { ai: 432, uv: 388 },
      { ai: 179, uv: 389 },
      { ai: 86, uv: 390 },
      { ai: 316, uv: 391 },
      { ai: 403, uv: 392 },
      { ai: 77, uv: 393 },
      { ai: 15, uv: 394 },
      { ai: 307, uv: 395 },
      { ai: 146, uv: 396 },
      { ai: 375, uv: 397 },
      { ai: 90, uv: 398 },
      { ai: 320, uv: 399 },
      { ai: 214, uv: 400 },
      { ai: 434, uv: 401 },
      { ai: 180, uv: 402 },
      { ai: 404, uv: 403 },
      { ai: 85, uv: 404 },
      { ai: 315, uv: 405 },
      { ai: 91, uv: 406 },
      { ai: 16, uv: 407 },
      { ai: 321, uv: 408 },
      { ai: 43, uv: 409 },
      { ai: 273, uv: 410 },
      { ai: 58, uv: 411 },
      { ai: 181, uv: 412 },
      { ai: 405, uv: 413 },
      { ai: 288, uv: 414 },
      { ai: 84, uv: 415 },
      { ai: 314, uv: 416 },
      { ai: 17, uv: 417 },
      { ai: 367, uv: 418 },
      { ai: 138, uv: 419 },
      { ai: 202, uv: 420 },
      { ai: 422, uv: 421 },
      { ai: 106, uv: 422 },
      { ai: 335, uv: 423 },
      { ai: 182, uv: 424 },
      { ai: 406, uv: 425 },
      { ai: 210, uv: 426 },
      { ai: 430, uv: 427 },
      { ai: 83, uv: 428 },
      { ai: 313, uv: 429 },
      { ai: 135, uv: 430 },
      { ai: 204, uv: 431 },
      { ai: 424, uv: 432 },
      { ai: 364, uv: 433 },
      { ai: 18, uv: 434 },
      { ai: 172, uv: 435 },
      { ai: 397, uv: 436 },
      { ai: 194, uv: 437 },
      { ai: 418, uv: 438 },
      { ai: 211, uv: 439 },
      { ai: 431, uv: 440 },
      { ai: 201, uv: 441 },
      { ai: 421, uv: 442 },
      { ai: 394, uv: 443 },
      { ai: 169, uv: 444 },
      { ai: 200, uv: 445 },
      { ai: 136, uv: 446 },
      { ai: 365, uv: 447 },
      { ai: 32, uv: 448 },
      { ai: 262, uv: 449 },
      { ai: 170, uv: 450 },
      { ai: 395, uv: 451 },
      { ai: 208, uv: 452 },
      { ai: 428, uv: 453 },
      { ai: 199, uv: 454 },
      { ai: 150, uv: 455 },
      { ai: 379, uv: 456 },
      { ai: 140, uv: 457 },
      { ai: 369, uv: 458 },
      { ai: 149, uv: 459 },
      { ai: 378, uv: 460 },
      { ai: 171, uv: 461 },
      { ai: 396, uv: 462 },
      { ai: 175, uv: 463 },
      { ai: 176, uv: 464 },
      { ai: 400, uv: 465 },
      { ai: 148, uv: 466 },
      { ai: 377, uv: 467 },
      { ai: 152, uv: 468 },
    ];
    const specificPointColor = "#0000FF"; // Color for the specific points

    if (results.multiFaceLandmarks) {
      for (const landmarks of results.multiFaceLandmarks) {
        // drawConnectors(liveVideoCtx.current, landmarks, FACEMESH_TESSELATION, {
        //   color: "#00FF00",
        //   lineWidth: 1,
        // });
        // drawLandmarks(liveVideoCtx.current, landmarks, {
        //   color: "#FF0000",
        //   lineWidth: 1,
        //   radius: 0.5,
        // });

        for (const key of Object.keys(uvPoints)) {
          const isSpecificPoint = specificPointIndices.some(
            (obj) => obj.uv === parseInt(key)
          );
          if (liveVideoCtx.current) {
            const point = uvPoints[key];
            liveVideoCtx.current.beginPath();
            liveVideoCtx.current.arc(
              point.u * liveVideoCtx.current.canvas.width,
              point.v * liveVideoCtx.current.canvas.height,
              1,
              0,
              2 * Math.PI
            );
            liveVideoCtx.current.fillStyle = isSpecificPoint
              ? "#FFFF00"
              : "#FF00FF";
            liveVideoCtx.current.fill();
          }
        }

        // Draw all landmarks with default color
        for (let i = 0; i < landmarks.length; i++) {
          const landmark = landmarks[i];
          const isSpecificPoint = specificPointIndices.some(
            (obj) => obj.ai === i
          );

          liveVideoCtx.current.beginPath();
          liveVideoCtx.current.arc(
            landmark.x * liveVideoCtx.current.canvas.width,
            landmark.y * liveVideoCtx.current.canvas.height,
            1,
            0,
            2 * Math.PI
          );
          liveVideoCtx.current.fillStyle = isSpecificPoint
            ? specificPointColor
            : "#FF0000";
          liveVideoCtx.current.fill();
        }

        // overlayImageOnLiveVideo(
        //   liveVideoCtx.current,
        //   landmarks,
        //   // overlayLandmarksArray[0],
        //   overlayImageRef.current
        // );
      }
    }
  };

  const onOverlayResults = (results: Results) => {
    if (overlayImageCanvasRef.current && overlayImageRef.current) {
      if (!overlayImageCtx.current) {
        return;
      }

      overlayImageCtx.current.clearRect(
        0,
        0,
        overlayImageCanvasRef.current.width,
        overlayImageCanvasRef.current.height
      );
      overlayImageCtx.current.drawImage(
        overlayImageRef.current,
        0,
        0,
        overlayImageCanvasRef.current.width,
        overlayImageCanvasRef.current.height
      );

      if (results.multiFaceLandmarks) {
        for (const landmarks of results.multiFaceLandmarks) {
          overlayLandmarksArray.push(landmarks);

          drawConnectors(
            overlayImageCtx.current,
            landmarks,
            FACEMESH_TESSELATION,
            {
              color: "#C0C0C0",
              lineWidth: 2,
            }
          );
          drawLandmarks(overlayImageCtx.current, landmarks, {
            color: "#FF3030",
            lineWidth: 2,
            radius: 1,
          });
        }
      }
    }
  };

  return (
    <div className='flex w-screen h-screen items-center'>
      <div className='flex-col w-1/2 h-5/6'>
        <video ref={liveVideoRef} className='h-1/2'></video>
        <canvas ref={liveVideoCanvasRef} className='h-1/2'></canvas>
      </div>
      <div className='flex-col w-1/2 h-5/6'>
        <img ref={overlayImageRef} src={imageSrc} className='h-1/2 hidden' />
        <canvas ref={overlayImageCanvasRef} className='h-1/2 hidden'></canvas>
      </div>
    </div>
  );
}
