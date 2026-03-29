import { useState, useEffect, type DragEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPaper, fetchAllPapers, fetchUserProfile, uploadFileObject, type Paper, type UserProfile } from '../lib/client';
import { authApi } from '../lib/auth';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Upload as UploadIcon, FileText, ArrowLeft, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';

const COLLEGES = [
  'College of Science and Technology',
  'College of Arts and Social Sciences',
  'College of Business and Economics',
  'College of Medicine and Health Sciences',
  'College of Agriculture and Veterinary Medicine',
  'College of Education',
];

const PAPER_TYPES = ['Exam', 'CAT', 'Assignment', 'GroupWork'];

const DEPARTMENTS: Record<string, string[]> = {
  'College of Science and Technology': ['Computer Science', 'Mathematics', 'Physics', 'Civil Engineering', 'Electrical Engineering', 'Mechanical Engineering'],
  'College of Arts and Social Sciences': ['Political Science', 'History', 'Journalism', 'Social Work', 'Law'],
  'College of Business and Economics': ['Accounting', 'Finance', 'Marketing', 'Economics', 'Management'],
  'College of Medicine and Health Sciences': ['Medicine', 'Pharmacy', 'Nursing', 'Public Health', 'Dentistry'],
  'College of Agriculture and Veterinary Medicine': ['Agriculture', 'Veterinary Medicine', 'Food Science', 'Forestry'],
  'College of Education': ['Educational Psychology', 'Curriculum Studies', 'Early Childhood Education', 'Science Education'],
};

const YEARS = [2026, 2025, 2024, 2023, 2022, 2021, 2020, 2019, 2018];

