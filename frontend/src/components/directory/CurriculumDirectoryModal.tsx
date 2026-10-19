import React, { useState, useEffect } from 'react';
import {
  X,
  Globe2,
  ShieldCheck,
  Clock,
  FileText,
  Building2,
  ExternalLink,
  Search,
  AlertTriangle,
  PlusCircle,
  BarChart3,
  BookOpen,
  CheckCircle2,
  HelpCircle,
} from 'lucide-react';
import { api } from '../../services/api';
import {
  DirectoryCountry,
  DirectoryCurriculum,
  DirectoryCoverageReport,
  VerificationStatus,
} from '../../types/directory';

interface CurriculumDirectoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenSuggestModal: () => void;
  initialCurriculumId?: string | null;
}

export const CurriculumDirectoryModal: React.FC<CurriculumDirectoryModalProps> = ({
  isOpen,
  onClose,
  onOpenSuggestModal,
  initialCurriculumId,
}) => {
  const [coverage, setCoverage] = useState<DirectoryCoverageReport | null>(null);
  const [countries, setCountries] = useState<DirectoryCountry[]>([]);
  const [curricula, setCurricula] = useState<DirectoryCurriculum[]>([]);
  const [selectedCurriculumId, setSelectedCurriculumId] = useState<string | null>(initialCurriculumId || null);

  useEffect(() => {
    if (initialCurriculumId) {
      setSelectedCurriculumId(initialCurriculumId);
    }
  }, [initialCurriculumId]);

  const [search, setSearch] = useState('');
  const [selectedCountryFilter, setSelectedCountryFilter] = useState('');
  const [selectedScopeFilter, setSelectedScopeFilter] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isOpen) {
      setLoading(true);
      Promise.all([
        api.getDirectoryCoverage(),
        api.getCountries(undefined, 300),
        api.getCurricula(),
      ])
        .then(([covRes, countryRes, currRes]) => {
          setCoverage(covRes);
          setCountries(countryRes.countries);
          setCurricula(currRes.curricula);
        })
        .catch((err) => console.error('Failed to load directory data:', err))
        .finally(() => setLoading(false));
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // Filter curricula
  const filteredCurricula = curricula.filter((c) => {
    if (selectedCountryFilter && c.countryIso2 !== selectedCountryFilter && c.scope !== 'international') {
      return false;
    }
    if (selectedScopeFilter && c.scope !== selectedScopeFilter) {
      return false;
    }
    if (search.trim()) {
      const q = search.toLowerCase().trim();
      const matchName = c.name.toLowerCase().includes(q);
      const matchShort = c.shortName.toLowerCase().includes(q);
      const matchCitation = c.sourceCitation?.toLowerCase().includes(q);
      return matchName || matchShort || matchCitation;
    }
    return true;
  });

  const selectedCurriculum = curricula.find((c) => c.id === selectedCurriculumId);

  const renderStatusBadge = (status: VerificationStatus) => {
    switch (status) {
      case 'verified':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/70 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
            <ShieldCheck className="w-3.5 h-3.5" />
            Verified Board
          </span>
        );
      case 'provisional':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-blue-100 text-blue-800 dark:bg-blue-950/70 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
            <Clock className="w-3.5 h-3.5" />
            Provisional Review
          </span>
        );
      case 'community_submitted':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-100 text-amber-800 dark:bg-amber-950/70 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
            <HelpCircle className="w-3.5 h-3.5" />
            Community Submitted
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
            Custom / Unverified
          </span>
        );
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
      <div 
        className="relative w-full max-w-4xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/50">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-900/50">
              <Globe2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                Global Curriculum Directory & Coverage
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Source-verified education authorities, syllabus references, and real coverage statistics
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                onClose();
                onOpenSuggestModal();
              }}
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/50 border border-indigo-200 dark:border-indigo-800 rounded-xl transition"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              Suggest Missing Board
            </button>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6">
          {/* Real Coverage Metric Cards */}
          {coverage && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800">
                <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
                  ISO Nations Covered
                </span>
                <div className="flex items-baseline gap-1.5 mt-1">
                  <span className="text-2xl font-bold text-slate-900 dark:text-white">
                    {coverage.totalCountriesWithCurricula}
                  </span>
                  <span className="text-xs text-slate-500 dark:text-slate-400">
                    / {coverage.totalRecognizedCountries}
                  </span>
                </div>
                <span className="text-[10px] text-indigo-600 dark:text-indigo-400 font-medium block mt-0.5">
                  {coverage.countryCoveragePercentage}% Measured Coverage
                </span>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800">
                <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
                  Curricula & Boards
                </span>
                <div className="flex items-baseline gap-1.5 mt-1">
                  <span className="text-2xl font-bold text-slate-900 dark:text-white">
                    {coverage.totalCurricula}
                  </span>
                  <span className="text-xs text-slate-500 dark:text-slate-400">
                    ({coverage.breakdownByStatus.verified || 0} verified)
                  </span>
                </div>
                <span className="text-[10px] text-slate-500 dark:text-slate-400 block mt-0.5">
                  {coverage.totalOrganizations} Issuing Authorities
                </span>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800">
                <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
                  Official Documents
                </span>
                <div className="flex items-baseline gap-1.5 mt-1">
                  <span className="text-2xl font-bold text-slate-900 dark:text-white">
                    {coverage.totalVerifiedDocuments}
                  </span>
                  <span className="text-xs text-slate-500 dark:text-slate-400">
                    syllabi indexed
                  </span>
                </div>
                <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium block mt-0.5">
                  Fair-Use Grounding
                </span>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800">
                <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
                  Verified Standards
                </span>
                <div className="flex items-baseline gap-1.5 mt-1">
                  <span className="text-2xl font-bold text-slate-900 dark:text-white">
                    {coverage.totalVerifiedStandards}
                  </span>
                  <span className="text-xs text-slate-500 dark:text-slate-400">
                    in registry
                  </span>
                </div>
                <span className="text-[10px] text-slate-500 dark:text-slate-400 block mt-0.5">
                  RAG Grounded Codes
                </span>
              </div>
            </div>
          )}

          {/* Honest Gap Disclosure Notice */}
          {coverage && coverage.documentedGaps && (
            <div className="p-4 rounded-xl bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200/80 dark:border-amber-900/40 text-xs text-amber-900 dark:text-amber-200 space-y-2">
              <div className="flex items-center gap-2 font-semibold text-amber-800 dark:text-amber-300">
                <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
                <span>Honest Coverage Principle & Documented Ingestion Gaps</span>
              </div>
              <p className="leading-relaxed">
                UnitWise does not claim 100% worldwide coverage because no authoritative, complete single global directory of educational boards exists. We index authentic official material transparently. The following major regional curricula are currently queued for verified ingestion:
              </p>
              <ul className="list-disc list-inside space-y-1 text-slate-700 dark:text-slate-300 pl-1">
                {coverage.documentedGaps.map((gap, idx) => (
                  <li key={idx} className="leading-snug">{gap}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Search & Filters */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-2.5 w-4 h-4 text-slate-400 pointer-events-none" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search boards (e.g. CBSE, NGSS, Cambridge, GCSE, VCE)..."
                className="w-full pl-9 pr-4 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
            </div>

            <div className="flex gap-2">
              <select
                value={selectedCountryFilter}
                onChange={(e) => setSelectedCountryFilter(e.target.value)}
                className="px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              >
                <option value="">All Countries</option>
                <option value="IN">India (IN)</option>
                <option value="US">United States (US)</option>
                <option value="GB">United Kingdom (GB)</option>
                <option value="AU">Australia (AU)</option>
                <option value="CA">Canada (CA)</option>
              </select>

              <select
                value={selectedScopeFilter}
                onChange={(e) => setSelectedScopeFilter(e.target.value)}
                className="px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              >
                <option value="">All Scopes</option>
                <option value="national">National</option>
                <option value="state-regional">State / Regional</option>
                <option value="international">International</option>
              </select>
            </div>
          </div>

          {/* Curricula Table / List */}
          <div className="space-y-3">
            <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 flex items-center justify-between">
              <span>Showing {filteredCurricula.length} of {curricula.length} curricula</span>
              <button
                onClick={onOpenSuggestModal}
                className="text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1 sm:hidden"
              >
                <PlusCircle className="w-3.5 h-3.5" />
                Suggest Board
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {filteredCurricula.map((curr) => {
                const isSelected = selectedCurriculumId === curr.id;
                return (
                  <div
                    key={curr.id}
                    onClick={() => setSelectedCurriculumId(isSelected ? null : curr.id)}
                    className={`p-4 rounded-xl border text-left transition cursor-pointer ${
                      isSelected
                        ? 'border-indigo-500 bg-indigo-50/40 dark:bg-indigo-950/30 ring-1 ring-indigo-500'
                        : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800/40 hover:border-slate-300 dark:hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2 mb-1.5">
                      <h4 className="text-sm font-bold text-slate-900 dark:text-white leading-snug">
                        {curr.name}
                      </h4>
                      {renderStatusBadge(curr.verificationStatus)}
                    </div>

                    <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 mb-2.5">
                      {curr.sourceCitation || 'Documented educational board guidelines and learning standards.'}
                    </p>

                    <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-600 dark:text-slate-300">
                      <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-medium">
                        {curr.countryIso2 === 'OTHER' ? 'International' : curr.countryIso2}
                        {curr.regionCode ? ` · ${curr.regionCode}` : ''}
                      </span>
                      <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                        {curr.educationPathway.toUpperCase()}
                      </span>
                      <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                        {curr.spelling} English
                      </span>
                      {curr.sourceUrl && (
                        <a
                          href={curr.sourceUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="inline-flex items-center gap-1 text-indigo-600 dark:text-indigo-400 hover:underline ml-auto"
                        >
                          Official Link <ExternalLink className="w-3 h-3" />
                        </a>
                      )}
                    </div>

                    {/* Expanded details */}
                    {isSelected && (
                      <div className="mt-3.5 pt-3 border-t border-slate-200 dark:border-slate-700/60 text-xs space-y-2 animate-fadeIn">
                        {curr.assessmentStyle && (
                          <div>
                            <span className="font-semibold text-slate-700 dark:text-slate-300">Assessment Style:</span>{' '}
                            <span className="text-slate-600 dark:text-slate-400">{curr.assessmentStyle}</span>
                          </div>
                        )}
                        {curr.officialDomains && curr.officialDomains.length > 0 && (
                          <div>
                            <span className="font-semibold text-slate-700 dark:text-slate-300">Verified Domains:</span>{' '}
                            <span className="font-mono text-[11px] text-slate-600 dark:text-slate-400">
                              {curr.officialDomains.join(', ')}
                            </span>
                          </div>
                        )}
                        {curr.lastVerifiedAt && (
                          <div className="text-[11px] text-slate-400">
                            Last verified against primary publication: {new Date(curr.lastVerifiedAt).toLocaleDateString()}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
          <span>Standards and syllabus metadata licensed under respective official authorities.</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-lg transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
