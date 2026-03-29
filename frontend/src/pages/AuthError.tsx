import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { AlertCircle } from 'lucide-react';

export default function AuthErrorPage() {
  const [searchParams] = useSearchParams();
  const [countdown, setCountdown] = useState(3);
  const errorMessage =
    searchParams.get('msg') ||
    'Sorry, your authentication information is invalid or has expired.';

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          window.location.href = '/';
          return 0;
        }

        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 p-6 text-center dark:from-[#2d3338] dark:to-[#343A40]">
      <div className="mx-auto flex min-h-[70vh] max-w-md flex-col items-center justify-center space-y-6">
        <div className="space-y-4">
          <div className="flex justify-center">
            <div className="relative">
              <div className="absolute inset-0 rounded-full bg-red-500/20 blur-xl" />
              <AlertCircle className="relative h-12 w-12 text-red-500" strokeWidth={1.5} />
            </div>
          </div>

          <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Authentication Error</h1>
          <p className="text-base text-muted-foreground">{errorMessage}</p>
          {errorMessage.toLowerCase().includes('not configured') && (
            <p className="text-sm text-muted-foreground">
              This local environment is missing required auth settings. Add the OIDC and JWT environment
              variables on the backend before using sign in.
            </p>
          )}

          <div className="pt-2">
            <p className="text-sm text-gray-500 dark:text-gray-300">
              {countdown > 0 ? (
                <>
                  Returning to the home page in{' '}
                  <span className="text-blue-600 dark:text-[#F08A5D] font-semibold text-base">{countdown}</span>{' '}
                  seconds
                </>
              ) : (
                'Redirecting...'
              )}
            </p>
          </div>
        </div>

        <div className="flex justify-center pt-2">
          <Button onClick={() => (window.location.href = '/')} className="px-6">
            Return to Home
          </Button>
        </div>
      </div>
    </div>
  );
}
