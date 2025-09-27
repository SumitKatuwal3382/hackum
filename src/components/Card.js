export default function Card({ title, children, right }) {
  return (
    <div className={`card-custom box-black-border p-5`}>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
        {right}
      </div>
      {children}
    </div>
  );
}