export default function UploadPage() {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [paperCatalog, setPaperCatalog] = useState<Paper[]>([]);

  const [title, setTitle] = useState('');
  const [courseCode, setCourseCode] = useState('');
  const [courseName, setCourseName] = useState('');
  const [college, setCollege] = useState('');
  const [department, setDepartment] = useState('');
  const [year, setYear] = useState('');
  const [paperType, setPaperType] = useState('');
  const [lecturer, setLecturer] = useState('');
  const [description, setDescription] = useState('');
  const [paperFile, setPaperFile] = useState<File | null>(null);
  const [solutionFile, setSolutionFile] = useState<File | null>(null);
  const [paperDragActive, setPaperDragActive] = useState(false);
  const [solutionDragActive, setSolutionDragActive] = useState(false);

  const handleDragOver = (
    event: DragEvent<HTMLDivElement>,
    setActive: React.Dispatch<React.SetStateAction<boolean>>
  ) => {
    event.preventDefault();
    event.stopPropagation();
    setActive(true);
  };

  const handleDragLeave = (
    event: DragEvent<HTMLDivElement>,
    setActive: React.Dispatch<React.SetStateAction<boolean>>
  ) => {
    event.preventDefault();
    event.stopPropagation();
    setActive(false);
  };

  const handleDropFile = (
    event: DragEvent<HTMLDivElement>,
    setFile: React.Dispatch<React.SetStateAction<File | null>>,
    setActive: React.Dispatch<React.SetStateAction<boolean>>
  ) => {
    event.preventDefault();
    event.stopPropagation();
    setActive(false);
    const file = event.dataTransfer.files?.[0];
    if (file) {
      setFile(file);
    }
  };

  useEffect(() => {
    if (!user) return;
    void loadProfileAndSuggestions();
  }, [user]);

  const loadProfileAndSuggestions = async () => {
    try {
      const [profileData, paperData] = await Promise.all([
        fetchUserProfile(),
        fetchAllPapers({ sort: '-created_at', limit: 200 }),
      ]);
      setProfile(profileData);
      setPaperCatalog(paperData.items);
    } catch (error) {
      console.error('Failed to load upload helpers:', error);
    }
  };

  const inferVerificationStatus = () => {
    if (!profile) return 'unverified';
    if (['admin', 'content_manager', 'cp', 'lecturer'].includes(profile.role)) {
      return 'verified';
    }
    if (profile.role === 'verified_contributor' || (profile.trust_score || 0) >= 50) {
      return 'community';
    }
    return 'unverified';
  };

  const matchingSuggestions = paperCatalog.filter(
    (paper) =>
      !courseCode ||
      paper.course_code.toLowerCase().includes(courseCode.toLowerCase()) ||
      paper.course_name.toLowerCase().includes(courseCode.toLowerCase())
  ).slice(0, 8);

  const applySuggestion = (paper: Paper) => {
    setCourseCode(paper.course_code);
    setCourseName(paper.course_name);
    setCollege(paper.college);
    setDepartment(paper.department);
    setPaperType(paper.paper_type);
    setLecturer(paper.lecturer || '');
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    if (!title || !courseCode || !courseName || !college || !department || !year || !paperType) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      setSubmitting(true);

      let fileKey = '';
      let solutionKey = '';

      // Upload paper file
      if (paperFile) {
        const objectKey = `${courseCode}_${paperType}_${year}_${Date.now()}.pdf`;
        try {
          await uploadFileObject('papers', objectKey, paperFile);
          fileKey = objectKey;
        } catch (err) {
          console.error('File upload failed:', err);
          toast.error('File upload failed');
          return;
        }
      }

      // Upload solution file
      if (solutionFile) {
        const solKey = `solutions/${courseCode}_${paperType}_${year}_sol_${Date.now()}.pdf`;
        try {
          await uploadFileObject('papers', solKey, solutionFile);
          solutionKey = solKey;
        } catch (err) {
          console.error('Solution upload failed:', err);
        }
      }

      // Create paper record
      await createPaper({
        title,
        course_code: courseCode.toUpperCase(),
        course_name: courseName,
        college,
        department,
        year: parseInt(year),
        paper_type: paperType,
        lecturer: lecturer || undefined,
        description: description || undefined,
        file_key: fileKey || undefined,
        solution_key: solutionKey || undefined,
        verification_status: inferVerificationStatus(),
        download_count: 0,
        report_count: 0,
        is_hidden: false,
      });

      setSuccess(true);
      toast.success('Paper uploaded successfully!');
    } catch (err) {
      console.error('Upload failed:', err);
      toast.error('Failed to upload paper');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#F08A5D]" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center">
        <img
          src="/upload-placeholder.svg"
          alt="Upload"
          className="w-48 h-48 mx-auto mb-6 rounded-lg opacity-80"
        />
        <h2 className="text-2xl font-bold text-[#343A40] dark:text-white mb-4">Sign In Required</h2>
        <p className="text-gray-500 dark:text-gray-400 mb-6">
          You need to sign in to upload papers and contribute to the community.
        </p>
        <Button
          onClick={() => authApi.login('/upload')}
          className="bg-[#F08A5D] hover:bg-[#e07a4d] text-white"
        >
          Sign In to Upload
        </Button>
      </div>
    );
  }

  if (success) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center">
        <div className="w-20 h-20 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mx-auto mb-6">
          <CheckCircle className="h-10 w-10 text-green-600" />
        </div>
        <h2 className="text-2xl font-bold text-[#343A40] dark:text-white mb-4">Upload Successful!</h2>
        <p className="text-gray-500 dark:text-gray-400 mb-6">
          Your paper has been submitted with a {inferVerificationStatus()} verification status. Thank you for contributing!
        </p>
        <div className="flex gap-3 justify-center">
          <Button onClick={() => { setSuccess(false); setTitle(''); setCourseCode(''); setCourseName(''); setCollege(''); setDepartment(''); setYear(''); setPaperType(''); setLecturer(''); setDescription(''); setPaperFile(null); setSolutionFile(null); }} variant="outline" className="dark:border-gray-600 dark:text-gray-300">
            Upload Another
          </Button>
          <Button onClick={() => navigate('/dashboard')} className="bg-[#F08A5D] hover:bg-[#e07a4d] text-white">
            Go to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <Button variant="ghost" onClick={() => navigate(-1)} className="mb-6 text-gray-500 hover:text-[#F08A5D]">
        <ArrowLeft className="h-4 w-4 mr-2" />
        Back
      </Button>

      <Card className="dark:bg-[#3E444A] dark:border-gray-700">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-[#343A40] dark:text-white">
            <UploadIcon className="h-6 w-6 text-[#F08A5D]" />
            Upload Past Paper
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleUpload} className="space-y-6">
            {/* Title */}
            <div>
              <Label htmlFor="title" className="dark:text-gray-300">Paper Title *</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g., Data Structures - Final Exam 2024"
                className="mt-1 dark:bg-[#343A40] dark:border-gray-600"
                required
              />
            </div>

            {/* Course Info */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="courseCode" className="dark:text-gray-300">Course Code *</Label>
                <Input
                  id="courseCode"
                  value={courseCode}
                  onChange={(e) => setCourseCode(e.target.value)}
                  placeholder="e.g., CSC2101"
                  className="mt-1 dark:bg-[#343A40] dark:border-gray-600"
                  required
                />
              </div>
              <div>
                <Label htmlFor="courseName" className="dark:text-gray-300">Course Name *</Label>
                <Input
                  id="courseName"
                  value={courseName}
                  onChange={(e) => setCourseName(e.target.value)}
                  placeholder="e.g., Data Structures and Algorithms"
                  className="mt-1 dark:bg-[#343A40] dark:border-gray-600"
                  required
                />
              </div>
            </div>

            {matchingSuggestions.length > 0 && (
              <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-[#343A40]">
                <p className="mb-3 text-sm font-medium text-[#343A40] dark:text-white">Auto-suggested course details</p>
                <div className="flex flex-wrap gap-2">
                  {matchingSuggestions.map((paper) => (
                    <button
                      key={paper.id}
                      type="button"
                      onClick={() => applySuggestion(paper)}
                      className="rounded-full border border-[#F08A5D]/40 px-3 py-1 text-xs text-[#343A40] transition-colors hover:bg-[#F08A5D] hover:text-white dark:text-white"
                    >
                      {paper.course_code} · {paper.course_name}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* College & Department */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label className="dark:text-gray-300">College *</Label>
                <Select value={college} onValueChange={(val) => { setCollege(val); setDepartment(''); }}>
                  <SelectTrigger className="mt-1 bg-white dark:bg-[#343A40] dark:border-gray-600">
                    <SelectValue placeholder="Select College" />
                  </SelectTrigger>
                  <SelectContent className="bg-white text-[#343A40] dark:bg-[#343A40] dark:border-gray-600 dark:text-white">
                    {COLLEGES.map((c) => (
                      <SelectItem key={c} value={c}>{c.replace('College of ', '')}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="dark:text-gray-300">Department *</Label>
                <Select value={department} onValueChange={setDepartment} disabled={!college}>
                  <SelectTrigger className="mt-1 bg-white dark:bg-[#343A40] dark:border-gray-600">
                    <SelectValue placeholder="Select Department" />
                  </SelectTrigger>
                  <SelectContent className="bg-white text-[#343A40] dark:bg-[#343A40] dark:border-gray-600 dark:text-white">
                    {(DEPARTMENTS[college] || []).map((d) => (
                      <SelectItem key={d} value={d}>{d}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Year & Type */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label className="dark:text-gray-300">Academic Year *</Label>
                <Select value={year} onValueChange={setYear}>
                  <SelectTrigger className="mt-1 bg-white dark:bg-[#343A40] dark:border-gray-600">
                    <SelectValue placeholder="Select Year" />
                  </SelectTrigger>
                  <SelectContent className="bg-white text-[#343A40] dark:bg-[#343A40] dark:border-gray-600 dark:text-white">
                    {YEARS.map((y) => (
                      <SelectItem key={y} value={String(y)}>{y}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="dark:text-gray-300">Paper Type *</Label>
                <Select value={paperType} onValueChange={setPaperType}>
                  <SelectTrigger className="mt-1 bg-white dark:bg-[#343A40] dark:border-gray-600">
                    <SelectValue placeholder="Select Type" />
                  </SelectTrigger>
                  <SelectContent className="bg-white text-[#343A40] dark:bg-[#343A40] dark:border-gray-600 dark:text-white">
                    {PAPER_TYPES.map((t) => (
                      <SelectItem key={t} value={t}>{t}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Lecturer */}
            <div>
              <Label htmlFor="lecturer" className="dark:text-gray-300">Lecturer (Optional)</Label>
              <Input
                id="lecturer"
                value={lecturer}
                onChange={(e) => setLecturer(e.target.value)}
                placeholder="e.g., Dr. Jean Baptiste Uwimana"
                className="mt-1 dark:bg-[#343A40] dark:border-gray-600"
              />
            </div>

            {/* Description */}
            <div>
              <Label htmlFor="description" className="dark:text-gray-300">Description (Optional)</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Brief description of the paper content..."
                rows={3}
                className="mt-1 dark:bg-[#343A40] dark:border-gray-600"
              />
            </div>

            <div className="rounded-lg border border-dashed border-[#F08A5D]/40 bg-[#FFF8F3] p-4 dark:bg-[#2f2620]">
              <p className="text-sm font-medium text-[#343A40] dark:text-white">Upload status preview</p>
              <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">
                This upload will be marked as <span className="font-semibold">{inferVerificationStatus()}</span>
                {profile ? ` based on your role "${profile.role}" and trust score ${profile.trust_score || 0}.` : '.'}
              </p>
            </div>

            {/* File Uploads */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label className="dark:text-gray-300">Paper File (PDF)</Label>
                <div
                  className={`mt-1 border-2 border-dashed rounded-lg p-4 text-center transition-colors cursor-pointer ${
                    paperDragActive
                      ? 'border-[#F08A5D] bg-[#FFF4E6] dark:bg-[#3b2e1f]'
                      : 'border-gray-300 dark:border-gray-600 hover:border-[#F08A5D]'
                  }`}
                  onDragOver={(e) => handleDragOver(e, setPaperDragActive)}
                  onDragEnter={(e) => handleDragOver(e, setPaperDragActive)}
                  onDragLeave={(e) => handleDragLeave(e, setPaperDragActive)}
                  onDrop={(e) => handleDropFile(e, setPaperFile, setPaperDragActive)}
                >
                  <input
                    type="file"
                    accept=".pdf"
                    onChange={(e) => setPaperFile(e.target.files?.[0] || null)}
                    className="hidden"
                    id="paperFile"
                  />
                  <label htmlFor="paperFile" className="cursor-pointer">
                    <FileText className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {paperFile ? paperFile.name : 'Click to upload paper'}
                    </p>
                  </label>
                </div>
              </div>
              <div>
                <Label className="dark:text-gray-300">Solution File (Optional)</Label>
                <div
                  className={`mt-1 border-2 border-dashed rounded-lg p-4 text-center transition-colors cursor-pointer ${
                    solutionDragActive
                      ? 'border-[#F08A5D] bg-[#FFF4E6] dark:bg-[#3b2e1f]'
                      : 'border-gray-300 dark:border-gray-600 hover:border-[#F08A5D]'
                  }`}
                  onDragOver={(e) => handleDragOver(e, setSolutionDragActive)}
                  onDragEnter={(e) => handleDragOver(e, setSolutionDragActive)}
                  onDragLeave={(e) => handleDragLeave(e, setSolutionDragActive)}
                  onDrop={(e) => handleDropFile(e, setSolutionFile, setSolutionDragActive)}
                >
                  <input
                    type="file"
                    accept=".pdf"
                    onChange={(e) => setSolutionFile(e.target.files?.[0] || null)}
                    className="hidden"
                    id="solutionFile"
                  />
                  <label htmlFor="solutionFile" className="cursor-pointer">
                    <FileText className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {solutionFile ? solutionFile.name : 'Click to upload solution'}
                    </p>
                  </label>
                </div>
              </div>
            </div>

            <Button
              type="submit"
              disabled={submitting}
              className="w-full bg-[#F08A5D] hover:bg-[#e07a4d] text-white h-12 text-lg"
            >
              {submitting ? (
                <div className="flex items-center gap-2">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white" />
                  Uploading...
                </div>
              ) : (
                <>
                  <UploadIcon className="h-5 w-5 mr-2" />
                  Upload Paper
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
