import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  fetchPaperById,
  fetchComments,
  fetchSolutions,
  createComment,
  createSolution,
  createReport,
  upvoteComment,
  upvoteSolution,
  recordPaperDownload,
  runStudyAI,
  saveDocumentOffline,
  getOfflineDocumentUrl,
  getStorageDownloadUrl,
  Paper,
  Comment,
  Solution,
} from '../lib/client';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Download,
  CheckCircle,
  Users,
  BookOpen,
  Clock,
  ArrowLeft,
  MessageSquare,
  Lightbulb,
  Flag,
  User,
  Send,
  FileText,
  GraduationCap,
  ChevronUp,
  Reply,
  ZoomIn,
  ZoomOut,
  Sparkles,
  Maximize2,
  WifiOff,
  Save,
} from 'lucide-react';
import { toast } from 'sonner';

function VerificationBadge({ status }: { status: string }) {
  if (status === 'verified') {
    return (
      <Badge className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 hover:bg-green-100">
        <CheckCircle className="h-3 w-3 mr-1" />
        Verified
      </Badge>
    );
  }
  if (status === 'community') {
    return (
      <Badge className="bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400 hover:bg-yellow-100">
        <Users className="h-3 w-3 mr-1" />
        Community Verified
      </Badge>
    );
  }
  return (
    <Badge className="bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400 hover:bg-gray-100">
      Unverified
    </Badge>
  );
}

