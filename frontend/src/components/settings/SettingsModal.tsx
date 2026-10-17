import React, { useState, useEffect } from 'react';
import { X, Check, Save, Settings as SettingsIcon, Cpu, BookOpen, AlertCircle } from 'lucide-react';
import { UserSettings, api } from '../../services/api';
import { CURRICULUM_OPTIONS, GRADE_OPTIONS } from '../../data/templates';
import { BRAND } from '../../config/brand';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSettingsUpdated: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  onSettingsUpdated,
}) => {
  const [settings, setSettings] = useState<UserSettings>({
    defaultCurriculum: 'US Common Core & Next Generation Science Standards (NGSS)',
    defaultGradeLevel: 'Grade 9 (High School / Freshman)',
    preferredLanguage: 'English',
    preferredFormat: 'session_sequence',
    defaultClassDuration: 50,
    theme: 'light',
    aiProvider: 'gemini',
    apiKeyConfigured: false,
  });

  const [activeTab, setActiveTab] = useState<'preferences' | 'ai'>('preferences');
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    if (isOpen) {
      api.getSettings().then(setSettings).catch(console.error);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await api.saveSettings(settings);
      setSaveSuccess(true);
      onSettingsUpdated();
      setTimeout(() => {
        setSaveSuccess(false);
        onClose();
      }, 700);
    } catch (err) {
      console.error('Failed to save settings:', err);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-xs p-4">
      <div className="w-full max-w-xl neu-card overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[var(--border)] px-6 py-5">
          <div className="flex items-center gap-3">
            <div className="neu-icon-box">
              <SettingsIcon className="h-5 w-5 text-[var(--primary)]" />
            </div>
            <div>
              <h2 className="text-base font-bold text-[var(--text)]">
                {BRAND.name} Profile & Pedagogical Engine
              </h2>
              <p className="text-xs text-[var(--text-muted)]">
                Configure curriculum defaults and AI reasoning parameters
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-[12px] p-2 text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--lavender-soft)] transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="flex border-b border-[var(--border)] px-6 bg-[var(--bg)] gap-2 pt-2 text-xs">
          <button
            onClick={() => setActiveTab('preferences')}
            className={`flex items-center gap-2 py-2 px-3.5 rounded-t-[12px] font-semibold transition-all ${
              activeTab === 'preferences'
                ? 'bg-white text-[var(--primary)] border-t border-x border-[var(--border)] -mb-px'
                : 'text-[var(--text-muted)] hover:text-[var(--text)]'
            }`}
          >
            <BookOpen className="h-3.5 w-3.5 text-[var(--primary)]" />
            Teaching Defaults
          </button>
          <button
            onClick={() => setActiveTab('ai')}
            className={`flex items-center gap-2 py-2 px-3.5 rounded-t-[12px] font-semibold transition-all ${
              activeTab === 'ai'
                ? 'bg-white text-[var(--primary)] border-t border-x border-[var(--border)] -mb-px'
                : 'text-[var(--text-muted)] hover:text-[var(--text)]'
            }`}
          >
            <Cpu className="h-3.5 w-3.5 text-[var(--primary)]" />
            AI Model Engine
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-5 max-h-[70vh] overflow-y-auto">
          {activeTab === 'ai' ? (
            <div className="space-y-4">
              {/* AI Status Banner */}
              <div className={`rounded-[16px] p-4 border text-xs space-y-1.5 ${
                settings.apiKeyConfigured
                  ? 'bg-[var(--lavender-soft)] border-[var(--border)] text-[var(--primary)]'
                  : 'bg-[var(--lavender-soft)]/60 border-[var(--border)] text-[var(--text)]'
              }`}>
                <div className="flex items-center gap-2 font-bold">
                  {settings.apiKeyConfigured ? (
                    <>
                      <Check className="h-4 w-4 text-[var(--primary)]" />
                      <span>Connected to Google Gemini Live API</span>
                    </>
                  ) : (
                    <>
                      <AlertCircle className="h-4 w-4 text-[var(--primary)]" />
                      <span>{BRAND.name} Embedded Pedagogical Engine Active</span>
                    </>
                  )}
                </div>
                <p className="leading-relaxed text-[11px] text-[var(--text-muted)]">
                  {settings.apiKeyConfigured
                    ? 'Your application server has a valid Gemini API key configured. Multi-week units are generated with live model reasoning.'
                    : `No API key is required to explore! ${BRAND.name} includes an embedded Backward-Design Pedagogical Generator producing structured multi-week units aligned to Bloom’s taxonomy and schedule parameters.`}
                </p>
                {!settings.apiKeyConfigured && (
                  <div className="pt-1 text-[11px] text-[var(--text-muted)]">
                    To activate live Gemini AI: specify <code className="bg-[var(--lavender-soft)] px-1.5 py-0.5 rounded-md font-mono text-[var(--primary)]">GEMINI_API_KEY=your_key</code> in your backend environment.
                  </div>
                )}
              </div>

              <div className="rounded-[16px] border border-[var(--border)] p-4 bg-[var(--bg)] space-y-1.5 text-xs">
                <span className="font-bold text-[var(--text)]">Backward-Design UbD Framework</span>
                <p className="text-[11px] text-[var(--text-muted)] leading-relaxed">
                  Every generation enforces Stage 1 (Desired Results), Stage 2 (Assessment Evidence), and Stage 3 (Learning Plan) sequencing to guarantee instructional coherence.
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-[var(--text)]">
                  Default Curriculum Framework
                </label>
                <select
                  value={settings.defaultCurriculum}
                  onChange={(e) => setSettings({ ...settings, defaultCurriculum: e.target.value })}
                  className="w-full neu-input px-3.5 py-2 text-xs text-[var(--text)]"
                >
                  {CURRICULUM_OPTIONS.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-[var(--text)]">
                  Default Grade Level
                </label>
                <select
                  value={settings.defaultGradeLevel}
                  onChange={(e) => setSettings({ ...settings, defaultGradeLevel: e.target.value })}
                  className="w-full neu-input px-3.5 py-2 text-xs text-[var(--text)]"
                >
                  {GRADE_OPTIONS.map((g) => (
                    <option key={g} value={g}>{g}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3.5">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-[var(--text)]">
                    Session Duration (Mins)
                  </label>
                  <input
                    type="number"
                    min={15}
                    max={180}
                    step={5}
                    value={settings.defaultClassDuration}
                    onChange={(e) => setSettings({ ...settings, defaultClassDuration: parseInt(e.target.value) || 50 })}
                    className="w-full neu-input px-3.5 py-2 text-xs text-[var(--text)]"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-[var(--text)]">
                    Instruction Language
                  </label>
                  <input
                    type="text"
                    value={settings.preferredLanguage}
                    onChange={(e) => setSettings({ ...settings, preferredLanguage: e.target.value })}
                    className="w-full neu-input px-3.5 py-2 text-xs text-[var(--text)]"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-[var(--text)]">
                  Schedule Organization
                </label>
                <select
                  value={settings.preferredFormat}
                  onChange={(e) => setSettings({ ...settings, preferredFormat: e.target.value as 'calendar' | 'session_sequence' })}
                  className="w-full neu-input px-3.5 py-2 text-xs text-[var(--text)]"
                >
                  <option value="session_sequence">Linear Sequence of Teaching Sessions (1...N)</option>
                  <option value="calendar">Weekly Calendar (Monday through Friday)</option>
                </select>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-end gap-3 border-t border-[var(--border)] bg-[var(--bg)] px-6 py-4">
          <button
            onClick={onClose}
            className="neu-btn-secondary px-4 py-2 text-xs font-semibold text-[var(--text-muted)]"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="neu-btn-primary inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white disabled:opacity-50"
          >
            <Save className="h-3.5 w-3.5" />
            {saveSuccess ? 'Saved' : isSaving ? 'Saving...' : 'Save Preferences'}
          </button>
        </div>
      </div>
    </div>
  );
};
