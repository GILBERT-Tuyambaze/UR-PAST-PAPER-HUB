import { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  fetchMyPapers,
  deleteMyPaper,
  fetchLeaderboard,
  fetchNotifications,
  fetchUserProfile,
  markAllNotificationsRead,
  markNotificationRead,
  Paper,
  UserProfile,
  NotificationItem,
} from '../lib/client';
import { authApi } from '../lib/auth';
import { useAuth } from '../contexts/AuthContext';
import OfflineDataBanner from '../components/OfflineDataBanner';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart';
import {
  Upload,
  Download,
  FileText,
  CheckCircle,
  Users,
  Clock,
  Eye,
  Trash2,
  BarChart3,
  BookOpen,
  Trophy,
  Shield,
  Bell,
  CheckCheck,
} from 'lucide-react';
import { Bar, BarChart, CartesianGrid, Pie, PieChart, XAxis } from 'recharts';
import { toast } from 'sonner';

function VerificationBadge({ status }: { status: string }) {
  if (status === 'verified') {
    return (
      <Badge className="bg-green-100 text-green-700 hover:bg-green-100">
        <CheckCircle className="h-3 w-3 mr-1" />
        Verified
      </Badge>
    );
  }
  if (status === 'community') {
    return (
      <Badge className="bg-yellow-100 text-yellow-700 hover:bg-yellow-100">
        <Users className="h-3 w-3 mr-1" />
        Community
      </Badge>
    );
  }
  return (
    <Badge className="bg-gray-100 text-gray-600 hover:bg-gray-100">
      Unverified
    </Badge>
  );
}

