import React, { useState, useEffect } from 'react';
import { X, Globe, Building2, ExternalLink, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { api } from '../../services/api';
import { DirectoryCountry, DirectoryRegion, EducationPathway } from '../../types/directory';

interface SuggestCurriculumModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultCountryIso2?: string;
  onSuggestionSubmitted?: () => void;
}

export const SuggestCurriculumModal: React.FC<SuggestCurriculumModalProps> = ({
  isOpen,
  onClose,
  defaultCountryIso2,
  onSuggestionSubmitted,
}) => {
  const [countries, setCountries] = useState<DirectoryCountry[]>([]);
  const [regions, setRegions] = useState<DirectoryRegion[]>([]);
  const [selectedCountry, setSelectedCountry] = useState<string>(defaultCountryIso2 || 'IN');
  const [selectedRegion, setSelectedRegion] = useState<string>('');
  const [boardName, setBoardName] = useState<string>('');
  const [organizationName, setOrganizationName] = useState<string>('');
  const [websiteUrl, setWebsiteUrl] = useState<string>('');
  const [pathway, setPathway] = useState<EducationPathway>('k-12');
  const [notes, setNotes] = useState<string>('');
  const [email, setEmail] = useState<string>('');

  const [loading, setLoading] = useState(false);
  const [loadingRegions, setLoadingRegions] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      api.getCountries(undefined, 300)
        .then((res) => setCountries(res.countries))
        .catch((err) => console.error('Failed to load countries:', err));
    }
  }, [isOpen]);

  useEffect(() => {
    if (selectedCountry) {
      setLoadingRegions(true);
      api.getRegions(selectedCountry)
        .then((res) => setRegions(res.regions))
        .catch(() => setRegions([]))
        .finally(() => setLoadingRegions(false));
    } else {
      setRegions([]);
    }
    setSelectedRegion('');
  }, [selectedCountry]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!selectedCountry) {
      setError('Please select a country.');
      return;
    }
    if (!boardName.trim()) {
      setError('Please enter the name of the curriculum or education board.');
      return;
    }
    if (!websiteUrl.trim()) {
      setError('Please provide an official website URL.');
      return;
    }

    // Check basic url format
    try {
      new URL(websiteUrl.trim());
    } catch {
      setError('Please enter a valid URL starting with http:// or https://');
      return;
    }

    setLoading(true);
    try {
      const res = await api.submitCurriculumSuggestion({
        countryIso2: selectedCountry,
        regionCode: selectedRegion || undefined,
        boardName: boardName.trim(),
        organizationName: organizationName.trim() || undefined,
        websiteUrl: websiteUrl.trim(),
        educationPathway: pathway,
        notes: notes.trim() || undefined,
        submitterEmail: email.trim() || undefined,
      });

      setSuccessMessage(res.message || 'Your suggestion has been submitted successfully!');
      if (onSuggestionSubmitted) onSuggestionSubmitted();
      setTimeout(() => {
        setSuccessMessage(null);
        onClose();
      }, 2400);
    } catch (err: any) {
      setError(err?.message || 'Failed to submit curriculum suggestion.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
      <div 
        className="relative w-full max-w-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/50">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-900/50">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                Suggest an Education Board
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Help expand UnitWise's source-verified global curriculum directory
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-5">
          {successMessage ? (
            <div className="py-8 text-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 mx-auto flex items-center justify-center">
                <CheckCircle2 className="w-7 h-7" />
              </div>
              <h3 className="text-base font-semibold text-slate-900 dark:text-white">Suggestion Received</h3>
              <p className="text-sm text-slate-600 dark:text-slate-300 max-w-md mx-auto">
                {successMessage}
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Our verification pipeline will review domain reachability and index official standards under Fair Use.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900/50 flex items-start gap-2.5 text-rose-700 dark:text-rose-300 text-xs">
                  <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <div className="p-3.5 rounded-xl bg-indigo-50/60 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-900/30 text-xs text-indigo-900 dark:text-indigo-200 leading-relaxed">
                <strong>Verification Standard:</strong> UnitWise adheres to strict source verification. Every board record must be anchored to an authentic government ministry or educational authority website.
              </div>

              {/* Country & Region Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    Country <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={selectedCountry}
                    onChange={(e) => setSelectedCountry(e.target.value)}
                    className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    required
                  >
                    {countries.map((c) => (
                      <option key={c.iso2} value={c.iso2}>
                        {c.flagEmoji ? `${c.flagEmoji} ` : ''}{c.name} ({c.iso2})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    State / Region / Province <span className="text-slate-400 font-normal">(Optional)</span>
                  </label>
                  <select
                    value={selectedRegion}
                    onChange={(e) => setSelectedRegion(e.target.value)}
                    disabled={loadingRegions || regions.length === 0}
                    className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none disabled:opacity-50"
                  >
                    <option value="">
                      {loadingRegions ? 'Loading subdivisions...' : regions.length === 0 ? 'No regional subdivisions' : 'All Regions / National'}
                    </option>
                    {regions.map((r) => (
                      <option key={r.code} value={r.code}>
                        {r.name} ({r.code})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Board Name */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Board or Curriculum Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={boardName}
                  onChange={(e) => setBoardName(e.target.value)}
                  placeholder="e.g. Kenya KICD, Singapore MOE, Gujarat GSEB"
                  className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  required
                />
              </div>

              {/* Organization Name */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Issuing Organization <span className="text-slate-400 font-normal">(Optional)</span>
                </label>
                <input
                  type="text"
                  value={organizationName}
                  onChange={(e) => setOrganizationName(e.target.value)}
                  placeholder="e.g. Kenya Institute of Curriculum Development"
                  className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              {/* Official Website URL */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Official Website or Syllabus URL <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="url"
                    value={websiteUrl}
                    onChange={(e) => setWebsiteUrl(e.target.value)}
                    placeholder="https://..."
                    className="w-full pl-3.5 pr-9 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    required
                  />
                  <ExternalLink className="absolute right-3 top-2.5 w-4 h-4 text-slate-400 pointer-events-none" />
                </div>
              </div>

              {/* Pathway & Email Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    Education Pathway
                  </label>
                  <select
                    value={pathway}
                    onChange={(e) => setPathway(e.target.value as EducationPathway)}
                    className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  >
                    <option value="k-12">K-12 Comprehensive</option>
                    <option value="primary">Primary / Elementary</option>
                    <option value="secondary">Secondary / Middle School</option>
                    <option value="higher-secondary">Higher Secondary / High School</option>
                    <option value="early-childhood">Early Childhood</option>
                    <option value="vocational">Vocational / Technical</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    Your Email <span className="text-slate-400 font-normal">(Optional, for status updates)</span>
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="teacher@school.edu"
                    className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Additional Notes or Specific Syllabus Links <span className="text-slate-400 font-normal">(Optional)</span>
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="e.g. Please index the Class 9 & 10 Mathematics syllabus guidelines."
                  rows={2}
                  className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              {/* Actions */}
              <div className="pt-3 flex items-center justify-end gap-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex items-center gap-2 px-5 py-2 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 active:scale-[0.98] rounded-xl shadow-sm transition disabled:opacity-60"
                >
                  {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                  Submit for Verification
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
