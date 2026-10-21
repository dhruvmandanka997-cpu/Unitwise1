import React, { useState, useEffect, useRef } from 'react';
import { 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  GraduationCap, 
  Calendar, 
  Edit3, 
  Save, 
  X, 
  AlertCircle, 
  CheckCircle2, 
  Lock, 
  RefreshCw,
  Sparkles,
  ArrowLeft,
  Camera,
  Upload,
  Trash2,
  Loader2
} from 'lucide-react';
import { api } from '../../services/api';
import { UserProfile, ProfileInput, MIN_AGE, MAX_AGE, DEGREE_OPTIONS, DegreeOption, getInitials } from '../../types/profile';
import { BRAND } from '../../config/brand';

interface ProfileViewProps {
  onNavigateHome?: () => void;
  onProfileUpdated?: (updated: UserProfile) => void;
}

// Country dial code presets for convenient international E.164 entry
const COUNTRY_CODES = [
  { code: '+1', country: 'US/CA' },
  { code: '+44', country: 'UK' },
  { code: '+91', country: 'IN' },
  { code: '+61', country: 'AU' },
  { code: '+49', country: 'DE' },
  { code: '+33', country: 'FR' },
  { code: '+81', country: 'JP' },
  { code: '+86', country: 'CN' },
  { code: '+971', country: 'AE' },
  { code: '+65', country: 'SG' },
];

