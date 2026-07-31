import type { ListEditorItem } from "@/components/shared/ListEditor";

// TODO: replace with the real Admin DB resources contract.
//
// Scope note: built to the simple committed scope — a CRUD resource manager
// with external links, grouped by category with a last-updated date. No
// access control, curriculum alignment, or tagging taxonomy (brief §6).

export type ResourceGroup = {
  category: string;
  items: ListEditorItem[];
};

export const resourceGroups: ResourceGroup[] = [
  {
    category: "Teaching & learning",
    items: [
      {
        id: "res-1",
        title: "Google Classroom",
        detail: "https://classroom.google.com",
        status: { tone: "ok", label: "Published" },
        meta: "Updated Jul 22, 2026"
      },
      {
        id: "res-2",
        title: "Curriculum handbook",
        detail: "https://edison.example.org/curriculum-handbook",
        status: { tone: "ok", label: "Published" },
        meta: "Updated Jun 04, 2026"
      }
    ]
  },
  {
    category: "Student information",
    items: [
      {
        id: "res-3",
        title: "Genesis parent portal",
        detail: "https://genesis.example.org/parents",
        status: { tone: "ok", label: "Published" },
        meta: "Updated Jul 18, 2026"
      },
      {
        id: "res-4",
        title: "Attendance policy",
        detail: "https://edison.example.org/policies/attendance",
        status: { tone: "ok", label: "Published" },
        meta: "Updated May 30, 2026"
      }
    ]
  },
  {
    category: "Staff",
    items: [
      {
        id: "res-5",
        title: "Employee portal",
        detail: "https://edison.example.org/staff",
        status: { tone: "ok", label: "Published" },
        meta: "Updated Jul 09, 2026"
      },
      {
        id: "res-6",
        title: "Professional development calendar",
        detail: "https://edison.example.org/staff/pd",
        status: { tone: "neutral", label: "Draft" },
        meta: "Updated Jul 29, 2026"
      }
    ]
  }
];
