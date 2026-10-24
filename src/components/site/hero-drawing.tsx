/**
 * Line elevation used as the hero visual until HKNR uploads a real photograph
 * (Admin → Settings → Hero image). Purely decorative and clearly not a photo of a real property.
 */
export function HeroDrawing({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 560 420" className={className} aria-hidden="true" fill="none" strokeLinecap="square">
      <defs>
        <pattern id="hero-grid" width="20" height="20" patternUnits="userSpaceOnUse">
          <path d="M20 0H0V20" stroke="#E6E1D8" strokeWidth="1" />
        </pattern>
      </defs>
      <rect width="560" height="420" fill="url(#hero-grid)" />
      <g stroke="#242522" strokeWidth="1.5">
        {/* ground */}
        <path d="M20 360H540" />
        {/* main block */}
        <path d="M120 360V170H400V360" />
        <path d="M100 170H420" strokeWidth="3" />
        {/* upper floor */}
        <path d="M160 170V90H360V170" />
        <path d="M145 90H375" strokeWidth="3" />
        {/* stair core */}
        <path d="M400 360V220H470V360" />
        <path d="M392 220H478" strokeWidth="2" />
      </g>
      <g stroke="#7A6240" strokeWidth="1.25">
        {/* windows, ground floor */}
        <rect x="150" y="240" width="60" height="70" />
        <path d="M180 240V310M150 275H210" />
        <rect x="310" y="240" width="60" height="70" />
        <path d="M340 240V310M310 275H370" />
        {/* door */}
        <rect x="235" y="250" width="50" height="110" />
        <path d="M275 305h4" strokeWidth="2" />
        {/* upper windows */}
        <rect x="185" y="112" width="70" height="40" />
        <rect x="270" y="112" width="70" height="40" />
        <path d="M220 112V152M305 112V152" />
        {/* balcony rail */}
        <path d="M160 190H360M160 205H360" />
        <path d="M180 190V205M200 190V205M220 190V205M240 190V205M260 190V205M280 190V205M300 190V205M320 190V205M340 190V205" />
        {/* stair window slits */}
        <path d="M425 240V340M445 240V340" />
      </g>
      <g stroke="#B49A70" strokeWidth="1" strokeDasharray="3 5">
        {/* dimension lines */}
        <path d="M120 385H400" />
        <path d="M120 380V390M400 380V390" strokeDasharray="none" />
        <path d="M500 90V360" />
        <path d="M495 90H505M495 360H505" strokeDasharray="none" />
      </g>
      <g fill="#7A6240" fontFamily="ui-sans-serif, system-ui" fontSize="11" letterSpacing="1.5">
        <text x="236" y="404">ELEVATION</text>
        <text x="512" y="230" transform="rotate(90 512 230)">G + 1</text>
      </g>
    </svg>
  );
}
