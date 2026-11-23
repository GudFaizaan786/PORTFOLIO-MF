// All portfolio data lives in this single file for easy editing.
// Fields marked `// TODO: edit` contain concise placeholder copy inferred from your project titles.

export interface QuoteItem {
  id: string;
  section: string;
  topic: string;
  text: string;
  source?: string;
}

export interface ProjectItem {
  id: string;
  slug: string;
  title: string;
  year: string;
  category: string;
  tags: string[];
  role: string;
  summary: string;
  description: string[];
  coverImageUrl: string | null;
  galleryUrls: string[];
  liveLink: string;
  accentColor: string;
}

export interface SkillCardItem {
  id: string;
  title: string;
  level: string;
  summary: string;
  tools: string[];
}

export interface JourneyItem {
  id: string;
  principle: string;
  title: string;
  detail: string;
}

export interface SocialLinkItem {
  label: string;
  handle: string;
  href: string;
}

export interface SectionAnchor {
  id: "hero" | "about" | "projects" | "skills" | "journey" | "contact";
  index: string;
  label: string;
}

export const PORTFOLIO_CONTENT = {
  identity: {
    name: "Mohammed Faizaan",
    alias: "Rangreza",
    wordmark: "FAIZAAN",
    role: "Developer and Founder",
    location: "Jodhpur, Rajasthan, India",
    availability: "Available for freelance and collaboration, Jan 2027",
    tagline: "Be imaginative at every moment of life.",
    // Local portrait image rendered as an interactive 3D holographic relief
    portraitUrl: "/assets/aistudio/Gemini_Generated_Image_vfnnsbvfnnsbvfnn_a909947f.png",
  },

  heroMorphingWords: [
    "Get Educated",
    "Build Environment Clean",
    "Stable Economics",
    "Become Employable",
    "Enjoy The Ecosystem",
  ],

  bio: {
    short:
      "I'm Faizaan, also known as Rangreza, an undergrad and a founding member of Origins.",
    longParagraphs: [
      "I'm a man of simple thinking, walking the paths of my guides in this world: my elder brother and Prophet Muhammad (peace be upon him). I carry leadership with quiet responsibility and a cool mindset rooted in earthliness and humanity.",
      "Humanity above all is my motto. Through both work and everyday life, I strive to live by sabr (patience) and shukr (gratitude), grounded by my daily salah. As an undergrad builder and founding member of Origins, I want technology to serve people with honesty and care.",
    ],
    philosophy:
      "I'm secular and a lover of peace. I love planting more than anything, I'm a robotics enthusiast with new ideas arriving every hour, and a story writer who savors every moment — because life happens only once.",
    stats: [
      { label: "Projects Shipped", value: 4, suffix: "+" },
      { label: "Core Languages", value: 4, suffix: "" },
      { label: "Years Building", value: 3, suffix: "+" },
      { label: "Ideas Per Hour", value: 24, suffix: "/d" },
    ],
    skills: [
      "C programming",
      "Python development",
      "Web development",
      "Learning entrepreneurship",
      "Vibe coding",
      "Prompt engineering",
      "Writing",
    ],
    tools: [
      "VS Code",
      "Git / GitHub",
      "Python",
      "C",
      "React",
      "Google AI Studio",
      "Cloudinary",
    ],
  },

  projects: [
    {
      id: "mbmosc",
      slug: "open-source-platform-mbmosc",
      title: "Open Source Platform (MBMOSC)",
      year: "2025",
      // TODO: edit category, role, summary, and description
      category: "Open Source · Web Platform",
      tags: ["Open Source", "Web Development", "Community", "2025"],
      role: "Founding Contributor & Web Developer",
      summary:
        "A collaborative open-source community platform helping student engineers share repositories, document work, and build together.",
      description: [
        "MBMOSC connects student developers around real open-source repositories rather than isolated coursework. Contributors explore issues, submit pull requests, and learn collaborative engineering workflows.",
        "Built with clean editorial structure and fast loading performance so onboarding feels inviting for first-time contributors.",
      ],
      coverImageUrl:
        "https://res.cloudinary.com/dtz0urit6/image/upload/q_auto:best,f_jpg/cloudinary-tools-uploads/lyot23taevbjehgylitm",
      galleryUrls: [],
      liveLink: "",
      accentColor: "#E8D9A8", // neon beige-gold
    },
    {
      id: "restaurant-python",
      slug: "python-restaurant-management-system",
      title: "Python: Restaurant Management System",
      year: "2026",
      // TODO: edit category, role, summary, and description
      category: "Python · Operations System",
      tags: ["Python", "Order Routing", "Billing", "2026"],
      role: "Python Developer",
      summary:
        "A structured Python dining operations suite managing table orders, menu inventory, and accurate itemized billing.",
      description: [
        "Streamlines daily dining workflows by linking table order tickets directly to menu catalogs, tax logic, and shift revenue summaries.",
        "Engineered with modular Python functions and input validation to prevent calculation errors during peak service.",
      ],
      coverImageUrl:
        "https://res.cloudinary.com/dtz0urit6/image/upload/q_auto:best,f_jpg/cloudinary-tools-uploads/l4iee5bfcv9s2nxiracb",
      galleryUrls: [],
      liveLink: "",
      accentColor: "#F4FF3A", // neon yellow
    },
    {
      id: "banking-c",
      slug: "c-programming-banking-management-system",
      title: "C Programming: Banking Management System",
      year: "2025",
      // TODO: edit category, role, summary, and description
      category: "C Systems · Ledger Core",
      tags: ["C Programming", "Binary File I/O", "Ledger", "2025"],
      role: "Systems Programmer",
      summary:
        "A deterministic banking management engine written in pure C with persistent binary record storage and transaction checks.",
      description: [
        "Implements account creation, deposits, withdrawals, balance queries, and record updates using pure C structs and standard file streams.",
        "Designed from first principles to strengthen mastery of pointers, memory layout, and atomic state verification.",
      ],
      coverImageUrl: "https://cdn.corenexis.com/f/vtqXK6oV.png",
      galleryUrls: [],
      liveLink: "",
      accentColor: "#39FF14", // neon green
    },
    {
      id: "meridian-travel",
      slug: "meridian-travel-landing-page",
      title: "Meridian Travel Landing Page Website",
      year: "2026",
      // TODO: edit category, role, summary, and description
      category: "Web Design · Frontend",
      tags: ["Web Development", "Responsive UI", "Editorial", "2026"],
      role: "Web Developer",
      summary:
        "An atmospheric travel landing page blending crisp typographic hierarchy with curated itinerary storytelling.",
      description: [
        "Created to evoke calm anticipation for journeys around the globe, pairing balanced layout rhythm with responsive mobile ergonomics.",
        "Focused on clean semantic HTML, smooth interaction states, and visual clarity.",
      ],
      coverImageUrl: null,
      galleryUrls: [],
      liveLink: "",
      accentColor: "#38C8FF", // sky blue
    },
  ] as ProjectItem[],

  skillsAndServices: [
    {
      id: "c-systems",
      title: "C Systems Engineering",
      level: "Foundational Core",
      summary:
        "Memory-aware data structures, binary file persistence, and dependable command-line engines written from scratch.",
      tools: ["C", "GCC", "VS Code"],
    },
    {
      id: "python-ops",
      title: "Python Development",
      level: "Automation & Logic",
      summary:
        "Modular operational systems, management tools, rapid scripting, and structured data workflows.",
      tools: ["Python", "CLI Tooling", "Git"],
    },
    {
      id: "web-dev",
      title: "Web Development",
      level: "Interactive Craft",
      summary:
        "Modern React & TypeScript interfaces, responsive layouts, 3D WebGL scenes, and thoughtful motion design.",
      tools: ["React", "TypeScript", "Tailwind CSS"],
    },
    {
      id: "prompt-vibe",
      title: "Prompt Engineering & Vibe Coding",
      level: "AI-Accelerated Craft",
      summary:
        "Translating fresh hourly concepts into working prototypes with structured prompting and creative iteration.",
      tools: ["Google AI Studio", "Prompt Systems", "Cloudinary"],
    },
    {
      id: "entrepreneurship",
      title: "Origins & Storytelling",
      level: "Leadership & Narrative",
      summary:
        "Building community initiatives, writing human stories, and approaching engineering with patience and purpose.",
      tools: ["Origins", "Writing", "Community"],
    },
  ] as SkillCardItem[],

  journeyValues: [
    {
      id: "patience",
      principle: "01 · Sabr (Patience)",
      title: "Steady progress over noise",
      detail:
        "Every complex system — from C file ledgers to communities like Origins — grows brick by brick with patience.",
    },
    {
      id: "gratitude",
      principle: "02 · Shukr (Gratitude)",
      title: "Grounded by daily Salah",
      detail:
        "Gratitude keeps ego small and curiosity sharp, turning every bug solved and milestone reached into humility.",
    },
    {
      id: "humanity",
      principle: "03 · Humanity Above All",
      title: "Peace, earthliness & service",
      detail:
        "Technology only matters when it uplifts people kindly, fairly, and without excluding anyone.",
    },
    {
      id: "planting",
      principle: "04 · Planting & Environment",
      title: "Tending to living ecosystems",
      detail:
        "I love planting more than anything. Caring for saplings reminds me that the best work outlives us quietly.",
    },
    {
      id: "robotics",
      principle: "05 · Robotics & Hourly Ideas",
      title: "Restless kinetic curiosity",
      detail:
        "New robotics and software ideas arrive every hour — sketching mechanisms that bridge physical and digital worlds.",
    },
    {
      id: "storytelling",
      principle: "06 · Story Writing",
      title: "Savoring every moment",
      detail:
        "Life happens only once; writing stories preserves the wonder, humor, and meaning inside ordinary days.",
    },
  ] as JourneyItem[],

  // Exact quotes & attributions (never altered or embellished)
  quotes: {
    enter: {
      id: "enter",
      section: "Enter",
      topic: "on learning",
      text: "Read in the name of your Lord who created... Who taught by the pen, taught man that which he knew not.",
      source: "Quote on learning",
    },
    hero: {
      id: "hero",
      section: "Hero",
      topic: "on humanity",
      text: "O mankind, We created you from male and female and made you peoples and tribes that you may know one another.",
      source: "Quote on humanity",
    },
    about: {
      id: "about",
      section: "About",
      topic: "on service",
      text: "The best of people are those who are most beneficial to people.",
      source: "Quote on service",
    },
    projects: {
      id: "projects",
      section: "Projects",
      topic: "on excellence",
      text: "Indeed, God loves that when one of you does a task, he does it with excellence.",
      source: "Quote on excellence",
    },
    skills: {
      id: "skills",
      section: "Skills",
      topic: "on knowledge",
      text: "My Lord, increase me in knowledge.",
      source: "Quote on knowledge",
    },
    journey: {
      id: "journey",
      section: "Journey/Values",
      topic: "on justice",
      text: "And establish weight in justice and do not make deficient the balance.",
      source: "Quote on justice",
    },
    environment: {
      id: "environment",
      section: "Environment",
      topic: "on environment",
      text: "Corruption has appeared on land and sea because of what the hands of people have earned...",
      source: "Quote on environment",
    },
    planting: {
      id: "planting",
      section: "Planting",
      topic: "on planting",
      text: "If the Hour is established while one of you has a sapling in his hand, let him plant it.",
      source: "Hadith, Musnad Ahmad",
    },
    contact: {
      id: "contact",
      section: "Contact",
      topic: "on compassion",
      text: "None of you truly believes until he loves for his brother what he loves for himself.",
      source: "Quote on compassion",
    },
    footer: {
      id: "footer",
      section: "Footer",
      topic: "on life",
      text: "Whoever saves one life, it is as if he saved all of mankind.",
      source: "Quote on life",
    },
  } as Record<string, QuoteItem>,

  contact: {
    cta: "Let's build something meaningful",
    email: "peoplesplanetscience687@gmail.com",
    socials: [
      {
        label: "LinkedIn",
        handle: "mohammed-faizaan",
        href: "https://www.linkedin.com/in/mohammed-faizaan-95a3b3286/",
      },
      {
        label: "GitHub",
        handle: "@GudFaizaan786",
        href: "https://github.com/GudFaizaan786",
      },
      {
        label: "YouTube",
        handle: "Guddu Ka Jahan",
        href: "https://youtube.com/@guddukajahan786?si=yC0-32FZDpgX69wh",
      },
      {
        label: "Instagram",
        handle: "Visual Journal",
        href: "https://www.instagram.com/p/Df7FFNhClSw/?img_index=2&lqvp=YnJuY3gyZjVwa2tj",
      },
    ].filter((s) => Boolean(s.href)) as SocialLinkItem[],
  },

  sections: [
    { id: "hero", index: "01", label: "Hero" },
    { id: "about", index: "02", label: "About" },
    { id: "projects", index: "03", label: "Projects" },
    { id: "skills", index: "04", label: "Skills" },
    { id: "journey", index: "05", label: "Values" },
    { id: "contact", index: "06", label: "Contact" },
  ] as SectionAnchor[],
};
