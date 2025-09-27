// src/data.js

export const students = [
  { id: "S001", name: "Avery Kim", gpa: 3.2, major: "Physics" },
  { id: "S002", name: "Jordan Lee", gpa: 2.8, major: "Chemistry" },
  { id: "S003", name: "Riya Patel", gpa: 3.6, major: "Biology" },
  { id: "S004", name: "Diego Rivera", gpa: 3.0, major: "Math" },
  { id: "S005", name: "Noah Williams", gpa: 2.9, major: "CS" },
];

export const courses = [
  { id: "PHY101", title: "Physics I", level: 100 },
  { id: "MTH101", title: "Calculus I", level: 100 },
  { id: "BIO120", title: "Intro Biology", level: 100 },
  { id: "CHE101", title: "Gen Chemistry", level: 100 },
  { id: "CS110", title: "Intro to CS", level: 100 },
];

export const concepts = [
  { id: "K_VEC", name: "Vectors" },
  { id: "K_DER", name: "Derivatives" },
  { id: "K_INT", name: "Integrals" },
  { id: "K_KIN", name: "Kinematics" },
  { id: "K_BIO", name: "Cell Structure" },
  { id: "K_CHE", name: "Stoichiometry" },
  { id: "K_CS1", name: "Loops" },
  { id: "K_CS2", name: "Arrays" },
];

export const courseConcepts = [
  { course_id: "PHY101", concept_id: "K_VEC" },
  { course_id: "PHY101", concept_id: "K_KIN" },
  { course_id: "MTH101", concept_id: "K_DER" },
  { course_id: "MTH101", concept_id: "K_INT" },
  { course_id: "BIO120", concept_id: "K_BIO" },
  { course_id: "CHE101", concept_id: "K_CHE" },
  { course_id: "CS110", concept_id: "K_CS1" },
  { course_id: "CS110", concept_id: "K_CS2" },
];

export const enrollments = [
  { student_id: "S001", course_id: "PHY101", term: "FALL25", grade_num: 2.7 },
  { student_id: "S001", course_id: "MTH101", term: "FALL25", grade_num: 2.3 },
  { student_id: "S002", course_id: "CHE101", term: "FALL25", grade_num: 2.5 },
  { student_id: "S002", course_id: "MTH101", term: "FALL25", grade_num: 2.6 },
  { student_id: "S003", course_id: "BIO120", term: "FALL25", grade_num: 3.7 },
  { student_id: "S003", course_id: "MTH101", term: "FALL25", grade_num: 3.1 },
  { student_id: "S004", course_id: "PHY101", term: "FALL25", grade_num: 3.0 },
  { student_id: "S004", course_id: "CS110", term: "FALL25", grade_num: 3.1 },
  { student_id: "S005", course_id: "CS110", term: "FALL25", grade_num: 2.4 },
  { student_id: "S005", course_id: "CHE101", term: "FALL25", grade_num: 2.7 },
];

export const weaknesses = [
  { student_id: "S001", concept_id: "K_VEC", mastery: 0.35 },
  { student_id: "S001", concept_id: "K_DER", mastery: 0.42 },
  { student_id: "S001", concept_id: "K_KIN", mastery: 0.55 },
  { student_id: "S002", concept_id: "K_CHE", mastery: 0.38 },
  { student_id: "S002", concept_id: "K_INT", mastery: 0.43 },
  { student_id: "S003", concept_id: "K_BIO", mastery: 0.50 },
  { student_id: "S004", concept_id: "K_VEC", mastery: 0.49 },
  { student_id: "S004", concept_id: "K_CS2", mastery: 0.44 },
  { student_id: "S005", concept_id: "K_CS1", mastery: 0.40 },
  { student_id: "S005", concept_id: "K_CHE", mastery: 0.41 },
];

export const availability = [
  { student_id: "S001", day: "Mon", hour_start: 15, hour_end: 17 },
  { student_id: "S001", day: "Tue", hour_start: 19, hour_end: 20 },
  { student_id: "S002", day: "Mon", hour_start: 16, hour_end: 18 },
  { student_id: "S003", day: "Mon", hour_start: 14, hour_end: 16 },
  { student_id: "S004", day: "Mon", hour_start: 10, hour_end: 12 },
  { student_id: "S005", day: "Mon", hour_start: 13, hour_end: 15 },
];

export const resources = [
  { id: "R001", type: "video", url: "https://www.khanacademy.org/math/linear-algebra/vectors-and-spaces", concept_id: "K_VEC", duration: 12 },
  { id: "R002", type: "quiz", url: "https://www.proprofs.com/quiz-school/", concept_id: "K_VEC", duration: 8 },
  { id: "R003", type: "video", url: "https://www.khanacademy.org/math/calculus-1/derivative-intro", concept_id: "K_DER", duration: 15 },
  { id: "R004", type: "notes", url: "https://www.paulstruckmath.com/derivatives-cheatsheet", concept_id: "K_DER", duration: 7 },
  { id: "R005", type: "video", url: "https://www.khanacademy.org/math/calculus-1/integration-calc-1", concept_id: "K_INT", duration: 14 },
  { id: "R006", type: "quiz", url: "https://www.sparknotes.com/physics/kinematics/", concept_id: "K_KIN", duration: 10 },
  { id: "R007", type: "video", url: "https://www.khanacademy.org/science/biology/structure-of-a-cell", concept_id: "K_BIO", duration: 11 },
  { id: "R008", type: "video", url: "https://www.khanacademy.org/science/chemistry/stoichiometry-mp", concept_id: "K_CHE", duration: 13 },
  { id: "R009", type: "video", url: "https://www.khanacademy.org/computing/computer-programming/intro-to-js/loops", concept_id: "K_CS1", duration: 9 },
  { id: "R010", type: "quiz", url: "https://www.hackerrank.com/domains/tutorials/10-days-of-javascript", concept_id: "K_CS1", duration: 10 },
  { id: "R011", type: "notes", url: "https://visualgo.net/en/list", concept_id: "K_CS2", duration: 8 },
];

export const dayOrder = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
