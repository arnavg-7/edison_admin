// TODO: replace with the real Admin DB portal-configuration contract.
//
// Scope note: the committed scope names HS and KG only. ES/MS are deliberately
// absent until the team confirms whether they need their own screens
// (brief §8 item 6).
//
// The HS/KG layout & branding editors were removed on request (2026-07-17).
// The screen inventory lists them under Portal Configuration, so re-adding them
// is a scope change rather than a gap to fill.

export type SchoolLevel = "HS" | "KG";

// Confirmed 2026-07-17: HS and KG only. ES/MS are deliberately absent rather
// than pending, so adding them is a scope change, not a gap to fill in.
export const SCHOOL_LEVELS: { value: SchoolLevel; label: string }[] = [
  { value: "HS", label: "High School" },
  { value: "KG", label: "Kindergarten" }
];

/**
 * Development areas are two levels: an area is the coloured heading a student
 * sees (Strengths, Room To Grow…) and it holds the individual skills listed
 * under it.
 *
 * The faculty portal colours these cards by :nth-child, which silently
 * reassigns colours when a card is added, removed or reordered. Here the tone
 * is a property of the area, so it survives editing.
 */
export type DevAreaTone = "blue" | "green" | "cyan" | "orange" | "violet" | "rose";

export type DevAreaIcon = "check" | "bolt" | "smile" | "target" | "book" | "star";

export const DEV_AREA_TONES: { value: DevAreaTone; label: string }[] = [
  { value: "blue", label: "Blue" },
  { value: "green", label: "Green" },
  { value: "cyan", label: "Cyan" },
  { value: "orange", label: "Orange" },
  { value: "violet", label: "Violet" },
  { value: "rose", label: "Rose" }
];

export const DEV_AREA_ICONS: { value: DevAreaIcon; label: string }[] = [
  { value: "check", label: "Check" },
  { value: "bolt", label: "Bolt" },
  { value: "smile", label: "Smile" },
  { value: "target", label: "Target" },
  { value: "book", label: "Book" },
  { value: "star", label: "Star" }
];

export type DevSkill = {
  id: string;
  label: string;
};

export type DevelopmentArea = {
  id: string;
  title: string;
  tone: DevAreaTone;
  icon: DevAreaIcon;
  published: boolean;
  skills: DevSkill[];
};

export const developmentAreas: Record<SchoolLevel, DevelopmentArea[]> = {
  HS: [
    {
      id: "da-hs-strengths",
      title: "Strengths",
      tone: "blue",
      icon: "check",
      published: true,
      skills: [
        { id: "sk-1", label: "Analytical Thinker" },
        { id: "sk-2", label: "Problem Solver" },
        { id: "sk-3", label: "Detail-Oriented" }
      ]
    },
    {
      id: "da-hs-grow",
      title: "Room To Grow",
      tone: "green",
      icon: "bolt",
      published: true,
      skills: [
        { id: "sk-4", label: "Speed in Tests" },
        { id: "sk-5", label: "Word Problems" },
        { id: "sk-6", label: "Time Management" }
      ]
    },
    {
      id: "da-hs-interests",
      title: "Interests",
      tone: "cyan",
      icon: "smile",
      published: true,
      skills: [
        { id: "sk-7", label: "Mathematics" },
        { id: "sk-8", label: "Physics" },
        { id: "sk-9", label: "Chess" }
      ]
    },
    {
      id: "da-hs-goals",
      title: "Future Goals",
      tone: "orange",
      icon: "target",
      published: true,
      skills: [
        { id: "sk-10", label: "Engineering School" },
        { id: "sk-11", label: "STEM Career" },
        { id: "sk-12", label: "Research Internship" }
      ]
    }
  ],
  KG: [
    {
      id: "da-kg-strengths",
      title: "Strengths",
      tone: "blue",
      icon: "check",
      published: true,
      skills: [
        { id: "sk-k1", label: "Shares Willingly" },
        { id: "sk-k2", label: "Listens Well" }
      ]
    },
    {
      id: "da-kg-grow",
      title: "Room To Grow",
      tone: "green",
      icon: "bolt",
      published: false,
      skills: [{ id: "sk-k3", label: "Pencil Grip" }]
    }
  ]
};

/**
 * Skills profile is also two levels, but unlike development areas the colour
 * belongs to the sub-skill rather than the group: each sub-skill is rated
 * High / Middle / Elementary and the pill takes its colour from that rating.
 * Groups are plain white cards.
 */
export type SkillLevel = "high" | "middle" | "elementary";

export const SKILL_LEVELS: { value: SkillLevel; label: string }[] = [
  { value: "high", label: "High Skill" },
  { value: "middle", label: "Middle Skill" },
  { value: "elementary", label: "Elementary Skill" }
];

export type SubSkill = {
  id: string;
  label: string;
  level: SkillLevel;
  /** Shown on hover/focus of the pill. */
  description: string;
};

export type SkillGroup = {
  id: string;
  title: string;
  published: boolean;
  subSkills: SubSkill[];
};