export const ProfileView: React.FC<ProfileViewProps> = ({ 
  onNavigateHome,
  onProfileUpdated 
}) => {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [email, setEmail] = useState<string>('');
  const [isFirstTime, setIsFirstTime] = useState<boolean>(false);
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState<boolean>(false);

  // Form State
  const [formState, setFormState] = useState<{
    educatorName: string;
    email: string;
    age: string;
    address: string;
    degree: DegreeOption;
    degreeOther: string;
    dialCode: string;
    phoneNumber: string;
  }>({
    educatorName: '',
    email: '',
    age: '',
    address: '',
    degree: 'B.Ed.',
    degreeOther: '',
    dialCode: '+1',
    phoneNumber: '',
  });

  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [isDirty, setIsDirty] = useState<boolean>(false);
  const [showCancelConfirm, setShowCancelConfirm] = useState<boolean>(false);

  // Profile Photo State & Modals
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [pendingPhotoFile, setPendingPhotoFile] = useState<File | null>(null);
  const [photoPreviewData, setPhotoPreviewData] = useState<string | null>(null);
  const [showPhotoPreviewModal, setShowPhotoPreviewModal] = useState<boolean>(false);
  const [showRemovePhotoConfirm, setShowRemovePhotoConfirm] = useState<boolean>(false);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState<boolean>(false);
  const [isRemovingPhoto, setIsRemovingPhoto] = useState<boolean>(false);
  const [photoError, setPhotoError] = useState<string | null>(null);
  const [photoSuccess, setPhotoSuccess] = useState<string | null>(null);

  // Refs for focusing first invalid field on failed submit
  const nameInputRef = useRef<HTMLInputElement>(null);
  const emailInputRef = useRef<HTMLInputElement>(null);
  const ageInputRef = useRef<HTMLInputElement>(null);
  const addressInputRef = useRef<HTMLTextAreaElement>(null);
  const degreeSelectRef = useRef<HTMLSelectElement>(null);
  const degreeOtherInputRef = useRef<HTMLInputElement>(null);
  const phoneInputRef = useRef<HTMLInputElement>(null);

  // Warn on browser tab closure if unsaved edits exist
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isDirty && isEditing) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [isDirty, isEditing]);

  const loadProfile = async () => {
    setIsLoading(true);
    setLoadError(null);
    try {
      const data = await api.getProfile();
      setEmail(data.email || '');

      if (data.exists && data.profile) {
        setProfile(data.profile);
        setIsFirstTime(false);
        setIsEditing(false);
        initFormFromProfile(data.profile);
        onProfileUpdated?.(data.profile);
      } else {
        // First-time educator without a profile: open directly in edit mode
        setIsFirstTime(true);
        setIsEditing(true);
        setFormState({
          educatorName: '',
          email: data.email || '',
          age: '',
          address: '',
          degree: 'B.Ed.',
          degreeOther: '',
          dialCode: '+1',
          phoneNumber: '',
        });
      }
    } catch (err: any) {
      console.error('Failed to load educator profile:', err);
      setLoadError(err.message || 'Unable to load profile. Please check your connection and retry.');
    } finally {
      setIsLoading(false);
    }
  };

  const initFormFromProfile = (p: UserProfile) => {
    let dialCode = '+1';
    let localNumber = p.mobileNumber || '';

    // Extract country code if present
    for (const c of COUNTRY_CODES) {
      if (p.mobileNumber && p.mobileNumber.startsWith(c.code)) {
        dialCode = c.code;
        localNumber = p.mobileNumber.substring(c.code.length);
        break;
      }
    }

    setFormState({
      educatorName: p.educatorName || '',
      email: p.email || email || '',
      age: p.age ? String(p.age) : '',
      address: p.address || '',
      degree: p.degree || 'B.Ed.',
      degreeOther: p.degreeOther || '',
      dialCode,
      phoneNumber: localNumber,
    });
    setFormErrors({});
    setIsDirty(false);
  };

  useEffect(() => {
    loadProfile();
  }, []);

  // Validate form fields on the frontend
  const validateForm = (): { isValid: boolean; errors: Record<string, string>; firstInvalidRef: React.RefObject<any> | null } => {
    const errors: Record<string, string> = {};
    let firstRef: React.RefObject<any> | null = null;

    // 1. Educator Name
    const nameTrimmed = formState.educatorName.trim();
    const nameRegex = /^[\p{L}\s\-.']{2,100}$/u;
    if (!nameTrimmed) {
      errors.educatorName = 'Educator name is required';
      if (!firstRef) firstRef = nameInputRef;
    } else if (nameTrimmed.length < 2) {
      errors.educatorName = 'Educator name must be at least 2 characters';
      if (!firstRef) firstRef = nameInputRef;
    } else if (nameTrimmed.length > 100) {
      errors.educatorName = 'Educator name cannot exceed 100 characters';
      if (!firstRef) firstRef = nameInputRef;
    } else if (!nameRegex.test(nameTrimmed)) {
      errors.educatorName = 'Educator name may only contain letters, spaces, hyphens, apostrophes, and periods';
      if (!firstRef) firstRef = nameInputRef;
    }

    // 2. Email Address
    const emailTrimmed = formState.email.trim();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailTrimmed) {
      errors.email = 'Email address is required';
      if (!firstRef) firstRef = emailInputRef;
    } else if (emailTrimmed.length > 254) {
      errors.email = 'Email address cannot exceed 254 characters';
      if (!firstRef) firstRef = emailInputRef;
    } else if (!emailRegex.test(emailTrimmed)) {
      errors.email = 'Please provide a valid email address (e.g. educator@school.edu)';
      if (!firstRef) firstRef = emailInputRef;
    }

    // 2. Age
    const parsedAge = parseInt(formState.age, 10);
    if (!formState.age || isNaN(parsedAge)) {
      errors.age = 'Age is required and must be an integer';
      if (!firstRef) firstRef = ageInputRef;
    } else if (parsedAge < MIN_AGE || parsedAge > MAX_AGE) {
      errors.age = `Age must be between ${MIN_AGE} and ${MAX_AGE}`;
      if (!firstRef) firstRef = ageInputRef;
    }

    // 3. Address
    const addressTrimmed = formState.address.trim();
    if (!addressTrimmed) {
      errors.address = 'Address is required';
      if (!firstRef) firstRef = addressInputRef;
    } else if (addressTrimmed.length < 5) {
      errors.address = 'Address must be at least 5 characters';
      if (!firstRef) firstRef = addressInputRef;
    } else if (addressTrimmed.length > 300) {
      errors.address = 'Address cannot exceed 300 characters';
      if (!firstRef) firstRef = addressInputRef;
    }

    // 4. Degree
    if (!formState.degree) {
      errors.degree = 'Degree/qualification is required';
      if (!firstRef) firstRef = degreeSelectRef;
    } else if (formState.degree === 'Other') {
      const otherTrimmed = formState.degreeOther.trim();
      if (!otherTrimmed) {
        errors.degreeOther = 'Please specify your degree or qualification';
        if (!firstRef) firstRef = degreeOtherInputRef;
      } else if (otherTrimmed.length > 100) {
        errors.degreeOther = 'Custom degree description cannot exceed 100 characters';
        if (!firstRef) firstRef = degreeOtherInputRef;
      }
    }

    // 5. Mobile Number (E.164)
    const cleanDigits = formState.phoneNumber.replace(/[^\d]/g, '');
    const fullE164 = `${formState.dialCode}${cleanDigits}`;
    const e164Regex = /^\+[1-9]\d{1,14}$/;

    if (!cleanDigits) {
      errors.mobileNumber = 'Mobile number is required';
      if (!firstRef) firstRef = phoneInputRef;
    } else if (!e164Regex.test(fullE164)) {
      errors.mobileNumber = 'Please provide a valid phone number (e.g. +14155552671)';
      if (!firstRef) firstRef = phoneInputRef;
    }

    return {
      isValid: Object.keys(errors).length === 0,
      errors,
      firstInvalidRef: firstRef,
    };
  };

  const handleFieldChange = (field: keyof typeof formState, value: any) => {
    setFormState((prev) => ({ ...prev, [field]: value }));
    setIsDirty(true);
    if (formErrors[field]) {
      setFormErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const { isValid, errors, firstInvalidRef } = validateForm();

    if (!isValid) {
      setFormErrors(errors);
      if (firstInvalidRef && firstInvalidRef.current) {
        firstInvalidRef.current.focus();
      }
      return;
    }

    const cleanDigits = formState.phoneNumber.replace(/[^\d]/g, '');
    const fullE164 = `${formState.dialCode}${cleanDigits}`;

    const payload: ProfileInput = {
      educatorName: formState.educatorName.trim(),
      email: formState.email.trim().toLowerCase(),
      age: parseInt(formState.age, 10),
      address: formState.address.trim(),
      degree: formState.degree,
      degreeOther: formState.degree === 'Other' ? formState.degreeOther.trim() : null,
      mobileNumber: fullE164,
    };

    setIsSaving(true);
    try {
      const res = await api.saveProfile(payload);
      setProfile(res.profile);
      setEmail(res.profile.email);
      setIsFirstTime(false);
      setIsEditing(false);
      setIsDirty(false);
      setSaveSuccess(true);
      onProfileUpdated?.(res.profile);
      setTimeout(() => setSaveSuccess(false), 4000);
    } catch (err: any) {
      console.error('Failed to save profile:', err);
      if (err.details && typeof err.details === 'object') {
        setFormErrors(err.details);
        if (err.details.email && emailInputRef.current) {
          emailInputRef.current.focus();
        }
      } else {
        alert(err.message || 'Failed to save profile. Please verify your entries.');
      }
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancelClick = () => {
    if (isDirty) {
      setShowCancelConfirm(true);
    } else {
      revertChanges();
    }
  };

  const revertChanges = () => {
    if (profile) {
      initFormFromProfile(profile);
      setIsEditing(false);
    } else {
      // First-time user with no profile, reset empty form
      setFormState({
        educatorName: '',
        email: email || '',
        age: '',
        address: '',
        degree: 'B.Ed.',
        degreeOther: '',
        dialCode: '+1',
        phoneNumber: '',
      });
      setIsDirty(false);
    }
    setShowCancelConfirm(false);
  };

  // Profile Photo Action Handlers
  const handleOpenFileDialog = () => {
    setPhotoError(null);
    fileInputRef.current?.click();
  };

  const handleFileSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Reset input so re-selecting same file triggers change event
    e.target.value = '';

    const validTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      setPhotoError('Unsupported format. Please select a JPEG, PNG, or WebP image.');
      return;
    }

    const MAX_SIZE = 5 * 1024 * 1024; // 5 MB
    if (file.size > MAX_SIZE) {
      setPhotoError('Image file size exceeds the 5 MB limit. Please select a smaller photo.');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      setPhotoPreviewData(result);
      setPendingPhotoFile(file);
      setPhotoError(null);
      setShowPhotoPreviewModal(true);
    };
    reader.onerror = () => {
      setPhotoError('Failed to read selected image. Please try another image.');
    };
    reader.readAsDataURL(file);
  };

  const handleCancelPhotoPreview = () => {
    setPhotoPreviewData(null);
    setPendingPhotoFile(null);
    setShowPhotoPreviewModal(false);
  };

  const handleConfirmPhotoUpload = async () => {
    if (!photoPreviewData) return;
    setIsUploadingPhoto(true);
    setPhotoError(null);

    try {
      const res = await api.uploadProfilePhoto(photoPreviewData);
      setProfile(res.profile);
      onProfileUpdated?.(res.profile);
      setShowPhotoPreviewModal(false);
      setPhotoPreviewData(null);
      setPendingPhotoFile(null);
      setPhotoSuccess('Profile photo updated successfully!');
      setTimeout(() => setPhotoSuccess(null), 4000);
    } catch (err: any) {
      console.error('Failed to upload profile photo:', err);
      setPhotoError(err.message || 'Failed to upload photo. Please try again.');
    } finally {
      setIsUploadingPhoto(false);
    }
  };

  const handleConfirmRemovePhoto = async () => {
    setIsRemovingPhoto(true);
    setPhotoError(null);

    try {
      const res = await api.deleteProfilePhoto();
      setProfile(res.profile);
      onProfileUpdated?.(res.profile);
      setShowRemovePhotoConfirm(false);
      setPhotoSuccess('Profile photo removed. Initial avatar restored.');
      setTimeout(() => setPhotoSuccess(null), 4000);
    } catch (err: any) {
      console.error('Failed to remove profile photo:', err);
      setPhotoError(err.message || 'Failed to remove photo. Please try again.');
    } finally {
      setIsRemovingPhoto(false);
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  // Loading Skeleton State
  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
        <div className="h-40 rounded-[var(--radius-card)] bg-[var(--surface)] border border-[var(--border)] animate-pulse p-6 flex items-center gap-6">
          <div className="w-20 h-20 rounded-full bg-[var(--border)]" />
          <div className="space-y-3 flex-1">
            <div className="h-6 w-1/3 bg-[var(--border)] rounded-md" />
            <div className="h-4 w-1/4 bg-[var(--border)] rounded-md" />
          </div>
        </div>
        <div className="h-64 rounded-[var(--radius-card)] bg-[var(--surface)] border border-[var(--border)] animate-pulse" />
      </div>
    );
  }

  // Error State with Retry
  if (loadError) {
    return (
      <div className="max-w-xl mx-auto my-12 p-8 rounded-[var(--radius-card)] bg-[var(--surface)] border border-[var(--border)] shadow-[var(--shadow-raised-sm)] text-center space-y-4">
        <div className="w-12 h-12 rounded-full bg-[var(--danger-soft)] text-[var(--danger)] flex items-center justify-center mx-auto">
          <AlertCircle className="h-6 w-6" />
        </div>
        <h2 className="text-lg font-bold text-[var(--text)]">Failed to Load Profile</h2>
        <p className="text-sm text-[var(--text-muted)] leading-relaxed">{loadError}</p>
        <button
          onClick={loadProfile}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-[var(--radius-button)] bg-[var(--primary)] text-white text-xs font-semibold shadow-[var(--shadow-primary)] hover:bg-[var(--primary-hover)] transition-all"
        >
          <RefreshCw className="h-4 w-4" />
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 md:py-8 space-y-6">
      {/* Top Header & Breadcrumb */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-medium text-[var(--text-muted)] mb-1">
            {onNavigateHome && (
              <button
                onClick={onNavigateHome}
                className="hover:text-[var(--primary)] flex items-center gap-1 transition-colors"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                Home
              </button>
            )}
            <span>/</span>
            <span className="text-[var(--text)] font-semibold">Educator Profile</span>
          </div>
          <h1 className="text-xl md:text-2xl font-extrabold text-[var(--text)] tracking-tight">
            My Educator Profile
          </h1>
          <p className="text-xs text-[var(--text-muted)] mt-0.5">
            Manage your verified teacher credentials, contact information, and teaching background
          </p>
        </div>

        {/* Action Toggle Button */}
        {!isEditing && (
          <button
            onClick={() => setIsEditing(true)}
            id="edit-profile-btn"
            className="self-start sm:self-auto inline-flex items-center gap-2 px-4 py-2.5 rounded-[var(--radius-button)] bg-[var(--surface)] text-[var(--text)] border border-[var(--border)] text-xs font-semibold shadow-[var(--shadow-raised-sm)] hover:shadow-[var(--shadow-hover)] hover:bg-[var(--lavender-soft)] focus-visible:outline-2 focus-visible:outline-[var(--accent)] transition-all"
          >
            <Edit3 className="h-4 w-4 text-[var(--accent)]" />
            <span>Edit Profile</span>
          </button>
        )}
      </div>

      {/* Success Notification Banner */}
      {saveSuccess && (
        <div
          role="status"
          className="flex items-center gap-3 p-4 rounded-[var(--radius-button)] bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-xs shadow-xs animate-in fade-in duration-200"
        >
          <CheckCircle2 className="h-4 w-4 flex-shrink-0 text-emerald-600 dark:text-emerald-400" />
          <span className="font-semibold">Your educator profile has been saved successfully!</span>
        </div>
      )}

      {/* Photo Action Success Banner */}
      {photoSuccess && (
        <div
          role="status"
          className="flex items-center gap-3 p-4 rounded-[var(--radius-button)] bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-xs shadow-xs animate-in fade-in duration-200"
        >
          <CheckCircle2 className="h-4 w-4 flex-shrink-0 text-emerald-600 dark:text-emerald-400" />
          <span className="font-semibold">{photoSuccess}</span>
        </div>
      )}

      {/* Photo Action Error Banner */}
      {photoError && (
        <div
          role="alert"
          className="flex items-center justify-between gap-3 p-4 rounded-[var(--radius-button)] bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-300 text-xs shadow-xs animate-in fade-in duration-200"
        >
          <div className="flex items-center gap-2.5">
            <AlertCircle className="h-4 w-4 flex-shrink-0 text-rose-600 dark:text-rose-400" />
            <span className="font-semibold">{photoError}</span>
          </div>
          <button
            type="button"
            onClick={() => setPhotoError(null)}
            className="p-1 rounded-md text-rose-600 hover:bg-rose-100 dark:hover:bg-rose-900/40"
            title="Dismiss error"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      {/* First Time User Greeting Prompt */}
      {isFirstTime && isEditing && (
        <div className="flex items-start gap-3.5 p-4 rounded-[var(--radius-button)] bg-[var(--lavender-soft)] border border-[var(--border)] text-xs text-[var(--text)] shadow-xs">
          <div className="p-1.5 rounded-lg bg-[var(--surface)] text-[var(--primary)] flex-shrink-0">
            <Sparkles className="h-4 w-4" />
          </div>
          <div>
            <h4 className="font-bold text-[var(--text)]">Welcome to {BRAND.name}!</h4>
            <p className="text-[var(--text-muted)] mt-0.5 leading-relaxed">
              Please enter your educator details below. Your profile ensures that your educational units and plans align with your professional credentials.
            </p>
          </div>
        </div>
      )}

      {/* Unsaved Changes Confirmation Modal */}
      {showCancelConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="w-full max-w-sm rounded-[var(--radius-card)] bg-[var(--surface)] border border-[var(--border)] p-6 shadow-2xl space-y-4">
            <div className="w-10 h-10 rounded-full bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 flex items-center justify-center">
              <AlertCircle className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-[var(--text)]">Discard unsaved edits?</h3>
              <p className="text-xs text-[var(--text-muted)] mt-1 leading-relaxed">
                You have unsaved changes in your profile. Discarding will restore your previously saved details.
              </p>
            </div>
            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setShowCancelConfirm(false)}
                className="px-3.5 py-2 rounded-[var(--radius-button)] text-xs font-semibold text-[var(--text)] bg-[var(--surface)] border border-[var(--border)] hover:bg-[var(--lavender-soft)]"
              >
                Keep Editing
              </button>
              <button
                type="button"
                onClick={revertChanges}
                className="px-3.5 py-2 rounded-[var(--radius-button)] text-xs font-semibold text-white bg-[var(--danger)] hover:bg-[var(--danger-hover)] shadow-xs"
              >
                Discard Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Photo Preview & Confirmation Modal */}
      {showPhotoPreviewModal && photoPreviewData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="w-full max-w-md rounded-[var(--radius-card)] bg-[var(--surface)] border border-[var(--border)] p-6 shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-[var(--border)] pb-3">
              <div className="flex items-center gap-2 text-sm font-bold text-[var(--text)]">
                <Camera className="h-4 w-4 text-[var(--primary)]" />
                <span>Preview Profile Photo</span>
              </div>
              <button
                type="button"
                onClick={handleCancelPhotoPreview}
                disabled={isUploadingPhoto}
                className="p-1 rounded-md text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--lavender-soft)] transition-colors"
                title="Cancel preview"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Circular Preview Container */}
            <div className="flex flex-col items-center justify-center gap-3 py-3">
              <div className="w-32 h-32 md:w-36 md:h-36 rounded-full overflow-hidden border-4 border-[var(--primary)] shadow-[var(--shadow-raised)] bg-[var(--lavender-soft)] flex items-center justify-center relative">
                <img
                  src={photoPreviewData}
                  alt="Avatar preview"
                  className="w-full h-full object-cover"
                />
              </div>

              {pendingPhotoFile && (
                <div className="text-center space-y-0.5">
                  <p className="text-xs font-bold text-[var(--text)] truncate max-w-[280px]">
                    {pendingPhotoFile.name}
                  </p>
                  <p className="text-[10px] text-[var(--text-muted)] font-mono">
                    {formatFileSize(pendingPhotoFile.size)} • {pendingPhotoFile.type.replace('image/', '').toUpperCase()}
                  </p>
                </div>
              )}
            </div>

            <div className="p-3 rounded-xl bg-[var(--lavender-soft)]/50 border border-[var(--border)] text-[11px] text-[var(--text-muted)] leading-relaxed">
              Your photo will appear in the top-right navigation bar and on your public educator profile.
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-[var(--border)]">
              <button
                type="button"
                onClick={handleCancelPhotoPreview}
                disabled={isUploadingPhoto}
                className="px-4 py-2 rounded-[var(--radius-button)] text-xs font-semibold text-[var(--text)] bg-[var(--surface)] border border-[var(--border)] hover:bg-[var(--lavender-soft)] transition-colors"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleConfirmPhotoUpload}
                disabled={isUploadingPhoto}
                className="inline-flex items-center gap-2 px-5 py-2 rounded-[var(--radius-button)] text-xs font-bold text-[var(--on-primary)] bg-[var(--primary)] hover:bg-[var(--primary-hover)] shadow-[var(--shadow-primary)] transition-all disabled:opacity-50"
              >
                {isUploadingPhoto ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    <span>Saving Photo...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    <span>Save Photo</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Remove Photo Confirmation Modal */}
      {showRemovePhotoConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="w-full max-w-sm rounded-[var(--radius-card)] bg-[var(--surface)] border border-[var(--border)] p-6 shadow-2xl space-y-4">
            <div className="w-10 h-10 rounded-full bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-400 flex items-center justify-center">
              <Trash2 className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-[var(--text)]">Remove profile photo?</h3>
              <p className="text-xs text-[var(--text-muted)] mt-1 leading-relaxed">
                Are you sure you want to remove your photo? Your circular avatar will revert to displaying your initials.
              </p>
            </div>
            <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-[var(--border)]">
              <button
                type="button"
                onClick={() => setShowRemovePhotoConfirm(false)}
                disabled={isRemovingPhoto}
                className="px-3.5 py-2 rounded-[var(--radius-button)] text-xs font-semibold text-[var(--text)] bg-[var(--surface)] border border-[var(--border)] hover:bg-[var(--lavender-soft)]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmRemovePhoto}
                disabled={isRemovingPhoto}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-[var(--radius-button)] text-xs font-semibold text-white bg-[var(--danger)] hover:bg-[var(--danger-hover)] shadow-xs disabled:opacity-50"
              >
                {isRemovingPhoto ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    <span>Removing...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="h-3.5 w-3.5" />
                    <span>Yes, Remove</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Profile Card */}
      <div className="rounded-[var(--radius-card)] bg-[var(--surface)] border border-[var(--border)] shadow-[var(--shadow-raised-sm)] overflow-hidden">
        {/* Profile Card Header Banner */}
        <div className="px-6 py-6 md:px-8 border-b border-[var(--border)] bg-gradient-to-r from-[var(--surface)] via-[var(--lavender-soft)]/40 to-[var(--surface)] flex flex-col sm:flex-row items-center sm:items-start gap-6">
          {/* Avatar with Photo & Actions */}
          <div className="flex flex-col items-center sm:items-start gap-2.5">
            <div className="relative group">
              <div
                aria-label={`Avatar for ${isEditing ? formState.educatorName || 'Educator' : profile?.educatorName || 'Educator'}`}
                className="w-20 h-20 md:w-24 md:h-24 rounded-full bg-[var(--lavender-soft)] text-[var(--primary)] text-xl md:text-2xl font-extrabold flex items-center justify-center border-2 border-[var(--border)] shadow-[var(--shadow-raised-sm)] flex-shrink-0 tracking-wider overflow-hidden relative"
              >
                {profile?.photoUrl ? (
                  <img
                    src={profile.photoUrl}
                    alt={isEditing ? formState.educatorName || 'Educator' : profile?.educatorName || 'Educator'}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span>{getInitials(isEditing ? formState.educatorName : profile?.educatorName)}</span>
                )}
              </div>

              {/* Camera Icon Overlay Button */}
              <button
                type="button"
                onClick={handleOpenFileDialog}
                disabled={isUploadingPhoto || isRemovingPhoto}
                aria-label={profile?.photoUrl ? "Change profile photo" : "Add profile photo"}
                className="absolute bottom-0 right-0 p-1.5 md:p-2 rounded-full bg-[var(--primary)] text-[var(--on-primary)] shadow-[var(--shadow-raised-sm)] hover:scale-110 active:scale-95 transition-all border-2 border-[var(--surface)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] cursor-pointer"
                title={profile?.photoUrl ? "Change photo" : "Add photo"}
              >
                <Camera className="h-3.5 w-3.5" />
              </button>
            </div>

            {/* Photo Action Controls */}
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={handleOpenFileDialog}
                disabled={isUploadingPhoto || isRemovingPhoto}
                id="photo-upload-btn"
                aria-label={profile?.photoUrl ? "Change photo" : "Add photo"}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-[var(--surface)] border border-[var(--border)] text-[11px] font-semibold text-[var(--primary)] shadow-[var(--shadow-raised-sm)] hover:bg-[var(--lavender-soft)] transition-all cursor-pointer"
              >
                <Upload className="h-3 w-3" />
                <span>{profile?.photoUrl ? 'Change Photo' : 'Add Photo'}</span>
              </button>

              {profile?.photoUrl && (
                <button
                  type="button"
                  onClick={() => setShowRemovePhotoConfirm(true)}
                  disabled={isUploadingPhoto || isRemovingPhoto}
                  id="photo-remove-btn"
                  aria-label="Remove photo"
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-[var(--surface)] border border-[var(--border)] text-[11px] font-semibold text-[var(--danger)] shadow-[var(--shadow-raised-sm)] hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-all cursor-pointer"
                >
                  <Trash2 className="h-3 w-3" />
                  <span>Remove</span>
                </button>
              )}
            </div>

            {/* Hidden native file input */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={handleFileSelected}
              className="hidden"
              aria-label="Upload educator profile photo"
            />
          </div>

          <div className="text-center sm:text-left flex-1 min-w-0">
            <h2 className="text-lg md:text-xl font-bold text-[var(--text)] truncate">
              {isEditing 
                ? (formState.educatorName || 'Educator Name') 
                : (profile?.educatorName || 'Educator Name')}
            </h2>
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 mt-1.5">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-[var(--lavender-soft)] text-[var(--primary)] border border-[var(--border)]">
                <GraduationCap className="h-3.5 w-3.5" />
                {isEditing ? formState.degree : profile?.degree || 'Degree'}
              </span>

              {/* Educator Email Indicator */}
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium text-[var(--text-muted)] bg-[var(--bg)] border border-[var(--border)]">
                <Mail className="h-3 w-3 text-[var(--accent)]" />
                <span className="truncate max-w-[200px]">
                  {isEditing ? (formState.email || 'Email address') : (email || profile?.email || 'educator@unitwise.local')}
                </span>
              </span>
            </div>
            <p className="text-[11px] text-[var(--text-muted)] mt-2">
              Teaching Credentials & Pedagogical Record
            </p>
          </div>
        </div>

        {/* VIEW MODE */}
        {!isEditing && profile && (
          <div className="p-6 md:p-8 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Field 1: Educator Name */}
              <div className="p-4 rounded-[16px] bg-[var(--bg)] border border-[var(--border)] space-y-1">
                <div className="flex items-center gap-2 text-xs font-semibold text-[var(--text-muted)]">
                  <User className="h-3.5 w-3.5 text-[var(--primary)]" />
                  <span>Educator Full Name</span>
                </div>
                <p className="text-sm font-bold text-[var(--text)] pl-5.5">
                  {profile.educatorName}
                </p>
              </div>

              {/* Field 2: Age */}
              <div className="p-4 rounded-[16px] bg-[var(--bg)] border border-[var(--border)] space-y-1">
                <div className="flex items-center gap-2 text-xs font-semibold text-[var(--text-muted)]">
                  <Calendar className="h-3.5 w-3.5 text-[var(--primary)]" />
                  <span>Age</span>
                </div>
                <p className="text-sm font-bold text-[var(--text)] pl-5.5">
                  {profile.age} years
                </p>
              </div>

              {/* Field 3: Degree / Qualification */}
              <div className="p-4 rounded-[16px] bg-[var(--bg)] border border-[var(--border)] space-y-1">
                <div className="flex items-center gap-2 text-xs font-semibold text-[var(--text-muted)]">
                  <GraduationCap className="h-3.5 w-3.5 text-[var(--primary)]" />
                  <span>Degree / Qualification</span>
                </div>
                <p className="text-sm font-bold text-[var(--text)] pl-5.5">
                  {profile.degree === 'Other' && profile.degreeOther
                    ? `Other (${profile.degreeOther})`
                    : profile.degree}
                </p>
              </div>

              {/* Field 4: Mobile Number */}
              <div className="p-4 rounded-[16px] bg-[var(--bg)] border border-[var(--border)] space-y-1">
                <div className="flex items-center gap-2 text-xs font-semibold text-[var(--text-muted)]">
                  <Phone className="h-3.5 w-3.5 text-[var(--primary)]" />
                  <span>Verified Contact Number (E.164)</span>
                </div>
                <p className="text-sm font-bold text-[var(--text)] pl-5.5 font-mono">
                  {profile.mobileNumber}
                </p>
              </div>
            </div>

            {/* Field 5: Address (Multiline) */}
            <div className="p-4 rounded-[16px] bg-[var(--bg)] border border-[var(--border)] space-y-1">
              <div className="flex items-center gap-2 text-xs font-semibold text-[var(--text-muted)]">
                <MapPin className="h-3.5 w-3.5 text-[var(--primary)]" />
                <span>Institutional / Professional Address</span>
              </div>
              <p className="text-sm text-[var(--text)] pl-5.5 whitespace-pre-line leading-relaxed">
                {profile.address}
              </p>
            </div>

            {/* Field 6: Email Address */}
            <div className="p-4 rounded-[16px] bg-[var(--bg)] border border-[var(--border)] flex items-start justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-xs font-semibold text-[var(--text-muted)]">
                  <Mail className="h-3.5 w-3.5 text-[var(--primary)]" />
                  <span>Registered Email Address</span>
                </div>
                <p className="text-sm font-bold text-[var(--text)] pl-5.5">
                  {email || profile.email || 'educator@unitwise.local'}
                </p>
              </div>
              <div className="text-[11px] text-[var(--text-muted)] flex items-center gap-1.5 bg-[var(--surface)] px-2.5 py-1 rounded-lg border border-[var(--border)]">
                <Mail className="h-3 w-3 text-[var(--accent)]" />
                <span>Primary Contact</span>
              </div>
            </div>

            {profile.updatedAt && (
              <div className="text-[11px] text-[var(--text-muted)] text-right pt-2 border-t border-[var(--border)]">
                Last updated on {new Date(profile.updatedAt).toLocaleDateString(undefined, { 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </div>
            )}
          </div>
        )}

        {/* EDIT MODE FORM */}
        {isEditing && (
          <form onSubmit={handleSubmit} noValidate className="p-6 md:p-8 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* 1. Educator Name */}
              <div className="space-y-1.5">
                <label 
                  htmlFor="educatorName" 
                  className="block text-xs font-bold text-[var(--text)]"
                >
                  Educator Full Name <span className="text-[var(--danger)]">*</span>
                </label>
                <input
                  ref={nameInputRef}
                  id="educatorName"
                  name="educatorName"
                  type="text"
                  autoComplete="name"
                  placeholder="e.g. Dr. Jane M. Doe"
                  value={formState.educatorName}
                  onChange={(e) => handleFieldChange('educatorName', e.target.value)}
                  aria-describedby={formErrors.educatorName ? 'educatorName-error' : undefined}
                  aria-invalid={Boolean(formErrors.educatorName)}
                  className={`w-full neu-input ${
                    formErrors.educatorName ? 'border-[var(--danger)] focus:ring-[var(--danger)]' : ''
                  }`}
                />
                {formErrors.educatorName && (
                  <p id="educatorName-error" className="text-[11px] font-medium text-[var(--danger)] flex items-center gap-1 mt-1">
                    <AlertCircle className="h-3 w-3 flex-shrink-0" />
                    <span>{formErrors.educatorName}</span>
                  </p>
                )}
                <p className="text-[10px] text-[var(--text-muted)]">
                  Letters, spaces, hyphens, apostrophes, and periods (2–100 characters).
                </p>
              </div>

              {/* 2. Age */}
              <div className="space-y-1.5">
                <label 
                  htmlFor="age" 
                  className="block text-xs font-bold text-[var(--text)]"
                >
                  Age <span className="text-[var(--danger)]">*</span>
                </label>
                <input
                  ref={ageInputRef}
                  id="age"
                  name="age"
                  type="number"
                  min={MIN_AGE}
                  max={MAX_AGE}
                  step={1}
                  placeholder={`Between ${MIN_AGE} and ${MAX_AGE}`}
                  value={formState.age}
                  onChange={(e) => handleFieldChange('age', e.target.value)}
                  aria-describedby={formErrors.age ? 'age-error' : undefined}
                  aria-invalid={Boolean(formErrors.age)}
                  className={`w-full neu-input ${
                    formErrors.age ? 'border-[var(--danger)] focus:ring-[var(--danger)]' : ''
                  }`}
                />
                {formErrors.age && (
                  <p id="age-error" className="text-[11px] font-medium text-[var(--danger)] flex items-center gap-1 mt-1">
                    <AlertCircle className="h-3 w-3 flex-shrink-0" />
                    <span>{formErrors.age}</span>
                  </p>
                )}
                <p className="text-[10px] text-[var(--text-muted)]">
                  Must be an integer between {MIN_AGE} and {MAX_AGE}.
                </p>
              </div>

              {/* 3. Degree / Qualification */}
              <div className="space-y-1.5">
                <label 
                  htmlFor="degree" 
                  className="block text-xs font-bold text-[var(--text)]"
                >
                  Degree / Qualification <span className="text-[var(--danger)]">*</span>
                </label>
                <select
                  ref={degreeSelectRef}
                  id="degree"
                  name="degree"
                  value={formState.degree}
                  onChange={(e) => handleFieldChange('degree', e.target.value as DegreeOption)}
                  aria-describedby={formErrors.degree ? 'degree-error' : undefined}
                  aria-invalid={Boolean(formErrors.degree)}
                  className={`w-full neu-input ${
                    formErrors.degree ? 'border-[var(--danger)] focus:ring-[var(--danger)]' : ''
                  }`}
                >
                  {DEGREE_OPTIONS.map((deg) => (
                    <option key={deg} value={deg}>
                      {deg}
                    </option>
                  ))}
                </select>
                {formErrors.degree && (
                  <p id="degree-error" className="text-[11px] font-medium text-[var(--danger)] flex items-center gap-1 mt-1">
                    <AlertCircle className="h-3 w-3 flex-shrink-0" />
                    <span>{formErrors.degree}</span>
                  </p>
                )}
              </div>

              {/* 3b. Degree Other (Conditional Field) */}
              {formState.degree === 'Other' && (
                <div className="space-y-1.5 animate-in fade-in duration-150">
                  <label 
                    htmlFor="degreeOther" 
                    className="block text-xs font-bold text-[var(--text)]"
                  >
                    Specify Qualification <span className="text-[var(--danger)]">*</span>
                  </label>
                  <input
                    ref={degreeOtherInputRef}
                    id="degreeOther"
                    name="degreeOther"
                    type="text"
                    placeholder="e.g. M.Phil in Education, NBCT, State Certified"
                    value={formState.degreeOther}
                    onChange={(e) => handleFieldChange('degreeOther', e.target.value)}
                    aria-describedby={formErrors.degreeOther ? 'degreeOther-error' : undefined}
                    aria-invalid={Boolean(formErrors.degreeOther)}
                    className={`w-full neu-input ${
                      formErrors.degreeOther ? 'border-[var(--danger)] focus:ring-[var(--danger)]' : ''
                    }`}
                  />
                  {formErrors.degreeOther && (
                    <p id="degreeOther-error" className="text-[11px] font-medium text-[var(--danger)] flex items-center gap-1 mt-1">
                      <AlertCircle className="h-3 w-3 flex-shrink-0" />
                      <span>{formErrors.degreeOther}</span>
                    </p>
                  )}
                  <p className="text-[10px] text-[var(--text-muted)]">
                    Max 100 characters.
                  </p>
                </div>
              )}

              {/* 4. Mobile Number (E.164 with Country Code Picker) */}
              <div className="space-y-1.5">
                <label 
                  htmlFor="phoneNumber" 
                  className="block text-xs font-bold text-[var(--text)]"
                >
                  Mobile Number (E.164) <span className="text-[var(--danger)]">*</span>
                </label>
                <div className="flex gap-2">
                  <select
                    value={formState.dialCode}
                    onChange={(e) => handleFieldChange('dialCode', e.target.value)}
                    aria-label="Country dial code prefix"
                    className="neu-input w-28 text-xs font-mono font-bold"
                  >
                    {COUNTRY_CODES.map((c) => (
                      <option key={`${c.code}-${c.country}`} value={c.code}>
                        {c.code} ({c.country})
                      </option>
                    ))}
                  </select>
                  <input
                    ref={phoneInputRef}
                    id="phoneNumber"
                    name="phoneNumber"
                    type="tel"
                    autoComplete="tel-national"
                    placeholder="e.g. 4155552671"
                    value={formState.phoneNumber}
                    onChange={(e) => handleFieldChange('phoneNumber', e.target.value)}
                    aria-describedby={formErrors.mobileNumber ? 'mobileNumber-error' : undefined}
                    aria-invalid={Boolean(formErrors.mobileNumber)}
                    className={`flex-1 neu-input font-mono ${
                      formErrors.mobileNumber ? 'border-[var(--danger)] focus:ring-[var(--danger)]' : ''
                    }`}
                  />
                </div>
                {formErrors.mobileNumber && (
                  <p id="mobileNumber-error" className="text-[11px] font-medium text-[var(--danger)] flex items-center gap-1 mt-1">
                    <AlertCircle className="h-3 w-3 flex-shrink-0" />
                    <span>{formErrors.mobileNumber}</span>
                  </p>
                )}
                <p className="text-[10px] text-[var(--text-muted)]">
                  Formatted into standard international E.164: {formState.dialCode}{formState.phoneNumber.replace(/[^\d]/g, '') || '...'}
                </p>
              </div>

              {/* 5. Educator Email Address (Fully Editable) */}
              <div className="space-y-1.5">
                <label 
                  htmlFor="email" 
                  className="block text-xs font-bold text-[var(--text)]"
                >
                  Email Address <span className="text-[var(--danger)]">*</span>
                </label>
                <div className="relative">
                  <input
                    ref={emailInputRef}
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    placeholder="e.g. educator@school.edu"
                    value={formState.email}
                    onChange={(e) => handleFieldChange('email', e.target.value)}
                    aria-describedby={formErrors.email ? 'email-error' : undefined}
                    aria-invalid={Boolean(formErrors.email)}
                    className={`w-full neu-input pr-9 ${
                      formErrors.email ? 'border-[var(--danger)] focus:ring-[var(--danger)]' : ''
                    }`}
                  />
                  <Mail className="h-4 w-4 text-[var(--text-muted)] absolute right-3 top-1/2 -translate-y-1/2" />
                </div>
                {formErrors.email && (
                  <p id="email-error" className="text-[11px] font-medium text-[var(--danger)] flex items-center gap-1 mt-1">
                    <AlertCircle className="h-3 w-3 flex-shrink-0" />
                    <span>{formErrors.email}</span>
                  </p>
                )}
                <p className="text-[10px] text-[var(--text-muted)]">
                  Your registered login identifier and institutional contact email.
                </p>
              </div>
            </div>

            {/* 6. Address (Multiline) */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label 
                  htmlFor="address" 
                  className="block text-xs font-bold text-[var(--text)]"
                >
                  Institutional / School Address <span className="text-[var(--danger)]">*</span>
                </label>
                <span className="text-[10px] text-[var(--text-muted)]">
                  {formState.address.length}/300 chars
                </span>
              </div>
              <textarea
                ref={addressInputRef}
                id="address"
                name="address"
                rows={3}
                autoComplete="street-address"
                placeholder="Enter your school, department, institution, street address, and city..."
                value={formState.address}
                onChange={(e) => handleFieldChange('address', e.target.value)}
                aria-describedby={formErrors.address ? 'address-error' : undefined}
                aria-invalid={Boolean(formErrors.address)}
                className={`w-full neu-input resize-y min-h-[80px] leading-relaxed ${
                  formErrors.address ? 'border-[var(--danger)] focus:ring-[var(--danger)]' : ''
                }`}
              />
              {formErrors.address && (
                <p id="address-error" className="text-[11px] font-medium text-[var(--danger)] flex items-center gap-1 mt-1">
                  <AlertCircle className="h-3 w-3 flex-shrink-0" />
                  <span>{formErrors.address}</span>
                </p>
              )}
              <p className="text-[10px] text-[var(--text-muted)]">
                Between 5 and 300 characters.
              </p>
            </div>

            {/* Form Action Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-end gap-3 pt-4 border-t border-[var(--border)]">
              <button
                type="button"
                onClick={handleCancelClick}
                disabled={isSaving}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-[var(--radius-button)] bg-[var(--surface)] text-[var(--text)] border border-[var(--border)] text-xs font-semibold shadow-[var(--shadow-raised-sm)] hover:bg-[var(--lavender-soft)] disabled:opacity-50 transition-all"
              >
                <X className="h-4 w-4" />
                Cancel
              </button>

              <button
                type="submit"
                id="save-profile-btn"
                disabled={isSaving}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-[var(--radius-button)] bg-[var(--primary)] text-white text-xs font-semibold shadow-[var(--shadow-primary)] hover:bg-[var(--primary-hover)] disabled:opacity-50 transition-all"
              >
                {isSaving ? (
                  <>
                    <RefreshCw className="h-4 w-4 animate-spin" />
                    <span>Saving Profile...</span>
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4" />
                    <span>Save Changes</span>
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
