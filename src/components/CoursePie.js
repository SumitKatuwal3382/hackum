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

export default function CoursePie({ studentId, enrollments, courses, courseConcepts, weaknesses, concepts, size = 320 }) {
  const [hover, setHover] = useState(null);

  // friendly color palette (varied hues) — assigned by index
  const palette = [
    '#10b981', // green
    '#3b82f6', // blue
    '#f59e0b', // amber
    '#ef4444', // red
    '#8b5cf6', // purple
    '#06b6d4', // teal
    '#f472b6', // pink
  ];

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
    <div className="relative w-full flex flex-col items-center text-sm">
      <div className="course-pie-wrap">
        <svg viewBox={`0 0 ${size} ${size}`} style={{ width: size, height: size }}>
          <defs>
            <radialGradient id="centerGrad" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#0b1220" />
              <stop offset="100%" stopColor="#071019" />
            </radialGradient>
            <filter id="glow" x="-60%" y="-60%" width="220%" height="220%">
              <feGaussianBlur stdDeviation="10" result="coloredBlur" />
              <feMerge>
                <feMergeNode in="coloredBlur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>
          <g>
            {slices.map((s, idx) => {
              const isHover = hover && hover.course_id === s.course_id;
              const outerR = isHover ? (size/2 - 2) : (size/2 - 4);
              const innerR = isHover ? (size/2 - 66) : (size/2 - 68);
              const color = palette[idx % palette.length];
              return (
                <g key={s.course_id} filter={'url(#glow)'}>
                  <path
                    d={polarArc(size/2, size/2, outerR, innerR, s.start, s.end)}
                    fill={color}
                    stroke="rgba(255,255,255,0.02)"
                    strokeWidth={2}
                    className="cursor-pointer transition-all duration-150"
                    opacity={hover && hover.course_id !== s.course_id ? 0.28 : 1}
                    onMouseEnter={() => setHover(s)}
                    onMouseLeave={() => setHover(null)}
                  />
                  {/* percentage label positioned at slice midpoint */}
                  {(() => {
                    const mid = (s.start + s.end) / 2;
                    const labelR = (outerR + innerR) / 2;
                    const lx = size/2 + labelR * Math.cos(mid);
                    const ly = size/2 + labelR * Math.sin(mid);
                    const pct = Math.round((s.conceptCount/total) * 100);
                    return (
                      <text key={`lab-${s.course_id}`} x={lx} y={ly} textAnchor="middle" dominantBaseline="middle" className="svg-slice-label" fontSize={12}>{pct}%</text>
                    );
                  })()}
                </g>
              );
            })}
            {/* inner dark center with radial gloss */}
            <circle cx={size/2} cy={size/2} r={size/2 - 88} fill="url(#centerGrad)" stroke="rgba(255,255,255,0.02)" strokeWidth={1.5} />
            <circle cx={size/2} cy={size/2} r={size/2 - 110} fill="#071019" />
            <text x={size/2} y={size/2 - 6} textAnchor="middle" className="course-pie-center-text text-[18px]">
              Courses
            </text>
            <text x={size/2} y={size/2 + 18} textAnchor="middle" className="course-pie-center-sub text-[12px]">
              {data.length} enrolled
            </text>
          </g>
        </svg>
      </div>

      {hover && (
        <div className="absolute -bottom-2 translate-y-full px-3 py-2 rounded-lg bg-[rgba(4,8,14,0.9)] text-white text-xs shadow-md w-64 text-left border border-[rgba(255,255,255,0.02)]">
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

      <div className="mt-6 course-pie-legend w-full">
        <ul>
          {slices.map((s, idx) => {
            const pct = Math.round((s.conceptCount / total) * 100);
            return (
              <li key={s.course_id}>
                <div className="left">
                  <span className="course-pie-dot" style={{background: palette[idx % palette.length]}} />
                  <span className="course-pie-title">{s.title}</span>
                </div>
                <div className="pct">{pct}%</div>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
