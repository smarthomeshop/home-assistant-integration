import type { HousePlacement, Point } from '../types';
// Node's native TypeScript test runner needs the explicit extension. Rollup
// resolves the same source file when producing the Home Assistant bundle.
// @ts-ignore TS5097: the extension is intentional for direct source tests.
import { polygonInteriorPoint, transformHomePoint, type WholeHomePerson } from './whole-home.ts';

export interface Home3DRoom {
  id: string;
  name: string;
  points: Point[];
  house: HousePlacement;
  people: number;
  occupied: boolean;
  approximate: boolean;
  available: boolean;
  linked: boolean;
  degraded?: boolean;
}

export interface Home3DScene {
  rooms: Home3DRoom[];
  people: WholeHomePerson[];
  selectedFloor: number | null;
  selectedRoomId?: string | null;
  floorSeparation?: number;
  darkMode: boolean;
  showRoomNames?: boolean;
  showEmptyRooms?: boolean;
  presenceLabel?: string;
  offlineLabel?: string;
  degradedLabel?: string;
}

interface Point3D extends Point { z: number }
interface ProjectedPoint extends Point { depth: number }
interface Home3DCamera {
  azimuth: number;
  elevation: number;
  distance: number;
  targetX: number;
  targetY: number;
  targetZ: number;
}

const FLOOR_HEIGHT = 3000;
const WALL_HEIGHT = 2450;

export const projectHome3DPoint = (
  point: Point3D,
  camera: Home3DCamera,
  width: number,
  height: number,
): ProjectedPoint => {
  const azimuth = camera.azimuth * Math.PI / 180;
  const elevation = camera.elevation * Math.PI / 180;
  const dx = point.x - camera.targetX;
  const dy = point.y - camera.targetY;
  const dz = point.z - camera.targetZ;
  const horizontal = dx * Math.cos(azimuth) - dy * Math.sin(azimuth);
  const depthPlane = dx * Math.sin(azimuth) + dy * Math.cos(azimuth);
  const vertical = depthPlane * Math.cos(elevation) + dz * Math.sin(elevation);
  const depth = camera.distance + depthPlane * Math.sin(elevation) - dz * Math.cos(elevation);
  const focal = Math.min(width, height) * 1.18;
  const scale = focal / Math.max(200, depth);
  return { x: width / 2 - horizontal * scale, y: height / 2 - vertical * scale, depth };
};

export class WholeHome3DRenderer {
  public camera = {
    azimuth: 42,
    elevation: 34,
    distance: 18000,
    targetX: 0,
    targetY: 0,
    targetZ: 1000,
  };

  private width = 900;
  private height = 620;
  private readonly personLabels = new Map<string, string>();
  private readonly nextPersonLabelByRoom = new Map<string, number>();

  resetCamera(rooms: Home3DRoom[], floorSeparation = 1): void {
    const points = rooms.flatMap(room => room.points.map(point => transformHomePoint(point, room.house)));
    if (!points.length) return;
    const xs = points.map(point => point.x);
    const ys = points.map(point => point.y);
    const floors = rooms.map(room => room.house.floor);
    const minX = Math.min(...xs);
    const maxX = Math.max(...xs);
    const minY = Math.min(...ys);
    const maxY = Math.max(...ys);
    const floorZ = floors.map(floor => this.floorZ(floor, floorSeparation));
    const minZ = Math.min(...floorZ);
    const maxZ = Math.max(...floorZ) + WALL_HEIGHT;
    const span = Math.max(maxX - minX, maxY - minY, maxZ - minZ);
    this.camera = {
      azimuth: 42,
      elevation: 34,
      distance: Math.max(9000, span * 1.7),
      targetX: (minX + maxX) / 2,
      targetY: (minY + maxY) / 2,
      targetZ: (minZ + maxZ) / 2,
    };
  }

  orbit(dx: number, dy: number): void {
    this.camera.azimuth = (this.camera.azimuth - dx * 0.45) % 360;
    this.camera.elevation = Math.max(8, Math.min(78, this.camera.elevation + dy * 0.28));
  }

  zoomBy(factor: number): void {
    this.camera.distance = Math.max(3500, Math.min(60000, this.camera.distance * factor));
  }

