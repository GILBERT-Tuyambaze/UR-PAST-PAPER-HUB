import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchAllPapers, Paper } from '../lib/client';
import OfflineDataBanner from '../components/OfflineDataBanner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import {
  Search,
  Download,
  FileText,
  Users,
  CheckCircle,
  TrendingUp,
  ArrowRight,
  BookOpen,
  Clock,
  Star,
  Upload,
} from 'lucide-react';

const HERO_IMAGE = '/hero-study.svg';
const COLLAB_IMAGE = '/collaboration-scene.svg';

const COLLEGES = [
  'College of Science and Technology',
  'College of Arts and Social Sciences',
  'College of Business and Economics',
  'College of Medicine and Health Sciences',
  'College of Agriculture and Veterinary Medicine',
  'College of Education',
];

const PAPER_TYPES = ['Exam', 'CAT', 'Assignment', 'GroupWork'];

function VerificationBadge({ status }: { status: string }) {
  if (status === 'verified') {
    return (
      <Badge className="theme-status-badge--verified hover:bg-inherit">
        <CheckCircle className="h-3 w-3 mr-1" />
        Verified
      </Badge>
    );
  }
  if (status === 'community') {
    return (
      <Badge className="theme-status-badge--community hover:bg-inherit">
        <Users className="h-3 w-3 mr-1" />
        Community
      </Badge>
    );
  }
  return (
      <Badge className="bg-muted text-muted-foreground hover:bg-muted">
      Unverified
    </Badge>
  );
}

