import { useEffect } from 'react';
import SeoMeta from '@/components/SeoMeta';
import { authApi } from '../lib/auth';

export default function AuthCallback() {
  useEffect(() => {
    void (async () => {
      try {
        const returnTo = await authApi.completeLoginCallback();
        await authApi.getCurrentUser();
        window.location.replace(returnTo || '/');
      } catch (_error) {
        window.location.replace('/auth/error?msg=Authentication%20callback%20failed');
      }
    })();
  }, []);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <SeoMeta
        title="Completing sign in"
        description="Authentication callback page for UR Academic Resource Hub."
        canonicalPath="/auth/callback"
        robots="noindex,nofollow"
      />
      <div className="text-center">
        <div className="theme-accent mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-b-2 border-current" />
        <p className="theme-muted">Completing sign in...</p>
      </div>
    </div>
  );
}
