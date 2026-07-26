export function WeddingBackdrop() {
  return (
    <div
      aria-hidden
      className="wedding-backdrop pointer-events-none absolute inset-0 overflow-hidden"
    >
      {/* Soft veil drapes */}
      <svg
        className="absolute -left-8 top-0 h-[70vh] w-[min(42vw,22rem)] opacity-[0.22] text-maroon"
        viewBox="0 0 220 640"
        fill="none"
      >
        <path
          d="M40 0c20 40 28 90 20 150-10 70-40 120-20 200 18 70 50 110 35 180-8 40-30 70-50 110"
          stroke="currentColor"
          strokeWidth="1.2"
          opacity="0.55"
        />
        <path
          d="M70 0c30 50 40 110 25 180-18 85-55 140-30 220 22 70 55 115 40 190-10 45-35 80-55 120"
          stroke="currentColor"
          strokeWidth="1.4"
        />
        <path
          d="M105 0c35 55 48 125 28 200-22 95-65 155-38 240 24 75 62 125 42 200"
          stroke="currentColor"
          strokeWidth="1"
          opacity="0.7"
        />
        <path
          d="M140 0c38 60 55 140 30 220-28 100-75 165-42 250"
          stroke="currentColor"
          strokeWidth="0.9"
          opacity="0.45"
        />
        <path
          fill="currentColor"
          opacity="0.08"
          d="M20 0h140c-10 80-30 160-20 250s40 160 10 280c-20 70-55 110-80 110C40 640 0 520 10 400 22 270 60 180 50 90 45 50 35 20 20 0Z"
        />
      </svg>

      <svg
        className="absolute -right-10 top-0 h-[65vh] w-[min(40vw,20rem)] scale-x-[-1] opacity-[0.2] text-maroon"
        viewBox="0 0 220 640"
        fill="none"
      >
        <path
          d="M70 0c30 50 40 110 25 180-18 85-55 140-30 220 22 70 55 115 40 190"
          stroke="currentColor"
          strokeWidth="1.4"
        />
        <path
          d="M105 0c35 55 48 125 28 200-22 95-65 155-38 240 24 75 62 125 42 200"
          stroke="currentColor"
          strokeWidth="1"
          opacity="0.7"
        />
        <path
          fill="currentColor"
          opacity="0.07"
          d="M20 0h140c-10 80-30 160-20 250s40 160 10 280c-20 70-55 110-80 110C40 640 0 520 10 400 22 270 60 180 50 90 45 50 35 20 20 0Z"
        />
      </svg>

      {/* Center chandelier */}
      <div className="wedding-float absolute left-1/2 top-0 -translate-x-1/2">
        <svg
          className="h-44 w-40 opacity-[0.28] text-gold sm:h-52 sm:w-48"
          viewBox="0 0 160 200"
          fill="none"
        >
          <path d="M80 8v28" stroke="currentColor" strokeWidth="1.5" />
          <circle cx="80" cy="8" r="3.5" fill="currentColor" />
          <path
            d="M55 36h50"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
          <path
            d="M48 42c10-8 22-12 32-12s22 4 32 12"
            stroke="currentColor"
            strokeWidth="1.4"
          />
          <path
            d="M40 55c14-14 28-20 40-20s26 6 40 20"
            stroke="currentColor"
            strokeWidth="1.3"
          />
          <path d="M48 42v38M80 36v50M112 42v38" stroke="currentColor" strokeWidth="1.1" />
          <path d="M28 70v36M132 70v36" stroke="currentColor" strokeWidth="1" />
          <path
            d="M28 70c8-6 16-8 24-8M132 70c-8-6-16-8-24-8"
            stroke="currentColor"
            strokeWidth="1"
          />
          <ellipse cx="28" cy="112" rx="5" ry="8" fill="currentColor" opacity="0.85" />
          <ellipse cx="48" cy="88" rx="5.5" ry="9" fill="currentColor" />
          <ellipse cx="80" cy="94" rx="6" ry="10" fill="currentColor" />
          <ellipse cx="112" cy="88" rx="5.5" ry="9" fill="currentColor" />
          <ellipse cx="132" cy="112" rx="5" ry="8" fill="currentColor" opacity="0.85" />
          <path
            d="M68 52h24M62 62h36"
            stroke="currentColor"
            strokeWidth="0.8"
            opacity="0.7"
          />
          <circle cx="80" cy="48" r="3" fill="currentColor" />
        </svg>
      </div>

      {/* Side chandeliers */}
      <div className="wedding-float-slow absolute left-[8%] top-0 hidden md:block">
        <svg
          className="h-32 w-28 opacity-[0.2] text-gold"
          viewBox="0 0 120 150"
          fill="none"
        >
          <path d="M60 4v20" stroke="currentColor" strokeWidth="1.2" />
          <path d="M40 24h40" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
          <path d="M35 30c8-6 16-9 25-9s17 3 25 9" stroke="currentColor" strokeWidth="1.1" />
          <path d="M38 30v28M60 24v36M82 30v28" stroke="currentColor" strokeWidth="1" />
          <ellipse cx="38" cy="64" rx="4" ry="7" fill="currentColor" />
          <ellipse cx="60" cy="68" rx="4.5" ry="8" fill="currentColor" />
          <ellipse cx="82" cy="64" rx="4" ry="7" fill="currentColor" />
        </svg>
      </div>

      <div className="wedding-float absolute right-[10%] top-0 hidden md:block">
        <svg
          className="h-28 w-24 opacity-[0.18] text-gold"
          viewBox="0 0 120 150"
          fill="none"
        >
          <path d="M60 4v18" stroke="currentColor" strokeWidth="1.2" />
          <path d="M42 22h36" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
          <path d="M38 28c7-5 14-8 22-8s15 3 22 8" stroke="currentColor" strokeWidth="1.1" />
          <path d="M40 28v24M60 22v32M80 28v24" stroke="currentColor" strokeWidth="1" />
          <ellipse cx="40" cy="58" rx="3.5" ry="6" fill="currentColor" />
          <ellipse cx="60" cy="62" rx="4" ry="7" fill="currentColor" />
          <ellipse cx="80" cy="58" rx="3.5" ry="6" fill="currentColor" />
        </svg>
      </div>

      {/* Floral corner — bottom left */}
      <svg
        className="absolute -bottom-6 -left-4 h-56 w-56 opacity-[0.3] text-maroon sm:h-64 sm:w-64"
        viewBox="0 0 240 240"
        fill="none"
      >
        <g fill="currentColor">
          {/* Large bloom */}
          <circle cx="70" cy="170" r="18" opacity="0.55" />
          <circle cx="52" cy="158" r="14" opacity="0.45" />
          <circle cx="88" cy="156" r="14" opacity="0.45" />
          <circle cx="58" cy="186" r="13" opacity="0.4" />
          <circle cx="84" cy="186" r="13" opacity="0.4" />
          <circle cx="70" cy="170" r="8" fill="oklch(0.78 0.1 85)" />
          {/* Medium bloom */}
          <circle cx="130" cy="200" r="12" opacity="0.5" />
          <circle cx="118" cy="192" r="9" opacity="0.4" />
          <circle cx="142" cy="192" r="9" opacity="0.4" />
          <circle cx="122" cy="210" r="8" opacity="0.35" />
          <circle cx="138" cy="210" r="8" opacity="0.35" />
          <circle cx="130" cy="200" r="5" opacity="0.7" />
          {/* Small bloom */}
          <circle cx="40" cy="210" r="9" opacity="0.4" />
          <circle cx="32" cy="204" r="7" opacity="0.3" />
          <circle cx="48" cy="204" r="7" opacity="0.3" />
          <circle cx="40" cy="210" r="3.5" opacity="0.65" />
        </g>
        <g stroke="currentColor" strokeWidth="1.2" opacity="0.55">
          <path d="M70 170c10-30 28-55 55-70" />
          <path d="M100 140c8-4 18-6 28-4" />
          <path d="M95 155c12 2 22 10 28 22" />
          <path d="M55 185c-12 8-22 22-26 38" />
        </g>
        {/* Leaves */}
        <g fill="oklch(0.5 0.09 155)" opacity="0.55">
          <ellipse cx="108" cy="125" rx="14" ry="7" transform="rotate(-35 108 125)" />
          <ellipse cx="145" cy="155" rx="12" ry="6" transform="rotate(25 145 155)" />
          <ellipse cx="48" cy="145" rx="11" ry="5.5" transform="rotate(-50 48 145)" />
        </g>
      </svg>

      {/* Floral corner — bottom right */}
      <svg
        className="absolute -bottom-8 -right-6 h-60 w-60 opacity-[0.28] text-maroon sm:h-72 sm:w-72"
        viewBox="0 0 260 260"
        fill="none"
      >
        <g fill="currentColor">
          <circle cx="180" cy="175" r="20" opacity="0.5" />
          <circle cx="160" cy="160" r="15" opacity="0.42" />
          <circle cx="200" cy="158" r="15" opacity="0.42" />
          <circle cx="164" cy="192" r="14" opacity="0.38" />
          <circle cx="196" cy="192" r="14" opacity="0.38" />
          <circle cx="180" cy="175" r="9" fill="oklch(0.78 0.1 85)" />
          <circle cx="220" cy="210" r="11" opacity="0.45" />
          <circle cx="210" cy="202" r="8" opacity="0.35" />
          <circle cx="230" cy="202" r="8" opacity="0.35" />
          <circle cx="220" cy="210" r="4" opacity="0.7" />
          <circle cx="145" cy="215" r="10" opacity="0.4" />
          <circle cx="136" cy="208" r="7" opacity="0.3" />
          <circle cx="154" cy="208" r="7" opacity="0.3" />
        </g>
        <g stroke="currentColor" strokeWidth="1.2" opacity="0.5">
          <path d="M180 175c-12-32-35-58-65-72" />
          <path d="M140 140c-10-2-22 0-32 6" />
          <path d="M150 155c-14 4-26 14-32 28" />
        </g>
        <g fill="oklch(0.5 0.09 155)" opacity="0.5">
          <ellipse cx="125" cy="118" rx="15" ry="7" transform="rotate(40 125 118)" />
          <ellipse cx="105" cy="155" rx="12" ry="6" transform="rotate(-20 105 155)" />
          <ellipse cx="210" cy="140" rx="11" ry="5.5" transform="rotate(55 210 140)" />
        </g>
      </svg>

      {/* Scattered petal / marigold accents */}
      <svg
        className="absolute right-[28%] top-[38%] h-10 w-10 opacity-[0.16] text-gold"
        viewBox="0 0 40 40"
        fill="currentColor"
      >
        <circle cx="20" cy="20" r="5" />
        <circle cx="20" cy="10" r="4" opacity="0.8" />
        <circle cx="28" cy="14" r="4" opacity="0.8" />
        <circle cx="28" cy="26" r="4" opacity="0.8" />
        <circle cx="20" cy="30" r="4" opacity="0.8" />
        <circle cx="12" cy="26" r="4" opacity="0.8" />
        <circle cx="12" cy="14" r="4" opacity="0.8" />
      </svg>

      <svg
        className="absolute left-[30%] top-[55%] h-8 w-8 opacity-[0.14] text-maroon"
        viewBox="0 0 40 40"
        fill="currentColor"
      >
        <circle cx="20" cy="20" r="4" />
        <circle cx="20" cy="11" r="3.5" opacity="0.75" />
        <circle cx="27" cy="15" r="3.5" opacity="0.75" />
        <circle cx="27" cy="25" r="3.5" opacity="0.75" />
        <circle cx="20" cy="29" r="3.5" opacity="0.75" />
        <circle cx="13" cy="25" r="3.5" opacity="0.75" />
        <circle cx="13" cy="15" r="3.5" opacity="0.75" />
      </svg>
    </div>
  );
}
