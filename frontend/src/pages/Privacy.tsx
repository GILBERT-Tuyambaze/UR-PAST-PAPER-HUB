import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const sections = [
  {
    title: 'What we collect',
    content:
      'The platform may store profile details you provide such as your name, email, university information, UR code, uploaded materials, comments, and account activity needed to operate the service.',
  },
  {
    title: 'Why we collect it',
    content:
      'This information supports authentication, moderation, verification, file uploads, profile features, notifications, and the overall reliability of the academic resource hub.',
  },
  {
    title: 'How it is used',
    content:
      'Your data is used to run your account, display your profile where relevant, manage moderation, and improve access to academic materials. Sensitive admin-only configuration is not exposed publicly.',
  },
  {
    title: 'Storage and third parties',
    content:
      'The current system uses a database for account and app data, plus Supabase-backed file storage for uploaded assets. Hosting providers and infrastructure services may process technical data required to run the app.',
  },
  {
    title: 'Visibility of shared content',
    content:
      'If you upload a paper, add comments, or complete a public profile, some information may be visible to other users so they can understand where a resource came from and how trustworthy it is. We aim to expose only the information needed for the platform to work well.',
  },
  {
    title: 'Your control and requests',
    content:
      'You can update profile details from your account area, and moderation teams may help with correction or removal requests when needed. As the platform matures, privacy controls can be expanded to give users clearer management of their stored information.',
  },
];

export default function PrivacyPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6 lg:px-8">
      <Card className="theme-panel">
        <CardHeader>
          <CardTitle className="text-3xl text-foreground">Privacy Policy</CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          <section className="rounded-2xl bg-muted/40 p-5">
            <h2 className="text-lg font-semibold text-foreground">How privacy works on a study materials Rwanda platform</h2>
            <p className="mt-3 text-sm leading-7 text-muted-foreground">
              UR Academic Resource Hub is a practical student platform, so the privacy policy focuses on the information needed to run accounts, manage uploads, and keep the academic archive trustworthy. Students who use the site to browse <strong>University of Rwanda past papers</strong> or contribute <strong>UR exam papers</strong> should understand what data is collected, why it is needed, and where it may appear across the experience.
            </p>
            <p className="mt-3 text-sm leading-7 text-muted-foreground">
              This page is written as a clear project-level explanation rather than dense legal text. The aim is to help users understand how profile data, uploaded files, and activity signals support moderation, verification, and access to <strong>study materials Rwanda</strong> students can discover more easily. As the platform grows, this summary can be expanded into a more formal public policy, but the current version already explains the main data flows in readable language.
            </p>
          </section>
          {sections.map((section) => (
            <section key={section.title} className="rounded-2xl bg-muted/40 p-5">
              <h2 className="text-lg font-semibold text-foreground">{section.title}</h2>
              <p className="mt-3 text-sm leading-7 text-muted-foreground">{section.content}</p>
            </section>
          ))}
          <p className="text-sm leading-7 text-muted-foreground">
            This policy is a project-level privacy summary for the current implementation and should be expanded further before a large public launch.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
