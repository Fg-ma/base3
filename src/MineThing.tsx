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

  const getCamera = async () => {
    await navigator.mediaDevices
      .getUserMedia({ video: true })
      .then(async (stream) => {
        if (liveVideoRef.current) {
          liveVideoRef.current.srcObject = stream;
          await liveVideoRef.current.play();
        }
      })
      .catch((error) => {
        console.error("Error accessing the camera:", error);
      });
  };

  useEffect(() => {
    // Setup video capture
    getCamera();

    if (liveVideoRef.current) {
      liveVideoRef.current.onloadedmetadata = () => {
        if (liveVideoCanvasRef.current) {
          liveVideoCanvasRef.current.width = liveVideoRef.current!.videoWidth;
          liveVideoCanvasRef.current.height = liveVideoRef.current!.videoHeight;
          liveVideoCtx.current = liveVideoCanvasRef.current.getContext("2d");
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
  }, []);

  const onLiveResults = (results: Results) => {
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
      { ai: 69, uv: 8 },
      { ai: 108, uv: 9 },
      { ai: 337, uv: 10 },
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
      { ai: 105, uv: 21 },
      { ai: 66, uv: 22 },
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
      { ai: 70, uv: 38 },
      { ai: 300, uv: 39 },
      { ai: 55, uv: 40 },
      { ai: 285, uv: 41 },
      { ai: 8, uv: 42 },
      { ai: 46, uv: 43 },
      { ai: 276, uv: 44 },
      { ai: 162, uv: 45 },
      { ai: 389, uv: 46 },
      { ai: 223, uv: 47 },
      { ai: 443, uv: 48 },
      { ai: 224, uv: 49 },
      { ai: 444, uv: 50 },
      { ai: 222, uv: 51 },
      { ai: 442, uv: 52 },
      { ai: 139, uv: 53 },
      { ai: 368, uv: 54 },
      { ai: 225, uv: 55 },
      { ai: 445, uv: 56 },
      { ai: 221, uv: 57 },
      { ai: 441, uv: 58 },
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
      // thing
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
      { ai: 341, uv: 130 },
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
