import React from 'react';

export default function Legend() {
  const items = [
    { color: '#111827', label: 'Student (you)' },
    { color: '#2563eb', label: 'Course' },
    { color: '#10b981', label: 'Concept (target)' }
  ];
  return (
    <div className="flex flex-wrap gap-3 text-xs">
      {items.map(it => (
        <div key={it.label} className="flex items-center gap-1">
          <span className="inline-block w-3 h-3 rounded-full border" style={{ background: it.color }} />
          <span className="text-gray-700">{it.label}</span>
        </div>
      ))}
    </div>
  );
}
