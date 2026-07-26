/**
 * Manages the current "student" (child user).
 * Identity is stored in localStorage (no auth required).
 * Only a nickname + avatar number are stored.
 */
import { useState, useCallback } from 'react';

export interface Student {
  id: string;        // UUID stored in localStorage
  nickname: string;
  avatar: number;    // 1–8
}

const STORAGE_KEY = 'vocab-kid-student';

function generateId(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  // Fallback for older browsers
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

export function loadStudent(): Student | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<Student>;
    if (typeof parsed.id === 'string' && typeof parsed.nickname === 'string') {
      return {
        id: parsed.id,
        nickname: parsed.nickname,
        avatar: typeof parsed.avatar === 'number' ? parsed.avatar : 1,
      };
    }
  } catch {
    // ignore
  }
  return null;
}

export function saveStudent(student: Student): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(student));
}

export function getOrCreateStudentId(): string {
  const existing = loadStudent();
  if (existing) return existing.id;
  const id = generateId();
  // Save minimal record so ID persists even before nickname is set
  saveStudent({ id, nickname: '', avatar: 1 });
  return id;
}

/**
 * Hook — returns the current student and a setter.
 * Changes are persisted to localStorage immediately.
 */
export function useStudent() {
  const [student, setStudentState] = useState<Student | null>(() => loadStudent());

  const setStudent = useCallback((s: Student) => {
    saveStudent(s);
    setStudentState(s);
  }, []);

  const clearStudent = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    setStudentState(null);
  }, []);

  return { student, setStudent, clearStudent };
}
