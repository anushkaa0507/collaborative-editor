export function DocIcon({ className = "w-6 h-6" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      className={className}
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <path
        d="M6.5 2.75h7.25a.5.5 0 0 1 .35.15l4.25 4.25a.5.5 0 0 1 .15.35V20.5a.75.75 0 0 1-.75.75h-11a.75.75 0 0 1-.75-.75V3.5a.75.75 0 0 1 .75-.75Z"
        fill="currentColor"
        fillOpacity="0.12"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <path
        d="M14 2.75V6.5a1 1 0 0 0 1 1h3.75"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <path
        d="M8 12h8M8 15.25h8M8 8.75h4"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}