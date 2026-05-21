export default function QuickActions({ actions }) {
  return (
    <div className="ed-quick-actions">
      {actions.map(({ icon, label, color, bg, onClick }, index) => (
        <button
          key={index}
          className="ed-quick-action-btn"
          style={{ "--qa-color": color, "--qa-bg": bg }}
          onClick={onClick}
        >
          <span className="ed-qa-icon">{icon}</span>
          <span className="ed-qa-label">{label}</span>
        </button>
      ))}
    </div>
  );
}