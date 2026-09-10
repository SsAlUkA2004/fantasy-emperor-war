export default function Sigil() {
  return (
    <svg className="sigil" viewBox="0 0 240 240" aria-hidden="true">
      <g className="sigil-outer" stroke="#c8a44d" fill="none">
        <circle cx="120" cy="120" r="112" strokeOpacity="0.35" />
        <circle cx="120" cy="120" r="104" strokeOpacity="0.6" strokeDasharray="2 10" />
        {[...Array(12)].map((_, i) => (
          <line
            key={i}
            x1="120"
            y1="8"
            x2="120"
            y2={i === 0 ? 40 : i % 3 === 0 ? 28 : 20}
            strokeOpacity={i === 0 ? 0.9 : 0.45}
            transform={`rotate(${i * 30} 120 120)`}
          />
        ))}
      </g>

      <g className="sigil-inner" stroke="#6fd6c8" fill="none" strokeOpacity="0.45">
        <circle cx="120" cy="120" r="76" />
        <path d="M120 48 L182 156 L58 156 Z" />
        <path d="M120 192 L58 84 L182 84 Z" />
      </g>

      <circle cx="120" cy="120" r="44" fill="none" stroke="#c8a44d" strokeOpacity="0.22" />
    </svg>
  )
}
