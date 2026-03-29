import { ChangeEvent, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  fetchUserProfile,
  getStorageDownloadUrl,
  updateUserProfile,
  uploadFileObject,
  type UserProfile,
} from '../lib/client';
import { authApi } from '../lib/auth';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { BadgeCheck, Camera, Pencil, School, ShieldCheck } from 'lucide-react';
import { toast } from 'sonner';
import {
  buildProfilePictureObjectKey,
  createEmptyProfileForm,
  institutionTypeOptions,
  normalizeOptionalField,
  yearOfStudyOptions,
  type ProfileFormValues,
} from '../lib/profile-form';

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

function URVerificationBadge({ status }: { status?: string | null }) {
  if (status === 'verified') {
    return (
      <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100">
        <BadgeCheck className="mr-1 h-3 w-3" />
        UR verified
      </Badge>
    );
  }
  if (status === 'pending') {
    return <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100">UR review pending</Badge>;
  }
  if (status === 'rejected') {
    return <Badge className="bg-red-100 text-red-700 hover:bg-red-100">UR verification rejected</Badge>;
  }
  return <Badge className="bg-slate-100 text-slate-700 hover:bg-slate-100">No UR verification</Badge>;
}

function profileFormFromProfile(profile: UserProfile, fallbackName: string): ProfileFormValues {
  const inferredInstitutionType =
    profile.institution_type || (profile.ur_student_code ? 'ur_student' : 'other_university');

  return {
    display_name: profile.display_name || fallbackName,
    institution_type: inferredInstitutionType,
    university_name:
      inferredInstitutionType === 'ur_student'
        ? 'University of Rwanda'
        : profile.university_name || '',
    ur_student_code: profile.ur_student_code || '',
    phone_number: profile.phone_number || '',
    college_name: profile.college_name || '',
    department_name: profile.department_name || '',
    year_of_study: profile.year_of_study || '',
    bio: profile.bio || '',
  };
}

