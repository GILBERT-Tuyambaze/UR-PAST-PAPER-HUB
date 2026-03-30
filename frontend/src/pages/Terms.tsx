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
  {
    title: 'Responsible academic use',
    content:
      'The website is designed to help students study smarter, not to encourage misconduct. Materials should be used for revision, practice, and understanding assessment patterns, not for cheating or misrepresentation in coursework or exams.',
  },
  {
    title: 'Platform changes',
    content:
      'Features, moderation workflows, and access rules may change as the platform grows. Continued use of the website means you accept reasonable updates that improve safety, organization, and the long-term quality of shared study resources.',
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
          <section className="rounded-2xl bg-muted/40 p-5">
            <h2 className="text-lg font-semibold text-foreground">How these terms support University of Rwanda past papers access</h2>
            <p className="mt-3 text-sm leading-7 text-muted-foreground">
              These terms explain how UR Academic Resource Hub should be used by students, contributors, and moderators. The website exists to make <strong>University of Rwanda past papers</strong>, revision resources, and community study support easier to find and use responsibly. Because the platform includes uploads, comments, and account roles, the rules need to be clear enough to protect trust while still keeping access simple for genuine learners.
            </p>
            <p className="mt-3 text-sm leading-7 text-muted-foreground">
              Our goal is not to create legal noise. It is to describe the practical expectations behind a clean academic archive. When students search for <strong>UR exam papers</strong> or other <strong>study materials Rwanda</strong> learners rely on, they should find a platform that values organization, integrity, and respectful contribution. These terms set that expectation for everyone using the website.
            </p>
          </section>
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
