export default function Badge({ children }) {
  return (
    <span className="px-2 py-0.5 text-xs rounded-full bg-[rgba(255,255,255,0.02)] text-[#9ed7ff] border border-[rgba(78,174,255,0.06)] font-semibold">
      {children}
    </span>
  );
}
