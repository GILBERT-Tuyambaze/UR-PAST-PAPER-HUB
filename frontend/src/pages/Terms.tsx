import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const sections = [
  {
    title: 'Use of the platform',
    content:
      'UR Academic Resource Hub is meant for academic support, revision, collaboration, and responsible sharing of course-related materials. You agree not to upload misleading, harmful, or unauthorized content.',
  },
  {
    title: 'User content',
    content:
      'You remain responsible for the materials, comments, and solutions you upload. The platform may review, hide, or remove content that is reported, inaccurate, abusive, or inconsistent with academic integrity.',
  },
  {
    title: 'Accounts and roles',
    content:
      'Some features depend on account roles and verification status. Administrative and management roles may suspend, ban, or moderate accounts when misuse, abuse, or policy violations occur.',
  },
  {
    title: 'No guaranteed accuracy',
    content:
      'Although the platform uses verification and moderation, not every uploaded resource is official or fully accurate. Students should still confirm critical academic information with lecturers or official course guidance.',
  },
];

export default function TermsPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6 lg:px-8">
      <Card className="theme-panel">
        <CardHeader>
          <CardTitle className="text-3xl text-foreground">Terms of Use</CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          {sections.map((section) => (
            <section key={section.title} className="rounded-2xl bg-muted/40 p-5">
              <h2 className="text-lg font-semibold text-foreground">{section.title}</h2>
              <p className="mt-3 text-sm leading-7 text-muted-foreground">{section.content}</p>
            </section>
          ))}
          <p className="text-sm leading-7 text-muted-foreground">
            These terms are a practical project-level policy for the current version of the platform and can be refined as the website grows.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
