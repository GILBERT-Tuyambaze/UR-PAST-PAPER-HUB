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
];

export default function PrivacyPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6 lg:px-8">
      <Card className="theme-panel">
        <CardHeader>
          <CardTitle className="text-3xl text-foreground">Privacy Policy</CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
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
