export type InstitutionType = 'ur_student' | 'other_university';
export type PublicAccountRole = 'normal' | 'cp' | 'lecturer';

export const publicAccountRoleOptions: Array<{
  value: PublicAccountRole;
  label: string;
  description: string;
}> = [
  {
    value: 'normal',
    label: 'Community Student',
    description: 'Use the standard student account for browsing, discussions, and uploads.',
  },
  {
    value: 'cp',
    label: 'Class Representative (CP)',
    description: 'Choose this to request CP access. Your account stays normal until an admin or content manager approves it.',
  },
  {
    value: 'lecturer',
    label: 'Lecturer',
    description: 'Choose this to request lecturer access. Your account stays normal until an admin or content manager approves it.',
  },
];

export interface ProfileFormValues {
  display_name: string;
  institution_type: InstitutionType;
  university_name: string;
  ur_student_code: string;
  phone_number: string;
  college_name: string;
  department_name: string;
  year_of_study: string;
  bio: string;
}

export const institutionTypeOptions: Array<{ value: InstitutionType; label: string }> = [
  { value: 'ur_student', label: 'University of Rwanda student' },
  { value: 'other_university', label: 'Other university student' },
];

export const yearOfStudyOptions = [
  'Year 1',
  'Year 2',
  'Year 3',
  'Year 4',
  'Year 5',
  'Postgraduate',
];

export function createEmptyProfileForm(): ProfileFormValues {
  return {
    display_name: '',
    institution_type: 'ur_student',
    university_name: 'University of Rwanda',
    ur_student_code: '',
    phone_number: '',
    college_name: '',
    department_name: '',
    year_of_study: '',
    bio: '',
  };
}

export function normalizeOptionalField(value: string): string | undefined {
  const normalized = value.trim();
  return normalized ? normalized : undefined;
}

export function buildProfilePictureObjectKey(userId: string, filename: string): string {
  const extension = filename.includes('.') ? filename.split('.').pop()?.toLowerCase() || 'jpg' : 'jpg';
  return `avatars/${userId}-${Date.now()}.${extension}`;
}
