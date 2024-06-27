interface Point {
  x: number;
  y: number;
}

interface Edge {
  p1: Point;
  p2: Point;
}

interface Vertex {
  point: Point;
  index: number;
}

type Triangle = [Vertex, Vertex, Vertex];

export class DelaunayTriangulation {
  private points: Point[];
  private triangles: Triangle[];

  constructor(points: Point[]) {
    this.points = points;
    this.triangles = [];

    // Perform initial triangulation
    this.initializeTriangulation();
  }

  private initializeTriangulation() {
    // Create a super triangle that contains all points
    const superTriangle = this.createSuperTriangle();

    // Add super triangle to the list of triangles
    this.triangles.push(superTriangle);

    // Incrementally add points to the triangulation
    for (const point of this.points) {
      const badTriangles: Triangle[] = [];
      const polygon: Vertex[] = [];

      // Find triangles that are affected by the addition of the point
      for (const triangle of this.triangles) {
        if (this.isPointInsideCircumcircle(point, triangle)) {
          badTriangles.push(triangle);
          for (const vertex of triangle) {
            if (!polygon.some((p) => p.point === vertex.point)) {
              polygon.push(vertex);
            }
          }
        }
      }

      // Remove bad triangles from the triangulation
      this.triangles = this.triangles.filter((t) => !badTriangles.includes(t));

      // Create new triangles from the polygon and the new point
      for (const vertex of polygon) {
        this.triangles.push([
          vertex,
          { point, index: this.points.indexOf(point) },
          {
            point: superTriangle[0].point,
            index: this.points.indexOf(superTriangle[0].point),
          },
        ]);
      }
    }

    // Remove triangles that include super triangle vertices
    this.triangles = this.triangles.filter((triangle) => {
      for (const vertex of triangle) {
        if (this.isVertexOfSuperTriangle(vertex.point)) {
          return false;
        }
      }
      return true;
    });

    // Ensure triangles are stored in counter-clockwise order
    for (const triangle of this.triangles) {
      this.fixTriangleOrientation(triangle);
    }
  }

  private createSuperTriangle(): Triangle {
    // Logic to create a super triangle that encompasses all points
    // Example implementation:
    const minX = Math.min(...this.points.map((p) => p.x));
    const minY = Math.min(...this.points.map((p) => p.y));
    const maxX = Math.max(...this.points.map((p) => p.x));
    const maxY = Math.max(...this.points.map((p) => p.y));

    const dx = maxX - minX;
    const dy = maxY - minY;
    const deltaMax = Math.max(dx, dy);
    const midX = (minX + maxX) / 2;
    const midY = (minY + maxY) / 2;

    // Ensure indices are valid within this.points
    const p1 = {
      point: { x: midX - 20 * deltaMax, y: midY - deltaMax },
      index: this.points.length,
    };
    const p2 = {
      point: { x: midX, y: midY + 20 * deltaMax },
      index: this.points.length + 1,
    };
    const p3 = {
      point: { x: midX + 20 * deltaMax, y: midY - deltaMax },
      index: this.points.length + 2,
    };

    return [p1, p2, p3];
  }

  private fixTriangleOrientation(triangle: Triangle) {
    // Calculate centroid of triangle
    const centroid = this.calculateCentroid(triangle);

    // Sort vertices based on counter-clockwise order from the centroid
    triangle.sort((a, b) => {
      return (
        Math.atan2(a.point.y - centroid.y, a.point.x - centroid.x) -
        Math.atan2(b.point.y - centroid.y, b.point.x - centroid.x)
      );
    });
  }

  private calculateCentroid(triangle: Triangle): Point {
    const sumX = triangle.reduce((acc, vertex) => acc + vertex.point.x, 0);
    const sumY = triangle.reduce((acc, vertex) => acc + vertex.point.y, 0);
    const centerX = sumX / 3;
    const centerY = sumY / 3;
    return { x: centerX, y: centerY };
  }

  public updatePointPosition(index: number, newX: number, newY: number) {
    const point = this.points[index];
    point.x = newX;
    point.y = newY;

    // Find affected triangles
    const affectedTriangles = this.findAffectedTriangles(point);

    // Update affected triangles
    for (const triangle of affectedTriangles) {
      if (this.isPointInsideCircumcircle(point, triangle)) {
        // Perform edge flip
        const edge = this.findCommonEdge(triangle, point);
        if (edge) {
          this.flipEdges(triangle, point, edge);
        }
      }
    }
  }

