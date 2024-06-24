import * as cv from "opencv.js";

class MaskGenerator {
  private target: any;

  constructor() {
    this.target = {};
  }

  findConvexHull(points: cv.Point[]): [cv.Point[], cv.Point[]] {
    const hull: cv.Point[] = [];
    const hullIndex = cv.convexHull(new cv.Mat(points), false, true);

    const addPoints = [
      48,
      49,
      50,
      51,
      52,
      53,
      54,
      55,
      56,
      57,
      58,
      59, // Outer lips
      60,
      61,
      62,
      63,
      64,
      65,
      66,
      67, // Inner lips
      27,
      28,
      29,
      30,
      31,
      32,
      33,
      34,
      35, // Nose
      36,
      37,
      38,
      39,
      40,
      41,
      42,
      43,
      44,
      45,
      46,
      47, // Eyes
      17,
      18,
      19,
      20,
      21,
      22,
      23,
      24,
      25,
      26, // Eyebrows
    ];

    addPoints.forEach((index) => {
      hullIndex.push(new cv.Point(index, 0));
    });

    hullIndex.forEach((index) => {
      hull.push(points[index.x]);
    });

    return [hull, hullIndex];
  }

  rectContains(rect: cv.Rect, point: cv.Point): boolean {
    return (
      point.x >= rect.x &&
      point.y >= rect.y &&
      point.x <= rect.x + rect.width &&
      point.y <= rect.y + rect.height
    );
  }

  calculateDelaunayTriangles(rect: cv.Rect, points: cv.Point[]): number[][] {
    const subdiv = new cv.Subdiv2D();
    points.forEach((p) => {
      subdiv.insert(p);
    });

    const triangleList = subdiv.getTriangleList();
    const delaunay: number[][] = [];

    triangleList.forEach((t) => {
      const pt = [
        new cv.Point(t.x, t.y),
        new cv.Point(t.x + t.width, t.y),
        new cv.Point(t.x, t.y + t.height),
      ];

      if (
        this.rectContains(rect, pt[0]) &&
        this.rectContains(rect, pt[1]) &&
        this.rectContains(rect, pt[2])
      ) {
        const ind: number[] = [];
        pt.forEach((point, j) => {
          points.forEach((p, k) => {
            if (
              Math.abs(point.x - p.x) < 1.0 &&
              Math.abs(point.y - p.y) < 1.0
            ) {
              ind.push(k);
            }
          });
        });

        if (ind.length === 3) {
          delaunay.push(ind);
        }
      }
    });

    return delaunay;
  }

  applyAffineTransform(
    src: cv.Mat,
    srcTri: cv.Point[],
    dstTri: cv.Point[],
    size: cv.Size
  ): cv.Mat {
    const warpMat = cv.getAffineTransform(srcTri, dstTri);
    const dst = new cv.Mat();
    cv.warpAffine(
      src,
      dst,
      warpMat,
      size,
      cv.INTER_LINEAR,
      cv.BORDER_REFLECT_101
    );
    return dst;
  }

  warpTriangle(
    img1: cv.Mat,
    img2: cv.Mat,
    t1: cv.Point[],
    t2: cv.Point[]
  ): void {
    const r1 = cv.boundingRect(new cv.Mat(t1));
    const r2 = cv.boundingRect(new cv.Mat(t2));

    const t1Rect: cv.Point[] = [];
    const t2Rect: cv.Point[] = [];
    const t2RectInt: cv.Point[] = [];

    t1.forEach((p) => {
      t1Rect.push(new cv.Point(p.x - r1.x, p.y - r1.y));
    });

    t2.forEach((p) => {
      t2Rect.push(new cv.Point(p.x - r2.x, p.y - r2.y));
      t2RectInt.push(new cv.Point(p.x - r2.x, p.y - r2.y));
    });

    const mask = new cv.Mat.zeros(r2.height, r2.width, cv.CV_32FC3);
    cv.fillConvexPoly(mask, t2RectInt, new cv.Scalar(1.0, 1.0, 1.0), 16, 0);

    const img1Rect = img1.roi(r1);
    const size = new cv.Size(r2.width, r2.height);
    const img2Rect = this.applyAffineTransform(img1Rect, t1Rect, t2Rect, size);

    img2Rect.convertTo(img2Rect, img2.type());
    img2Rect.mul(mask);

    const maskInv = new cv.Mat.zeros(r2.height, r2.width, cv.CV_32FC3);
    maskInv.setTo(new cv.Scalar(1.0, 1.0, 1.0));
    maskInv.sub(mask);

    const temp1 = new cv.Mat();
    cv.multiply(img2, mask, temp1);
    const temp2 = new cv.Mat();
    cv.multiply(img2Rect, maskInv, temp2);
    const output = new cv.Mat();
    cv.add(temp1, temp2, output);

    output.copyTo(img2);
  }

