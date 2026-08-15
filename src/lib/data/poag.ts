/**
 * Edison Portrait of a Graduate — the content an admin owns.
 *
 * Six pillars, each rated on an ordered progression of levels, scoped per
 * class/subject. Faculty rate students against this; the admin portal owns the
 * *content* — the wording teachers and students read, and the scale itself —
 * plus oversight of who has rated and where a grade sits.
 *
 * Two names per pillar, deliberately. The Skills Chart and the Rubric call the
 * same pillar different things ("Resilience" vs "Adaptive & Resilient"); Edison
 * confirmed the Skills Chart titles are what ships in the UI, so `displayTitle`
 * is what anyone sees and `rubricKey` is the join key that level text hangs off
 * and that the rating rows store.
 *
 * TODO: replace the seeded strings below with a load of POAG_Content_Master.xlsx
 * (Sheets 1–4: 6 pillars × 3 bands × 4 levels = 72 level strings, plus a
 * descriptor per band/pillar pair). The shape here is the shape that file has —
 * nothing reads a hardcoded pillar name or level string outside this module, so
 * swapping the source is a data change, not a code change.
 */

/**
 * A position on the scale, not a fixed set: the district can add to Edison's
 * four. Ordered — the progression is the point, so the index is meaning, not
 * display order, and it is what a rating row stores.
 */
export type PoagLevel = number;

/**
 * Edison's own four. Seeded, not fixed, on the same terms as the six pillars: a
 * district can add a fifth and rename any of them, but the four cannot be
 * deleted — they are the scale Edison signed off and every rating already filed
 * points at one of their positions.
 */
export const seedPoagLevels: string[] = ["Learning", "Building", "Applying", "Innovating"];

/** One level of the live scale, as the store hands it to the UI. */
export type PoagScaleLevel = {
  value: PoagLevel;
  label: string;
  /** One of Edison's four, so it can be reworded but never removed. */
  seeded: boolean;
};

export type PoagBand = "Elementary" | "Middle School" | "High School";

export const POAG_BANDS: PoagBand[] = ["Elementary", "Middle School", "High School"];

/**
 * Grade → band. Edison confirmed "anything up to grade 5 in Elementary", which
 * settles the open question about grades 3–5 at James Madison Intermediate: they
 * read Elementary text despite sitting in an intermediate school, so the band
 * follows the grade and never the school.
 */
export function poagBandForGrade(grade: string): PoagBand {
  const normalized = grade.trim().toUpperCase();
  if (normalized === "K" || normalized === "KG") return "Elementary";

  const number = Number(normalized);
  if (!Number.isFinite(number)) return "Elementary";
  if (number <= 5) return "Elementary";
  if (number <= 8) return "Middle School";
  return "High School";
}

export type PoagPillar = {
  /** Skills Chart name — the only one that appears in any UI. */
  displayTitle: string;
  /** Rubric name. Joins to level text and is what a rating row stores. */
  rubricKey: string;
  /** Skills Chart definition, shown on hover in the faculty and student views. */
  hoverText: string;
  /**
   * Subjects this pillar is rated in, as `subjects.id` from System Settings.
   *
   * Empty means every subject, which is not the same as "none" — Edison's six
   * are district-wide competencies and a Maths teacher rates Resilience just as
   * a Science teacher does. A district adding "Practical Technique" would scope
   * it to Arts, and no other subject's teacher would ever see it.
   *
   * Scoping lives on the pillar rather than on the rating because it decides
   * what a teacher is *asked*; the rating itself is already per class, which is
   * what makes a student's Critical Thinking in Calculus a separate record from
   * the same pillar in Geology.
   */
  subjectIds: string[];
};

/** Empty subject list means every subject, so an unscoped pillar matches all. */
export function pillarAppliesToSubject(pillar: PoagPillar, subjectId: string): boolean {
  return pillar.subjectIds.length === 0 || pillar.subjectIds.includes(subjectId);
}

export function pillarsForSubject(pillars: PoagPillar[], subjectId: string | null): PoagPillar[] {
  if (!subjectId) return pillars;
  return pillars.filter((pillar) => pillarAppliesToSubject(pillar, subjectId));
}

/**
 * Edison's own six. Seeded, not fixed: a district can add a seventh, and the
 * live list lives in the store. These six can be reworded but not deleted —
 * they are the Portrait of a Graduate as Edison signed it off, and a rating row
 * already stores their rubric key.
 */