export const skillsProfile: Record<SchoolLevel, SkillGroup[]> = {
  HS: [
    {
      id: "sg-resilience",
      title: "Resilience",
      published: true,
      subSkills: [
        {
          id: "ss-1",
          label: "Perseverance",
          level: "high",
          description: "Keeps working at a problem after early attempts fail."
        },
        {
          id: "ss-2",
          label: "Flexibility",
          level: "middle",
          description:
            "Accepts change, learns from mistakes, and stays positive in the face of setbacks."
        },
        {
          id: "ss-3",
          label: "Adaptability",
          level: "elementary",
          description: "Adjusts approach when circumstances or expectations shift."
        }
      ]
    },
    {
      id: "sg-communication",
      title: "Effective Communication",
      published: true,
      subSkills: [
        {
          id: "ss-4",
          label: "Reasoning",
          level: "high",
          description: "Builds a clear, evidenced argument others can follow."
        },
        {
          id: "ss-5",
          label: "Clarity",
          level: "middle",
          description: "Expresses ideas concisely in speech and writing."
        },
        {
          id: "ss-6",
          label: "Active Listening",
          level: "elementary",
          description: "Listens to understand before responding."
        }
      ]
    },
    {
      id: "sg-community",
      title: "Engaged Community Member",
      published: true,
      subSkills: [
        {
          id: "ss-7",
          label: "Service",
          level: "high",
          description: "Contributes time and effort to the wider school community."
        },
        {
          id: "ss-8",
          label: "Empathy",
          level: "middle",
          description: "Recognises and responds to how others are feeling."
        },
        {
          id: "ss-9",
          label: "Respect",
          level: "elementary",
          description: "Treats peers and staff with consideration."
        }
      ]
    },
    {
      id: "sg-lifelong",
      title: "Lifelong Learner",
      published: true,
      subSkills: [
        {
          id: "ss-10",
          label: "Initiative",
          level: "high",
          description: "Starts work without being prompted."
        },
        {
          id: "ss-11",
          label: "Collaboration",
          level: "middle",
          description: "Works productively with others toward a shared goal."
        },
        {
          id: "ss-12",
          label: "Curiosity",
          level: "elementary",
          description: "Asks questions and explores beyond what is required."
        }
      ]
    },
    {
      id: "sg-emotional",
      title: "Emotionally Intelligent",
      published: true,
      subSkills: [
        {
          id: "ss-13",
          label: "Accountability",
          level: "high",
          description: "Owns outcomes, including mistakes."
        },
        {
          id: "ss-14",
          label: "Self-Regulation",
          level: "middle",
          description: "Manages impulses and emotions under pressure."
        },
        {
          id: "ss-15",
          label: "Self-Awareness",
          level: "elementary",
          description: "Recognises personal strengths and limits."
        }
      ]
    },
    {
      id: "sg-critical",
      title: "Critical Thinking",
      published: true,
      subSkills: [
        {
          id: "ss-16",
          label: "Innovation",
          level: "high",
          description: "Generates original approaches to open-ended problems."
        },
        {
          id: "ss-17",
          label: "Analysis",
          level: "middle",
          description: "Breaks a problem into parts and evaluates each."
        },
        {
          id: "ss-18",
          label: "Reasoning",
          level: "elementary",
          description: "Draws conclusions that follow from the evidence."
        }
      ]
    }
  ],
  KG: [
    {
      id: "sg-kg-social",
      title: "Social Readiness",
      published: true,
      subSkills: [
        {
          id: "ss-k1",
          label: "Sharing",
          level: "high",
          description: "Shares materials and takes turns with peers."
        },
        {
          id: "ss-k2",
          label: "Following Routines",
          level: "middle",
          description: "Moves through the daily routine with light prompting."
        }
      ]
    },
    {
      id: "sg-kg-motor",
      title: "Fine Motor Skills",
      published: false,
      subSkills: [
        {
          id: "ss-k3",
          label: "Pencil Grip",
          level: "elementary",
          description: "Holds a pencil with a developing tripod grip."
        }
      ]
    }
  ]
};

export type FacultyDashboardComponent = {
  id: string;
  label: string;
  description: string;
  enabled: boolean;
};

export const facultyDashboardComponents: FacultyDashboardComponent[] = [
  {
    id: "fd-schedule",
    label: "Schedule strip",
    description: "Today's classes across the top of the faculty dashboard.",
    enabled: true
  },
  {
    id: "fd-attendance",
    label: "Attendance summary",
    description: "Class attendance percentage tile.",
    enabled: true
  },
  {
    id: "fd-alerts",
    label: "Student alerts",
    description: "Open alerts requiring faculty attention.",
    enabled: true
  },
  {
    id: "fd-skills",
    label: "Skills profile",
    description: "Per-student skills breakdown panel.",
    enabled: false
  },
  {
    id: "fd-goals",
    label: "Goal progress",
    description: "Academic goal status for the teacher's students.",
    enabled: true
  }
];
