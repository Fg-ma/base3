import * as cv from "opencv.js"; // Import opencv.js (ensure it's included in your project)
import * as mp from "@mediapipe/face_mesh";

const lk_params = {
  winSize: new cv.Size(101, 101),
  maxLevel: 15,
  criteria: new cv.TermCriteria(
    cv.TermCriteria_EPS | cv.TermCriteria_COUNT,
    20,
    0.001
  ),
};

function constrainPoint(p: cv.Point, w: number, h: number): cv.Point {
  p.x = Math.min(Math.max(p.x, 0), w - 1);
  p.y = Math.min(Math.max(p.y, 0), h - 1);
  return p;
}

class FaceDetector {
  private mpDraw: any;
  private mpFaceMesh: any;
  private faceMesh: any;
  private drawSpec: any;
  private stream_started: boolean;
  private points2Prev: any;
  private img2GrayPrev: any;

  constructor() {
    this.mpDraw = mp.solutions.drawing_utils;
    this.mpFaceMesh = mp.solutions.face_mesh;
    this.faceMesh = new this.mpFaceMesh.FaceMesh({
      static_image_mode: true,
      max_num_faces: 1,
      min_detection_confidence: 0.5,
    });
    this.drawSpec = new this.mpDraw.DrawingSpec({
      thickness: 1,
      circle_radius: 1,
      color: new cv.Scalar(200, 200, 0),
    });
    this.stream_started = false;
  }

  stabilizeVideoStream(frame: cv.Mat, landmarks: cv.Point[]): void {
    const img2Gray = new cv.Mat();
    cv.cvtColor(frame, img2Gray, cv.COLOR_BGR2GRAY);

    if (!this.stream_started) {
      this.points2Prev = new cv.Mat(landmarks, cv.CV_32F);
      this.img2GrayPrev = img2Gray.clone();
      this.stream_started = true;
    }

    const { nextPts, status, err } = cv.calcOpticalFlowPyrLK(
      this.img2GrayPrev,
      img2Gray,
      this.points2Prev,
      new cv.Mat(landmarks, cv.CV_32F),
      lk_params
    );

    for (let k = 0; k < landmarks.length; k++) {
      const d = cv.norm(landmarks[k], nextPts[k], cv.NORM_L2);
      const alpha = Math.exp((-d * d) / 50);
      landmarks[k].x = (1 - alpha) * landmarks[k].x + alpha * nextPts[k].x;
      landmarks[k].y = (1 - alpha) * landmarks[k].y + alpha * nextPts[k].y;
      landmarks[k] = constrainPoint(landmarks[k], frame.cols, frame.rows);
    }

    this.points2Prev = new cv.Mat(landmarks, cv.CV_32F);
    this.img2GrayPrev = img2Gray.clone();
    img2Gray.delete();
  }

  loadTargetImage(imgPath: string): { img: cv.Mat; alpha: cv.Mat } {
    const img = cv.imread(imgPath, cv.IMREAD_UNCHANGED);
    const resizedImg = new cv.Mat();
    cv.resize(img, resizedImg, new cv.Size(480, 640), 0, 0, cv.INTER_AREA);
    const [b, g, r, alpha] = cv.split(resizedImg);
    const imgBGR = new cv.Mat();
    cv.merge([b, g, r], imgBGR);
    return { img: imgBGR, alpha };
  }

  drawLandmarks(img: cv.Mat, landmarks: cv.Point[]): cv.Mat {
    const out = img.clone();
    this.mpDraw.draw_landmarks(
      out,
      landmarks,
      this.mpFaceMesh.FACEMESH_TESSELATION,
      this.drawSpec,
      this.drawSpec
    );
    this.mpDraw.draw_landmarks(
      out,
      landmarks,
      this.mpFaceMesh.FACEMESH_CONTOURS,
      this.drawSpec,
      this.drawSpec
    );
    // this.mpDraw.draw_landmarks(out, landmarks, this.mpFaceMesh.FACEMESH_IRISES, this.drawSpec, this.drawSpec);
    return out;
  }

  findFaceLandmarks(img: cv.Mat): {
    landmarks: cv.Point[];
    img: cv.Mat;
    faceLandmarks: any;
  } {
    const imgRGB = new cv.Mat();
    cv.cvtColor(img, imgRGB, cv.COLOR_BGR2RGB);
    const results = this.faceMesh.process(imgRGB);

    const selectedKeypointIndices = [
      127, 93, 58, 136, 150, 149, 176, 148, 152, 377, 400, 378, 379, 365, 288,
      323, 356, 70, 63, 105, 66, 55, 285, 296, 334, 293, 300, 168, 6, 195, 4,
      64, 60, 94, 290, 439, 33, 160, 158, 173, 153, 144, 398, 385, 387, 466,
      373, 380, 61, 40, 39, 0, 269, 270, 291, 321, 405, 17, 181, 91, 78, 81, 13,
      311, 306, 402, 14, 178, 162, 54, 67, 10, 297, 284, 389,
    ];

    if (!results.multi_face_landmarks) {
      console.log("Face not detected!!!");
      return { landmarks: [], img: null, faceLandmarks: null };
    }

    const landmarks: cv.Point[] = [];
    const height = img.rows;
    const width = img.cols;

    const faceLandmarks = results.multi_face_landmarks[0];

    const values = faceLandmarks.landmark;
    const faceKeypoints: cv.Point[] = [];

    for (let i = 0; i < values.length; i++) {
      faceKeypoints.push(new cv.Point(values[i].x, values[i].y));
    }

    faceKeypoints.forEach((point, idx) => {
      faceKeypoints[idx].x *= width;
      faceKeypoints[idx].y *= height;
    });

    selectedKeypointIndices.forEach((index) => {
      landmarks.push(faceKeypoints[index]);
    });

    return { landmarks, img, faceLandmarks };
  }
}

export default FaceDetector;