export const seedPoagPillars: PoagPillar[] = [
  {
    displayTitle: "Resilience",
    rubricKey: "Adaptive & Resilient",
    hoverText:
      "Takes calculated risks, reflects on challenges, and persists in the face of difficulties.",
    subjectIds: []
  },
  {
    displayTitle: "Effective Communication",
    rubricKey: "Effective Communicator",
    hoverText:
      "Listens actively, expresses ideas clearly, and adapts the message to the audience.",
    subjectIds: []
  },
  {
    displayTitle: "Engaged Community Member",
    rubricKey: "Engaged Community Member",
    hoverText: "Contributes to the community, collaborates with others, and acts with integrity.",
    subjectIds: []
  },
  {
    displayTitle: "Lifelong Learner",
    rubricKey: "Resourceful Lifelong Learner",
    hoverText:
      "Seeks out new knowledge, uses resources independently, and owns their own learning.",
    subjectIds: []
  },
  {
    displayTitle: "Emotionally Intelligent",
    rubricKey: "Emotionally Intelligent",
    hoverText:
      "Recognises their own emotions and those of others, and responds with empathy and self-control.",
    subjectIds: []
  },
  {
    displayTitle: "Critical Thinking",
    rubricKey: "Critical Thinker & Problem Solver",
    hoverText:
      "Analyses information, weighs evidence, and works through problems to a reasoned solution.",
    subjectIds: []
  }
];

export function isSeedPillar(rubricKey: string): boolean {
  return seedPoagPillars.some((pillar) => pillar.rubricKey === rubricKey);
}

/**
 * The rubric key a new pillar gets when the admin does not type one.
 *
 * Derived from the title but stored separately and never rewritten afterwards:
 * the key is what a rating row holds, so renaming "Curiosity" to "Curious
 * Enquirer" a term later has to leave every rating already filed against it
 * pointing at the same pillar.
 */
export function poagRubricKeyFrom(title: string): string {
  return title.trim().replace(/\s+/g, " ");
}

/** One (band, pillar) pair: the band summary plus its level definitions. */
export type PoagBandContent = {
  /** One-line grade-band summary, shown at the top of an expanded row. */
  descriptor: string;
  /**
   * Indexed by PoagLevel, in scale order. Not fixed at four: a level added
   * after this was written has no entry here, which is exactly what the "levels
   * written" count reports until someone writes it. The store pads on read, so
   * nothing downstream has to deal with the gap.
   */
  levels: string[];
};

/** Keyed `${band}|${rubricKey}`. */
export type PoagContentMap = Record<string, PoagBandContent>;

export function poagContentKey(band: PoagBand, rubricKey: string): string {
  return `${band}|${rubricKey}`;
}

/**
 * Written in the Rubric's observational voice and pitched at each band, so an
 * elementary child and a senior read language written for them from the same six
 * pillars. Placeholder wording until POAG_Content_Master.xlsx is loaded — the
 * admin can revise any of it in place, which is the whole point of holding it in
 * a content table.
 */
