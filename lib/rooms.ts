interface Room {
  code: string;
  currentStock: string | null;
  votes: { invest: number; skip: number };
  phase: "waiting" | "voting";
  listeners: Set<(data: RoomState) => void>;
}

export interface RoomState {
  votes: { invest: number; skip: number };
  stock: string | null;
  phase: string;
}

const g = globalThis as unknown as { __rooms: Map<string, Room> };
if (!g.__rooms) g.__rooms = new Map();
const rooms = g.__rooms;

function generateCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 4; i++) code += chars[Math.floor(Math.random() * chars.length)];
  return code;
}

export function createRoom(): string {
  let code = generateCode();
  while (rooms.has(code)) code = generateCode();
  rooms.set(code, {
    code,
    currentStock: null,
    votes: { invest: 0, skip: 0 },
    phase: "waiting",
    listeners: new Set(),
  });
  return code;
}

export function getRoom(code: string): Room | undefined {
  return rooms.get(code.toUpperCase());
}

export function setStock(code: string, stock: string) {
  const room = rooms.get(code.toUpperCase());
  if (!room) return;
  room.currentStock = stock;
  room.votes = { invest: 0, skip: 0 };
  room.phase = "voting";
  broadcast(room);
}

export function vote(code: string, type: "invest" | "skip") {
  const room = rooms.get(code.toUpperCase());
  if (!room || room.phase !== "voting") return null;
  room.votes[type]++;
  broadcast(room);
  return room.votes;
}

export function subscribe(code: string, cb: (data: RoomState) => void): (() => void) | null {
  const room = rooms.get(code.toUpperCase());
  if (!room) return null;
  room.listeners.add(cb);
  cb(getState(room));
  return () => { room.listeners.delete(cb); };
}

function getState(room: Room): RoomState {
  return { votes: { ...room.votes }, stock: room.currentStock, phase: room.phase };
}

function broadcast(room: Room) {
  const state = getState(room);
  for (const cb of room.listeners) cb(state);
}
