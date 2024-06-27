import { Delaunay } from "d3-delaunay";
import { Point2D, Point3D } from "./overlayImageOnLiveVideo";
import { uvPoints } from "./uvPoints";
import { DelaunayTriangulation } from "./delaunayTriangulation";

export const getTriangles = (livePoints: Point3D[]) => {
  // const liveDelaunay = new DelaunayTriangulation(livePoints);
  // console.log(liveDelaunay.getTriangles());
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

  const overlayTriangles: [Point2D, Point2D, Point2D][] = [];
  const liveTriangles: [Point3D, Point3D, Point3D][] = [];

  for (let i = 0; i < overlayTrianglesIndices.length; i += 3) {
    if (
      uvPoints[overlayTrianglesIndices[i]] &&
      uvPoints[overlayTrianglesIndices[i + 1]] &&
      uvPoints[overlayTrianglesIndices[i + 2]]
    ) {
      const overlayTriangle: [Point2D, Point2D, Point2D] = [
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
      overlayTriangles.push(overlayTriangle);
    }
    if (
      livePoints[overlayTrianglesIndices[i]] &&
      livePoints[overlayTrianglesIndices[i + 1]] &&
      livePoints[overlayTrianglesIndices[i + 2]]
    ) {
      const liveTriangle: [Point3D, Point3D, Point3D] = [
        livePoints[overlayTrianglesIndices[i]],
        livePoints[overlayTrianglesIndices[i + 1]],
        livePoints[overlayTrianglesIndices[i + 2]],
      ];
      liveTriangles.push(liveTriangle);
    }
  }

  return { overlayTriangles, liveTriangles };
};
