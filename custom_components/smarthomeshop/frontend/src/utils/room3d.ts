// Shared 3D room renderer for SmartHomeShop.
//
// This is a 1:1 port of the Room Designer panel 3D view so the
// UltimateSensor card shows exactly the same scene. If the panel renderer
// changes (panel/src/pages/zones-page.ts), port the change here as well.
//
// Renders at a fixed internal resolution of 800x600; scale via CSS.

export interface P2 { x: number; y: number }
export interface P3 { x: number; y: number; z: number }

export interface Scene3DFurniture { x: number; y: number; width: number; height: number; rotation: number; name: string }
export interface Scene3DDoor { wallIndex: number; position: number; width: number }
export interface Scene3DWindow { wallIndex: number; position: number; width: number; height: number }
export interface Scene3DZone { points: P2[]; type: 'detection' | 'exclusion' | 'entry'; name: string; inDirection?: 'left' | 'right' }
export interface Scene3DSensor { x: number; y: number; rotation: number; range: number; fov: number; heightMm?: number }

export interface Scene3D {
  roomPoints: P2[];
  furniture: Scene3DFurniture[];
  doors: Scene3DDoor[];
  windows: Scene3DWindow[];
  zones: Scene3DZone[];
  sensors: Scene3DSensor[];
  /** Active targets in world (room) coordinates */
  targets: P2[];
}

const ZONE_COLORS: Record<string, { fill: string; stroke: string }> = {
  detection: { fill: 'rgba(34, 197, 94, 0.2)', stroke: '#22c55e' },
  exclusion: { fill: 'rgba(239, 68, 68, 0.2)', stroke: '#ef4444' },
  entry: { fill: 'rgba(16, 185, 129, 0.25)', stroke: '#10b981' },
};

const W = 800;
const H = 600;

export class Room3DRenderer {
  public camera = { azimuth: 45, elevation: 35, distance: 8000, targetX: 0, targetY: 0, targetZ: 1000 };
  public readonly wallHeight = 2500;

  resetCamera(roomPoints: P2[]): void {
    if (roomPoints.length >= 3) {
      const xs = roomPoints.map(p => p.x);
      const ys = roomPoints.map(p => p.y);
      const centerX = (Math.min(...xs) + Math.max(...xs)) / 2;
      const centerY = (Math.min(...ys) + Math.max(...ys)) / 2;
      const size = Math.max(Math.max(...xs) - Math.min(...xs), Math.max(...ys) - Math.min(...ys));
      this.camera = {
        azimuth: 45, elevation: 35,
        distance: Math.max(4000, size * 1.5),
        targetX: centerX, targetY: centerY,
        targetZ: this.wallHeight / 2,
      };
    } else {
      this.camera = { azimuth: 45, elevation: 35, distance: 8000, targetX: 0, targetY: 0, targetZ: 1000 };
    }
  }

  orbit(dx: number, dy: number): void {
    this.camera.azimuth = (this.camera.azimuth - dx * 0.5) % 360;
    this.camera.elevation = Math.max(5, Math.min(85, this.camera.elevation + dy * 0.3));
  }

  zoomBy(factor: number): void {
    this.camera.distance = Math.max(2000, Math.min(20000, this.camera.distance * factor));
  }

  render(canvas: HTMLCanvasElement, scene: Scene3D): void {
    canvas.width = W;
    canvas.height = H;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const bgGrad = ctx.createLinearGradient(0, 0, 0, H);
    bgGrad.addColorStop(0, '#1e293b');
    bgGrad.addColorStop(1, '#0f172a');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, W, H);

