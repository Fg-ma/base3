import React, { useEffect, useRef } from "react";
import imageSrc from "../public/james.png";
import { FaceMesh, Results } from "@mediapipe/face_mesh";
import { Camera } from "@mediapipe/camera_utils";
import overlayImageOnLiveVideo from "./overlayImageOnLiveVideo";
import threeInit from "./threeInit";

export default function MineThing() {
  const liveVideoRef = useRef<HTMLVideoElement>(null);
  const overlayImageRef = useRef<HTMLImageElement>(null);
  const liveVideoCanvasRef = useRef<HTMLCanvasElement>(null);
  const resultsCanvasRef = useRef<HTMLCanvasElement>(null);
  const overlayImageCanvasRef = useRef<HTMLCanvasElement>(null);
  const liveVideoCtx = useRef<CanvasRenderingContext2D | null>(null);
  const overlayImageCtx = useRef<CanvasRenderingContext2D | null>(null);

  const init = async () => {
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
        }
      }
    };

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
      !liveVideoCtx.current ||
      !resultsCanvasRef.current
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

    if (results.multiFaceLandmarks) {
      for (const landmarks of results.multiFaceLandmarks) {
        threeInit(resultsCanvasRef.current, liveVideoRef.current).then(
          ({ canvasWidth, canvasHeight, scene, camera, renderer, texture }) => {
            overlayImageOnLiveVideo(
              landmarks.slice(0, -10),
              canvasWidth,
              canvasHeight,
              scene,
              camera,
              renderer,
              texture
            );
          }
        );
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
        <canvas ref={resultsCanvasRef} className='h-80 w-80'></canvas>
        <img ref={overlayImageRef} src={imageSrc} className='h-1/2 hidden' />
        <canvas ref={overlayImageCanvasRef} className='h-1/2 hidden'></canvas>
      </div>
    </div>
  );
}

// const specificPointColor = "#0000FF"; // Color for the specific points
// drawConnectors(liveVideoCtx.current, landmarks, FACEMESH_TESSELATION, {
//   color: "#00FF00",
//   lineWidth: 1,
// });
// drawLandmarks(liveVideoCtx.current, landmarks, {
//   color: "#FF0000",
//   lineWidth: 1,
//   radius: 0.5,
// });
// const points = new Array(468).fill(0);
// for (const key of Object.keys(uvPoints)) {
//   points[uvMap[parseInt(key) - 1].ai] = uvPoints[key];
//   if (key === "152") {
//     console.log(
//       uvMap[parseInt(key) - 1],
//       uvMap[parseInt(key) - 1].ai,
//       uvPoints[key]
//     );
//   }
// }
// points[uvMap[151].ai] = uvPoints["152"];
// console.log(points);
// for (const key of Object.keys(uvPoints)) {
//   const isSpecificPoint = uvMap.some((obj) => obj.uv === parseInt(key));
//   if (liveVideoCtx.current) {
//     const point = uvPoints[key];
//     liveVideoCtx.current.beginPath();
//     liveVideoCtx.current.arc(
//       point.u * liveVideoCtx.current.canvas.width,
//       point.v * liveVideoCtx.current.canvas.height,
//       1,
//       0,
//       2 * Math.PI
//     );
//     liveVideoCtx.current.fillStyle = isSpecificPoint
//       ? "#FFFF00"
//       : "#FF00FF";
//     liveVideoCtx.current.fill();
//   }
// }
// // Draw all landmarks with default color
// for (let i = 0; i < landmarks.length; i++) {
//   const landmark = landmarks[i];
//   const isSpecificPoint = uvMap.some((obj) => obj.ai === i);
//   liveVideoCtx.current.beginPath();
//   liveVideoCtx.current.arc(
//     landmark.x * liveVideoCtx.current.canvas.width,
//     landmark.y * liveVideoCtx.current.canvas.height,
//     1,
//     0,
//     2 * Math.PI
//   );
//   liveVideoCtx.current.fillStyle = isSpecificPoint
//     ? specificPointColor
//     : "#FF0000";
//   liveVideoCtx.current.fill();
// }