  private findAffectedTriangles(point: Point): Triangle[] {
    // Find all triangles that contain the point
    return this.triangles.filter((triangle) =>
      this.isPointInsideTriangle(point, triangle)
    );
  }

  private isPointInsideTriangle(point: Point, triangle: Triangle): boolean {
    const [p1, p2, p3] = triangle.map((vertex) => vertex.point);

    // Check if the point is inside the triangle using barycentric coordinates
    const areaABC = this.area(p1, p2, p3);
    const areaPBC = this.area(point, p2, p3);
    const areaPCA = this.area(p1, point, p3);
    const areaPAB = this.area(p1, p2, point);

    // If the sum of areas equals areaABC, point is inside triangle
    return Math.abs(areaABC - (areaPBC + areaPCA + areaPAB)) < Number.EPSILON;
  }

  private area(a: Point, b: Point, c: Point): number {
    return Math.abs(
      (a.x * (b.y - c.y) + b.x * (c.y - a.y) + c.x * (a.y - b.y)) / 2
    );
  }

  private isPointInsideCircumcircle(point: Point, triangle: Triangle): boolean {
    const [p1, p2, p3] = triangle.map((vertex) => vertex.point);

    // Compute the circumcircle of the triangle
    const cx =
      ((p1.x * p1.x + p1.y * p1.y) * (p2.y - p3.y) -
        (p2.x * p2.x + p2.y * p2.y) * (p1.y - p3.y) +
        (p3.x * p3.x + p3.y * p3.y) * (p1.y - p2.y)) /
      (2 * this.area(p1, p2, p3));

    const cy =
      ((p1.x * p1.x + p1.y * p1.y) * (p3.x - p2.x) +
        (p2.x * p2.x + p2.y * p2.y) * (p1.x - p3.x) +
        (p3.x * p3.x + p3.y * p3.y) * (p2.x - p1.x)) /
      (2 * this.area(p1, p2, p3));

    const radiusSquared = (p1.x - cx) * (p1.x - cx) + (p1.y - cy) * (p1.y - cy);

    const distanceSquared =
      (point.x - cx) * (point.x - cx) + (point.y - cy) * (point.y - cy);

    return distanceSquared <= radiusSquared;
  }

  private findCommonEdge(triangle: Triangle, point: Point): Edge | undefined {
    const edges: Edge[] = [
      { p1: triangle[0].point, p2: triangle[1].point },
      { p1: triangle[1].point, p2: triangle[2].point },
      { p1: triangle[2].point, p2: triangle[0].point },
    ];

    for (const edge of edges) {
      if (
        (edge.p1 === point && edge.p2 === triangle[0].point) ||
        (edge.p1 === triangle[0].point && edge.p2 === point)
      ) {
        return edge;
      }
      if (
        (edge.p1 === point && edge.p2 === triangle[1].point) ||
        (edge.p1 === triangle[1].point && edge.p2 === point)
      ) {
        return edge;
      }
      if (
        (edge.p1 === point && edge.p2 === triangle[2].point) ||
        (edge.p1 === triangle[2].point && edge.p2 === point)
      ) {
        return edge;
      }
    }

    return undefined;
  }

  private flipEdges(triangle: Triangle, point: Point, edge: Edge) {
    // Perform edge flip to maintain Delaunay triangulation
    // Update triangle vertices based on edge and point
    const newTriangle1: Triangle = [
      { point: edge.p1, index: this.points.indexOf(edge.p1) },
      { point: edge.p2, index: this.points.indexOf(edge.p2) },
      { point, index: this.points.indexOf(point) },
    ];

    const newTriangle2: Triangle = [
      { point: edge.p2, index: this.points.indexOf(edge.p2) },
      triangle[(triangle.findIndex((v) => v.point === edge.p2) + 1) % 3],
      { point, index: this.points.indexOf(point) },
    ];

    // Replace old triangle with new triangles in the triangulation
    this.triangles = this.triangles.filter((t) => t !== triangle);
    this.triangles.push(newTriangle1, newTriangle2);

    // Ensure new triangles are stored in counter-clockwise order
    this.fixTriangleOrientation(newTriangle1);
    this.fixTriangleOrientation(newTriangle2);
  }

  private isVertexOfSuperTriangle(vertex: Point): boolean {
    // Assuming super triangle vertices are outside the bounds of the actual points
    // Adjust this logic based on your implementation of the super triangle
    return false; // Placeholder, update based on your super triangle implementation
  }

  // Method to get the resulting triangles
  public getTriangles(): Triangle[] {
    return this.triangles;
  }
}
