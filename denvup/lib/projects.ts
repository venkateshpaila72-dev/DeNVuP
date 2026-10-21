export type Project = {
  title: string;
  type: string;
  bg: string; // card background, shown behind the image while it loads (or if there is no image)
  image?: string; // e.g. "/projects/site-one.jpg" (put the image in public/projects)
  url?: string; // link to the live project
  placeholder?: boolean; // shows a "Placeholder" tag. Remove it when the project is real.
};

// PLACEHOLDERS: the images below are random sample photos from picsum.photos (needs internet).
// Replace each one with your real project image (for example "/projects/my-site.jpg").
export const projects: Project[] = [
  {
    title: "Project One",
    type: "Web Development",
    bg: "linear-gradient(135deg,#FF4B1F 0%,#3a1209 90%)",
    image: "https://picsum.photos/seed/denvup-one/900/920",
    placeholder: true,
  },
  {
    title: "Project Two",
    type: "UI/UX Design",
    bg: "linear-gradient(135deg,#F47B20 0%,#1a0f08 90%)",
    image: "https://picsum.photos/seed/denvup-two/900/920",
    placeholder: true,
  },
  {
    title: "Project Three",
    type: "Branding",
    bg: "linear-gradient(135deg,#B9A98F 0%,#292522 90%)",
    image: "https://picsum.photos/seed/denvup-three/900/920",
    placeholder: true,
  },
  {
    title: "Project Four",
    type: "AI Solutions",
    bg: "linear-gradient(135deg,#FFB020 0%,#F47B20 40%,#4a1608 100%)",
    image: "https://picsum.photos/seed/denvup-four/900/920",
    placeholder: true,
  },
  {
    title: "Project Five",
    type: "Web Development",
    bg: "linear-gradient(135deg,#4a3f38 0%,#111111 75%)",
    image: "https://picsum.photos/seed/denvup-five/900/920",
    placeholder: true,
  },
];