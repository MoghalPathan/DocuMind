import { useId } from "react";

// The DocuMind mark: a D made of a page (left, folded corner, one cited line) and a mind (right).
export default function Logo({ className = "", title = "DocuMind" }) {
  const id = useId().replace(/:/g, "");
  return (
    <svg className={className} viewBox="0 0 64 64" role="img" aria-label={title}>
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#8190ff" />
          <stop offset="1" stopColor="#4350dc" />
        </linearGradient>
      </defs>
      <rect width="64" height="64" rx="15" fill={`url(#${id})`} />
      <path d="M24 13h5.500v38H19a4 4 0 0 1-4-4V22z" fill="#fff" />
      <path d="M15 22h6a3 3 0 0 0 3-3v-6z" fill="#aeb6ff" />
      <rect x="19" y="31" width="7.500" height="4" rx="2" fill="#4350dc" />
      <path d="M32.500 13H34a19 19 0 0 1 0 38h-1.500z" fill="#fff" />
    </svg>
  );
}