  render(canvas: HTMLCanvasElement, scene: Home3DScene): void {
    const rect = canvas.getBoundingClientRect();
    if (rect.width < 20 || rect.height < 20) return;
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    this.width = rect.width;
    this.height = rect.height;
    const pixelWidth = Math.round(rect.width * dpr);
    const pixelHeight = Math.round(rect.height * dpr);
    if (canvas.width !== pixelWidth) canvas.width = pixelWidth;
    if (canvas.height !== pixelHeight) canvas.height = pixelHeight;
    const context = canvas.getContext('2d');
    if (!context) return;
    context.setTransform(dpr, 0, 0, dpr, 0, 0);
    context.clearRect(0, 0, this.width, this.height);

    this.drawBackdrop(context, scene.darkMode);
    const shownRooms = scene.rooms.filter(room =>
      room.house.visible !== false
      && (scene.selectedFloor === null || room.house.floor === scene.selectedFloor)
      && (scene.showEmptyRooms !== false || room.occupied || (room.linked && !room.available)));
    this.drawFloorGuides(context, shownRooms, scene);

    const orderedRooms = [...shownRooms].sort((a, b) => a.house.floor - b.house.floor
      || this.roomDepth(b) - this.roomDepth(a));
    orderedRooms.forEach(room => this.drawRoom(context, room, scene));
    const shownRoomIds = new Set(shownRooms.map(room => room.id));
    const visiblePeople = scene.people
      .filter(person => shownRoomIds.has(person.roomId))
      .filter(person => scene.selectedFloor === null || person.floor === scene.selectedFloor);
    const exactPeople = visiblePeople.filter(person => !person.approximate)
      .sort((a, b) => a.id.localeCompare(b.id));
    exactPeople.forEach(person => {
      if (!this.personLabels.has(person.id)) {
        const nextLabel = this.nextPersonLabelByRoom.get(person.roomId) || 1;
        this.personLabels.set(person.id, String(nextLabel));
        this.nextPersonLabelByRoom.set(person.roomId, nextLabel + 1);
      }
    });
    visiblePeople
      .sort((a, b) => a.floor - b.floor || this.pointDepth(b.x, b.y) - this.pointDepth(a.x, a.y))
      .forEach(person => this.drawPerson(
        context,
        person,
        person.approximate ? (scene.presenceLabel || 'Presence') : (this.personLabels.get(person.id) || ''),
        scene.darkMode,
        scene.floorSeparation,
      ));
    if (scene.showRoomNames !== false) orderedRooms.forEach(room => this.drawRoomLabel(context, room, scene));
  }

  private drawBackdrop(context: CanvasRenderingContext2D, darkMode: boolean): void {
    const gradient = context.createLinearGradient(0, 0, 0, this.height);
    if (darkMode) {
      gradient.addColorStop(0, '#111827');
      gradient.addColorStop(1, '#0b1220');
    } else {
      gradient.addColorStop(0, '#f7f9fc');
      gradient.addColorStop(1, '#edf1f7');
    }
    context.fillStyle = gradient;
    context.fillRect(0, 0, this.width, this.height);
  }

  private project(point: Point3D): ProjectedPoint {
    return projectHome3DPoint(point, this.camera, this.width, this.height);
  }

  private roomDepth(room: Home3DRoom): number {
    if (!room.points.length) return 0;
    const center = room.points.reduce((sum, point) => ({ x: sum.x + point.x, y: sum.y + point.y }), { x: 0, y: 0 });
    const world = transformHomePoint({ x: center.x / room.points.length, y: center.y / room.points.length }, room.house);
    return this.pointDepth(world.x, world.y);
  }

  private pointDepth(x: number, y: number): number {
    const azimuth = this.camera.azimuth * Math.PI / 180;
    return (x - this.camera.targetX) * Math.sin(azimuth) + (y - this.camera.targetY) * Math.cos(azimuth);
  }

  private floorZ(floor: number, separation = 1): number {
    return floor * FLOOR_HEIGHT * Math.max(0.65, Math.min(1.8, separation));
  }