    this.drawGrid(ctx);
    if (scene.roomPoints.length >= 3) {
      this.drawRoom(ctx, scene);
      this.drawFurniture(ctx, scene);
      this.drawDoors(ctx, scene);
      this.drawWindows(ctx, scene);
      this.drawZones(ctx, scene);
    }
    this.drawSensors(ctx, scene);
    this.drawTargets(ctx, scene);
  }

  private project(p: P3): P2 {
    const cam = this.camera;
    const azRad = (cam.azimuth * Math.PI) / 180;
    const elRad = (cam.elevation * Math.PI) / 180;

    const dx = p.x - cam.targetX;
    const dy = p.y - cam.targetY;
    const dz = p.z - cam.targetZ;

    const x1 = dx * Math.cos(azRad) - dy * Math.sin(azRad);
    const y1 = dx * Math.sin(azRad) + dy * Math.cos(azRad);
    const z1 = dz;

    const y2 = y1 * Math.cos(elRad) - z1 * Math.sin(elRad);
    const z2 = y1 * Math.sin(elRad) + z1 * Math.cos(elRad);

    const fov = 60;
    const scale = (1 / Math.tan((fov * Math.PI) / 360)) * 400;
    const depth = cam.distance + y2;
    const factor = depth > 50 ? scale / depth : scale / 50;

    // Mirror X-axis to match the 2D view orientation
    return { x: W / 2 - x1 * factor, y: H / 2 - z2 * factor };
  }

  private drawGrid(ctx: CanvasRenderingContext2D): void {
    ctx.strokeStyle = 'rgba(71, 85, 105, 0.3)';
    ctx.lineWidth = 1;
    const gridSize = 1000;
    const gridRange = 5000;

    for (let i = -gridRange; i <= gridRange; i += gridSize) {
      const p1 = this.project({ x: i, y: -gridRange, z: 0 });
      const p2 = this.project({ x: i, y: gridRange, z: 0 });
      ctx.beginPath(); ctx.moveTo(p1.x, p1.y); ctx.lineTo(p2.x, p2.y); ctx.stroke();

      const p3 = this.project({ x: -gridRange, y: i, z: 0 });
      const p4 = this.project({ x: gridRange, y: i, z: 0 });
      ctx.beginPath(); ctx.moveTo(p3.x, p3.y); ctx.lineTo(p4.x, p4.y); ctx.stroke();
    }
  }

  private drawRoom(ctx: CanvasRenderingContext2D, scene: Scene3D): void {
    const pts = scene.roomPoints;

    // Floor
    ctx.fillStyle = 'rgba(67, 97, 238, 0.08)';
    ctx.strokeStyle = 'rgba(67, 97, 238, 0.4)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    const first = this.project({ x: pts[0].x, y: pts[0].y, z: 0 });
    ctx.moveTo(first.x, first.y);
    for (let i = 1; i < pts.length; i++) {
      const p = this.project({ x: pts[i].x, y: pts[i].y, z: 0 });
      ctx.lineTo(p.x, p.y);
    }
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Walls back-to-front
    const wallsWithDepth = pts.map((p, i) => {
      const next = pts[(i + 1) % pts.length];
      const midX = (p.x + next.x) / 2;
      const midY = (p.y + next.y) / 2;
      const dist = Math.hypot(midX - this.camera.targetX, midY - this.camera.targetY);
      return { index: i, dist };
    }).sort((a, b) => b.dist - a.dist);

    for (const { index } of wallsWithDepth) {
      this.drawWall(ctx, scene, index);
    }
  }

  private drawWall(ctx: CanvasRenderingContext2D, scene: Scene3D, wallIndex: number): void {
    const pts = scene.roomPoints;
    const p1 = pts[wallIndex];
    const p2 = pts[(wallIndex + 1) % pts.length];

    const bl = this.project({ x: p1.x, y: p1.y, z: 0 });
    const br = this.project({ x: p2.x, y: p2.y, z: 0 });
    const tr = this.project({ x: p2.x, y: p2.y, z: this.wallHeight });
    const tl = this.project({ x: p1.x, y: p1.y, z: this.wallHeight });

    const dx = p2.x - p1.x;
    const dy = p2.y - p1.y;
    const normalAngle = Math.atan2(dy, dx) + Math.PI / 2;
    const lightDir = (this.camera.azimuth * Math.PI) / 180;
    const shade = 0.3 + 0.4 * Math.abs(Math.cos(normalAngle - lightDir));

    const wallGrad = ctx.createLinearGradient(
      (bl.x + br.x) / 2, Math.max(bl.y, br.y),
      (tl.x + tr.x) / 2, Math.min(tl.y, tr.y)
    );
    wallGrad.addColorStop(0, `rgba(71, 85, 105, ${shade * 0.5})`);
    wallGrad.addColorStop(1, `rgba(71, 85, 105, ${shade * 0.2})`);

    ctx.fillStyle = wallGrad;
    ctx.strokeStyle = '#475569';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(bl.x, bl.y); ctx.lineTo(br.x, br.y);
    ctx.lineTo(tr.x, tr.y); ctx.lineTo(tl.x, tl.y);
    ctx.closePath();
    ctx.fill(); ctx.stroke();
  }

  private drawFurniture(ctx: CanvasRenderingContext2D, scene: Scene3D): void {
    for (const f of scene.furniture) {
      const hw = f.width / 2;
      const hh = f.height / 2;
      const furnitureHeight = 400;

      // Bottom corners, rotated around the furniture center
      const rad = ((f.rotation || 0) * Math.PI) / 180;
      const cosR = Math.cos(rad), sinR = Math.sin(rad);
      const cornerOffsets: Array<[number, number]> = [[-hw, -hh], [hw, -hh], [hw, hh], [-hw, hh]];
      const corners3D: P3[] = cornerOffsets.map(([ox, oy]) => ({
        x: f.x + ox * cosR - oy * sinR,
        y: f.y + ox * sinR + oy * cosR,
        z: 0,
      }));
      const topCorners3D = corners3D.map(c => ({ ...c, z: furnitureHeight }));
      const bottom = corners3D.map(c => this.project(c));
      const top = topCorners3D.map(c => this.project(c));

      ctx.fillStyle = 'rgba(148, 163, 184, 0.5)';
      ctx.strokeStyle = '#64748b';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(top[0].x, top[0].y);
      for (let i = 1; i < 4; i++) ctx.lineTo(top[i].x, top[i].y);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      for (let i = 0; i < 4; i++) {
        const ni = (i + 1) % 4;
        ctx.fillStyle = 'rgba(148, 163, 184, 0.25)';
        ctx.beginPath();
        ctx.moveTo(bottom[i].x, bottom[i].y);
        ctx.lineTo(bottom[ni].x, bottom[ni].y);
        ctx.lineTo(top[ni].x, top[ni].y);
        ctx.lineTo(top[i].x, top[i].y);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
      }

      const center = this.project({ x: f.x, y: f.y, z: furnitureHeight + 100 });
      ctx.fillStyle = '#94a3b8';
      ctx.font = '11px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(f.name, center.x, center.y);
    }
  }

  private drawDoors(ctx: CanvasRenderingContext2D, scene: Scene3D): void {
    const doorHeight = 2000;
    const depth = 80;

    for (const door of scene.doors) {
      if (door.wallIndex >= scene.roomPoints.length) continue;
      const p1 = scene.roomPoints[door.wallIndex];
      const p2 = scene.roomPoints[(door.wallIndex + 1) % scene.roomPoints.length];
      const doorX = p1.x + (p2.x - p1.x) * door.position;
      const doorY = p1.y + (p2.y - p1.y) * door.position;
      const wallAngle = Math.atan2(p2.y - p1.y, p2.x - p1.x);
      const hw = door.width / 2;

      const cos = Math.cos(wallAngle), sin = Math.sin(wallAngle);
      const perpCos = Math.cos(wallAngle + Math.PI / 2), perpSin = Math.sin(wallAngle + Math.PI / 2);
      const worldCorners = [
        { x: doorX - hw * cos - depth / 2 * perpCos, y: doorY - hw * sin - depth / 2 * perpSin },
        { x: doorX + hw * cos - depth / 2 * perpCos, y: doorY + hw * sin - depth / 2 * perpSin },
        { x: doorX + hw * cos + depth / 2 * perpCos, y: doorY + hw * sin + depth / 2 * perpSin },
        { x: doorX - hw * cos + depth / 2 * perpCos, y: doorY - hw * sin + depth / 2 * perpSin },
      ];
      const bottom = worldCorners.map(c => this.project({ ...c, z: 0 }));
      const top = worldCorners.map(c => this.project({ ...c, z: doorHeight }));

      ctx.strokeStyle = '#8b5a2b';
      ctx.lineWidth = 1;
      ctx.fillStyle = 'rgba(139, 90, 43, 0.6)';
      ctx.beginPath();
      ctx.moveTo(top[0].x, top[0].y);
      for (let i = 1; i < 4; i++) ctx.lineTo(top[i].x, top[i].y);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      for (let i = 0; i < 4; i++) {
        const ni = (i + 1) % 4;
        ctx.fillStyle = i % 2 === 0 ? 'rgba(139, 90, 43, 0.5)' : 'rgba(139, 90, 43, 0.35)';
        ctx.beginPath();
        ctx.moveTo(bottom[i].x, bottom[i].y);
        ctx.lineTo(bottom[ni].x, bottom[ni].y);
        ctx.lineTo(top[ni].x, top[ni].y);
        ctx.lineTo(top[i].x, top[i].y);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
      }
    }
  }

  private drawWindows(ctx: CanvasRenderingContext2D, scene: Scene3D): void {
    const windowBottom = 900;
    const depth = 50;

    for (const win of scene.windows) {
      if (win.wallIndex >= scene.roomPoints.length) continue;
      const p1 = scene.roomPoints[win.wallIndex];
      const p2 = scene.roomPoints[(win.wallIndex + 1) % scene.roomPoints.length];
      const winX = p1.x + (p2.x - p1.x) * win.position;
      const winY = p1.y + (p2.y - p1.y) * win.position;
      const wallAngle = Math.atan2(p2.y - p1.y, p2.x - p1.x);
      const hw = win.width / 2;
      const winHeight = win.height || 1100;

      const cos = Math.cos(wallAngle), sin = Math.sin(wallAngle);
      const perpCos = Math.cos(wallAngle + Math.PI / 2), perpSin = Math.sin(wallAngle + Math.PI / 2);
      const worldCorners = [
        { x: winX - hw * cos - depth / 2 * perpCos, y: winY - hw * sin - depth / 2 * perpSin },
        { x: winX + hw * cos - depth / 2 * perpCos, y: winY + hw * sin - depth / 2 * perpSin },
        { x: winX + hw * cos + depth / 2 * perpCos, y: winY + hw * sin + depth / 2 * perpSin },
        { x: winX - hw * cos + depth / 2 * perpCos, y: winY - hw * sin + depth / 2 * perpSin },
      ];
      const bottom = worldCorners.map(c => this.project({ ...c, z: windowBottom }));
      const top = worldCorners.map(c => this.project({ ...c, z: windowBottom + winHeight }));

      ctx.strokeStyle = '#4a90a4';
      ctx.lineWidth = 1;
      ctx.fillStyle = 'rgba(135, 206, 235, 0.4)';
      ctx.beginPath();
      ctx.moveTo(top[0].x, top[0].y);
      for (let i = 1; i < 4; i++) ctx.lineTo(top[i].x, top[i].y);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      for (let i = 0; i < 4; i++) {
        const ni = (i + 1) % 4;
        ctx.fillStyle = i % 2 === 0 ? 'rgba(135, 206, 235, 0.35)' : 'rgba(135, 206, 235, 0.25)';
        ctx.beginPath();
        ctx.moveTo(bottom[i].x, bottom[i].y);
        ctx.lineTo(bottom[ni].x, bottom[ni].y);
        ctx.lineTo(top[ni].x, top[ni].y);
        ctx.lineTo(top[i].x, top[i].y);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
      }
    }
  }

  private drawZones(ctx: CanvasRenderingContext2D, scene: Scene3D): void {
    const zoneHeight = this.wallHeight;

    for (const zone of scene.zones) {
      const colors = ZONE_COLORS[zone.type] || ZONE_COLORS.detection;
      const pts = zone.points;

      if (zone.type === 'entry' && pts.length === 2) {
        const p1 = pts[0], p2 = pts[1];
        const bl1 = this.project({ x: p1.x, y: p1.y, z: 0 });
        const bl2 = this.project({ x: p2.x, y: p2.y, z: 0 });
        const tl1 = this.project({ x: p1.x, y: p1.y, z: zoneHeight });
        const tl2 = this.project({ x: p2.x, y: p2.y, z: zoneHeight });

        ctx.fillStyle = colors.fill.replace('0.25', '0.4');
        ctx.strokeStyle = colors.stroke;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(bl1.x, bl1.y); ctx.lineTo(bl2.x, bl2.y);
        ctx.lineTo(tl2.x, tl2.y); ctx.lineTo(tl1.x, tl1.y);
        ctx.closePath();
        ctx.fill(); ctx.stroke();

        const mid3D = this.project({ x: (p1.x + p2.x) / 2, y: (p1.y + p2.y) / 2, z: zoneHeight / 2 });
        ctx.fillStyle = colors.stroke;
        ctx.font = 'bold 14px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(zone.inDirection === 'left' ? '← IN' : 'IN →', mid3D.x, mid3D.y);
      } else if (pts.length >= 3) {
        // Floor
        ctx.fillStyle = colors.fill;
        ctx.strokeStyle = colors.stroke;
        ctx.lineWidth = 2;
        ctx.beginPath();
        const firstFloor = this.project({ x: pts[0].x, y: pts[0].y, z: 10 });
        ctx.moveTo(firstFloor.x, firstFloor.y);
        for (let i = 1; i < pts.length; i++) {
          const p = this.project({ x: pts[i].x, y: pts[i].y, z: 10 });
          ctx.lineTo(p.x, p.y);
        }
        ctx.closePath();
        ctx.fill(); ctx.stroke();

        // Ceiling
        ctx.fillStyle = colors.fill.replace('0.2', '0.15');
        ctx.beginPath();
        const firstCeiling = this.project({ x: pts[0].x, y: pts[0].y, z: zoneHeight });
        ctx.moveTo(firstCeiling.x, firstCeiling.y);
        for (let i = 1; i < pts.length; i++) {
          const p = this.project({ x: pts[i].x, y: pts[i].y, z: zoneHeight });
          ctx.lineTo(p.x, p.y);
        }
        ctx.closePath();
        ctx.fill(); ctx.stroke();

        // Vertical faces
        for (let i = 0; i < pts.length; i++) {
          const p1 = pts[i];
          const p2 = pts[(i + 1) % pts.length];
          const bl = this.project({ x: p1.x, y: p1.y, z: 10 });
          const br = this.project({ x: p2.x, y: p2.y, z: 10 });
          const tr = this.project({ x: p2.x, y: p2.y, z: zoneHeight });
          const tl = this.project({ x: p1.x, y: p1.y, z: zoneHeight });
          ctx.fillStyle = colors.fill.replace('0.2', '0.12');
          ctx.strokeStyle = colors.stroke;
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(bl.x, bl.y);
          ctx.lineTo(br.x, br.y);
          ctx.lineTo(tr.x, tr.y);
          ctx.lineTo(tl.x, tl.y);
          ctx.closePath();
          ctx.fill();
          ctx.stroke();
        }

        const centerX = pts.reduce((s, p) => s + p.x, 0) / pts.length;
        const centerY = pts.reduce((s, p) => s + p.y, 0) / pts.length;
        const labelPos = this.project({ x: centerX, y: centerY, z: zoneHeight / 2 });
        ctx.fillStyle = colors.stroke;
        ctx.font = 'bold 12px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(zone.name, labelPos.x, labelPos.y);
      }
    }
  }

  private drawSensors(ctx: CanvasRenderingContext2D, scene: Scene3D): void {
    for (const sn of scene.sensors) {
      const sensorZ = sn.heightMm ?? 2000;
      const pos = this.project({ x: sn.x, y: sn.y, z: sensorZ });
      const fovRad = (sn.fov / 2) * Math.PI / 180;
      const rotRad = (sn.rotation - 90) * Math.PI / 180;
      const leftAngle = rotRad - fovRad;
      const rightAngle = rotRad + fovRad;
      const leftX = sn.x + Math.cos(leftAngle) * sn.range;
      const leftY = sn.y + Math.sin(leftAngle) * sn.range;
      const rightX = sn.x + Math.cos(rightAngle) * sn.range;
      const rightY = sn.y + Math.sin(rightAngle) * sn.range;
      const origin = this.project({ x: sn.x, y: sn.y, z: 0 });
      const left = this.project({ x: leftX, y: leftY, z: 0 });
      const right = this.project({ x: rightX, y: rightY, z: 0 });

      ctx.fillStyle = 'rgba(67, 97, 238, 0.15)';
      ctx.strokeStyle = '#4361ee';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(origin.x, origin.y);
      ctx.lineTo(left.x, left.y);
      ctx.lineTo(right.x, right.y);
      ctx.closePath();
      ctx.fill(); ctx.stroke();

      // Drop line from the sensor to its floor position (shows the height)
      ctx.strokeStyle = 'rgba(67, 97, 238, 0.5)';
      ctx.lineWidth = 1;
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.moveTo(pos.x, pos.y);
      ctx.lineTo(origin.x, origin.y);
      ctx.stroke();
      ctx.setLineDash([]);

      ctx.fillStyle = '#4361ee';
      ctx.beginPath();
      ctx.arc(pos.x, pos.y, 12, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = 'white';
      ctx.font = 'bold 10px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('📡', pos.x, pos.y);
    }
  }

  private drawTargets(ctx: CanvasRenderingContext2D, scene: Scene3D): void {
    for (let i = 0; i < scene.targets.length; i++) {
      const worldX = scene.targets[i].x;
      const worldY = scene.targets[i].y;

      ctx.save();

      // Ground shadow
      const shadowPos = this.project({ x: worldX + 80, y: worldY + 80, z: 5 });
      ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
      ctx.beginPath();
      ctx.ellipse(shadowPos.x, shadowPos.y, 25, 10, 0.3, 0, Math.PI * 2);
      ctx.fill();

      // Capsule-style figure
      this.drawCapsule(ctx, worldX - 60, worldY, 0, 60, 700, '#8b9299', '#6b7280');
      this.drawCapsule(ctx, worldX + 60, worldY, 0, 60, 700, '#8b9299', '#6b7280');
      this.drawCapsule(ctx, worldX - 160, worldY, 900, 50, 380, '#8b9299', '#6b7280');
      this.drawCapsule(ctx, worldX + 160, worldY, 900, 50, 380, '#8b9299', '#6b7280');
      this.drawCapsule(ctx, worldX, worldY, 700, 120, 600, '#b8bfc7', '#9ca3af');
      this.drawSphere(ctx, worldX, worldY, 1500, 110);

      // Number badge above head
      const labelPos = this.project({ x: worldX, y: worldY, z: 1700 });
      ctx.fillStyle = 'rgba(239, 68, 68, 0.95)';
      ctx.beginPath();
      ctx.arc(labelPos.x, labelPos.y, 14, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.6)';
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.fillStyle = 'white';
      ctx.font = 'bold 12px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(`${i + 1}`, labelPos.x, labelPos.y);

      ctx.restore();
    }
  }

  private drawCapsule(
    ctx: CanvasRenderingContext2D,
    centerX: number,
    centerY: number,
    bottomZ: number,
    radius: number,
    height: number,
    fillColor: string,
    strokeColor: string
  ): void {
    const depth = radius * 0.8;
    const segments = 8;
    const topZ = bottomZ + height;
    const faces: Array<{ points: P2[]; depth: number; isTop: boolean }> = [];

    for (let i = 0; i < segments; i++) {
      const angle1 = (i / segments) * Math.PI * 2;
      const angle2 = ((i + 1) / segments) * Math.PI * 2;
      const x1 = centerX + Math.cos(angle1) * radius;
      const y1 = centerY + Math.sin(angle1) * depth;
      const x2 = centerX + Math.cos(angle2) * radius;
      const y2 = centerY + Math.sin(angle2) * depth;

      const bl = this.project({ x: x1, y: y1, z: bottomZ });
      const br = this.project({ x: x2, y: y2, z: bottomZ });
      const tr = this.project({ x: x2, y: y2, z: topZ });
      const tl = this.project({ x: x1, y: y1, z: topZ });
      faces.push({ points: [bl, br, tr, tl], depth: (y1 + y2) / 2, isTop: false });
    }

    const topPoints: P2[] = [];
    for (let i = 0; i < segments; i++) {
      const angle = (i / segments) * Math.PI * 2;
      topPoints.push(this.project({
        x: centerX + Math.cos(angle) * radius,
        y: centerY + Math.sin(angle) * depth,
        z: topZ,
      }));
    }
    faces.push({ points: topPoints, depth: -1000, isTop: true });

    faces.sort((a, b) => b.depth - a.depth);

    for (const face of faces) {
      ctx.beginPath();
      ctx.moveTo(face.points[0].x, face.points[0].y);
      for (let j = 1; j < face.points.length; j++) {
        ctx.lineTo(face.points[j].x, face.points[j].y);
      }
      ctx.closePath();
      ctx.fillStyle = face.isTop ? fillColor : this.shadeColor(fillColor, face.depth > 0 ? 0.85 : 1.0);
      ctx.fill();
      ctx.strokeStyle = strokeColor;
      ctx.lineWidth = 0.5;
      ctx.stroke();
    }
  }

  private drawSphere(
    ctx: CanvasRenderingContext2D,
    centerX: number,
    centerY: number,
    centerZ: number,
    radius: number
  ): void {
    const center = this.project({ x: centerX, y: centerY, z: centerZ });
    const top = this.project({ x: centerX, y: centerY, z: centerZ + radius });
    const screenRadius = Math.abs(center.y - top.y);

    const gradient = ctx.createRadialGradient(
      center.x - screenRadius * 0.35, center.y - screenRadius * 0.35, 0,
      center.x, center.y, screenRadius
    );
    gradient.addColorStop(0, '#ffffff');
    gradient.addColorStop(0.3, '#e5e7eb');
    gradient.addColorStop(0.7, '#d1d5db');
    gradient.addColorStop(1, '#9ca3af');

    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(center.x, center.y, screenRadius, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#6b7280';
    ctx.lineWidth = 1;
    ctx.stroke();
  }

  private shadeColor(color: string, factor: number): string {
    const hex = color.replace('#', '');
    const r = Math.round(parseInt(hex.substr(0, 2), 16) * factor);
    const g = Math.round(parseInt(hex.substr(2, 2), 16) * factor);
    const b = Math.round(parseInt(hex.substr(4, 2), 16) * factor);
    return `rgb(${r}, ${g}, ${b})`;
  }
}

/** Build the world-space target list from room sensors + HA target entities. */
export function collectWorldTargets(
  sensors: Array<Scene3DSensor & { deviceId?: string | null }>,
  getState: (entityId: string) => string | undefined
): P2[] {
  const targets: P2[] = [];
  for (const sn of sensors) {
    if (!sn.deviceId) continue;
    const rotRad = (sn.rotation - 90) * Math.PI / 180;
    for (let i = 1; i <= 3; i++) {
      const xs = getState(`sensor.${sn.deviceId}_target_${i}_x`);
      const ys = getState(`sensor.${sn.deviceId}_target_${i}_y`);
      if (xs === undefined || ys === undefined) continue;
      const x = parseFloat(xs) || 0;
      const y = parseFloat(ys) || 0;
      if (x === 0 && y === 0) continue;
      targets.push({
        x: sn.x + y * Math.cos(rotRad) - x * Math.sin(rotRad),
        y: sn.y + y * Math.sin(rotRad) + x * Math.cos(rotRad),
      });
    }
  }
  return targets;
}
