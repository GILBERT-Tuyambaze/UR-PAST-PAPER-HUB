import { ChangeEvent, FormEvent, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Camera } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import AuthShowcase from '../components/AuthShowcase';
import { updateUserProfile, uploadFileObject } from '../lib/client';
import { authApi } from '../lib/auth';
import {
  buildProfilePictureObjectKey,
  createEmptyProfileForm,
  institutionTypeOptions,
  normalizeOptionalField,
  publicAccountRoleOptions,
  yearOfStudyOptions,
  type ProfileFormValues,
  type PublicAccountRole,
} from '../lib/profile-form';

export default function RegisterPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const returnTo = searchParams.get('returnTo') || '/';
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [accountRole, setAccountRole] = useState<PublicAccountRole>('normal');
  const [profileForm, setProfileForm] = useState<ProfileFormValues>(createEmptyProfileForm());
  const [profileImageFile, setProfileImageFile] = useState<File | null>(null);
  const [profileImagePreview, setProfileImagePreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const updateField = <K extends keyof ProfileFormValues>(field: K, value: ProfileFormValues[K]) => {
    setProfileForm((prev) => {
      const next = { ...prev, [field]: value };
      if (field === 'institution_type') {
        if (value === 'ur_student') {
          next.university_name = 'University of Rwanda';
        } else if (prev.university_name === 'University of Rwanda') {
          next.university_name = '';
        }
      }
      return next;
    });
  };

  const handleProfileImageChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] || null;
    setProfileImageFile(file);

    if (profileImagePreview?.startsWith('blob:')) {
      URL.revokeObjectURL(profileImagePreview);
    }

    if (!file) {
      setProfileImagePreview(null);
      return;
    }

    setProfileImagePreview(URL.createObjectURL(file));
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setError(null);

    const displayName = profileForm.display_name.trim();
    const isUrStudent = profileForm.institution_type === 'ur_student';
    const universityName = profileForm.university_name.trim();
    const urStudentCode = profileForm.ur_student_code.trim();

    if (!displayName) {
      setError('Full name is required.');
      setLoading(false);
      return;
    }

    if (isUrStudent && !urStudentCode) {
      setError('UR student code is required if you want UR verification.');
      setLoading(false);
      return;
    }

    if (!isUrStudent && !universityName) {
      setError('University name is required when you select another university.');
      setLoading(false);
      return;
    }

    try {
      await authApi.registerWithCredentials({
        name: displayName,
        email,
        password,
        role: accountRole,
        institution_type: profileForm.institution_type,
        university_name: isUrStudent ? 'University of Rwanda' : universityName,
        ur_student_code: isUrStudent ? urStudentCode : undefined,
        phone_number: normalizeOptionalField(profileForm.phone_number),
        college_name: normalizeOptionalField(profileForm.college_name),
        department_name: normalizeOptionalField(profileForm.department_name),
        year_of_study: normalizeOptionalField(profileForm.year_of_study),
        bio: normalizeOptionalField(profileForm.bio),
      });

      if (profileImageFile) {
        try {
          const currentUser = await authApi.getCurrentUser();
          if (currentUser?.id) {
            const objectKey = buildProfilePictureObjectKey(currentUser.id, profileImageFile.name);
            const storedKey = await uploadFileObject('profiles', objectKey, profileImageFile);
            await updateUserProfile({ profile_picture_key: storedKey });
          }
        } catch (uploadError) {
          console.error('Profile image upload failed:', uploadError);
        }
      }

      window.location.replace(returnTo);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Registration failed, please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen overflow-hidden bg-[linear-gradient(135deg,_#fff8f2_0%,_#f6f8ff_50%,_#eefaf7_100%)] px-4 py-8 dark:bg-[linear-gradient(135deg,_#0f172a_0%,_#111827_45%,_#0b1120_100%)] md:px-8 md:py-10">
      <div className="mx-auto grid min-h-[calc(100vh-4rem)] max-w-7xl gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <AuthShowcase />

        <div className="flex items-center justify-center">
          <div className="w-full max-w-2xl rounded-[2rem] border border-slate-200/80 bg-white/90 p-8 shadow-2xl backdrop-blur dark:border-white/10 dark:bg-[#111827]/90 md:p-10">
            <div className="mb-8">
              <p className="mb-3 text-xs font-semibold uppercase tracking-[0.28em] text-[#F08A5D]">Join the hub</p>
              <h1 className="text-3xl font-bold text-slate-900 dark:text-white md:text-4xl">Build your student profile</h1>
              <p className="mt-3 text-sm leading-6 text-slate-600 dark:text-white/70">
                We collect a richer profile so contributors can be identified correctly, verified when needed, and supported with more relevant features.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="rounded-2xl border border-slate-200/80 bg-slate-50/80 p-4 dark:border-white/10 dark:bg-white/5">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                  <div className="flex h-24 w-24 items-center justify-center overflow-hidden rounded-3xl bg-slate-200 text-2xl font-semibold text-slate-600 dark:bg-[#0f172a] dark:text-white/80">
                    {profileImagePreview ? (
                      <img src={profileImagePreview} alt="Profile preview" className="h-full w-full object-cover" />
                    ) : (
                      displayNameInitials(profileForm.display_name)
                    )}
                  </div>
                  <div className="flex-1">
                    <Label htmlFor="profile-image" className="text-slate-700 dark:text-white/85">Profile picture</Label>
                    <div className="mt-2 flex items-center gap-3">
                      <Input
                        id="profile-image"
                        type="file"
                        accept="image/*"
                        onChange={handleProfileImageChange}
                        className="h-12 rounded-xl border-slate-200 bg-white dark:border-white/10 dark:bg-[#0f172a] dark:text-white"
                      />
                      <div className="hidden rounded-xl bg-[#F08A5D]/10 px-3 py-2 text-xs font-medium text-[#F08A5D] sm:flex sm:items-center sm:gap-2">
                        <Camera className="h-4 w-4" />
                        Optional
                      </div>
                    </div>
                    <p className="mt-2 text-xs text-slate-500 dark:text-white/55">
                      Add a face or logo so your profile is easier to recognize in the community.
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid gap-5 md:grid-cols-2">
                <div className="md:col-span-2">
                  <Label className="text-slate-700 dark:text-white/85">Account type</Label>
                  <Select value={accountRole} onValueChange={(value) => setAccountRole(value as PublicAccountRole)}>
                    <SelectTrigger className="mt-2 h-12 rounded-xl border-slate-200 bg-white dark:border-white/10 dark:bg-[#0f172a] dark:text-white">
                      <SelectValue placeholder="Choose how you contribute" />
                    </SelectTrigger>
                    <SelectContent>
                      {publicAccountRoleOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="mt-2 text-xs text-slate-500 dark:text-white/55">
                    {publicAccountRoleOptions.find((option) => option.value === accountRole)?.description}
                  </p>
                  <p className="mt-1 text-xs text-slate-500 dark:text-white/45">
                    Admin and content manager accounts are assigned later by the management team.
                  </p>
                </div>

                <div>
                  <Label htmlFor="display_name" className="text-slate-700 dark:text-white/85">Full Name</Label>
                  <Input
                    id="display_name"
                    type="text"
                    value={profileForm.display_name}
                    onChange={(event) => updateField('display_name', event.target.value)}
                    placeholder="Your full name"
                    required
                    className="mt-2 h-12 rounded-xl border-slate-200 bg-white dark:border-white/10 dark:bg-[#0f172a] dark:text-white"
                  />
                </div>

                <div>
                  <Label htmlFor="email" className="text-slate-700 dark:text-white/85">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    placeholder="you@example.com"
                    required
                    className="mt-2 h-12 rounded-xl border-slate-200 bg-white dark:border-white/10 dark:bg-[#0f172a] dark:text-white"
                  />
                </div>

                <div>
                  <Label htmlFor="password" className="text-slate-700 dark:text-white/85">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    placeholder="Create a password"
                    required
                    className="mt-2 h-12 rounded-xl border-slate-200 bg-white dark:border-white/10 dark:bg-[#0f172a] dark:text-white"
                  />
                </div>

                <div>
                  <Label className="text-slate-700 dark:text-white/85">Student type</Label>
                  <Select
                    value={profileForm.institution_type}
                    onValueChange={(value) => updateField('institution_type', value as ProfileFormValues['institution_type'])}
                  >
                    <SelectTrigger className="mt-2 h-12 rounded-xl border-slate-200 bg-white dark:border-white/10 dark:bg-[#0f172a] dark:text-white">
                      <SelectValue placeholder="Choose your institution type" />
                    </SelectTrigger>
                    <SelectContent>
                      {institutionTypeOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="university_name" className="text-slate-700 dark:text-white/85">University</Label>
                  <Input
                    id="university_name"
                    type="text"
                    value={profileForm.institution_type === 'ur_student' ? 'University of Rwanda' : profileForm.university_name}
                    onChange={(event) => updateField('university_name', event.target.value)}
                    placeholder="University name"
                    disabled={profileForm.institution_type === 'ur_student'}
                    className="mt-2 h-12 rounded-xl border-slate-200 bg-white dark:border-white/10 dark:bg-[#0f172a] dark:text-white disabled:opacity-80"
                  />
                </div>

                <div>
                  <Label htmlFor="ur_student_code" className="text-slate-700 dark:text-white/85">UR Student Code</Label>
                  <Input
                    id="ur_student_code"
                    type="text"
                    value={profileForm.ur_student_code}
                    onChange={(event) => updateField('ur_student_code', event.target.value)}
                    placeholder={profileForm.institution_type === 'ur_student' ? 'Required for UR verification' : 'Not required'}
                    disabled={profileForm.institution_type !== 'ur_student'}
                    className="mt-2 h-12 rounded-xl border-slate-200 bg-white dark:border-white/10 dark:bg-[#0f172a] dark:text-white disabled:opacity-60"
                  />
                </div>

                <div>
                  <Label htmlFor="phone_number" className="text-slate-700 dark:text-white/85">Phone Number</Label>
                  <Input
                    id="phone_number"
                    type="tel"
                    value={profileForm.phone_number}
                    onChange={(event) => updateField('phone_number', event.target.value)}
                    placeholder="+250..."
                    className="mt-2 h-12 rounded-xl border-slate-200 bg-white dark:border-white/10 dark:bg-[#0f172a] dark:text-white"
                  />
                </div>

                <div>
                  <Label htmlFor="college_name" className="text-slate-700 dark:text-white/85">College</Label>
                  <Input
                    id="college_name"
                    type="text"
                    value={profileForm.college_name}
                    onChange={(event) => updateField('college_name', event.target.value)}
                    placeholder="College or faculty"
                    className="mt-2 h-12 rounded-xl border-slate-200 bg-white dark:border-white/10 dark:bg-[#0f172a] dark:text-white"
                  />
                </div>

                <div>
                  <Label htmlFor="department_name" className="text-slate-700 dark:text-white/85">Department</Label>
                  <Input
                    id="department_name"
                    type="text"
                    value={profileForm.department_name}
                    onChange={(event) => updateField('department_name', event.target.value)}
                    placeholder="Department or program"
                    className="mt-2 h-12 rounded-xl border-slate-200 bg-white dark:border-white/10 dark:bg-[#0f172a] dark:text-white"
                  />
                </div>

                <div>
                  <Label className="text-slate-700 dark:text-white/85">Year of study</Label>
                  <Select value={profileForm.year_of_study} onValueChange={(value) => updateField('year_of_study', value)}>
                    <SelectTrigger className="mt-2 h-12 rounded-xl border-slate-200 bg-white dark:border-white/10 dark:bg-[#0f172a] dark:text-white">
                      <SelectValue placeholder="Select your current year" />
                    </SelectTrigger>
                    <SelectContent>
                      {yearOfStudyOptions.map((option) => (
                        <SelectItem key={option} value={option}>
                          {option}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label htmlFor="bio" className="text-slate-700 dark:text-white/85">Short Bio</Label>
                <Textarea
                  id="bio"
                  value={profileForm.bio}
                  onChange={(event) => updateField('bio', event.target.value)}
                  placeholder="Tell the community what you study or what you like contributing."
                  className="mt-2 min-h-[110px] rounded-2xl border-slate-200 bg-white dark:border-white/10 dark:bg-[#0f172a] dark:text-white"
                />
              </div>

              <div className="rounded-2xl bg-amber-50 px-4 py-4 text-sm text-amber-700 dark:bg-amber-500/10 dark:text-amber-200">
                If you register as a University of Rwanda student, your UR student code is required and your verification status will start as pending until it is reviewed.
              </div>

              {error && <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600 dark:bg-red-950/40 dark:text-red-300">{error}</p>}

              <Button
                type="submit"
                className="h-12 w-full rounded-xl bg-[#F08A5D] text-white hover:bg-[#e07a4d]"
                disabled={loading}
              >
                {loading ? 'Creating account...' : 'Create account'}
              </Button>
            </form>

            <div className="mt-6 rounded-2xl bg-slate-50 px-4 py-4 text-sm text-slate-600 dark:bg-white/5 dark:text-white/75">
              <p>
                Already have an account?{' '}
                <button
                  type="button"
                  onClick={() => navigate(`/login?returnTo=${encodeURIComponent(returnTo)}`)}
                  className="font-semibold text-[#F08A5D] underline underline-offset-4"
                >
                  Sign in
                </button>
              </p>
              <p className="mt-2 text-xs text-slate-500 dark:text-white/50">
                Your profile details help us verify contributors and build better community trust.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function displayNameInitials(name: string) {
  const parts = name
    .split(' ')
    .map((part) => part.trim())
    .filter(Boolean)
    .slice(0, 2);

  if (parts.length === 0) {
    return 'UR';
  }

  return parts.map((part) => part[0]?.toUpperCase() || '').join('');
}
