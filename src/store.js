import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { students as seedStudents, courses, concepts, courseConcepts, enrollments as seedEnrollments, weaknesses as seedWeaknesses, availability as seedAvailability, resources } from './data';

const DataContext = createContext(null);

export function DataProvider({ children }) {
  const [students, setStudents] = useState(seedStudents);
  const [enrollments, setEnrollments] = useState(seedEnrollments);
  const [weaknesses, setWeaknesses] = useState(seedWeaknesses);
  const [availability, setAvailability] = useState(seedAvailability);
  const [studySessions, setStudySessions] = useState(()=> {
    // Support migration: prefer new key, fall back to legacy key.
    const NEW_KEY = 'connectandlearn_studySessions';
    const OLD_KEY = 'studymate_studySessions';
    try {
      let raw = localStorage.getItem(NEW_KEY);
      if(!raw) raw = localStorage.getItem(OLD_KEY);
      if(raw){
        const parsed = JSON.parse(raw);
        if(Array.isArray(parsed)) return parsed;
      }
    } catch { /* ignore */ }
    return [];
  }); // {id, concept_id, name, plannedMinutes, completedMinutes, status, startedAt?, finishedAt?}

  // Persist sessions (debounced minimal via effect)
  useEffect(()=> {
    try { localStorage.setItem('connectandlearn_studySessions', JSON.stringify(studySessions)); } catch { /* ignore quota */ }
  }, [studySessions]);

  const addStudent = useCallback((student) => {
    setStudents(prev => [...prev, student]);
  }, []);

  const addEnrollment = useCallback((enrollment) => {
    setEnrollments(prev => [...prev, enrollment]);
  }, []);

  const addWeakness = useCallback((w) => {
    setWeaknesses(prev => [...prev, w]);
  }, []);

  const addAvailability = useCallback((slot) => {
    setAvailability(prev => [...prev, slot]);
  }, []);

  // Study sessions helpers
  const createStudySessionsFromPlan = useCallback(({ studentId, allocations }) => {
    if(!allocations || allocations.length === 0) return [];
    // Simple signature to avoid duplicate generation for identical plan in same render cycle.
    const signature = allocations.map(a=> a.concept_id+':'+a.minutes).join('|');
    // If sessions already exist for this signature and student, skip.
    const existing = studySessions.filter(s => s.studentId === studentId && s.signature === signature);
    if(existing.length) return existing;
    const now = Date.now();
    const fresh = allocations.map(a => ({
      id: 'sess_'+Math.random().toString(36).slice(2,9),
      studentId,
      concept_id: a.concept_id,
      name: a.name || a.concept_id,
      plannedMinutes: a.minutes,
      completedMinutes: 0,
      status: 'pending',
      createdAt: now,
      signature
    }));
    setStudySessions(prev => [...prev, ...fresh]);
    return fresh;
  }, [studySessions]);

  const updateStudySession = useCallback((id, patch) => {
    setStudySessions(prev => prev.map(s => s.id === id ? { ...s, ...patch } : s));
  }, []);

  const startStudySession = useCallback((id) => {
    setStudySessions(prev => prev.map(s => s.id === id ? { ...s, status: 'in-progress', startedAt: s.startedAt || Date.now() } : s));
  }, []);

  const completeStudySession = useCallback((id) => {
    setStudySessions(prev => prev.map(s => {
      if(s.id !== id) return s;
      const finishedAt = Date.now();
      let completedMinutes = s.completedMinutes;
      if(s.startedAt){
        const elapsed = Math.ceil((finishedAt - s.startedAt)/60000);
        completedMinutes = Math.min(s.plannedMinutes, Math.max(completedMinutes, elapsed));
      } else {
        completedMinutes = s.plannedMinutes;
      }
      return { ...s, status: 'done', finishedAt, completedMinutes };
    }));
  }, []);

  const resetStudySessions = useCallback((studentId, signature) => {
    setStudySessions(prev => prev.filter(s => !(s.studentId === studentId && (!signature || s.signature === signature))));
  }, []);

  const value = {
    students,
    courses,
    concepts,
    courseConcepts,
    enrollments,
    weaknesses,
    availability,
    resources,
    studySessions,
    createStudySessionsFromPlan,
    updateStudySession,
    startStudySession,
    completeStudySession,
  resetStudySessions,
    addStudent,
    addEnrollment,
    addWeakness,
    addAvailability
  };

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
}

export function useData() {
  const ctx = useContext(DataContext);
  if (!ctx) throw new Error('useData must be used within DataProvider');
  return ctx;
}
