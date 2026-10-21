export type TeamMember = {
  name: string;
  role: string;
  bio: string;
  skills?: string[]; // e.g. ["React", "Next.js", "UI Design"]
  photo?: string; // e.g. "/team/venky.jpg" (put the image in the public/team folder)
  portfolioUrl?: string; // their portfolio website
  github?: string; // only add if you have the real link
  linkedin?: string; // only add if you have the real link
  website?: string; // any other personal site
};

// Used for links such as /team#team-member-1
export const slugOf = (name: string) =>
  name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

// PLACEHOLDERS: replace with your real team members (the home page shows the first four).
// Leave a link empty until you have the real URL; it simply won't be shown.
export const team: TeamMember[] = [
  {
    name: "Team Member 1",
    role: "Role / Specialization",
    bio: "Add a short introduction for this team member here.",
    skills: [],
    photo: "",
    portfolioUrl: "",
  },
  {
    name: "Team Member 2",
    role: "Role / Specialization",
    bio: "Add a short introduction for this team member here.",
    skills: [],
    photo: "",
    portfolioUrl: "",
  },
  {
    name: "Team Member 3",
    role: "Role / Specialization",
    bio: "Add a short introduction for this team member here.",
    skills: [],
    photo: "",
    portfolioUrl: "",
  },
  {
    name: "Team Member 4",
    role: "Role / Specialization",
    bio: "Add a short introduction for this team member here.",
    skills: [],
    photo: "",
    portfolioUrl: "",
  },
];