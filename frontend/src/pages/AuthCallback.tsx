import { useEffect } from 'react';
import { authApi } from '../lib/auth';

export default function AuthCallback() {
  useEffect(() => {
    void (async () => {
      try {
        const returnTo = await authApi.completeLoginCallback();
        const currentUser = await authApi.getCurrentUser();
        console.log('[auth] callback user after token exchange:', currentUser);
        window.location.replace(returnTo || '/');
      } catch (error) {
        console.log('[auth] callback failed:', error);
        window.location.replace('/auth/error?msg=Authentication%20callback%20failed');
      }
    })();
  }, []);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="text-center">
        <div className="theme-accent mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-b-2 border-current" />
        <p className="theme-muted">Completing sign in...</p>
      </div>
    </div>
  );
}