export default function DashboardPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, loading: authLoading } = useAuth();
  const [papers, setPapers] = useState<Paper[]>([]);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [leaderboard, setLeaderboard] = useState<UserProfile[]>([]);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [showOfflineBanner, setShowOfflineBanner] = useState(false);
  const notificationsRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (user) loadMyPapers();
    else setLoading(false);
  }, [user]);

  useEffect(() => {
    if (location.hash !== '#notifications') return;

    window.requestAnimationFrame(() => {
      notificationsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  }, [location.hash, notifications.length]);

  const loadMyPapers = async () => {
    try {
      setLoading(true);
      const [dataResult, profileResult, leaderboardResult, notificationResult] = await Promise.allSettled([
        fetchMyPapers(),
        fetchUserProfile(),
        fetchLeaderboard(),
        fetchNotifications(),
      ]);

      if (dataResult.status === 'fulfilled') {
        setPapers(dataResult.value.items);
        setShowOfflineBanner(dataResult.value.data_source === 'cache');
      } else {
        setPapers([]);
        setShowOfflineBanner(false);
      }

      setProfile(profileResult.status === 'fulfilled' ? profileResult.value : null);
      setLeaderboard(leaderboardResult.status === 'fulfilled' ? leaderboardResult.value : []);
      setNotifications(notificationResult.status === 'fulfilled' ? notificationResult.value : []);
    } catch (err) {
      console.error('Failed to load papers:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (paperId: number) => {
    try {
      await deleteMyPaper(paperId);
      setPapers((prev) => prev.filter((p) => p.id !== paperId));
      toast.success('Paper deleted');
    } catch {
      toast.error('Failed to delete paper');
    }
  };

  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-[#F08A5D]" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center">
        <h2 className="text-2xl font-bold text-[#343A40] dark:text-white mb-4">Sign In Required</h2>
        <p className="text-gray-500 dark:text-gray-400 mb-6">
          Sign in to view your dashboard and manage your uploads.
        </p>
        <Button onClick={() => authApi.login('/dashboard')} className="bg-[#F08A5D] hover:bg-[#e07a4d] text-white">
          Sign In
        </Button>
      </div>
    );
  }

  const totalDownloads = papers.reduce((sum, p) => sum + (p.download_count || 0), 0);
  const verifiedCount = papers.filter((p) => p.verification_status === 'verified').length;
  const uploadTrend = [...papers]
    .sort((a, b) => new Date(a.created_at || 0).getTime() - new Date(b.created_at || 0).getTime())
    .slice(-6)
    .map((paper) => ({
      title: paper.course_code,
      downloads: paper.download_count || 0,
    }));
  const verificationBreakdown = [
    { status: 'verified', papers: papers.filter((paper) => paper.verification_status === 'verified').length, fill: 'var(--color-verified)' },
    { status: 'community', papers: papers.filter((paper) => paper.verification_status === 'community').length, fill: 'var(--color-community)' },
    { status: 'unverified', papers: papers.filter((paper) => paper.verification_status === 'unverified').length, fill: 'var(--color-unverified)' },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {showOfflineBanner && (
        <OfflineDataBanner message="Your dashboard charts and upload list are currently using cached paper data." />
      )}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-[#343A40] dark:text-white">My Dashboard</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">{user?.email || 'Welcome back!'}</p>
        </div>
        <Button onClick={() => navigate('/upload')} className="bg-[#F08A5D] hover:bg-[#e07a4d] text-white">
          <Upload className="h-4 w-4 mr-2" />
          Upload Paper
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <Card className="dark:bg-[#3E444A] dark:border-gray-700">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="w-12 h-12 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
              <FileText className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-[#343A40] dark:text-white">{papers.length}</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">My Uploads</p>
            </div>
          </CardContent>
        </Card>
        <Card className="dark:bg-[#3E444A] dark:border-gray-700">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="w-12 h-12 rounded-lg bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
              <Download className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-[#343A40] dark:text-white">{totalDownloads}</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">Total Downloads</p>
            </div>
          </CardContent>
        </Card>
        <Card className="dark:bg-[#3E444A] dark:border-gray-700">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="w-12 h-12 rounded-lg bg-[#F08A5D]/20 flex items-center justify-center">
              <CheckCircle className="h-6 w-6 text-[#F08A5D]" />
            </div>
            <div>
              <p className="text-2xl font-bold text-[#343A40] dark:text-white">{verifiedCount}</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">Verified</p>
            </div>
          </CardContent>
        </Card>
        <Card className="dark:bg-[#3E444A] dark:border-gray-700">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="w-12 h-12 rounded-lg bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
              <BarChart3 className="h-6 w-6 text-purple-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-[#343A40] dark:text-white">
                {papers.length > 0 ? Math.round(totalDownloads / papers.length) : 0}
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400">Avg Downloads</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="mb-8 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card className="dark:bg-[#3E444A] dark:border-gray-700">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-[#343A40] dark:text-white">
              <Shield className="h-5 w-5 text-[#F08A5D]" />
              Contributor Status
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-gray-600 dark:text-gray-300">
            <p>Role: <span className="font-semibold">{profile?.role || 'normal'}</span></p>
            <p>Institution: <span className="font-semibold">{profile?.institution_type === 'ur_student' ? 'University of Rwanda' : profile?.university_name || 'Not set'}</span></p>
            <p>UR verification: <span className="font-semibold">{profile?.ur_verification_status || 'not_requested'}</span></p>
            <p>Trust score: <span className="font-semibold">{profile?.trust_score || 0}</span></p>
            <p>Upload count: <span className="font-semibold">{profile?.upload_count || papers.length}</span></p>
            <p>Download count: <span className="font-semibold">{profile?.download_count || 0}</span></p>
            <div className="pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate('/profile')}
                className="dark:border-gray-600 dark:text-gray-200"
              >
                View profile
              </Button>
            </div>
          </CardContent>
        </Card>
        <Card className="dark:bg-[#3E444A] dark:border-gray-700">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-[#343A40] dark:text-white">
              <Trophy className="h-5 w-5 text-[#F08A5D]" />
              Leaderboard
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {leaderboard.slice(0, 5).map((entry, index) => (
              <div key={entry.id} className="flex items-center justify-between rounded-lg bg-gray-50 p-3 dark:bg-[#343A40]">
                <div>
                  <p className="text-sm font-medium text-[#343A40] dark:text-white">
                    {index + 1}. {entry.display_name}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{entry.role}</p>
                </div>
                <Badge variant="secondary">{entry.trust_score || 0} pts</Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <div className="mb-8 grid grid-cols-1 gap-4 xl:grid-cols-2">
        <Card className="dark:bg-[#3E444A] dark:border-gray-700">
          <CardHeader>
            <CardTitle className="text-[#343A40] dark:text-white">Download Performance</CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer
              className="h-[260px] w-full"
              config={{
                downloads: { label: 'Downloads', color: '#F08A5D' },
              }}
            >
              <BarChart data={uploadTrend}>
                <CartesianGrid vertical={false} />
                <XAxis dataKey="title" tickLine={false} axisLine={false} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar dataKey="downloads" radius={8} fill="var(--color-downloads)" />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>
        <Card className="dark:bg-[#3E444A] dark:border-gray-700">
          <CardHeader>
            <CardTitle className="text-[#343A40] dark:text-white">Verification Mix</CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer
              className="h-[260px] w-full"
              config={{
                verified: { label: 'Verified', color: '#22c55e' },
                community: { label: 'Community', color: '#f59e0b' },
                unverified: { label: 'Unverified', color: '#94a3b8' },
              }}
            >
              <PieChart>
                <ChartTooltip content={<ChartTooltipContent nameKey="status" />} />
                <Pie data={verificationBreakdown} dataKey="papers" nameKey="status" innerRadius={50} outerRadius={86} />
                <ChartLegend content={<ChartLegendContent nameKey="status" />} />
              </PieChart>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>

      <Card
        id="notifications"
        ref={notificationsRef}
        className="mb-8 scroll-mt-24 dark:bg-[#3E444A] dark:border-gray-700"
      >
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-[#343A40] dark:text-white">
            <Bell className="h-5 w-5 text-[#F08A5D]" />
            Notifications
          </CardTitle>
          <Button
            variant="outline"
            size="sm"
            onClick={async () => {
              await markAllNotificationsRead();
              setNotifications((prev) => prev.map((item) => ({ ...item, is_read: true })));
            }}
          >
            <CheckCheck className="mr-2 h-4 w-4" />
            Mark all read
          </Button>
        </CardHeader>
        <CardContent className="space-y-3">
          {notifications.length === 0 ? (
            <p className="text-sm text-gray-500 dark:text-gray-400">No notifications yet.</p>
          ) : (
            notifications.slice(0, 8).map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={async () => {
                  if (!item.is_read) {
                    await markNotificationRead(item.id);
                    setNotifications((prev) => prev.map((entry) => entry.id === item.id ? { ...entry, is_read: true } : entry));
                  }
                  if (item.related_entity === 'paper' && item.related_entity_id) {
                    navigate(`/paper/${item.related_entity_id}`);
                  }
                }}
                className={`w-full rounded-lg border p-3 text-left transition-colors ${
                  item.is_read
                    ? 'border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-[#343A40]'
                    : 'border-[#F08A5D]/30 bg-[#FFF7F1] dark:border-[#F08A5D]/40 dark:bg-[#3b3028]'
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-medium text-[#343A40] dark:text-white">{item.title}</p>
                  {!item.is_read && <Badge>New</Badge>}
                </div>
                <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">{item.message}</p>
              </button>
            ))
          )}
        </CardContent>
      </Card>

      {/* My Papers */}
      <Card className="dark:bg-[#3E444A] dark:border-gray-700">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-[#343A40] dark:text-white">
            <BookOpen className="h-5 w-5 text-[#F08A5D]" />
            My Uploaded Papers
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="animate-pulse flex items-center gap-4 p-4 bg-gray-50 dark:bg-[#343A40] rounded-lg">
                  <div className="h-12 w-12 bg-gray-200 dark:bg-gray-600 rounded" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-gray-200 dark:bg-gray-600 rounded w-3/4" />
                    <div className="h-3 bg-gray-200 dark:bg-gray-600 rounded w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          ) : papers.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="h-16 w-16 mx-auto mb-4 text-gray-300 dark:text-gray-600" />
              <h3 className="text-lg font-semibold text-[#343A40] dark:text-white mb-2">No uploads yet</h3>
              <p className="text-gray-500 dark:text-gray-400 mb-4">Start contributing by uploading your first paper!</p>
              <Button onClick={() => navigate('/upload')} className="bg-[#F08A5D] hover:bg-[#e07a4d] text-white">
                <Upload className="h-4 w-4 mr-2" />
                Upload Paper
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {papers.map((paper) => (
                <div
                  key={paper.id}
                  className="flex items-center gap-4 p-4 bg-gray-50 dark:bg-[#343A40] rounded-lg hover:bg-gray-100 dark:hover:bg-[#2a2e33] transition-colors"
                >
                  <div className="w-12 h-12 rounded-lg bg-[#F08A5D]/10 flex items-center justify-center flex-shrink-0">
                    <FileText className="h-6 w-6 text-[#F08A5D]" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-[#343A40] dark:text-white truncate">{paper.title}</h4>
                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                      <span className="text-xs text-gray-500 dark:text-gray-400">{paper.course_code}</span>
                      <span className="text-xs text-gray-400">·</span>
                      <span className="text-xs text-gray-500 dark:text-gray-400">{paper.year}</span>
                      <span className="text-xs text-gray-400">·</span>
                      <span className="text-xs text-gray-500 dark:text-gray-400">{paper.paper_type}</span>
                      <VerificationBadge status={paper.verification_status} />
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className="flex items-center gap-1 text-xs text-gray-400">
                      <Download className="h-3.5 w-3.5" />
                      {paper.download_count || 0}
                    </span>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => navigate(`/paper/${paper.id}`)}
                      className="h-8 w-8 text-gray-400 hover:text-[#F08A5D]"
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDelete(paper.id)}
                      className="h-8 w-8 text-gray-400 hover:text-red-500"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