  private drawFloorGuides(context: CanvasRenderingContext2D, rooms: Home3DRoom[], scene: Home3DScene): void {
    const floors = [...new Set(rooms.map(room => room.house.floor))].sort((a, b) => a - b);
    for (const floor of floors) {
      const floorRooms = rooms.filter(room => room.house.floor === floor);
      const points = floorRooms.flatMap(room => room.points.map(point => transformHomePoint(point, room.house)));
      if (!points.length) continue;
      const xs = points.map(point => point.x);
      const ys = points.map(point => point.y);
      const padding = 550;
      const corners = [
        { x: Math.min(...xs) - padding, y: Math.min(...ys) - padding },
        { x: Math.max(...xs) + padding, y: Math.min(...ys) - padding },
        { x: Math.max(...xs) + padding, y: Math.max(...ys) + padding },
        { x: Math.min(...xs) - padding, y: Math.max(...ys) + padding },
      ].map(point => this.project({ ...point, z: this.floorZ(floor, scene.floorSeparation) - 40 }));
      context.beginPath();
      corners.forEach((point, index) => index ? context.lineTo(point.x, point.y) : context.moveTo(point.x, point.y));
      context.closePath();
      context.fillStyle = scene.darkMode ? 'rgba(67, 97, 238, .045)' : 'rgba(67, 97, 238, .035)';
      context.strokeStyle = scene.darkMode ? 'rgba(148, 163, 184, .14)' : 'rgba(71, 85, 105, .12)';
      context.lineWidth = 1;
      context.fill();
      context.stroke();
    }
  }

  private drawRoom(context: CanvasRenderingContext2D, room: Home3DRoom, scene: Home3DScene): void {
    if (room.points.length < 3) return;
    const z = this.floorZ(room.house.floor, scene.floorSeparation);
    const world = room.points.map(point => transformHomePoint(point, room.house));
    const floor = world.map(point => this.project({ ...point, z }));
    const occupied = room.occupied;
    const unavailable = room.linked && !room.available;
    const degraded = room.degraded === true;
    const selected = scene.selectedRoomId === room.id;

    context.beginPath();
    floor.forEach((point, index) => index ? context.lineTo(point.x, point.y) : context.moveTo(point.x, point.y));
    context.closePath();
    context.fillStyle = unavailable
      ? (scene.darkMode ? 'rgba(71, 85, 105, .16)' : 'rgba(226, 232, 240, .55)')
      : degraded
      ? (scene.darkMode ? 'rgba(245, 158, 11, .12)' : 'rgba(245, 158, 11, .08)')
      : occupied
      ? (scene.darkMode ? 'rgba(52, 211, 153, .18)' : 'rgba(16, 185, 129, .14)')
      : (scene.darkMode ? 'rgba(71, 85, 105, .32)' : 'rgba(255, 255, 255, .78)');
    context.strokeStyle = unavailable ? (scene.darkMode ? '#94a3b8' : '#64748b') : degraded ? '#f59e0b' : occupied ? '#10b981' : selected ? '#4361ee' : (scene.darkMode ? '#64748b' : '#94a3b8');
    context.lineWidth = occupied ? 2.4 : selected ? 2.1 : 1.3;
    if (unavailable || degraded) context.setLineDash(unavailable ? [7, 5] : [3, 4]);
    context.fill();
    context.stroke();
    context.setLineDash([]);

    const wallFaces = world.map((start, index) => ({
      start,
      end: world[(index + 1) % world.length],
      depth: this.pointDepth((start.x + world[(index + 1) % world.length].x) / 2, (start.y + world[(index + 1) % world.length].y) / 2),
    })).sort((a, b) => b.depth - a.depth);
    wallFaces.forEach(face => {
      const points = [
        this.project({ ...face.start, z }),
        this.project({ ...face.end, z }),
        this.project({ ...face.end, z: z + WALL_HEIGHT }),
        this.project({ ...face.start, z: z + WALL_HEIGHT }),
      ];
      context.beginPath();
      points.forEach((point, index) => index ? context.lineTo(point.x, point.y) : context.moveTo(point.x, point.y));
      context.closePath();
      context.fillStyle = scene.darkMode ? 'rgba(71, 85, 105, .23)' : 'rgba(203, 213, 225, .24)';
      context.strokeStyle = unavailable ? 'rgba(100, 116, 139, .55)' : degraded ? 'rgba(245, 158, 11, .72)' : occupied ? 'rgba(16, 185, 129, .7)' : (scene.darkMode ? 'rgba(148, 163, 184, .45)' : 'rgba(100, 116, 139, .35)');
      context.lineWidth = 1;
      if (unavailable || degraded) context.setLineDash(unavailable ? [6, 4] : [3, 4]);
      context.fill();
      context.stroke();
      context.setLineDash([]);
    });
  }

