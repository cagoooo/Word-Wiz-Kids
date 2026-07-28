export interface BuildVersion {
  sequence: number;
  hash: string;
}

export function parseBuildVersion(version: string): BuildVersion | null {
  const match = /^(\d+)-([0-9a-f]{7,40})$/i.exec(version);
  if (!match) return null;
  return { sequence: Number(match[1]), hash: match[2].toLowerCase() };
}

export function isNewerBuildVersion(candidate: string, current: string): boolean {
  if (!candidate || candidate === current) return false;
  const next = parseBuildVersion(candidate);
  const active = parseBuildVersion(current);
  if (next && !active) return true;
  if (!next || !active) return false;
  if (next.sequence !== active.sequence) return next.sequence > active.sequence;
  return next.hash !== active.hash;
}
