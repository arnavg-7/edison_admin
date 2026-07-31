"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const navItems = [
  { label: "Dashboard", href: "/admin/dashboard", icon: "dashboard" },
  { label: "Faculty", href: "/admin/faculty", icon: "faculty" },
  { label: "Students", href: "/admin/students", icon: "students" },
  { label: "Courses", href: "/admin/courses", icon: "courses" },
  { label: "Attendance", href: "/admin/attendance", icon: "attendance" },
  { label: "Settings", href: "/admin/settings", icon: "settings" }
] as const;

type IconName = (typeof navItems)[number]["icon"] | "logout";

function NavIcon({ name }: { name: IconName }) {
  if (name === "dashboard") {
    return (
      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16" fill="none">
        <path d="M9.99584 13.9942V8.66309C9.99584 8.48635 9.92563 8.31685 9.80065 8.19188C9.67568 8.06691 9.50618 7.9967 9.32945 7.9967H6.66389C6.48715 7.9967 6.31765 8.06691 6.19268 8.19188C6.06771 8.31685 5.9975 8.48635 5.9975 8.66309V13.9942" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M1.99917 6.66384C1.99912 6.46996 2.04137 6.27841 2.12297 6.10255C2.20458 5.92668 2.32356 5.77074 2.47164 5.64559L7.13636 1.64726C7.37692 1.44395 7.6817 1.3324 7.99667 1.3324C8.31163 1.3324 8.61642 1.44395 8.85698 1.64726L13.5217 5.64559C13.6698 5.77074 13.7888 5.92668 13.8704 6.10255C13.952 6.27841 13.9942 6.46996 13.9942 6.66384V12.6613C13.9942 13.0148 13.8538 13.3538 13.6038 13.6037C13.3539 13.8536 13.0149 13.9941 12.6614 13.9941H3.33195C2.97847 13.9941 2.63947 13.8536 2.38953 13.6037C2.13958 13.3538 1.99917 13.0148 1.99917 12.6613V6.66384Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  }
  if (name === "faculty") {
    return (
      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16" fill="none">
        <path d="M11.3333 5.33333C11.3333 6.80609 10.1394 8 8.66667 8C7.19391 8 6 6.80609 6 5.33333C6 3.86057 7.19391 2.66667 8.66667 2.66667C10.1394 2.66667 11.3333 3.86057 11.3333 5.33333Z" stroke="currentColor" strokeWidth="1.33333" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M3.33333 13.3333C3.33333 11.1242 5.71376 9.33333 8.66667 9.33333C11.6196 9.33333 14 11.1242 14 13.3333" stroke="currentColor" strokeWidth="1.33333" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M4.66667 6.66667C3.5621 6.66667 2.66667 5.77124 2.66667 4.66667C2.66667 3.5621 3.5621 2.66667 4.66667 2.66667" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M2 11.3333C2 10.0733 2.94036 9.00229 4.23474 8.66667" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  }
  if (name === "students") {
    return (
      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16" fill="none">
        <path d="M1.33333 5.33333L8 2L14.6667 5.33333L8 8.66667L1.33333 5.33333Z" stroke="currentColor" strokeWidth="1.33333" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M4 7V11C4 11 5.5 12.6667 8 12.6667C10.5 12.6667 12 11 12 11V7" stroke="currentColor" strokeWidth="1.33333" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M14.6667 5.33333V9.33333" stroke="currentColor" strokeWidth="1.33333" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  }
  if (name === "courses") {
    return (
      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16" fill="none">
        <path d="M7.99667 4.66479V13.9943" stroke="currentColor" strokeWidth="1.33278" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M1.99917 11.9951C1.82243 11.9951 1.65293 11.9249 1.52796 11.7999C1.40299 11.675 1.33278 11.5055 1.33278 11.3287V2.66566C1.33278 2.48892 1.40299 2.31942 1.52796 2.19445C1.65293 2.06948 1.82243 1.99927 1.99917 1.99927H5.33111C6.03806 1.99927 6.71606 2.2801 7.21595 2.77999C7.71583 3.27988 7.99667 3.95787 7.99667 4.66482C7.99667 3.95787 8.2775 3.27988 8.77739 2.77999C9.27728 2.2801 9.95528 1.99927 10.6622 1.99927H13.9942C14.1709 1.99927 14.3404 2.06948 14.4654 2.19445C14.5904 2.31942 14.6606 2.48892 14.6606 2.66566V11.3287C14.6606 11.5055 14.5904 11.675 14.4654 11.7999C14.3404 11.9249 14.1709 11.9951 13.9942 11.9951H9.99584C9.46562 11.9951 8.95713 12.2057 8.58221 12.5806C8.20729 12.9556 7.99667 13.4641 7.99667 13.9943C7.99667 13.4641 7.78604 12.9556 7.41113 12.5806C7.03621 12.2057 6.52771 11.9951 5.9975 11.9951H1.99917Z" stroke="currentColor" strokeWidth="1.33278" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  }
  if (name === "attendance") {
    return (
      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16" fill="none">
        <path d="M14 7V12.6667C14 13.0203 13.8595 13.3594 13.6095 13.6095C13.3594 13.8595 13.0203 14 12.6667 14H3.33333C2.97971 14 2.64057 13.8595 2.39052 13.6095C2.14048 13.3594 2 13.0203 2 12.6667V3.33333C2 2.97971 2.14048 2.64057 2.39052 2.39052C2.64057 2.14048 2.97971 2 3.33333 2H11.6667" stroke="currentColor" strokeWidth="1.33333" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M6 7.33341L8 9.33341L14.6667 2.66675" stroke="currentColor" strokeWidth="1.33333" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  }
  if (name === "settings") {
    return (
      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16" fill="none">
        <path d="M8 10C9.10457 10 10 9.10457 10 8C10 6.89543 9.10457 6 8 6C6.89543 6 6 6.89543 6 8C6 9.10457 6.89543 10 8 10Z" stroke="currentColor" strokeWidth="1.33333" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M12.9333 9.99992C12.8377 10.2183 12.8114 10.4602 12.858 10.6939C12.9046 10.9276 13.0218 11.1416 13.1933 11.3066L13.2267 11.3399C13.365 11.4782 13.4749 11.6421 13.5502 11.8225C13.6254 12.0028 13.6644 12.1962 13.6644 12.3916C13.6644 12.587 13.6254 12.7804 13.5502 12.9607C13.4749 13.1411 13.365 13.305 13.2267 13.4433C13.0884 13.5816 12.9245 13.6915 12.7441 13.7667C12.5638 13.842 12.3704 13.881 12.175 13.881C11.9796 13.881 11.7862 13.842 11.6059 13.7667C11.4255 13.6915 11.2616 13.5816 11.1233 13.4433L11.09 13.4099C10.925 13.2384 10.711 13.1212 10.4773 13.0746C10.2436 13.028 10.0017 13.0543 9.78333 13.1499C9.56911 13.2409 9.38636 13.3934 9.25955 13.5885C9.13273 13.7835 9.06753 14.0117 9.06667 14.2433V14.3333C9.06667 14.7275 8.91176 15.106 8.63671 15.381C8.36165 15.6561 7.98319 15.811 7.58889 15.811" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  }
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16" fill="none">
      <path d="M6 14H3.33333C2.97971 14 2.64057 13.8595 2.39052 13.6095C2.14048 13.3594 2 13.0203 2 12.6667V3.33333C2 2.97971 2.14048 2.64057 2.39052 2.39052C2.64057 2.14048 2.97971 2 3.33333 2H6" stroke="currentColor" strokeWidth="1.33333" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M10.6667 11.3332L14 7.99984L10.6667 4.6665" stroke="currentColor" strokeWidth="1.33333" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M14 8H6" stroke="currentColor" strokeWidth="1.33333" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <main className="admin-shell">
      <aside className="admin-sidebar">
        <div>
          <div className="admin-profile">
            <div className="admin-avatar">AD</div>
            <h2>Admin</h2>
            <p>Edison360 Administration</p>
          </div>

          <nav className="admin-nav" aria-label="Admin navigation">
            {navItems.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.label}
                  href={item.href}
                  className={isActive ? "admin-nav-item active" : "admin-nav-item"}
                >
                  <span className="admin-nav-icon" aria-hidden>
                    <NavIcon name={item.icon} />
                  </span>
                  <span className="admin-nav-label">{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        <button className="admin-logout" type="button">
          <span aria-hidden><NavIcon name="logout" /></span>
          Logout
        </button>
      </aside>

      {children}
    </main>
  );
}