  calculateTargetInfo(
    targetImage: cv.Mat,
    targetAlpha: cv.Mat,
    targetLandmarks: cv.Point[]
  ): void {
    const [hull, hullIndex] = this.findConvexHull(targetLandmarks);
    const rect = new cv.Rect(0, 0, targetImage.cols, targetImage.rows);
    const dt = this.calculateDelaunayTriangles(rect, hull);

    this.target["image"] = targetImage.clone();
    this.target["width"] = targetImage.cols;
    this.target["height"] = targetImage.rows;
    this.target["alpha"] = targetAlpha.clone();
    this.target["landmarks"] = targetLandmarks;
    this.target["hull"] = hull;
    this.target["hullIndex"] = hullIndex;
    this.target["dt"] = dt;
  }

  applyTargetMask(actualImg: cv.Mat, actualLandmarks: cv.Point[]): cv.Mat {
    const warpedImg = actualImg.clone();

    const hull2: cv.Point[] = [];
    this.target["hullIndex"].forEach((index) => {
      hull2.push(actualLandmarks[index.x]);
    });

    const mask1 = new cv.Mat.zeros(warpedImg.rows, warpedImg.cols, cv.CV_32FC3);
    const img1AlphaMask = new cv.Mat.zeros(
      warpedImg.rows,
      warpedImg.cols,
      cv.CV_32FC3
    );
    cv.split(this.target["alpha"], img1AlphaMask);

    for (let i = 0; i < this.target["dt"].length; i++) {
      const t1: cv.Point[] = [];
      const t2: cv.Point[] = [];

      this.target["dt"][i].forEach((index) => {
        t1.push(this.target["hull"][index]);
        t2.push(hull2[index]);
      });

      this.warpTriangle(this.target["image"], warpedImg, t1, t2);
      this.warpTriangle(this.target["alpha"], mask1, t1, t2);
    }

    cv.GaussianBlur(mask1, mask1, new cv.Size(3, 3), 10, 10);
    const mask2 = new cv.Mat();
    mask2.setTo(new cv.Scalar(255.0, 255.0, 255.0));
    mask2.sub(mask1);

    const temp1 = new cv.Mat();
    cv.multiply(warpedImg, mask1, temp1, 1 / 255, -1);

    const temp2 = new cv.Mat();
    cv.multiply(actualImg, mask2, temp2, 1 / 255, -1);

    const output = new cv.Mat();
    cv.add(temp1, temp2, output);

    return output;
  }

  applyTargetMaskToTarget(actualLandmarks: cv.Point[]): cv.Mat {
    const tW = this.target["width"];
    const tH = this.target["height"];

    const ptsSrc = this.target["landmarks"].map((p) => [p.x, p.y]);
    const ptsDst = actualLandmarks.map((p) => [p.x, p.y]);
    const h = cv.findHomography(ptsSrc, ptsDst);

    const imOutTemp1 = new cv.Mat();
    cv.warpPerspective(this.temp1, imOutTemp1, h, new cv.Size(tW, tH));

    const imOutMask1 = new cv.Mat();
    cv.warpPerspective(this.mask1, imOutMask1, h, new cv.Size(tW, tH));

    const mask2 = new cv.Mat();
    mask2.setTo(new cv.Scalar(255.0, 255.0, 255.0));
    mask2.sub(imOutMask1);

    const temp2 = new cv.Mat();
    cv.multiply(this.target["image"], mask2, temp2, 1 / 255, -1);

    const output = new cv.Mat();
    cv.add(imOutTemp1, temp2, output);

    return output;
  }
}

export default MaskGenerator;
