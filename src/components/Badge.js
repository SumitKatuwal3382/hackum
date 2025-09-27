export default function Badge({ children }) {
  return (
    <span className="px-2 py-0.5 text-xs rounded-full bg-gray-100 text-gray-700 border border-gray-200">
      {children}
    </span>
  );
}
