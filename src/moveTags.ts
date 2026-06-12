import { CLOSE_RANGE_TAG } from './constants';

export function getAutoTagsForMoveName(name: string): string[] {
  return name.includes('近距離') ? [CLOSE_RANGE_TAG] : [];
}

export function withAutoTagsForMoveName(name: string, tags: string[]): string[] {
  const next = [...tags];
  for (const tag of getAutoTagsForMoveName(name)) {
    if (!next.includes(tag)) next.push(tag);
  }
  return next;
}
