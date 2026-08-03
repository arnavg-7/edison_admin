import type { SectionId } from "@/lib/nav";

const base = {
  xmlns: "http://www.w3.org/2000/svg",
  width: 16,
  height: 16,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.8,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const
};

export function NavIcon({ name }: { name: SectionId }) {
  switch (name) {
    case "home":
      return (
        <svg {...base}>
          <path d="M3 10.5 12 3l9 7.5" />
          <path d="M5 9.6V20h14V9.6" />
          <path d="M9.5 20v-6h5v6" />
        </svg>
      );
    case "reporting":
      return (
        <svg {...base}>
          <path d="M3 20h18" />
          <path d="M6 20V11" />
          <path d="M11 20V5" />
          <path d="M16 20v-6" />
          <path d="M21 20V8" />
        </svg>
      );
    case "people-360":
      return (
        <svg {...base}>
          <circle cx="9" cy="8.5" r="3.5" />
          <path d="M2.5 20c0-3.6 2.9-6 6.5-6s6.5 2.4 6.5 6" />
          <path d="M16.5 5.5a3.5 3.5 0 0 1 0 6.5" />
          <path d="M18.5 14.4c1.8.7 3 2.2 3 4.1" />
        </svg>
      );
    case "portal-configuration":
      return (
        <svg {...base}>
          <path d="M4 6h16M4 12h16M4 18h16" />
          <circle cx="9" cy="6" r="2" fill="currentColor" stroke="none" />
          <circle cx="15" cy="12" r="2" fill="currentColor" stroke="none" />
          <circle cx="8" cy="18" r="2" fill="currentColor" stroke="none" />
        </svg>
      );
    case "academic-goals":
      return (
        <svg {...base}>
          <circle cx="12" cy="12" r="8.5" />
          <circle cx="12" cy="12" r="4.5" />
          <circle cx="12" cy="12" r="1" fill="currentColor" stroke="none" />
        </svg>
      );
    case "alerts":
      return (
        <svg {...base}>
          <path d="M18 8.5a6 6 0 1 0-12 0c0 6-2.5 7.5-2.5 7.5h17S18 14.5 18 8.5Z" />
          <path d="M10.3 19.5a2 2 0 0 0 3.4 0" />
        </svg>
      );
    case "resources":
      return (
        <svg {...base}>
          <path d="M3.5 6.5A2 2 0 0 1 5.5 4.5H10l1.8 2.6h6.7a2 2 0 0 1 2 2v9.4a2 2 0 0 1-2 2H5.5a2 2 0 0 1-2-2V6.5Z" />
        </svg>
      );
    case "system-settings":
      return (
        <svg {...base}>
          <circle cx="12" cy="12" r="3" />
          <path d="M12 3.5v2.2M12 18.3v2.2M4.9 7.8l1.9 1.1M17.2 15.1l1.9 1.1M4.9 16.2l1.9-1.1M17.2 8.9l1.9-1.1" />
        </svg>
      );
    default:
      return (
        <svg {...base}>
          <path d="M9.5 14.5 14.5 9.5" />
          <path d="M13.5 6.5 15 5a4.2 4.2 0 0 1 6 6l-1.5 1.5" />
          <path d="M10.5 17.5 9 19a4.2 4.2 0 0 1-6-6l1.5-1.5" />
        </svg>
      );
  }
}
