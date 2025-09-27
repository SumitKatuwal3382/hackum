// src/logic.js
import { availability as seedAvailability, weaknesses as seedWeaknesses, concepts as seedConcepts, resources as seedResources, enrollments as seedEnrollments, courses as seedCourses, students as seedStudents } from "./data";

export function nextFreeSlot(studentId, day, hourNow, { availability = seedAvailability } = {}) {
  const dayOrder = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  const todays = availability
    .filter((a) => a.student_id === studentId && a.day === day && a.hour_start >= hourNow)
    .sort((a, b) => a.hour_start - b.hour_start);
  if (todays.length) return todays[0];

  const startIdx = dayOrder.indexOf(day);
  for (let i = 1; i < 7; i++) {
    const d = dayOrder[(startIdx + i) % 7];
    const slots = availability.filter((a) => a.student_id === studentId && a.day === d).sort((a, b) => a.hour_start - b.hour_start);
    if (slots.length) return slots[0];
  }
  return null;
}

export function weakestConcepts(studentId, n = 3, { weaknesses = seedWeaknesses, concepts = seedConcepts } = {}) {
  const w = weaknesses.filter((x) => x.student_id === studentId).sort((a, b) => a.mastery - b.mastery).slice(0, n);
  return w.map((x) => ({ ...x, concept: concepts.find((k) => k.id === x.concept_id) }));
}

export function conceptResources(conceptId, n = 2, { resources = seedResources } = {}) {
  return resources.filter((r) => r.concept_id === conceptId).slice(0, n);
}

export function peerMatches(studentId, targetConceptIds, n = 3, { weaknesses = seedWeaknesses, students = seedStudents, concepts = seedConcepts } = {}) {
  const matches = weaknesses
    .filter((w) => targetConceptIds.includes(w.concept_id) && w.student_id !== studentId)
    .sort((a, b) => a.mastery - b.mastery)
    .slice(0, n)
    .map((w) => ({
      ...w,
      student: students.find((s) => s.id === w.student_id),
      concept: concepts.find((k) => k.id === w.concept_id),
    }));
  return matches;
}

export function enrolledCourses(studentId, { enrollments = seedEnrollments, courses = seedCourses } = {}) {
  const ids = enrollments.filter((e) => e.student_id === studentId).map((e) => e.course_id);
  return courses.filter((c) => ids.includes(c.id));
}