export default function ProfilePage() {
  const navigate = useNavigate();
  const { user, loading: authLoading, refetch } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [profileForm, setProfileForm] = useState<ProfileFormValues>(createEmptyProfileForm());
  const [loading, setLoading] = useState(false);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [profileImageUrl, setProfileImageUrl] = useState<string | null>(null);
  const [profileImageFile, setProfileImageFile] = useState<File | null>(null);
  const [profileImagePreview, setProfileImagePreview] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      setProfile(null);
      setLoading(false);
      return;
    }

    void loadProfile();
  }, [user]);

  useEffect(() => {
    let cancelled = false;

    if (!profile?.profile_picture_key) {
      setProfileImageUrl(null);
      return () => {
        cancelled = true;
      };
    }

    void getStorageDownloadUrl('profiles', profile.profile_picture_key)
      .then((url) => {
        if (!cancelled) {
          setProfileImageUrl(url);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setProfileImageUrl(null);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [profile?.profile_picture_key]);

  const loadProfile = async () => {
    try {
      setLoading(true);
      const currentProfile = await fetchUserProfile();
      if (currentProfile) {
        setProfile(currentProfile);
        setProfileForm(profileFormFromProfile(currentProfile, user?.name || ''));
      }
    } catch (err) {
      console.error('Failed to load profile:', err);
      toast.error('Failed to load your profile');
    } finally {
      setLoading(false);
    }
  };

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

  const handleCancelEdit = () => {
    if (profile) {
      setProfileForm(profileFormFromProfile(profile, user?.name || ''));
    }
    if (profileImagePreview?.startsWith('blob:')) {
      URL.revokeObjectURL(profileImagePreview);
    }
    setProfileImagePreview(null);
    setProfileImageFile(null);
    setEditing(false);
  };

  const handleSaveProfile = async () => {
    if (!user || !profile) return;

    const displayName = profileForm.display_name.trim();
    const isUrStudent = profileForm.institution_type === 'ur_student';
    const urCodeLocked = profile.ur_verification_status === 'verified';

    if (!displayName) {
      toast.error('Full name is required.');
      return;
    }

    if (isUrStudent && !urCodeLocked && !profileForm.ur_student_code.trim()) {
      toast.error('UR student code is required for UR verification.');
      return;
    }

    if (!isUrStudent && !urCodeLocked && !profileForm.university_name.trim()) {
      toast.error('University name is required when selecting another university.');
      return;
    }

    setSaving(true);
    try {
      const updatePayload: Parameters<typeof updateUserProfile>[0] = {
        display_name: displayName,
        phone_number: normalizeOptionalField(profileForm.phone_number),
        college_name: normalizeOptionalField(profileForm.college_name),
        department_name: normalizeOptionalField(profileForm.department_name),
        year_of_study: normalizeOptionalField(profileForm.year_of_study),
        bio: normalizeOptionalField(profileForm.bio),
      };

      if (!urCodeLocked) {
        updatePayload.institution_type = profileForm.institution_type;
        updatePayload.university_name =
          isUrStudent ? 'University of Rwanda' : normalizeOptionalField(profileForm.university_name);
        updatePayload.ur_student_code =
          isUrStudent ? normalizeOptionalField(profileForm.ur_student_code) : undefined;
      }

      if (profileImageFile) {
        const objectKey = buildProfilePictureObjectKey(user.id, profileImageFile.name);
        updatePayload.profile_picture_key = await uploadFileObject('profiles', objectKey, profileImageFile);
      }

      const updatedProfile = await updateUserProfile(updatePayload);
      setProfile(updatedProfile);
      setProfileForm(profileFormFromProfile(updatedProfile, displayName));
      if (profileImagePreview?.startsWith('blob:')) {
        URL.revokeObjectURL(profileImagePreview);
      }
      setProfileImagePreview(null);
      setProfileImageFile(null);
      setEditing(false);
      await refetch();
      toast.success('Profile updated');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to update profile';
      toast.error(message);
    } finally {
      setSaving(false);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-[#F08A5D]" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 text-center">
        <h2 className="mb-4 text-2xl font-bold text-[#343A40] dark:text-white">Sign In Required</h2>
        <p className="mb-6 text-gray-500 dark:text-gray-400">
          Sign in to view and manage your profile.
        </p>
        <Button onClick={() => authApi.login('/profile')} className="bg-[#F08A5D] text-white hover:bg-[#e07a4d]">
          Sign In
        </Button>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16">
        <Card className="dark:bg-[#3E444A] dark:border-gray-700">
          <CardContent className="p-10 text-center">
            <p className="text-gray-500 dark:text-gray-400">We could not load your profile right now.</p>
            <Button onClick={() => void loadProfile()} className="mt-4 bg-[#F08A5D] text-white hover:bg-[#e07a4d]">
              Try again
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const urCodeLocked = profile.ur_verification_status === 'verified';
  const previewImage = profileImagePreview || profileImageUrl;

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-[#343A40] dark:text-white">My Profile</h1>
          <p className="mt-1 text-gray-500 dark:text-gray-400">
            View your academic identity, community details, and verification status in one place.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Badge variant="secondary">{profile.role || 'normal'}</Badge>
          <URVerificationBadge status={profile.ur_verification_status} />
          <Badge variant="outline" className="dark:border-gray-600 dark:text-gray-200">
            {profile.account_status || 'active'}
          </Badge>
          {!editing ? (
            <Button onClick={() => setEditing(true)} className="bg-[#F08A5D] text-white hover:bg-[#e07a4d]">
              <Pencil className="mr-2 h-4 w-4" />
              Edit profile
            </Button>
          ) : (
            <Button variant="outline" onClick={handleCancelEdit} className="dark:border-gray-600 dark:text-gray-200">
              Cancel
            </Button>
          )}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[320px_minmax(0,1fr)]">
        <Card className="dark:bg-[#3E444A] dark:border-gray-700">
          <CardContent className="p-6">
            <div className="mx-auto flex h-36 w-36 items-center justify-center overflow-hidden rounded-[2rem] bg-[#FFF4EC] text-4xl font-semibold text-[#9a5f43] dark:bg-[#2e2723] dark:text-white/85">
              {previewImage ? (
                <img src={previewImage} alt="Profile" className="h-full w-full object-cover" />
              ) : (
                displayNameInitials(profile.display_name)
              )}
            </div>

            <div className="mt-5 text-center">
              <h2 className="text-2xl font-semibold text-[#343A40] dark:text-white">{profile.display_name}</h2>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{user.email}</p>
            </div>

            <div className="mt-5 space-y-3 rounded-2xl bg-gray-50 p-4 text-sm dark:bg-[#343A40]">
              <div className="flex items-center justify-between gap-3">
                <span className="text-gray-500 dark:text-gray-400">Institution</span>
                <span className="text-right font-medium text-[#343A40] dark:text-white">
                  {profile.institution_type === 'ur_student' ? 'University of Rwanda' : profile.university_name || 'Not set'}
                </span>
              </div>
              <div className="flex items-center justify-between gap-3">
                <span className="text-gray-500 dark:text-gray-400">UR status</span>
                <span className="text-right font-medium text-[#343A40] dark:text-white">
                  {profile.ur_verification_status || 'not_requested'}
                </span>
              </div>
              <div className="flex items-center justify-between gap-3">
                <span className="text-gray-500 dark:text-gray-400">Trust score</span>
                <span className="text-right font-medium text-[#343A40] dark:text-white">
                  {profile.trust_score || 0}
                </span>
              </div>
              <div className="flex items-center justify-between gap-3">
                <span className="text-gray-500 dark:text-gray-400">Uploads</span>
                <span className="text-right font-medium text-[#343A40] dark:text-white">
                  {profile.upload_count || 0}
                </span>
              </div>
              <div className="flex items-center justify-between gap-3">
                <span className="text-gray-500 dark:text-gray-400">Downloads</span>
                <span className="text-right font-medium text-[#343A40] dark:text-white">
                  {profile.download_count || 0}
                </span>
              </div>
            </div>

            {editing && (
              <div className="mt-5">
                <Label htmlFor="profile-image" className="text-slate-700 dark:text-white/85">Profile picture</Label>
                <Input
                  id="profile-image"
                  type="file"
                  accept="image/*"
                  onChange={handleProfileImageChange}
                  className="mt-2 h-11 rounded-xl border-slate-200 bg-white dark:border-white/10 dark:bg-[#0f172a] dark:text-white"
                />
                <p className="mt-2 text-xs text-slate-500 dark:text-white/55">
                  Upload a photo or logo to make your profile easier to recognize.
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {!editing ? (
          <Card className="dark:bg-[#3E444A] dark:border-gray-700">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-[#343A40] dark:text-white">
                <School className="h-5 w-5 text-[#F08A5D]" />
                Profile Details
              </CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2">
              <ReadOnlyField label="Full name" value={profile.display_name} />
              <ReadOnlyField
                label="Student type"
                value={profile.institution_type === 'ur_student' ? 'University of Rwanda student' : 'Other university student'}
              />
              <ReadOnlyField
                label="University"
                value={profile.institution_type === 'ur_student' ? 'University of Rwanda' : profile.university_name}
              />
              <ReadOnlyField label="UR student code" value={profile.ur_student_code} />
              <ReadOnlyField label="Phone number" value={profile.phone_number} />
              <ReadOnlyField label="College" value={profile.college_name} />
              <ReadOnlyField label="Department" value={profile.department_name} />
              <ReadOnlyField label="Year of study" value={profile.year_of_study} />
              <div className="md:col-span-2">
                <ReadOnlyField label="Bio" value={profile.bio} multiline />
              </div>
              <div className="md:col-span-2 rounded-2xl bg-slate-50 p-4 text-sm text-slate-600 dark:bg-[#343A40] dark:text-white/75">
                {urCodeLocked ? (
                  <div className="flex items-start gap-3">
                    <ShieldCheck className="mt-0.5 h-5 w-5 text-emerald-600" />
                    <p>Your UR student code has been verified and is now locked to preserve verification integrity.</p>
                  </div>
                ) : (
                  <p>
                    Your profile is currently in view mode. Click <span className="font-semibold">Edit profile</span> to update your details.
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card className="dark:bg-[#3E444A] dark:border-gray-700">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-[#343A40] dark:text-white">
                <Camera className="h-5 w-5 text-[#F08A5D]" />
                Edit Profile
              </CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2">
              <div>
                <Label htmlFor="display_name" className="text-slate-700 dark:text-white/85">Full Name</Label>
                <Input
                  id="display_name"
                  value={profileForm.display_name}
                  onChange={(event) => updateField('display_name', event.target.value)}
                  className="mt-2 h-11 rounded-xl border-slate-200 bg-white dark:border-white/10 dark:bg-[#0f172a] dark:text-white"
                />
              </div>

              <div>
                <Label className="text-slate-700 dark:text-white/85">Student type</Label>
                <Select
                  value={profileForm.institution_type}
                  onValueChange={(value) => updateField('institution_type', value as ProfileFormValues['institution_type'])}
                  disabled={urCodeLocked}
                >
                  <SelectTrigger className="mt-2 h-11 rounded-xl border-slate-200 bg-white dark:border-white/10 dark:bg-[#0f172a] dark:text-white disabled:opacity-80">
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
                  value={profileForm.institution_type === 'ur_student' ? 'University of Rwanda' : profileForm.university_name}
                  onChange={(event) => updateField('university_name', event.target.value)}
                  disabled={profileForm.institution_type === 'ur_student' || urCodeLocked}
                  className="mt-2 h-11 rounded-xl border-slate-200 bg-white dark:border-white/10 dark:bg-[#0f172a] dark:text-white disabled:opacity-80"
                />
              </div>

              <div>
                <Label htmlFor="ur_student_code" className="text-slate-700 dark:text-white/85">UR Student Code</Label>
                <Input
                  id="ur_student_code"
                  value={profileForm.ur_student_code}
                  onChange={(event) => updateField('ur_student_code', event.target.value)}
                  disabled={profileForm.institution_type !== 'ur_student' || urCodeLocked}
                  placeholder={urCodeLocked ? 'Verified code is locked' : 'Required for UR verification'}
                  className="mt-2 h-11 rounded-xl border-slate-200 bg-white dark:border-white/10 dark:bg-[#0f172a] dark:text-white disabled:opacity-80"
                />
              </div>

              <div>
                <Label htmlFor="phone_number" className="text-slate-700 dark:text-white/85">Phone Number</Label>
                <Input
                  id="phone_number"
                  value={profileForm.phone_number}
                  onChange={(event) => updateField('phone_number', event.target.value)}
                  className="mt-2 h-11 rounded-xl border-slate-200 bg-white dark:border-white/10 dark:bg-[#0f172a] dark:text-white"
                />
              </div>

              <div>
                <Label htmlFor="college_name" className="text-slate-700 dark:text-white/85">College</Label>
                <Input
                  id="college_name"
                  value={profileForm.college_name}
                  onChange={(event) => updateField('college_name', event.target.value)}
                  className="mt-2 h-11 rounded-xl border-slate-200 bg-white dark:border-white/10 dark:bg-[#0f172a] dark:text-white"
                />
              </div>

              <div>
                <Label htmlFor="department_name" className="text-slate-700 dark:text-white/85">Department</Label>
                <Input
                  id="department_name"
                  value={profileForm.department_name}
                  onChange={(event) => updateField('department_name', event.target.value)}
                  className="mt-2 h-11 rounded-xl border-slate-200 bg-white dark:border-white/10 dark:bg-[#0f172a] dark:text-white"
                />
              </div>

              <div>
                <Label className="text-slate-700 dark:text-white/85">Year of study</Label>
                <Select value={profileForm.year_of_study} onValueChange={(value) => updateField('year_of_study', value)}>
                  <SelectTrigger className="mt-2 h-11 rounded-xl border-slate-200 bg-white dark:border-white/10 dark:bg-[#0f172a] dark:text-white">
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

              <div className="md:col-span-2">
                <Label htmlFor="bio" className="text-slate-700 dark:text-white/85">Short Bio</Label>
                <Textarea
                  id="bio"
                  value={profileForm.bio}
                  onChange={(event) => updateField('bio', event.target.value)}
                  className="mt-2 min-h-[120px] rounded-2xl border-slate-200 bg-white dark:border-white/10 dark:bg-[#0f172a] dark:text-white"
                />
              </div>

              <div className="md:col-span-2 rounded-2xl bg-slate-50 p-4 text-sm text-slate-600 dark:bg-[#343A40] dark:text-white/75">
                {urCodeLocked ? (
                  <p>Your UR student code has been verified. The code, institution type, and university are now locked.</p>
                ) : (
                  <p>If you use a UR student code, your verification status will stay pending until it is reviewed.</p>
                )}
              </div>

              <div className="md:col-span-2 flex justify-end gap-3">
                <Button variant="outline" onClick={handleCancelEdit} className="dark:border-gray-600 dark:text-gray-200">
                  Cancel
                </Button>
                <Button onClick={handleSaveProfile} disabled={saving} className="bg-[#F08A5D] text-white hover:bg-[#e07a4d]">
                  {saving ? 'Saving...' : 'Save profile'}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      <div className="mt-8">
        <Button variant="outline" onClick={() => navigate('/dashboard')} className="dark:border-gray-600 dark:text-gray-200">
          Back to dashboard
        </Button>
      </div>
    </div>
  );
}

function ReadOnlyField({
  label,
  value,
  multiline = false,
}: {
  label: string;
  value?: string | null;
  multiline?: boolean;
}) {
  return (
    <div className="rounded-2xl border border-slate-200/80 bg-slate-50/80 p-4 dark:border-gray-700 dark:bg-[#343A40]">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500 dark:text-white/45">{label}</p>
      <p className={`mt-2 text-sm text-[#343A40] dark:text-white ${multiline ? 'whitespace-pre-wrap leading-6' : ''}`}>
        {value || 'Not provided yet'}
      </p>
    </div>
  );
}
