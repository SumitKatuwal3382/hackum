export default function Card({ title, children, right, subtitle }) {
  return (
    <div className={`card-custom box-black-border p-5`}>
      <div className="flex items-center justify-between mb-3">
        <div>
          <h3 className="text-lg card-title">{title}</h3>
          {subtitle && <div className="card-sub">{subtitle}</div>}
        </div>
        {right}
      </div>
      {children}
    </div>
  );
}
