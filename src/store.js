import React, { createContext, useContext, useState, useCallback } from 'react';
import { students as seedStudents, courses, concepts, courseConcepts, enrollments as seedEnrollments, weaknesses as seedWeaknesses, availability as seedAvailability, resources } from './data';

const DataContext = createContext(null);

export function DataProvider({ children }) {
  const [students, setStudents] = useState(seedStudents);
  const [enrollments, setEnrollments] = useState(seedEnrollments);
  const [weaknesses, setWeaknesses] = useState(seedWeaknesses);
  const [availability, setAvailability] = useState(seedAvailability);

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

  const value = {
    students,
    courses,
    concepts,
    courseConcepts,
    enrollments,
    weaknesses,
    availability,
    resources,
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
