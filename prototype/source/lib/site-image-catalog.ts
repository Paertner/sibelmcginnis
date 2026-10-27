export type ImageSlot = {
  id: string;
  group: string;
  label: string;
  src: string;
  alt: string;
  position: string;
  altCopyId?: string;
  postId?: string;
  logo?: boolean;
};
export const siteImageCatalog: ImageSlot[] = [
  {
    id: "shared.logo",
    group: "Header & footer",
    label: "Brand icon",
    src: "/images/brand-cup.svg",
    alt: "",
    position: "center",
    logo: true,
  },
  {
    id: "home.hero",
    group: "Homepage",
    label: "Hero portrait",
    src: "/images/sibel-about-1.webp",
    alt: "Sibel McGinnis",
    position: "center 18%",
  },
  {
    id: "home.program-circle",
    group: "Homepage",
    label: "Programs · Morning Coffee Circle",
    src: "/images/womens-e1767706912925.webp",
    alt: "",
    position: "center",
  },
  {
    id: "home.program-coaching",
    group: "Homepage",
    label: "Programs · One-on-One Coaching",
    src: "/images/hero2-1-2.webp",
    alt: "",
    position: "center",
  },
  {
    id: "home.program-podcast",
    group: "Homepage",
    label: "Programs · The Podcast",
    src: "/images/sibel-about-1.webp",
    alt: "",
    position: "center 20%",
  },
  {
    id: "home.reflection",
    group: "Homepage",
    label: "About the community · portrait",
    src: "/images/sibel-about-1.webp",
    alt: "Sibel McGinnis",
    position: "center",
  },
  {
    id: "home.feature-conversations",
    group: "Homepage",
    label: "Features · Guided, Gentle Conversations",
    src: "/images/womens-e1767706912925.webp",
    alt: "",
    position: "center",
  },
  {
    id: "home.feature-catchup",
    group: "Homepage",
    label: "Features · Catch Up Anytime",
    src: "/images/hero2-1-2.webp",
    alt: "",
    position: "center",
  },
  {
    id: "home.feature-support",
    group: "Homepage",
    label: "Features · Support That Lasts",
    src: "/images/sibel-about-1.webp",
    alt: "",
    position: "center",
  },
  {
    id: "home.join",
    group: "Homepage",
    label: "Join the community · banner",
    src: "/images/womens-e1767706912925.webp",
    alt: "",
    position: "center 25%",
  },
  {
    id: "about.portrait",
    group: "Meet Sibel",
    label: "Sibel’s portrait",
    src: "/images/sibel-about-1.webp",
    alt: "Sibel McGinnis",
    altCopyId: "about.sibel-mcginnis",
    position: "center",
  },
  {
    id: "community.gathering",
    group: "Community & membership",
    label: "Community gathering",
    src: "/images/womens-e1767706912925.webp",
    alt: "Morning Coffee gathering",
    altCopyId: "morning-coffee.morning-coffee-gathering",
    position: "center",
  },
  {
    id: "blog.cover-0",
    group: "Blog cover styles",
    label: "Community cover",
    src: "/images/womens-e1767706912925.webp",
    alt: "",
    position: "center",
  },
  {
    id: "blog.cover-1",
    group: "Blog cover styles",
    label: "Coaching cover",
    src: "/images/hero2-1-2.webp",
    alt: "",
    position: "center",
  },
  {
    id: "blog.cover-2",
    group: "Blog cover styles",
    label: "Sibel cover",
    src: "/images/sibel-about-1.webp",
    alt: "",
    position: "center",
  },
];
