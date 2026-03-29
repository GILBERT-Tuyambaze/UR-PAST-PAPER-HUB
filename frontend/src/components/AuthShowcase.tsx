import { useEffect, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import BrandMark from '@/components/BrandMark';
import { BookOpen, Clock3, ShieldCheck, Sparkles, UploadCloud } from 'lucide-react';

type AuthSlide = {
  title: string;
  description: string;
  image: string;
  accent: string;
  chips: string[];
};

const SLIDES: AuthSlide[] = [
  {
    title: 'Study smarter with trusted past papers',
    description:
      'Browse organized papers, verified uploads, and discussion threads that help you revise with confidence.',
    image: '/hero-study.svg',
    accent: 'from-[#F08A5D] via-[#ffb48f] to-[#f6d365]',
    chips: ['Verified papers', 'Fast search', 'Course-based'],
  },
  {
    title: 'Share resources with your class community',
    description:
      'Upload exams, CATs, assignments, and model solutions so your classmates can build on real course materials.',
    image: '/collaboration-scene.svg',
    accent: 'from-[#1f6feb] via-[#5ea0ff] to-[#8ed1fc]',
    chips: ['Uploads', 'Solutions', 'Collaboration'],
  },
  {
    title: 'Keep your academic history in one place',
    description:
      'Track your contributions, manage downloads, and return to the resources you need throughout the semester.',
    image: '/upload-placeholder.svg',
    accent: 'from-[#0f766e] via-[#14b8a6] to-[#6ee7b7]',
    chips: ['Dashboard', 'Contribution log', 'Anywhere access'],
  },
];

const ICONS = [BookOpen, UploadCloud, ShieldCheck];

export default function AuthShowcase() {
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    const root = document.documentElement;
    const storedTheme = localStorage.getItem('ur-theme');
    const isDark =
      storedTheme != null ? storedTheme === 'dark' : window.matchMedia('(prefers-color-scheme: dark)').matches;

    root.classList.toggle('dark', isDark);

    return () => {
      const currentTheme = localStorage.getItem('ur-theme');
      const stillDark =
        currentTheme != null
          ? currentTheme === 'dark'
          : window.matchMedia('(prefers-color-scheme: dark)').matches;
      root.classList.toggle('dark', stillDark);
    };
  }, []);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setActiveIndex((current) => (current + 1) % SLIDES.length);
    }, 4200);

    return () => window.clearInterval(timer);
  }, []);

  const activeSlide = SLIDES[activeIndex];
  const ActiveIcon = ICONS[activeIndex] ?? BookOpen;

  return (
    <div className="relative overflow-hidden rounded-[2rem] border border-slate-200/80 bg-white/70 p-6 shadow-2xl backdrop-blur dark:border-white/10 dark:bg-[#111827]/75 md:p-8">
      <div
        className={`absolute inset-x-0 top-0 h-40 bg-gradient-to-br ${activeSlide.accent} opacity-90 transition-all duration-700`}
      />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(255,255,255,0.55),_transparent_45%)]" />

      <div className="relative z-10">
        <div className="mb-5 flex items-center justify-between gap-3">
          <Badge className="border-0 bg-white/80 px-3 py-1 text-slate-700 hover:bg-white/80 dark:bg-white/10 dark:text-white dark:hover:bg-white/10">
            <Sparkles className="mr-2 h-3.5 w-3.5" />
            Student Access
          </Badge>
          <div className="flex items-center gap-2 text-xs font-medium text-white/90">
            <Clock3 className="h-4 w-4" />
            Auto slides on
          </div>
        </div>

        <div className="mb-6 flex items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-950/85 text-white shadow-lg">
            <ActiveIcon className="h-7 w-7" />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-600 dark:text-white/60">UR Resource Hub</p>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white md:text-3xl">{activeSlide.title}</h2>
          </div>
        </div>

        <p className="max-w-xl text-sm leading-6 text-slate-700 dark:text-white/75 md:text-base">{activeSlide.description}</p>

        <div className="mt-5 flex flex-wrap gap-2">
          {activeSlide.chips.map((chip) => (
            <span
              key={chip}
              className="rounded-full border border-slate-200 bg-white/80 px-3 py-1 text-xs font-medium text-slate-700 dark:border-white/10 dark:bg-white/10 dark:text-white/80"
            >
              {chip}
            </span>
          ))}
        </div>

        <div className="mt-8 overflow-hidden rounded-[1.5rem] border border-white/70 bg-white/80 p-4 shadow-lg dark:border-white/10 dark:bg-[#0f172a]/80">
          <div className="grid gap-4 md:grid-cols-[1.15fr_0.85fr] md:items-center">
            <img
              src={activeSlide.image}
              alt={activeSlide.title}
              className="h-56 w-full rounded-[1.2rem] object-cover md:h-72"
            />

            <div className="space-y-4 rounded-[1.2rem] bg-slate-950 p-5 text-white">
              <div className="flex items-center gap-3">
                <BrandMark imageClassName="h-8 w-8" />
                <p className="text-sm font-semibold">Built for University of Rwanda students</p>
              </div>
              <p className="text-sm leading-6 text-white/75">
                Sign in once to unlock uploads, dashboards, moderation tools, and the discussion space around each
                paper.
              </p>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
                  <p className="text-xl font-semibold">24/7</p>
                  <p className="text-white/65">paper access</p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
                  <p className="text-xl font-semibold">1 place</p>
                  <p className="text-white/65">for your resources</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-5 flex items-center gap-2">
          {SLIDES.map((slide, index) => (
            <button
              key={slide.title}
              type="button"
              aria-label={`Show slide ${index + 1}`}
              onClick={() => setActiveIndex(index)}
              className={`h-2.5 rounded-full transition-all ${
                index === activeIndex ? 'w-10 bg-slate-900 dark:bg-white' : 'w-2.5 bg-slate-300 dark:bg-white/30'
              }`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
