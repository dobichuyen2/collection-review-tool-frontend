export const MOCK = {
  source: {
    title: "The Capital Gazette",
    homepage: "capitalgazette.com",
    language: "English",
    country: "United States",
    state: "Maryland",
    priorComment: {
      text: "Looks like a local outlet, but a lot of the recent articles are syndicated wire copy. Flagging for a second look before we keep it.",
      when: "left 2 days ago",
    },
  },
  project: {
    name: "Climate Reporting · US East Coast",
    guid: "proj_8fa221",
    progress: 0.62,
    seed: ["US Top Online (2024)", "Maryland Local", "Delaware Local", "Virginia Local", "DC Metro"],
    totals: { reviewed: 1240, kept: 812, removed: 318, added: 47, skipped: 63, undecided: 760 },
    queues: [
      { id: "Queue #1", url: "https://reviews.mediacloud.org/review-projects/proj_8fa221/queues/a4b1f937-2c1d-46e2-b8a1-1f9c6e937201", total: 200, kept: 76, removed: 35, added: 3, skipped: 10, undecided: 76, done: 124 },
      { id: "Queue #2", url: "https://reviews.mediacloud.org/review-projects/proj_8fa221/queues/c8d2a043-9b66-4c4a-8e21-7d05b1227e7c", total: 180, kept: 52, removed: 28, added: 1, skipped: 7,  undecided: 92, done: 88 },
      { id: "Queue #3", url: "https://reviews.mediacloud.org/review-projects/proj_8fa221/queues/e6f3b119-04a3-4f78-9b29-2a5f8d0aa110", total: 165, kept: 110, removed: 42, added: 5, skipped: 8, undecided: 0, done: 165 },
      { id: "Queue #4", url: "https://reviews.mediacloud.org/review-projects/proj_8fa221/queues/b7c4f225-32d8-4e91-a5b0-6e1a9cd44508", total: 190, kept: 0,  removed: 0,  added: 0, skipped: 0, undecided: 190, done: 0 },
    ],
  },
  allProjects: [
    { n: "Climate Reporting · US East Coast", seeds: 5, queues: 4, p: 0.62 },
    { n: "Spanish-language outlets · LATAM",  seeds: 8, queues: 6, p: 0.34 },
    { n: "Public broadcasters · EU",          seeds: 4, queues: 3, p: 0.91 },
    { n: "AI-generated content sweep",        seeds: 3, queues: 2, p: 0.18 },
  ],
  inProgress: [
    { n: "Top Online · Brazil 2025",   id: "38219100", p: 0.41 },
    { n: "Public broadcasters · EU",   id: "19204455", p: 0.89 },
    { n: "Local independents · UK",    id: "21887301", p: 0.18 },
  ],
  completed: [
    { n: "German weeklies · 2024",   when: "closed Apr 12" },
    { n: "Top Online · Brazil 2024", when: "closed Mar 03" },
    { n: "Nordic news ecosystem",    when: "closed Feb 18" },
  ],
};
