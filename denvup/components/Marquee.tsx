const items = ["Web Development", "UI/UX Design", "Branding", "AI Solutions"];

function Group() {
  return (
    <div className="marquee-group" aria-hidden="true">
      {items.map((t) => (
        <span key={t}>
          {t} <i className="marquee-dot">✦</i>
        </span>
      ))}
      {items.map((t) => (
        <span key={t + "2"}>
          {t} <i className="marquee-dot">✦</i>
        </span>
      ))}
    </div>
  );
}

export default function Marquee() {
  return (
    <div className="marquee">
      <div className="marquee-track">
        <Group />
        <Group />
      </div>
    </div>
  );
}