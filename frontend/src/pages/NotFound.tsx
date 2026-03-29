import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Compass, Home, Search } from 'lucide-react';

export default function NotFoundPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-[70vh] px-4 py-16">
      <div className="mx-auto flex max-w-2xl flex-col items-center text-center">
        <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-[#F08A5D]/15">
          <Compass className="h-10 w-10 text-[#F08A5D]" />
        </div>
        <p className="mb-2 text-sm font-semibold uppercase tracking-[0.2em] text-[#F08A5D]">404</p>
        <h1 className="mb-4 text-3xl font-bold text-[#343A40] dark:text-white">Page not found</h1>
        <p className="mb-8 max-w-lg text-gray-500 dark:text-gray-400">
          The page you were trying to open does not exist or may have been moved. You can head back home
          or continue browsing papers.
        </p>
        <div className="flex flex-wrap justify-center gap-3">
          <Button onClick={() => navigate('/')} className="bg-[#F08A5D] text-white hover:bg-[#e07a4d]">
            <Home className="mr-2 h-4 w-4" />
            Go Home
          </Button>
          <Button variant="outline" onClick={() => navigate('/search')}>
            <Search className="mr-2 h-4 w-4" />
            Browse Papers
          </Button>
        </div>
      </div>
    </div>
  );
}