  private drawRoomLabel(context: CanvasRenderingContext2D, room: Home3DRoom, scene: Home3DScene): void {
    if (room.points.length < 3) return;
    const z = this.floorZ(room.house.floor, scene.floorSeparation);
    const anchor = transformHomePoint(polygonInteriorPoint(room.points), room.house);
    const label = this.project({ ...anchor, z: z + 80 });
    const text = room.linked && !room.available
      ? `${room.name} · ${scene.offlineLabel || 'Offline'}`
      : room.degraded
        ? `${room.name} · ${scene.degradedLabel || 'Partial sensor outage'}`
      : room.occupied
        ? `${room.name} · ${room.people > 0 ? room.people : (scene.presenceLabel || 'Presence')}`
        : room.name;
    context.font = '600 12px system-ui, sans-serif';
    const width = context.measureText(text).width + 18;
    context.fillStyle = scene.darkMode ? 'rgba(15, 23, 42, .9)' : 'rgba(255, 255, 255, .94)';
    context.beginPath();
    context.roundRect(label.x - width / 2, label.y - 13, width, 26, 8);
    context.fill();
    context.fillStyle = room.linked && !room.available
      ? (scene.darkMode ? '#cbd5e1' : '#475569')
      : room.degraded ? (scene.darkMode ? '#fbbf24' : '#92400e')
      : room.occupied ? (scene.darkMode ? '#34d399' : '#047857')
      : (scene.darkMode ? '#e2e8f0' : '#334155');
    context.textAlign = 'center';
    context.textBaseline = 'middle';
    context.fillText(text, label.x, label.y);
  }

  private drawPerson(
    context: CanvasRenderingContext2D,
    person: WholeHomePerson,
    label: string,
    darkMode: boolean,
    floorSeparation = 1,
  ): void {
    const z = this.floorZ(person.floor, floorSeparation);
    const feet = this.project({ x: person.x, y: person.y, z: z + 20 });
    const body = this.project({ x: person.x, y: person.y, z: z + 900 });
    const head = this.project({ x: person.x, y: person.y, z: z + 1650 });
    const reducedMotion = typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;
    const pulse = reducedMotion ? .5 : 0.5 + 0.5 * Math.sin(performance.now() / 420 + person.x * .001);

    context.save();
    context.fillStyle = `rgba(16, 185, 129, ${0.12 + pulse * 0.09})`;
    context.beginPath();
    context.ellipse(feet.x, feet.y, 25 + pulse * 7, 10 + pulse * 3, 0, 0, Math.PI * 2);
    context.fill();

    context.strokeStyle = person.approximate ? '#f59e0b' : '#10b981';
    context.lineWidth = 5;
    if (person.approximate) context.setLineDash([5, 4]);
    context.beginPath();
    context.moveTo(feet.x, feet.y);
    context.lineTo(body.x, body.y);
    context.stroke();
    context.setLineDash([]);

    context.fillStyle = person.approximate ? '#f59e0b' : '#10b981';
    context.beginPath();
    context.arc(head.x, head.y, 9, 0, Math.PI * 2);
    context.fill();
    context.strokeStyle = darkMode ? '#0f172a' : '#ffffff';
    context.lineWidth = 2;
    context.stroke();

    context.font = '700 10px system-ui, sans-serif';
    const width = context.measureText(label).width + 12;
    context.fillStyle = darkMode ? 'rgba(15, 23, 42, .9)' : 'rgba(255, 255, 255, .94)';
    context.beginPath();
    context.roundRect(head.x - width / 2, head.y - 31, width, 18, 7);
    context.fill();
    context.fillStyle = person.approximate ? (darkMode ? '#fbbf24' : '#b45309') : (darkMode ? '#34d399' : '#047857');
    context.textAlign = 'center';
    context.textBaseline = 'middle';
    context.fillText(label, head.x, head.y - 22);
    context.restore();
  }
}

export const HOME_FLOOR_HEIGHT_MM = FLOOR_HEIGHT;