export default function PaperDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [paper, setPaper] = useState<Paper | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [solutions, setSolutions] = useState<Solution[]>([]);
  const [loading, setLoading] = useState(true);
  const [newComment, setNewComment] = useState('');
  const [newSolution, setNewSolution] = useState('');
  const [replyTarget, setReplyTarget] = useState<number | null>(null);
  const [replyDraft, setReplyDraft] = useState('');
  const [reportReason, setReportReason] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const [paperUrl, setPaperUrl] = useState<string | null>(null);
  const [solutionUrl, setSolutionUrl] = useState<string | null>(null);
  const [pdfZoom, setPdfZoom] = useState(1);
  const [aiResult, setAiResult] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [aiMode, setAiMode] = useState<'explain' | 'summarize' | null>(null);
  const [offlinePaperUrl, setOfflinePaperUrl] = useState<string | null>(null);
  const [offlineSolutionUrl, setOfflineSolutionUrl] = useState<string | null>(null);

  useEffect(() => {
    if (id) loadPaper(parseInt(id));
  }, [id]);

  const loadPaper = async (paperId: number) => {
    try {
      setLoading(true);
      setPaperUrl(null);
      setSolutionUrl(null);
      const [paperResult, commentsResult, solutionsResult] = await Promise.allSettled([
        fetchPaperById(paperId),
        fetchComments(paperId),
        fetchSolutions(paperId),
      ]);

      if (paperResult.status !== 'fulfilled') {
        throw paperResult.reason;
      }

      const paperData = paperResult.value;
      const commentsData = commentsResult.status === 'fulfilled' ? commentsResult.value : { items: [] };
      const solutionsData = solutionsResult.status === 'fulfilled' ? solutionsResult.value : { items: [] };

      setPaper(paperData);
      setComments(commentsData.items);
      setSolutions(solutionsData.items);
      if (paperData?.file_key) {
        await loadDownloadUrl(paperData.file_key, setPaperUrl);
        const localUrl = await getOfflineDocumentUrl('paper', paperData.id);
        setOfflinePaperUrl(localUrl);
      } else {
        setOfflinePaperUrl(await getOfflineDocumentUrl('paper', paperData.id));
      }
      if (paperData?.solution_key) {
        await loadDownloadUrl(paperData.solution_key, setSolutionUrl);
        const localSolutionUrl = await getOfflineDocumentUrl('solution', paperData.id);
        setOfflineSolutionUrl(localSolutionUrl);
      } else {
        setOfflineSolutionUrl(await getOfflineDocumentUrl('solution', paperData.id));
      }
    } catch (err) {
      console.error('Failed to load paper:', err);
      toast.error('Failed to load paper details');
    } finally {
      setLoading(false);
    }
  };

  const loadDownloadUrl = async (
    objectKey: string,
    setter: React.Dispatch<React.SetStateAction<string | null>>
  ) => {
    try {
      const downloadUrl = await getStorageDownloadUrl('papers', objectKey);
      setter(downloadUrl);
    } catch (err) {
      setter(null);
    }
  };

  const handleDownload = async () => {
    if (!paper?.file_key) return;
    try {
      const downloadUrl = await getStorageDownloadUrl('papers', paper.file_key);
      if (downloadUrl) {
        window.open(downloadUrl, '_blank');
        const updated = await recordPaperDownload(paper.id);
        setPaper((prev) => (prev ? { ...prev, download_count: updated.download_count } : prev));
      }
      toast.success('Download started');
    } catch {
      toast.error('Download failed. The file may not be available yet.');
    }
  };

  const handleSubmitComment = async () => {
    if (!newComment.trim() || !paper || !user) return;
    try {
      setSubmitting(true);
      const comment = await createComment({ paper_id: paper.id, content: newComment.trim() });
      setComments((prev) => [comment, ...prev]);
      setNewComment('');
      toast.success('Comment posted');
    } catch {
      toast.error('Failed to post comment');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmitSolution = async () => {
    if (!newSolution.trim() || !paper || !user) return;
    try {
      setSubmitting(true);
      const solution = await createSolution({ paper_id: paper.id, content: newSolution.trim() });
      setSolutions((prev) =>
        [solution, ...prev].sort((a, b) => (b.upvotes || 0) - (a.upvotes || 0))
      );
      setNewSolution('');
      toast.success('Solution submitted');
    } catch {
      toast.error('Failed to submit solution');
    } finally {
      setSubmitting(false);
    }
  };

  const handleReport = async () => {
    if (!reportReason.trim() || !paper || !user) return;
    try {
      setSubmitting(true);
      const response = await createReport({ paper_id: paper.id, reason: reportReason.trim() });
      setPaper((prev) =>
        prev
          ? {
              ...prev,
              report_count: response.paper.report_count,
              is_hidden: response.paper.is_hidden,
            }
          : prev
      );
      setReportReason('');
      setReportOpen(false);
      toast.success('Report submitted. Thank you for helping maintain quality.');
    } catch {
      toast.error('Failed to submit report');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 dark:bg-gray-600 rounded w-3/4" />
          <div className="h-4 bg-gray-200 dark:bg-gray-600 rounded w-1/2" />
          <div className="h-48 bg-gray-200 dark:bg-gray-600 rounded" />
        </div>
      </div>
    );
  }

  const handleReplySubmit = async (parentId: number) => {
    if (!replyDraft.trim() || !paper || !user) return;
    try {
      setSubmitting(true);
      const comment = await createComment({
        paper_id: paper.id,
        content: replyDraft.trim(),
        parent_id: parentId,
      });
      setComments((prev) => [comment, ...prev]);
      setReplyDraft('');
      setReplyTarget(null);
      toast.success('Reply posted');
    } catch {
      toast.error('Failed to post reply');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCommentVote = async (commentId: number) => {
    try {
      const updated = await upvoteComment(commentId);
      setComments((prev) => prev.map((comment) => (comment.id === commentId ? updated : comment)));
    } catch {
      toast.error('Failed to upvote comment');
    }
  };

  const handleSolutionVote = async (solutionId: number) => {
    try {
      const updated = await upvoteSolution(solutionId);
      setSolutions((prev) =>
        prev
          .map((solution) => (solution.id === solutionId ? updated : solution))
          .sort((a, b) => (b.upvotes || 0) - (a.upvotes || 0))
      );
    } catch {
      toast.error('Failed to upvote solution');
    }
  };

  const rootComments = comments
    .filter((comment) => !comment.parent_id)
    .sort((a, b) => {
      const votes = (b.upvotes || 0) - (a.upvotes || 0);
      if (votes !== 0) return votes;
      return (new Date(b.created_at || 0).getTime() || 0) - (new Date(a.created_at || 0).getTime() || 0);
    });

  const getReplies = (parentId: number) =>
    comments
      .filter((comment) => comment.parent_id === parentId)
      .sort((a, b) => (new Date(a.created_at || 0).getTime() || 0) - (new Date(b.created_at || 0).getTime() || 0));

  const handleAIAction = async (action: 'explain' | 'summarize') => {
    if (!paper) return;
    try {
      setAiLoading(true);
      setAiMode(action);
      const response = await runStudyAI(paper.id, action);
      setAiResult(response.content);
    } catch (error: any) {
      toast.error(error?.response?.data?.detail || 'AI assistant is unavailable right now');
    } finally {
      setAiLoading(false);
    }
  };

  const handleSaveOffline = async (kind: 'paper' | 'solution') => {
    if (!paper) return;
    const sourceUrl = kind === 'paper' ? paperUrl : solutionUrl;
    if (!sourceUrl) {
      toast.error('No preview URL is available to save offline');
      return;
    }
    try {
      const cachedUrl = await saveDocumentOffline(sourceUrl, kind, paper.id);
      if (kind === 'paper') {
        setOfflinePaperUrl(cachedUrl);
      } else {
        setOfflineSolutionUrl(cachedUrl);
      }
      toast.success(`${kind === 'paper' ? 'Paper' : 'Solution'} saved for offline use`);
    } catch (error: any) {
      toast.error(error?.message || 'Failed to save document offline');
    }
  };

  if (!paper) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center">
        <h2 className="text-2xl font-bold text-[#343A40] dark:text-white mb-4">Paper Not Found</h2>
        <Button onClick={() => navigate('/search')} className="bg-[#F08A5D] hover:bg-[#e07a4d] text-white">
          Browse Papers
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Back Button */}
      <Button
        variant="ghost"
        onClick={() => navigate(-1)}
        className="mb-6 text-gray-500 hover:text-[#F08A5D]"
      >
        <ArrowLeft className="h-4 w-4 mr-2" />
        Back
      </Button>

      {/* Paper Header */}
      <Card className="mb-6 dark:bg-[#3E444A] dark:border-gray-700">
        <CardContent className="p-6">
          <div className="flex flex-wrap items-center gap-2 mb-4">
            <Badge variant="outline" className="border-[#F08A5D] text-[#F08A5D]">
              {paper.paper_type}
            </Badge>
            <VerificationBadge status={paper.verification_status} />
            <Badge variant="outline" className="dark:border-gray-600 dark:text-gray-300">
              {paper.year}
            </Badge>
            {paper.report_count && paper.report_count > 0 && (
              <Badge className="bg-red-100 text-red-700 hover:bg-red-100">
                <Flag className="h-3 w-3 mr-1" />
                Reported {paper.report_count}
              </Badge>
            )}
            {paper.is_hidden && (
              <Badge className="bg-red-100 text-red-700 hover:bg-red-100">
                Hidden from public
              </Badge>
            )}
          </div>

          <h1 className="text-2xl md:text-3xl font-bold text-[#343A40] dark:text-white mb-4">
            {paper.title}
          </h1>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600 dark:text-gray-300">
            <div className="space-y-2">
              <p className="flex items-center gap-2">
                <BookOpen className="h-4 w-4 text-[#F08A5D]" />
                <span className="font-medium">{paper.course_code}</span> - {paper.course_name}
              </p>
              <p className="flex items-center gap-2">
                <GraduationCap className="h-4 w-4 text-[#F08A5D]" />
                {paper.college}
              </p>
              <p className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-[#F08A5D]" />
                {paper.department}
              </p>
            </div>
            <div className="space-y-2">
              {paper.lecturer && (
                <p className="flex items-center gap-2">
                  <User className="h-4 w-4 text-[#F08A5D]" />
                  {paper.lecturer}
                </p>
              )}
              <p className="flex items-center gap-2">
                <Users className="h-4 w-4 text-[#F08A5D]" />
                Uploaded by {paper.uploader_display_name || `Student ${paper.user_id}`}
              </p>
              <p className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-[#F08A5D]" />
                {paper.created_at ? new Date(paper.created_at).toLocaleDateString() : 'N/A'}
              </p>
              <p className="flex items-center gap-2">
                <Download className="h-4 w-4 text-[#F08A5D]" />
                {paper.download_count || 0} downloads
              </p>
            </div>
          </div>

          {paper.description && (
            <p className="mt-4 text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-[#343A40] p-4 rounded-lg">
              {paper.description}
            </p>
          )}

          {(paperUrl || offlinePaperUrl) ? (
            <div className="mt-6 overflow-hidden rounded-xl border border-gray-200 dark:border-gray-700">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-200 bg-gray-50 p-3 dark:border-gray-700 dark:bg-[#343A40]">
                <div className="flex items-center gap-2">
                  <Button type="button" size="sm" variant="outline" onClick={() => setPdfZoom((prev) => Math.max(0.6, prev - 0.1))}>
                    <ZoomOut className="h-4 w-4" />
                  </Button>
                  <span className="min-w-16 text-center text-sm text-gray-600 dark:text-gray-300">{Math.round(pdfZoom * 100)}%</span>
                  <Button type="button" size="sm" variant="outline" onClick={() => setPdfZoom((prev) => Math.min(2, prev + 0.1))}>
                    <ZoomIn className="h-4 w-4" />
                  </Button>
                  <Button type="button" size="sm" variant="outline" onClick={() => setPdfZoom(1)}>Reset</Button>
                </div>
                <div className="flex items-center gap-2">
                  <Button type="button" size="sm" variant="outline" onClick={() => handleSaveOffline('paper')}>
                    <Save className="mr-2 h-4 w-4" />
                    Save Offline
                  </Button>
                  {offlinePaperUrl && (
                    <Badge variant="secondary" className="gap-1">
                      <WifiOff className="h-3 w-3" />
                      Offline Ready
                    </Badge>
                  )}
                  <Button type="button" size="sm" variant="outline" onClick={() => window.open(paperUrl || offlinePaperUrl!, '_blank')}>
                    <Maximize2 className="mr-2 h-4 w-4" />
                    Open Fullscreen
                  </Button>
                </div>
              </div>
              <div className="overflow-auto bg-white dark:bg-[#1a1d21]">
                <iframe
                  src={paperUrl || offlinePaperUrl!}
                  title="Paper preview"
                  className="min-h-[700px] origin-top-left bg-white dark:bg-[#1a1d21]"
                  style={{ width: `${pdfZoom * 100}%` }}
                />
              </div>
            </div>
          ) : (
            <div className="mt-6 rounded-xl border border-dashed border-gray-200 dark:border-gray-700 p-6 text-center text-gray-500 dark:text-gray-400">
              Paper preview is not available. Use the download button to view the full document.
            </div>
          )}

          <Card className="mt-6 dark:bg-[#3E444A] dark:border-gray-700">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-[#343A40] dark:text-white">
                <Sparkles className="h-5 w-5 text-[#F08A5D]" />
                AI Study Assistant
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Ask for a practical study explanation or a compact brief of what the paper discussion already uncovered.
              </p>
              <div className="flex flex-wrap gap-2">
                <Button type="button" variant="outline" onClick={() => handleAIAction('explain')} disabled={aiLoading}>
                  Explain This Paper
                </Button>
                <Button type="button" variant="outline" onClick={() => handleAIAction('summarize')} disabled={aiLoading}>
                  Summarize Discussion
                </Button>
              </div>
              <div className="rounded-lg bg-gray-50 p-4 text-sm text-gray-700 dark:bg-[#343A40] dark:text-gray-300">
                <p className="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-[#F08A5D]">
                  {aiMode === 'summarize' ? 'Discussion Brief' : aiMode === 'explain' ? 'Study Guide' : 'AI Study Assistant'}
                </p>
                <div className="whitespace-pre-wrap leading-6">
                  {aiLoading ? 'Thinking...' : aiResult || 'Use the AI assistant to get a study explanation or a summary of the current discussion and solutions.'}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex flex-wrap gap-3 mt-6">
            <Button
              onClick={handleDownload}
              className="bg-[#F08A5D] hover:bg-[#e07a4d] text-white"
              disabled={!paper.file_key}
            >
              <Download className="h-4 w-4 mr-2" />
              Download Paper
            </Button>
            {paper.solution_key && (
              <>
                <Button
                  variant="outline"
                  onClick={async () => {
                    try {
                      const downloadUrl = await getStorageDownloadUrl('papers', paper.solution_key!);
                      if (downloadUrl) {
                        window.open(downloadUrl, '_blank');
                      }
                    } catch {
                      toast.error('Solution download failed');
                    }
                  }}
                  className="dark:border-gray-600 dark:text-gray-300"
                >
                  <Lightbulb className="h-4 w-4 mr-2" />
                  Download Solution
                </Button>
                <Button variant="outline" onClick={() => handleSaveOffline('solution')}>
                  <Save className="mr-2 h-4 w-4" />
                  Save Solution Offline
                </Button>
              </>
            )}
            {user && (
              <Dialog open={reportOpen} onOpenChange={setReportOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" className="text-red-500 border-red-200 hover:bg-red-50 dark:border-red-900 dark:hover:bg-red-900/20">
                    <Flag className="h-4 w-4 mr-2" />
                    Report
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Report Paper</DialogTitle>
                    <DialogDescription>
                      Tell us why this paper should be reviewed. Your report helps moderators check
                      quality, accuracy, and policy issues.
                    </DialogDescription>
                  </DialogHeader>
                  <Textarea
                    value={reportReason}
                    onChange={(e) => setReportReason(e.target.value)}
                    placeholder="Describe the issue (e.g., wrong content, duplicate, inappropriate)..."
                    rows={4}
                  />
                  <Button
                    onClick={handleReport}
                    disabled={!reportReason.trim() || submitting}
                    className="bg-red-500 hover:bg-red-600 text-white"
                  >
                    Submit Report
                  </Button>
                </DialogContent>
              </Dialog>
            )}
          </div>

          {(solutionUrl || offlineSolutionUrl) && (
            <Card className="mt-6 dark:bg-[#3E444A] dark:border-gray-700">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-[#343A40] dark:text-white">
                  Solution Preview
                  {offlineSolutionUrl && (
                    <Badge variant="secondary" className="gap-1">
                      <WifiOff className="h-3 w-3" />
                      Offline Ready
                    </Badge>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <iframe
                  src={solutionUrl || offlineSolutionUrl!}
                  title="Solution preview"
                  className="w-full min-h-[520px] bg-white dark:bg-[#1a1d21]"
                />
              </CardContent>
            </Card>
          )}
        </CardContent>
      </Card>

      {/* Discussion & Solutions Tabs */}
      <Tabs defaultValue="discussion" className="space-y-4">
        <TabsList className="dark:bg-[#3E444A]">
          <TabsTrigger value="discussion" className="flex items-center gap-2">
            <MessageSquare className="h-4 w-4" />
            Discussion ({comments.length})
          </TabsTrigger>
          <TabsTrigger value="solutions" className="flex items-center gap-2">
            <Lightbulb className="h-4 w-4" />
            Solutions ({solutions.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="discussion">
          {/* New Comment */}
          {user ? (
            <Card className="mb-4 dark:bg-[#3E444A] dark:border-gray-700">
              <CardContent className="p-4">
                <Textarea
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="Share your thoughts, ask a question, or help others..."
                  rows={3}
                  className="mb-3 dark:bg-[#343A40] dark:border-gray-600"
                />
                <Button
                  onClick={handleSubmitComment}
                  disabled={!newComment.trim() || submitting}
                  className="bg-[#F08A5D] hover:bg-[#e07a4d] text-white"
                  size="sm"
                >
                  <Send className="h-4 w-4 mr-2" />
                  Post Comment
                </Button>
              </CardContent>
            </Card>
          ) : (
            <Card className="mb-4 dark:bg-[#3E444A] dark:border-gray-700">
              <CardContent className="p-4 text-center text-gray-500 dark:text-gray-400">
                <p>Sign in to join the discussion</p>
              </CardContent>
            </Card>
          )}

          {/* Comments List */}
          {comments.length === 0 ? (
            <Card className="dark:bg-[#3E444A] dark:border-gray-700">
              <CardContent className="p-8 text-center text-gray-500 dark:text-gray-400">
                <MessageSquare className="h-12 w-12 mx-auto mb-3 opacity-30" />
                <p>No comments yet. Be the first to start a discussion!</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {rootComments.map((comment) => (
                <Card key={comment.id} className="dark:bg-[#3E444A] dark:border-gray-700">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-8 h-8 rounded-full bg-[#F08A5D]/20 flex items-center justify-center">
                        <User className="h-4 w-4 text-[#F08A5D]" />
                      </div>
                      <span className="text-sm font-medium text-[#343A40] dark:text-white">Student</span>
                      <span className="text-xs text-gray-400">
                        {comment.created_at ? new Date(comment.created_at).toLocaleDateString() : ''}
                      </span>
                    </div>
                    <p className="text-sm text-gray-700 dark:text-gray-300 pl-10">{comment.content}</p>
                    <div className="mt-3 flex items-center gap-2 pl-10">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleCommentVote(comment.id)}
                        className="h-8 px-2 text-gray-500 hover:text-[#F08A5D]"
                      >
                        <ChevronUp className="mr-1 h-4 w-4" />
                        {comment.upvotes || 0}
                      </Button>
                      {user && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setReplyTarget(replyTarget === comment.id ? null : comment.id)}
                          className="h-8 px-2 text-gray-500 hover:text-[#F08A5D]"
                        >
                          <Reply className="mr-1 h-4 w-4" />
                          Reply
                        </Button>
                      )}
                    </div>
                    {replyTarget === comment.id && (
                      <div className="mt-3 pl-10">
                        <Textarea
                          value={replyDraft}
                          onChange={(e) => setReplyDraft(e.target.value)}
                          placeholder="Write a reply..."
                          rows={2}
                          className="mb-2 dark:bg-[#343A40] dark:border-gray-600"
                        />
                        <Button
                          size="sm"
                          onClick={() => handleReplySubmit(comment.id)}
                          disabled={!replyDraft.trim() || submitting}
                          className="bg-[#F08A5D] hover:bg-[#e07a4d] text-white"
                        >
                          Reply
                        </Button>
                      </div>
                    )}
                    {getReplies(comment.id).length > 0 && (
                      <div className="mt-4 space-y-2 pl-10">
                        {getReplies(comment.id).map((reply) => (
                          <div
                            key={reply.id}
                            className="rounded-lg border border-gray-200 bg-gray-50 p-3 dark:border-gray-700 dark:bg-[#343A40]"
                          >
                            <div className="mb-1 flex items-center gap-2">
                              <span className="text-xs font-medium text-[#343A40] dark:text-white">Reply</span>
                              <span className="text-xs text-gray-400">
                                {reply.created_at ? new Date(reply.created_at).toLocaleDateString() : ''}
                              </span>
                            </div>
                            <p className="text-sm text-gray-700 dark:text-gray-300">{reply.content}</p>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleCommentVote(reply.id)}
                              className="mt-2 h-8 px-2 text-gray-500 hover:text-[#F08A5D]"
                            >
                              <ChevronUp className="mr-1 h-4 w-4" />
                              {reply.upvotes || 0}
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="solutions">
          {/* New Solution */}
          {user ? (
            <Card className="mb-4 dark:bg-[#3E444A] dark:border-gray-700">
              <CardHeader>
                <CardTitle className="text-lg dark:text-white">Submit a Solution</CardTitle>
              </CardHeader>
              <CardContent>
                <Textarea
                  value={newSolution}
                  onChange={(e) => setNewSolution(e.target.value)}
                  placeholder="Write your solution or explanation here..."
                  rows={5}
                  className="mb-3 dark:bg-[#343A40] dark:border-gray-600"
                />
                <Button
                  onClick={handleSubmitSolution}
                  disabled={!newSolution.trim() || submitting}
                  className="bg-[#F08A5D] hover:bg-[#e07a4d] text-white"
                  size="sm"
                >
                  <Lightbulb className="h-4 w-4 mr-2" />
                  Submit Solution
                </Button>
              </CardContent>
            </Card>
          ) : (
            <Card className="mb-4 dark:bg-[#3E444A] dark:border-gray-700">
              <CardContent className="p-4 text-center text-gray-500 dark:text-gray-400">
                <p>Sign in to submit a solution</p>
              </CardContent>
            </Card>
          )}

          {/* Solutions List */}
          {solutions.length === 0 ? (
            <Card className="dark:bg-[#3E444A] dark:border-gray-700">
              <CardContent className="p-8 text-center text-gray-500 dark:text-gray-400">
                <Lightbulb className="h-12 w-12 mx-auto mb-3 opacity-30" />
                <p>No solutions yet. Be the first to help!</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {solutions.map((solution) => (
                <Card key={solution.id} className="dark:bg-[#3E444A] dark:border-gray-700">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-8 h-8 rounded-full bg-[#F08A5D]/20 flex items-center justify-center">
                        <User className="h-4 w-4 text-[#F08A5D]" />
                      </div>
                      <span className="text-sm font-medium text-[#343A40] dark:text-white">Contributor</span>
                      {solution.is_best && (
                        <Badge className="bg-green-100 text-green-700 hover:bg-green-100">Best Answer</Badge>
                      )}
                      <span className="text-xs text-gray-400 ml-auto">
                        {solution.created_at ? new Date(solution.created_at).toLocaleDateString() : ''}
                      </span>
                    </div>
                    <p className="text-sm text-gray-700 dark:text-gray-300 pl-10 whitespace-pre-wrap">
                      {solution.content}
                    </p>
                    <div className="mt-3 pl-10">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleSolutionVote(solution.id)}
                        className="h-8 px-2 text-gray-500 hover:text-[#F08A5D]"
                      >
                        <ChevronUp className="mr-1 h-4 w-4" />
                        {solution.upvotes || 0}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