function PaperCard({ paper, onClick }: { paper: Paper; onClick: () => void }) {
  return (
    <Card
      className="theme-panel group cursor-pointer border transition-all duration-300 hover:-translate-y-1 hover:shadow-lg"
      onClick={onClick}
    >
      <CardContent className="p-5">
        <div className="flex items-start justify-between mb-3">
          <Badge variant="outline" className="border-[hsl(var(--brand))] text-xs font-medium text-[hsl(var(--brand))]">
            {paper.paper_type}
          </Badge>
          <VerificationBadge status={paper.verification_status} />
        </div>
        <h3 className="theme-title mb-2 line-clamp-2 font-semibold transition-colors group-hover:text-[hsl(var(--brand))]">
          {paper.title}
        </h3>
        <div className="theme-muted space-y-1 text-sm">
          <p className="flex items-center gap-1">
            <BookOpen className="h-3.5 w-3.5" />
            {paper.course_code} - {paper.course_name}
          </p>
          <p className="flex items-center gap-1">
            <Clock className="h-3.5 w-3.5" />
            {paper.year} - {paper.department}
          </p>
        </div>
        <div className="mt-4 flex items-center justify-between border-t pt-3">
          <span className="theme-muted flex items-center gap-1 text-xs">
            <Download className="h-3.5 w-3.5" />
            {paper.download_count || 0} downloads
          </span>
          {paper.solution_key && (
            <Badge className="theme-status-badge--solution text-xs hover:bg-inherit">
              <Star className="h-3 w-3 mr-1" />
              Has Solution
            </Badge>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export default function HomePage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [papers, setPapers] = useState<Paper[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ total: 0, downloads: 0, verified: 0 });
  const [showOfflineBanner, setShowOfflineBanner] = useState(false);
  const [featuredIndex, setFeaturedIndex] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    loadPapers();
  }, []);

  const loadPapers = async () => {
    try {
      setLoading(true);
      const data = await fetchAllPapers({ sort: '-download_count', limit: 50 });
      setShowOfflineBanner(data.data_source === 'cache');
      setPapers(data.items.filter((p) => !p.is_hidden));
      const totalDownloads = data.items.reduce((sum, p) => sum + (p.download_count || 0), 0);
      const verifiedCount = data.items.filter((p) => p.verification_status === 'verified').length;
      setStats({ total: data.total, downloads: totalDownloads, verified: verifiedCount });
    } catch (err) {
      console.error('Failed to load papers:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
    } else {
      navigate('/search');
    }
  };

  const trendingPapers = papers.slice(0, 6);
  const recentPapers = [...papers].sort((a, b) => {
    const dateA = a.created_at ? new Date(a.created_at).getTime() : 0;
    const dateB = b.created_at ? new Date(b.created_at).getTime() : 0;
    return dateB - dateA;
  }).slice(0, 6);
  const featuredPapers = papers.slice(0, 4);
  const activeFeaturedPaper = featuredPapers[featuredIndex] || null;

  useEffect(() => {
    if (featuredPapers.length < 2) return;
    const timer = window.setInterval(() => {
      setFeaturedIndex((current) => (current + 1) % featuredPapers.length);
    }, 4200);
    return () => window.clearInterval(timer);
  }, [featuredPapers.length]);

  return (
    <div>
      {/* Hero Section */}
      <section className="theme-header theme-hero-section relative overflow-hidden">
        <div
          className="theme-hero-media absolute inset-0"
          style={{
            backgroundImage: `url(${HERO_IMAGE})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
        />
        <div className="theme-hero-overlay absolute inset-0 pointer-events-none" />
        <div className="relative mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8 md:py-28"> 
          <div className="grid gap-10 lg:grid-cols-[1.08fr_0.92fr] lg:items-center">
            <div className="max-w-2xl">
              <h1 className="text-4xl font-bold leading-tight md:text-5xl">
                UR Academic
                <span className="theme-accent"> Resource Hub</span>
              </h1>
              <p className="theme-hero-copy mb-4 mt-4 text-lg">
                Access past papers, trusted solutions, and study support that helps University of Rwanda learners prepare faster and study smarter.
              </p>
              <p className="theme-hero-copy mb-8 max-w-xl text-sm leading-6">
                Search the most downloaded papers, discover lecturer-linked material, and learn from a growing community that keeps useful content visible.
              </p>

              <form onSubmit={handleSearch} className="mb-8 flex gap-2">
                <div className="relative flex-1">
                  <Search className="theme-muted absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2" />
                  <Input
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search course, code, year... (e.g., DSA 2023)"
                    className="theme-hero-input h-12 pl-10"
                  />
                </div>
                <Button type="submit" className="theme-accent-bg h-12 px-6">
                  Search
                </Button>
              </form>

              <div className="mb-6 flex flex-wrap gap-2">
                {PAPER_TYPES.map((type) => (
                  <Button
                    key={type}
                    variant="outline"
                    size="sm"
                    onClick={() => navigate(`/search?type=${type}`)}
                    className="theme-hero-filter text-xs"
                  >
                    {type}
                  </Button>
                ))}
              </div>

              <div className="grid gap-3 text-sm sm:grid-cols-3">
                <div className="theme-hero-feature rounded-2xl px-4 py-3">
                  <p className="font-semibold">Fast revision</p>
                  <p className="theme-hero-feature-copy mt-1">Find common exam patterns and prepare with less guesswork.</p>
                </div>
                <div className="theme-hero-feature rounded-2xl px-4 py-3">
                  <p className="font-semibold">Trusted by peers</p>
                  <p className="theme-hero-feature-copy mt-1">Verified community uploads help strong material stand out.</p>
                </div>
                <div className="theme-hero-feature rounded-2xl px-4 py-3">
                  <p className="font-semibold">Study together</p>
                  <p className="theme-hero-feature-copy mt-1">Discussion, solutions, and AI support stay close to each paper.</p>
                </div>
              </div>
            </div>

            <div className="lg:justify-self-end">
              <div className="theme-highlight-shell rounded-[2rem] p-6 backdrop-blur-xl">
                <div className="mb-5 flex items-center justify-between">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[#F08A5D]">Highlighted Papers</p>
                    <h2 className="mt-2 text-2xl font-bold">See what students are opening most</h2>
                  </div>
                  <Badge className="theme-highlight-stat hover:bg-transparent">
                    Live picks
                  </Badge>
                </div>

                {activeFeaturedPaper ? (
                  <div className="theme-highlight-card rounded-[1.6rem] p-5">
                    <div className="mb-3 flex flex-wrap items-center gap-2">
                      <Badge className="theme-highlight-badge">
                        {featuredIndex === 0 ? 'Most downloaded' : featuredIndex === 1 ? 'Highlighted' : featuredIndex === 2 ? 'Popular with solutions' : 'Fresh attention'}
                      </Badge>
                      <VerificationBadge status={activeFeaturedPaper.verification_status} />
                    </div>
                    <h3 className="text-xl font-semibold">{activeFeaturedPaper.title}</h3>
                    <p className="theme-highlight-muted mt-3 text-sm">
                      {activeFeaturedPaper.course_code} • {activeFeaturedPaper.course_name}
                    </p>
                    <p className="theme-highlight-muted mt-2 text-sm">
                      {activeFeaturedPaper.department} • {activeFeaturedPaper.year} • {activeFeaturedPaper.paper_type}
                    </p>
                    <div className="mt-5 grid gap-3 sm:grid-cols-2">
                      <div className="theme-highlight-stat rounded-2xl px-4 py-3 text-sm">
                        <p className="theme-highlight-stat-label text-xs uppercase tracking-[0.2em]">Downloads</p>
                        <p className="mt-2 text-lg font-semibold">{activeFeaturedPaper.download_count || 0}</p>
                      </div>
                      <div className="theme-highlight-stat rounded-2xl px-4 py-3 text-sm">
                        <p className="theme-highlight-stat-label text-xs uppercase tracking-[0.2em]">Extra value</p>
                        <p className="mt-2 text-lg font-semibold">
                          {activeFeaturedPaper.solution_key ? 'Has solution' : 'Paper only'}
                        </p>
                      </div>
                    </div>
                    <Button
                      onClick={() => navigate(`/paper/${activeFeaturedPaper.id}`)}
                      className="theme-accent-bg mt-5 w-full"
                    >
                      Open highlighted paper
                    </Button>
                  </div>
                ) : (
                  <div className="theme-highlight-card rounded-[1.6rem] p-5">
                    <p className="theme-highlight-muted text-sm">Highlighted papers will appear here as soon as the library loads.</p>
                  </div>
                )}

                {featuredPapers.length > 1 && (
                  <div className="mt-4 flex items-center justify-center gap-2">
                    {featuredPapers.map((paper, index) => (
                      <button
                        key={paper.id}
                        type="button"
                        onClick={() => setFeaturedIndex(index)}
                        className={`theme-home-indicator h-2.5 rounded-full transition-all ${index === featuredIndex ? 'theme-home-indicator--active w-8' : 'w-2.5'}`}
                        aria-label={`Show featured paper ${index + 1}`}
                      />
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Bar */}
      <section className="theme-section-band shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          {showOfflineBanner && (
            <OfflineDataBanner message="You are seeing cached homepage stats and paper lists while live data is unavailable." />
          )}
          <div className="grid grid-cols-3 gap-8">
            <div className="text-center">
              <div className="flex items-center justify-center gap-2 mb-1">
                <FileText className="theme-accent h-5 w-5" />
                <span className="theme-title text-2xl font-bold">{stats.total}</span>
              </div>
              <p className="theme-muted text-sm">Total Papers</p>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center gap-2 mb-1">
                <Download className="theme-accent h-5 w-5" />
                <span className="theme-title text-2xl font-bold">{stats.downloads.toLocaleString()}</span>
              </div>
              <p className="theme-muted text-sm">Total Downloads</p>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center gap-2 mb-1">
                <CheckCircle className="h-5 w-5 text-green-500" />
                <span className="theme-title text-2xl font-bold">{stats.verified}</span>
              </div>
              <p className="theme-muted text-sm">Verified Papers</p>
            </div>
          </div>
        </div>
      </section>

      {/* Browse by College */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h2 className="theme-title mb-6 text-2xl font-bold">Browse by College</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {COLLEGES.map((college) => (
            <Card
              key={college}
              className="theme-panel cursor-pointer border transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md"
              onClick={() => navigate(`/search?college=${encodeURIComponent(college)}`)}
            >
              <CardContent className="p-4 flex items-center justify-between">
                <span className="theme-title text-sm font-medium">{college}</span>
                <ArrowRight className="theme-accent h-4 w-4" />
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Trending Papers */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <TrendingUp className="theme-accent h-6 w-6" />
            <h2 className="theme-title text-2xl font-bold">Trending Papers</h2>
          </div>
          <Button variant="ghost" onClick={() => navigate('/search')} className="theme-accent hover:text-[hsl(var(--brand-hover))]">
            View All <ArrowRight className="ml-1 h-4 w-4" />
          </Button>
        </div>
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="theme-panel animate-pulse">
                <CardContent className="p-5 space-y-3">
                  <div className="h-4 w-1/3 rounded bg-muted" />
                  <div className="h-5 w-full rounded bg-muted" />
                  <div className="h-4 w-2/3 rounded bg-muted" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {trendingPapers.map((paper) => (
              <PaperCard key={paper.id} paper={paper} onClick={() => navigate(`/paper/${paper.id}`)} />
            ))}
          </div>
        )}
      </section>

      {/* Recent Papers */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <Clock className="theme-accent h-6 w-6" />
            <h2 className="theme-title text-2xl font-bold">Recently Added</h2>
          </div>
          <Button variant="ghost" onClick={() => navigate('/search?sort=-created_at')} className="theme-accent hover:text-[hsl(var(--brand-hover))]">
            View All <ArrowRight className="ml-1 h-4 w-4" />
          </Button>
        </div>
        {!loading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {recentPapers.map((paper) => (
              <PaperCard key={paper.id} paper={paper} onClick={() => navigate(`/paper/${paper.id}`)} />
            ))}
          </div>
        )}
      </section>

      {/* CTA Section */}
      <section className="theme-header theme-cta-section relative mt-8 overflow-hidden">
        <div
          className="theme-cta-media absolute inset-0"
          style={{
            backgroundImage: `url(${COLLAB_IMAGE})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
        />
        <div className="theme-cta-overlay absolute inset-0 pointer-events-none" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
          <h2 className="text-3xl font-bold mb-4">Contribute to the Community</h2>
          <p className="theme-cta-copy mx-auto mb-8 max-w-xl">
            Share your past papers and solutions to help fellow students. Every contribution makes a difference.
          </p>
          <Button
            onClick={() => navigate('/upload')}
            className="theme-accent-bg px-8 py-3 text-lg"
            size="lg"
          >
            <Upload className="mr-2 h-5 w-5" />
            Upload a Paper
          </Button>
        </div>
      </section>
    </div>
  );
}