export const seedPoagContent: PoagContentMap = {
  // ── Resilience ─────────────────────────────────────────────────────────────
  "Elementary|Adaptive & Resilient": {
    descriptor: "Keeping going when something is hard, and asking for help in the right way.",
    levels: [
      "Gives up quickly when a task feels hard and needs an adult to restart them.",
      "Keeps trying with encouragement, and can name one thing that went wrong.",
      "Tries a different approach on their own before asking for help.",
      "Takes on hard tasks by choice and helps classmates keep going."
    ]
  },
  "Middle School|Adaptive & Resilient": {
    descriptor: "Recovering from setbacks and changing approach rather than giving up.",
    levels: [
      "Avoids tasks that look difficult and disengages after a setback.",
      "Recovers from setbacks with prompting and can describe what they would change.",
      "Chooses a new strategy after a setback without being prompted.",
      "Seeks out challenging work, reflects on failure openly, and supports peers through it."
    ]
  },
  "High School|Adaptive & Resilient": {
    descriptor: "Taking calculated risks and persisting through difficulty with deliberate reflection.",
    levels: [
      "Struggles to recover from setbacks and may give up easily when faced with challenges.",
      "Recovers from setbacks with support and is beginning to reflect on what went wrong.",
      "Persists independently through difficulty and adjusts their approach based on reflection.",
      "Seeks out calculated risks, treats failure as information, and models persistence for others."
    ]
  },

  // ── Effective Communication ────────────────────────────────────────────────
  "Elementary|Effective Communicator": {
    descriptor: "Speaking and listening clearly with classmates and adults.",
    levels: [
      "Speaks rarely in group settings and finds it hard to follow spoken instructions.",
      "Shares ideas when invited and listens to a classmate without interrupting.",
      "Explains their thinking so others understand, and asks questions when they do not.",
      "Leads a discussion, draws quieter classmates in, and checks that everyone has followed."
    ]
  },
  "Middle School|Effective Communicator": {
    descriptor: "Explaining thinking clearly, and listening to understand rather than to reply.",
    levels: [
      "Gives very short answers and struggles to hold a listener's attention.",
      "Explains ideas clearly with prompting and mostly listens without interrupting.",
      "Organises what they say for the listener and responds to what others have said.",
      "Adjusts tone and detail for different audiences and helps others make their point."
    ]
  },
  "High School|Effective Communicator": {
    descriptor: "Adapting message, medium and tone to the audience and the purpose.",
    levels: [
      "Communicates unclearly or infrequently, and rarely adapts to the listener.",
      "Expresses ideas clearly in familiar formats and is beginning to read the audience.",
      "Chooses register, medium and evidence to suit the audience and purpose.",
      "Communicates persuasively to unfamiliar audiences and coaches peers to do the same."
    ]
  },

  // ── Engaged Community Member ───────────────────────────────────────────────
  "Elementary|Engaged Community Member": {
    descriptor: "Taking part in the class community and treating others fairly.",
    levels: [
      "Works alongside others but rarely joins in shared tasks.",
      "Takes part in group work when given a role.",
      "Volunteers for classroom jobs and looks out for classmates.",
      "Notices what the class needs and organises others to help."
    ]
  },
  "Middle School|Engaged Community Member": {
    descriptor: "Contributing to the group and taking responsibility for shared work.",
    levels: [
      "Stays on the edge of group work and leaves shared tasks to others.",
      "Does their share of group work when the task is clearly divided.",
      "Takes responsibility for the group's outcome, not only their own part.",
      "Initiates service beyond the classroom and brings others with them."
    ]
  },
  "High School|Engaged Community Member": {
    descriptor: "Acting with integrity and contributing beyond what is asked.",
    levels: [
      "Participates minimally and rarely contributes beyond individual work.",
      "Contributes reliably to group work and meets shared commitments.",
      "Takes ownership of collective outcomes and acts with integrity under pressure.",
      "Leads community initiatives and holds a shared standard that others follow."
    ]
  },

  // ── Lifelong Learner ───────────────────────────────────────────────────────
  "Elementary|Resourceful Lifelong Learner": {
    descriptor: "Being curious, and finding things out without being told to.",
    levels: [
      "Waits to be told what to do and rarely asks about new things.",
      "Asks questions about new topics and uses a resource when pointed to it.",
      "Looks things up on their own and tries new methods without being asked.",
      "Sets their own goals for learning and shares what they find with the class."
    ]
  },
  "Middle School|Resourceful Lifelong Learner": {
    descriptor: "Using resources independently and owning their own progress.",
    levels: [
      "Depends on step-by-step direction and does not seek out resources.",
      "Uses given resources well and asks for help at the right time.",
      "Finds and evaluates resources independently to close their own gaps.",
      "Plans their own learning, tracks progress, and teaches what they have learned."
    ]
  },
  "High School|Resourceful Lifelong Learner": {
    descriptor: "Directing their own learning and seeking out what they do not yet know.",
    levels: [
      "Relies on instruction and rarely pursues learning beyond what is assigned.",
      "Uses available resources purposefully and responds to feedback.",
      "Identifies gaps in their own knowledge and closes them without prompting.",
      "Designs their own learning path, seeks expert input, and mentors others through it."
    ]
  },

  // ── Emotionally Intelligent ────────────────────────────────────────────────
  "Elementary|Emotionally Intelligent": {
    descriptor: "Naming feelings, and being kind when someone else is upset.",
    levels: [
      "Finds it hard to name feelings and reacts strongly when upset.",
      "Names how they feel and calms down with adult support.",
      "Notices when a classmate is upset and responds kindly.",
      "Helps others settle disagreements and puts words to what they are feeling."
    ]
  },
  "Middle School|Emotionally Intelligent": {
    descriptor: "Managing their own reactions and reading how others are feeling.",
    levels: [
      "Reacts before thinking and misses how their behaviour lands on others.",
      "Recognises their own triggers and recovers with support.",
      "Manages their reaction in the moment and adjusts to how others are feeling.",
      "Defuses tension for the group and gives feedback others can hear."
    ]
  },
  "High School|Emotionally Intelligent": {
    descriptor: "Regulating emotion under pressure and responding to others with empathy.",
    levels: [
      "Struggles to regulate reactions and rarely reads the emotional context.",
      "Recognises their own emotional patterns and is beginning to manage them.",
      "Regulates under pressure and responds to others with genuine empathy.",
      "Reads group dynamics accurately and creates conditions where others feel safe."
    ]
  },

  // ── Critical Thinking ──────────────────────────────────────────────────────
  "Elementary|Critical Thinker & Problem Solver": {
    descriptor: "Asking why, and giving a reason for an answer.",
    levels: [
      "Gives an answer without a reason and struggles to explain their thinking.",
      "Gives a reason for their answer when asked.",
      "Compares two ideas and explains which they think is better, and why.",
      "Asks questions that open up a problem, and tests their own answer."
    ]
  },
  "Middle School|Critical Thinker & Problem Solver": {
    descriptor: "Weighing evidence and explaining the thinking behind a conclusion.",
    levels: [
      "Accepts the first answer and does not check it.",
      "Explains their reasoning and can spot an obvious flaw when it is pointed out.",
      "Weighs evidence, considers alternatives, and justifies a conclusion.",
      "Frames the problem itself, tests assumptions, and revises when the evidence changes."
    ]
  },
  "High School|Critical Thinker & Problem Solver": {
    descriptor: "Analysing complex problems and reasoning to a defensible solution.",
    levels: [
      "Accepts information at face value and rarely evaluates alternatives.",
      "Analyses a problem with structure and supports conclusions with evidence.",
      "Weighs competing evidence, tests assumptions, and reasons to a defensible solution.",
      "Reframes ambiguous problems, seeks disconfirming evidence, and defends conclusions under challenge."
    ]
  }
};
