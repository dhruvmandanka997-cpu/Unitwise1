import React, { useState, useEffect } from 'react';
import { X, Check, Save, Settings as SettingsIcon, Key, Info, Sparkles, AlertCircle } from 'lucide-react';
import { UserSettings, api } from '../../services/api';
import { CURRICULUM_OPTIONS, GRADE_OPTIONS } from '../../data/templates';

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
      }, 800);
    } catch (err) {
      console.error('Failed to save settings:', err);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-navy-950/60 backdrop-blur-sm p-4">
      <div className="w-full max-w-xl rounded-2xl bg-white shadow-2xl dark:bg-navy-900 border border-navy-200 dark:border-navy-800 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-navy-100 px-6 py-4 dark:border-navy-800">
          <div className="flex items-center gap-2">
            <div className="rounded-lg bg-brand-50 p-2 text-brand-600 dark:bg-navy-800 dark:text-brand-400">
              <SettingsIcon className="h-4 w-4" />
            </div>
            <h2 className="text-base font-bold text-navy-900 dark:text-white">
              Teacher Preferences & AI Configuration
            </h2>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-navy-400 hover:text-navy-700 hover:bg-navy-100 dark:hover:bg-navy-800"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-5 max-h-[75vh] overflow-y-auto">
          {/* AI Status Banner */}
          <div className={`rounded-xl p-4 border text-xs space-y-1.5 ${
            settings.apiKeyConfigured
              ? 'bg-emerald-50 border-emerald-200 text-emerald-900 dark:bg-emerald-950/30 dark:border-emerald-900 dark:text-emerald-300'
              : 'bg-amber-50 border-amber-200 text-amber-900 dark:bg-amber-950/30 dark:border-amber-900 dark:text-amber-300'
          }`}>
            <div className="flex items-center gap-2 font-bold">
              {settings.apiKeyConfigured ? (
                <>
                  <Check className="h-4 w-4 text-emerald-600" />
                  <span>Google Gemini API Key Configured</span>
                </>
              ) : (
                <>
                  <AlertCircle className="h-4 w-4 text-amber-600" />
                  <span>Pedagogical Demo Mode Active</span>
                </>
              )}
            </div>
            <p className="leading-relaxed">
              {settings.apiKeyConfigured
                ? 'Your server is connected to live Google Gemini AI. Multi-week curriculum plans will be generated using live model reasoning.'
                : 'No API key is required to explore! LessonCraft AI includes an embedded Backward-Design Pedagogical Generator that produces realistic, rigorous multi-week plans with full Bloom’s taxonomy objectives, differentiation, and schedule consistency.'}
            </p>
            {!settings.apiKeyConfigured && (
              <div className="pt-1 text-[11px] opacity-90">
                To connect live Gemini: add <code className="bg-amber-100 dark:bg-amber-900/40 px-1 py-0.5 rounded font-mono">GEMINI_API_KEY=your_key</code> in your <code className="bg-amber-100 dark:bg-amber-900/40 px-1 py-0.5 rounded font-mono">.env</code> file and restart the server.
              </div>
            )}
          </div>

          {/* Form Fields */}
          <div className="space-y-4">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-navy-700 dark:text-navy-300">
                Default Curriculum Framework
              </label>
              <select
                value={settings.defaultCurriculum}
                onChange={(e) => setSettings({ ...settings, defaultCurriculum: e.target.value })}
                className="w-full rounded-lg border border-navy-200 bg-white px-3 py-2 text-xs text-navy-900 dark:border-navy-700 dark:bg-navy-800 dark:text-white"
              >
                {CURRICULUM_OPTIONS.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-navy-700 dark:text-navy-300">
                Default Grade Level
              </label>
              <select
                value={settings.defaultGradeLevel}
                onChange={(e) => setSettings({ ...settings, defaultGradeLevel: e.target.value })}
                className="w-full rounded-lg border border-navy-200 bg-white px-3 py-2 text-xs text-navy-900 dark:border-navy-700 dark:bg-navy-800 dark:text-white"
              >
                {GRADE_OPTIONS.map((g) => (
                  <option key={g} value={g}>{g}</option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-navy-700 dark:text-navy-300">
                  Default Class Duration (Minutes)
                </label>
                <input
                  type="number"
                  min={15}
                  max={180}
                  step={5}
                  value={settings.defaultClassDuration}
                  onChange={(e) => setSettings({ ...settings, defaultClassDuration: parseInt(e.target.value) || 50 })}
                  className="w-full rounded-lg border border-navy-200 bg-white px-3 py-2 text-xs text-navy-900 dark:border-navy-700 dark:bg-navy-800 dark:text-white"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-navy-700 dark:text-navy-300">
                  Preferred Language
                </label>
                <input
                  type="text"
                  value={settings.preferredLanguage}
                  onChange={(e) => setSettings({ ...settings, preferredLanguage: e.target.value })}
                  className="w-full rounded-lg border border-navy-200 bg-white px-3 py-2 text-xs text-navy-900 dark:border-navy-700 dark:bg-navy-800 dark:text-white"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-navy-700 dark:text-navy-300">
                Preferred Schedule Organization
              </label>
              <select
                value={settings.preferredFormat}
                onChange={(e) => setSettings({ ...settings, preferredFormat: e.target.value as 'calendar' | 'session_sequence' })}
                className="w-full rounded-lg border border-navy-200 bg-white px-3 py-2 text-xs text-navy-900 dark:border-navy-700 dark:bg-navy-800 dark:text-white"
              >
                <option value="session_sequence">Linear Sequence of Teaching Sessions (1...N)</option>
                <option value="calendar">Weekly Calendar (Monday through Friday)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-end gap-3 border-t border-navy-100 bg-navy-50/50 px-6 py-4 dark:border-navy-800 dark:bg-navy-800/40">
          <button
            onClick={onClose}
            className="rounded-lg px-4 py-2 text-xs font-semibold text-navy-600 hover:bg-navy-100 dark:text-navy-300 dark:hover:bg-navy-700"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="inline-flex items-center gap-1.5 rounded-lg bg-brand-600 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-brand-500"
          >
            <Save className="h-3.5 w-3.5" />
            {saveSuccess ? 'Saved!' : isSaving ? 'Saving...' : 'Save Preferences'}
          </button>
        </div>
      </div>
    </div>
  );
};
