import React, { useMemo, useState } from 'react';

/*
  CoursePie visualizes a student's enrolled courses.
  - Slice size: number of distinct concepts in that course (courseConcepts count)
  - Slice color: grade_num mapped to red (low) -> green (high)
  - Tooltip: course title, grade (GPA scale), concept count, avg mastery (if available)
*/

function gradeColor(grade) {
  // grade_num ~ 0-4 scale. Map to 0 (red) to 1 (green)
  const norm = Math.max(0, Math.min(1, grade / 4));
  const r = Math.round(255 * (1 - norm));
  const g = Math.round(160 + 80 * norm);
  return `rgb(${r},${g},120)`;
}

function polarArc(cx, cy, rOuter, rInner, startAngle, endAngle) {
  const largeArc = endAngle - startAngle > Math.PI ? 1 : 0;
  const x0 = cx + rOuter * Math.cos(startAngle);
  const y0 = cy + rOuter * Math.sin(startAngle);
  const x1 = cx + rOuter * Math.cos(endAngle);
  const y1 = cy + rOuter * Math.sin(endAngle);
  const x2 = cx + rInner * Math.cos(endAngle);
  const y2 = cy + rInner * Math.sin(endAngle);
  const x3 = cx + rInner * Math.cos(startAngle);
  const y3 = cy + rInner * Math.sin(startAngle);
  return `M ${x0} ${y0} A ${rOuter} ${rOuter} 0 ${largeArc} 1 ${x1} ${y1} L ${x2} ${y2} A ${rInner} ${rInner} 0 ${largeArc} 0 ${x3} ${y3} Z`;
}

export default function CoursePie({ studentId, enrollments, courses, courseConcepts, weaknesses, concepts, size = 260 }) {
  const [hover, setHover] = useState(null);

  const data = useMemo(() => {
    const myEnrolls = enrollments.filter(e => e.student_id === studentId);
    const courseConceptCount = courseConcepts.reduce((acc, cc) => {
      acc[cc.course_id] = (acc[cc.course_id] || 0) + 1;
      return acc;
    }, {});
    return myEnrolls.map(e => {
      const course = courses.find(c => c.id === e.course_id);
      const conceptCount = courseConceptCount[e.course_id] || 1;
      // average mastery for student's weaknesses that belong to concepts of this course
      const conceptIds = courseConcepts.filter(cc => cc.course_id === e.course_id).map(cc => cc.concept_id);
      const masteryList = weaknesses.filter(w => w.student_id === studentId && conceptIds.includes(w.concept_id)).map(w => w.mastery);
      const avgMastery = masteryList.length ? masteryList.reduce((a,b)=>a+b,0)/masteryList.length : null;
      return { course_id: e.course_id, title: course?.title || e.course_id, grade: e.grade_num, conceptCount, avgMastery };
    }).sort((a,b) => a.title.localeCompare(b.title));
  }, [studentId, enrollments, courses, courseConcepts, weaknesses]);

  const total = data.reduce((sum, d) => sum + d.conceptCount, 0) || 1;
  let angleAcc = -Math.PI / 2; // start at top
  const slices = data.map(d => {
    const angle = (d.conceptCount / total) * Math.PI * 2;
    const start = angleAcc;
    const end = angleAcc + angle;
    angleAcc = end;
    return { ...d, start, end };
  });

  return (
    <div className="relative w-full flex flex-col items-center">
      <svg viewBox={`0 0 ${size} ${size}`} className="w-full max-w-sm">
        <g>
          {slices.map(s => (
            <path
              key={s.course_id}
              d={polarArc(size/2, size/2, size/2 - 8, size/2 - 48, s.start, s.end)}
              fill={gradeColor(s.grade)}
              stroke="#fff"
              strokeWidth={2}
              className="cursor-pointer transition-opacity duration-150"
              opacity={hover && hover.course_id !== s.course_id ? 0.35 : 1}
              onMouseEnter={() => setHover(s)}
              onMouseLeave={() => setHover(null)}
            />
          ))}
          {/* inner label */}
          <circle cx={size/2} cy={size/2} r={size/2 - 52} fill="#f8fafc" />
          <text x={size/2} y={size/2 - 6} textAnchor="middle" className="fill-gray-800 text-sm font-semibold">
            Courses
          </text>
          <text x={size/2} y={size/2 + 12} textAnchor="middle" className="fill-gray-500 text-[10px]">
            {data.length} enrolled
          </text>
        </g>
      </svg>
      {hover && (
        <div className="absolute -bottom-2 translate-y-full px-3 py-2 rounded-lg bg-gray-900 text-white text-xs shadow-md w-56 text-left">
          <div className="font-medium text-sm mb-1">{hover.title}</div>
            <div className="grid grid-cols-2 gap-x-2 gap-y-1">
              <span className="text-gray-400">Concepts:</span>
              <span>{hover.conceptCount}</span>
              <span className="text-gray-400">Grade:</span>
              <span>{hover.grade.toFixed(2)}</span>
              <span className="text-gray-400">Avg mastery:</span>
              <span>{hover.avgMastery != null ? (1 + hover.avgMastery * 9).toFixed(1) + '/10' : '—'}</span>
            </div>
        </div>
      )}
      <div className="mt-4 flex flex-wrap gap-3 justify-center text-[11px]">
        {slices.map(s => (
          <div key={s.course_id} className="flex items-center gap-1">
            <span className="w-3 h-3 rounded-sm" style={{ background: gradeColor(s.grade) }} />
            <span className="text-gray-700">{s.course_id}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
