type PendingCreate = {
  id: string;
  type: "create";
  title: string;
  description: string;
  createdAt: string;
};

type PendingDelete = {
  id: string;
  type: "delete";
};

type PendingMutation = PendingCreate | PendingDelete;

const QUEUE_KEY = "collabdoc:pending-mutations";

function readQueue(): PendingMutation[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(QUEUE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function writeQueue(queue: PendingMutation[]) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
  } catch {}
}

export function getPendingMutations(): PendingMutation[] {
  return readQueue();
}

export function enqueueCreate(title: string, description: string): PendingCreate {
  const queue = readQueue();
  const pending: PendingCreate = {
    id: `pending-${crypto.randomUUID()}`,
    type: "create",
    title,
    description,
    createdAt: new Date().toISOString(),
  };
  queue.push(pending);
  writeQueue(queue);
  return pending;
}

export function enqueueDelete(id: string) {
  const queue = readQueue();
  queue.push({ id, type: "delete" });
  writeQueue(queue);
}

export function removePendingMutation(matchId: string) {
  writeQueue(readQueue().filter((m) => m.id !== matchId));
}

export function isPendingId(id: string) {
  return id.startsWith("pending-");
}

export function isNetworkError(err: any) {
  return !err?.response;
}