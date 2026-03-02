// Temporary in-memory store
const usedReferences = new Set();

export function isUsed(reference) {
  return usedReferences.has(reference);
}

export function markAsUsed(reference) {
  usedReferences.add(reference);
}
