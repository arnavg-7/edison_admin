import type { SectionId } from "@/lib/role/roles";

export function NavIcon({ name }: { name: SectionId | "logout" }) {
  switch (name) {
    case "home":
      return (
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16" fill="none">
          <path d="M9.99584 13.9942V8.66309C9.99584 8.48635 9.92563 8.31685 9.80065 8.19188C9.67568 8.06691 9.50618 7.9967 9.32945 7.9967H6.66389C6.48715 7.9967 6.31765 8.06691 6.19268 8.19188C6.06771 8.31685 5.9975 8.48635 5.9975 8.66309V13.9942" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M1.99917 6.66384C1.99912 6.46996 2.04137 6.27841 2.12297 6.10255C2.20458 5.92668 2.32356 5.77074 2.47164 5.64559L7.13636 1.64726C7.37692 1.44395 7.6817 1.3324 7.99667 1.3324C8.31163 1.3324 8.61642 1.44395 8.85698 1.64726L13.5217 5.64559C13.6698 5.77074 13.7888 5.92668 13.8704 6.10255C13.952 6.27841 13.9942 6.46996 13.9942 6.66384V12.6613C13.9942 13.0148 13.8538 13.3538 13.6038 13.6037C13.3539 13.8536 13.0149 13.9941 12.6614 13.9941H3.33195C2.97847 13.9941 2.63947 13.8536 2.38953 13.6037C2.13958 13.3538 1.99917 13.0148 1.99917 12.6613V6.66384Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
    case "reporting":
      return (
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16" fill="none">
          <path d="M2 14H14" stroke="currentColor" strokeWidth="1.33333" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M4 11V7.33333" stroke="currentColor" strokeWidth="1.33333" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M7.33333 11V4" stroke="currentColor" strokeWidth="1.33333" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M10.6667 11V9" stroke="currentColor" strokeWidth="1.33333" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M14 11V5.33333" stroke="currentColor" strokeWidth="1.33333" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
    case "portal-configuration":
      return (
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16" fill="none">
          <path d="M2 4H14" stroke="currentColor" strokeWidth="1.33333" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M2 8H14" stroke="currentColor" strokeWidth="1.33333" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M2 12H14" stroke="currentColor" strokeWidth="1.33333" strokeLinecap="round" strokeLinejoin="round" />
          <circle cx="6" cy="4" r="1.6" fill="currentColor" />
          <circle cx="10.5" cy="8" r="1.6" fill="currentColor" />
          <circle cx="5" cy="12" r="1.6" fill="currentColor" />
        </svg>
      );
    case "academic-goals":
      return (
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16" fill="none">
          <circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="1.33333" />
          <circle cx="8" cy="8" r="3.2" stroke="currentColor" strokeWidth="1.33333" />
          <circle cx="8" cy="8" r="1" fill="currentColor" />
        </svg>
      );
    case "alerts":
      return (
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16" fill="none">
          <path d="M12 5.33333C12 4.27247 11.5786 3.25505 10.8284 2.50491C10.0783 1.75476 9.06087 1.33333 8 1.33333C6.93913 1.33333 5.92172 1.75476 5.17157 2.50491C4.42143 3.25505 4 4.27247 4 5.33333C4 10 2 11.3333 2 11.3333H14C14 11.3333 12 10 12 5.33333Z" stroke="currentColor" strokeWidth="1.33333" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M9.15333 14C9.03614 14.2021 8.86791 14.3698 8.6655 14.4864C8.46309 14.6029 8.2336 14.6643 8 14.6643C7.7664 14.6643 7.53691 14.6029 7.3345 14.4864C7.13209 14.3698 6.96386 14.2021 6.84667 14" stroke="currentColor" strokeWidth="1.33333" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
    case "resources":
      return (
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16" fill="none">
          <path d="M14 12.6667C14 13.0203 13.8595 13.3594 13.6095 13.6095C13.3594 13.8595 13.0203 14 12.6667 14H3.33333C2.97971 14 2.64057 13.8595 2.39052 13.6095C2.14048 13.3594 2 13.0203 2 12.6667V3.33333C2 2.97971 2.14048 2.64057 2.39052 2.39052C2.64057 2.14048 2.97971 2 3.33333 2H6L7.33333 4H12.6667C13.0203 4 13.3594 4.14048 13.6095 4.39052C13.8595 4.64057 14 4.97971 14 5.33333V12.6667Z" stroke="currentColor" strokeWidth="1.33333" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
    case "system-settings":
      return (
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16" fill="none">
          <circle cx="8" cy="8" r="2" stroke="currentColor" strokeWidth="1.33333" />
          <path d="M12.9333 10C12.8377 10.2183 12.8114 10.4602 12.858 10.6939C12.9046 10.9276 13.0218 11.1416 13.1933 11.3066L13.2267 11.34C13.365 11.4783 13.4749 11.6421 13.5502 11.8225C13.6254 12.0029 13.6644 12.1963 13.6644 12.3917C13.6644 12.587 13.6254 12.7804 13.5502 12.9608C13.4749 13.1411 13.365 13.305 13.2267 13.4433C13.0884 13.5817 12.9245 13.6915 12.7441 13.7668C12.5638 13.842 12.3704 13.8808 12.175 13.8808C11.9796 13.8808 11.7862 13.842 11.6059 13.7668C11.4255 13.6915 11.2617 13.5817 11.1233 13.4433L11.09 13.41C10.925 13.2385 10.711 13.1212 10.4773 13.0746C10.2436 13.028 10.0017 13.0544 9.78333 13.15C9.56911 13.241 9.38636 13.3934 9.25955 13.5885C9.13273 13.7836 9.06753 14.0117 9.06667 14.2433V14.3333C9.06667 14.7275 8.91176 15.106 8.63671 15.3811C8.36165 15.6561 7.98319 15.811 7.58889 15.811" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
    case "integrations":
      return (
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16" fill="none">
          <path d="M6 10L10 6" stroke="currentColor" strokeWidth="1.33333" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M9 3.33333L9.86667 2.46667C10.4889 1.84444 11.3333 1.49489 12.2138 1.49489C13.0942 1.49489 13.9387 1.84444 14.5609 2.46667C15.1831 3.08889 15.5327 3.93333 15.5327 4.81378C15.5327 5.69422 15.1831 6.53867 14.5609 7.16089L13.6942 8.02756" stroke="currentColor" strokeWidth="1.33333" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M7 12.6667L6.13333 13.5333C5.51111 14.1556 4.66667 14.5051 3.78622 14.5051C2.90578 14.5051 2.06133 14.1556 1.43911 13.5333C0.816889 12.9111 0.467339 12.0667 0.467339 11.1862C0.467339 10.3058 0.816889 9.46133 1.43911 8.83911L2.30578 7.97244" stroke="currentColor" strokeWidth="1.33333" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
    default:
      return (
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16" fill="none">
          <path d="M6 14H3.33333C2.97971 14 2.64057 13.8595 2.39052 13.6095C2.14048 13.3594 2 13.0203 2 12.6667V3.33333C2 2.97971 2.14048 2.64057 2.39052 2.39052C2.64057 2.14048 2.97971 2 3.33333 2H6" stroke="currentColor" strokeWidth="1.33333" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M10.6667 11.3332L14 7.99984L10.6667 4.6665" stroke="currentColor" strokeWidth="1.33333" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M14 8H6" stroke="currentColor" strokeWidth="1.33333" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
  }
}
