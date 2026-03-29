import BrandMark from '@/components/BrandMark';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Lightbulb, ShieldCheck, Search, Users, ExternalLink } from 'lucide-react';

const pillars = [
  {
    title: 'The problem we saw',
    description:
      'UR students often depend on scattered class groups and informal sharing to find past papers, assignments, and worked solutions. Valuable material disappears, quality is uneven, and preparation becomes harder than it should be.',
  },
  {
    title: 'The system we wanted',
    description:
      'A structured academic hub where content is organized by college, department, course, and year, while still keeping the energy of a student community through uploads, discussion, and shared solutions.',
  },
  {
    title: 'The promise we care about',
    description:
      'Reliable access, better revision, and a digital academic archive that can serve both current students and future generations at the University of Rwanda.',
  },
];

const features = [
  'Centralized repository of past papers and solutions',
  'Role-based moderation with admin, content manager, CP, lecturer, and contributor paths',
  'Verification layers for official, community-trusted, and unverified content',
  'Discussion and collaborative learning around each paper',
  'Fast search by course code, name, lecturer, year, and type',
  'Mobile-first access with progressive enhancement and offline support',
];

export default function StoryPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
      <section className="theme-panel overflow-hidden rounded-[2rem] border">
        <div className="grid gap-8 p-8 lg:grid-cols-[1.05fr_0.95fr] lg:p-10">
          <div>
            <Badge className="mb-4 bg-[#F08A5D]/10 text-[#F08A5D] hover:bg-[#F08A5D]/10">Story Behind This Website</Badge>
            <h1 className="text-4xl font-bold text-foreground">UR Academic Resource Hub began with a simple need: stop losing useful academic material.</h1>
            <p className="mt-5 max-w-2xl text-base leading-7 text-muted-foreground">
              This platform was designed for University of Rwanda students who needed a dependable place to find past papers, revise with confidence, and contribute resources that stay useful over time.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Badge variant="outline">Centralized access</Badge>
              <Badge variant="outline">Community verification</Badge>
              <Badge variant="outline">Structured organization</Badge>
              <Badge variant="outline">Long-term academic archive</Badge>
            </div>
          </div>

          <div className="rounded-[1.6rem] border border-border/70 bg-muted/40 p-6">
            <BrandMark label imageClassName="h-16 w-16" labelClassName="text-2xl text-foreground" />
            <p className="mt-5 text-sm leading-7 text-muted-foreground">
              The hub combines accessibility, collaboration, verification, and practical system design so academic preparation feels less chaotic and more intentional.
            </p>
            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              <div className="rounded-2xl bg-background p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Focus</p>
                <p className="mt-2 font-semibold text-foreground">Reliable UR learning resources</p>
              </div>
              <div className="rounded-2xl bg-background p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Scope</p>
                <p className="mt-2 font-semibold text-foreground">Built for UR first, scalable later</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mt-10 grid gap-5 lg:grid-cols-3">
        {pillars.map((pillar, index) => (
          <Card key={pillar.title} className="theme-panel">
            <CardHeader>
              <CardTitle className="flex items-center gap-3 text-foreground">
                {index === 0 ? <Lightbulb className="h-5 w-5 text-[#F08A5D]" /> : index === 1 ? <ShieldCheck className="h-5 w-5 text-[#F08A5D]" /> : <Users className="h-5 w-5 text-[#F08A5D]" />}
                {pillar.title}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm leading-7 text-muted-foreground">{pillar.description}</p>
            </CardContent>
          </Card>
        ))}
      </section>

      <section className="mt-10 grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <Card className="theme-panel">
          <CardHeader>
            <CardTitle className="flex items-center gap-3 text-foreground">
              <Search className="h-5 w-5 text-[#F08A5D]" />
              What This Platform Is Meant To Do
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {features.map((feature) => (
              <div key={feature} className="rounded-2xl bg-muted/40 px-4 py-3 text-sm text-muted-foreground">
                {feature}
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="theme-panel">
          <CardHeader>
            <CardTitle className="text-foreground">People Behind It</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-2xl border border-border/70 bg-background p-5">
              <div className="flex items-center gap-4">
                <BrandMark imageClassName="h-14 w-14" />
                <div>
                  <p className="font-semibold text-foreground">Gilbert Tuyambaze</p>
                  <p className="text-sm text-muted-foreground">Lead builder and one of the people driving the idea forward</p>
                </div>
              </div>
              <a
                href="https://tuyambaze-gilbert.vercel.app/"
                target="_blank"
                rel="noreferrer"
                className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-[#F08A5D] hover:underline"
              >
                Visit portfolio
                <ExternalLink className="h-4 w-4" />
              </a>
            </div>

            <div className="rounded-2xl border border-border/70 bg-background p-5">
              <div className="flex items-center gap-4">
                <BrandMark imageClassName="h-14 w-14" />
                <div>
                  <p className="font-semibold text-foreground">Karly Ngarambe</p>
                  <p className="text-sm text-muted-foreground">A strategic collaborator contributing to the platform’s vision, shaping its story and user experience, and leading the generation of core project ideas.<
                </div>
              </div>
              <a
                href="https://rw.linkedin.com/in/karly-ngarambe-designer"
                target="_blank"
                rel="noreferrer"
                className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-[#F08A5D] hover:underline"
              >
                Visit LinkedIn
                <ExternalLink className="h-4 w-4" />
              </a>
            </div>

            <div className="rounded-2xl bg-muted/40 p-5 text-sm leading-7 text-muted-foreground">
              The vision behind this website is not just to host files. It is to create a trustworthy academic ecosystem where revision resources, discussion, and quality control can live together in one sustainable place, shaped by people who understand the real academic pressure students face.
            </div>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
