import { Delaunay } from "d3-delaunay";
import { Point2D, Point3D } from "./overlayImageOnLiveVideo";
import { olduvPoints, uvPoints } from "./uvPoints";
import { DelaunayTriangulation } from "./delaunayTriangulation";
import { uvMap } from "./uvMap";

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

  const overlayTriangles: [Point2D, Point2D, Point2D][] = [];
  const liveTriangles: [Point3D, Point3D, Point3D][] = [];

  for (let i = 0; i < liveTrianglesIndices.length; i += 3) {
    if (
      uvPoints[liveTrianglesIndices[i]] &&
      uvPoints[liveTrianglesIndices[i + 1]] &&
      uvPoints[liveTrianglesIndices[i + 2]]
    ) {
      const matchingEntry1 = uvMap.find(
        (entry) => entry.ai === liveTrianglesIndices[i]
      );
      const matchingEntry2 = uvMap.find(
        (entry) => entry.ai === liveTrianglesIndices[i + 1]
      );
      const matchingEntry3 = uvMap.find(
        (entry) => entry.ai === liveTrianglesIndices[i + 2]
      );
      if (matchingEntry1 && matchingEntry2 && matchingEntry3) {
        const overlayTriangle: [Point2D, Point2D, Point2D] = [
          {
            x: olduvPoints[matchingEntry1.uv].u,
            y: olduvPoints[matchingEntry1.uv].v,
          },
          {
            x: olduvPoints[matchingEntry2.uv].u,
            y: olduvPoints[matchingEntry2.uv].v,
          },
          {
            x: olduvPoints[matchingEntry3.uv].u,
            y: olduvPoints[matchingEntry3.uv].v,
          },
        ];
        overlayTriangles.push(overlayTriangle);
      }
    }
    if (
      livePoints[liveTrianglesIndices[i]] &&
      livePoints[liveTrianglesIndices[i + 1]] &&
      livePoints[liveTrianglesIndices[i + 2]]
    ) {
      const liveTriangle: [Point3D, Point3D, Point3D] = [
        livePoints[liveTrianglesIndices[i]],
        livePoints[liveTrianglesIndices[i + 1]],
        livePoints[liveTrianglesIndices[i + 2]],
      ];
      liveTriangles.push(liveTriangle);
    }
  }

  return { overlayTriangles, liveTriangles };
};
