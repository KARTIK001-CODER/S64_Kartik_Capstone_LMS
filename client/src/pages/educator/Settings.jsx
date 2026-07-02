import React, { useState, useEffect } from 'react';
import { Save, DollarSign, Globe, Lock, Users, FileText, Eye, BookOpen } from 'lucide-react';
import { useAppContext } from '../../context/AppContext';
import { Card, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Select } from '../../components/ui/select';
import { Skeleton } from '../../components/ui/skeleton';
import { ErrorState } from '../../components/ui/empty-state';
import { useToast } from '../../components/ui/toast';

const DIFFICULTY_OPTIONS = [
  { value: 'Beginner', label: 'Beginner' },
  { value: 'Intermediate', label: 'Intermediate' },
  { value: 'Advanced', label: 'Advanced' },
  { value: 'All Levels', label: 'All Levels' },
];
const LANG_OPTIONS = [
  { value: 'English', label: 'English' },
  { value: 'Spanish', label: 'Spanish' },
  { value: 'French', label: 'French' },
  { value: 'German', label: 'German' },
  { value: 'Hindi', label: 'Hindi' },
  { value: 'Chinese', label: 'Chinese' },
  { value: 'Arabic', label: 'Arabic' },
  { value: 'Portuguese', label: 'Portuguese' },
  { value: 'Japanese', label: 'Japanese' },
  { value: 'Korean', label: 'Korean' },
  { value: 'Other', label: 'Other' },
];
const CATEGORY_OPTIONS = [
  { value: 'General', label: 'General' },
  { value: 'Development', label: 'Development' },
  { value: 'Business', label: 'Business' },
  { value: 'Design', label: 'Design' },
  { value: 'Marketing', label: 'Marketing' },
  { value: 'IT & Software', label: 'IT & Software' },
  { value: 'Personal Development', label: 'Personal Development' },
  { value: 'Photography', label: 'Photography' },
  { value: 'Music', label: 'Music' },
];

const SectionCard = ({ icon: Icon, title, description, children }) => (
  <Card variant="default" padding="lg">
    <div className="flex items-start gap-4 mb-4">
      <div className="p-2.5 rounded-lg bg-primary/10 text-primary flex-shrink-0">
        <Icon size={18} />
      </div>
      <div>
        <CardTitle className="text-base font-semibold text-foreground">{title}</CardTitle>
        <p className="text-sm text-muted-foreground mt-0.5">{description}</p>
      </div>
    </div>
    {children}
  </Card>
);

const Settings = () => {
  const { api } = useAppContext();
  const toast = useToast();
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [saved, setSaved] = useState(false);

  const fetchSettings = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get('/api/educator/settings');
      setSettings(res.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load settings');
    } finally { setLoading(false); }
  };

  useEffect(() => { fetchSettings(); }, []);

  const update = (section, field, value) => {
    setSettings(prev => ({
      ...prev,
      [section]: { ...(prev[section] || {}), [field]: value },
    }));
    setSaved(false);
  };

  const handleSave = async () => {
    setSaving(true);
    setSaved(false);
    try {
      const { defaults, visibility, certificate, enrollment } = settings;
      await api.put('/api/educator/settings', { defaults, visibility, certificate, enrollment });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save settings');
    } finally { setSaving(false); }
  };

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="rounded-xl border border-border p-6">
            <Skeleton variant="heading" />
            <div className="mt-4 space-y-3">
              <Skeleton variant="text" className="w-full h-10" />
              <Skeleton variant="text" className="w-3/4 h-10" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (error) return <div className="p-6"><ErrorState title="Failed to load settings" description={error} onRetry={fetchSettings} /></div>;
  if (!settings) return null;

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Settings</h1>
          <p className="text-muted-foreground mt-1">Configure your course defaults and preferences</p>
        </div>
        <Button variant="primary" size="sm" onClick={handleSave} loading={saving}>
          <Save size={14} /> {saved ? 'Saved!' : 'Save Settings'}
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Default Course Settings */}
        <SectionCard icon={BookOpen} title="Course Defaults" description="Default values applied when creating a new course">
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1.5">Default Price ($)</label>
              <div className="relative">
                <DollarSign size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="number" min="0" step="0.01"
                  value={settings.defaults?.price ?? 0}
                  onChange={(e) => update('defaults', 'price', parseFloat(e.target.value) || 0)}
                  className="w-full h-10 pl-9 pr-3 rounded-lg border border-input bg-background text-sm text-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                />
              </div>
            </div>
            <div>
              <Select
                label="Default Difficulty"
                value={settings.defaults?.difficulty || 'All Levels'}
                onChange={(e) => update('defaults', 'difficulty', e.target.value)}
                options={DIFFICULTY_OPTIONS}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Select
                  label="Default Language"
                  value={settings.defaults?.language || 'English'}
                  onChange={(e) => update('defaults', 'language', e.target.value)}
                  options={LANG_OPTIONS}
                />
              </div>
              <div>
                <Select
                  label="Default Category"
                  value={settings.defaults?.category || 'General'}
                  onChange={(e) => update('defaults', 'category', e.target.value)}
                  options={CATEGORY_OPTIONS}
                />
              </div>
            </div>
          </div>
        </SectionCard>

        {/* Visibility Defaults */}
        <SectionCard icon={Eye} title="Visibility Defaults" description="Control how your courses and profile appear">
          <div className="space-y-4">
            <label className="flex items-center justify-between p-3 rounded-lg border border-border cursor-pointer hover:bg-accent/50 transition-colors">
              <div>
                <p className="text-sm font-medium text-foreground">Auto-publish courses</p>
                <p className="text-xs text-muted-foreground">New courses are published immediately instead of saved as draft</p>
              </div>
              <input
                type="checkbox"
                checked={settings.visibility?.autoPublish || false}
                onChange={(e) => update('visibility', 'autoPublish', e.target.checked)}
                className="rounded border-border text-primary focus:ring-primary h-4 w-4"
              />
            </label>
            <label className="flex items-center justify-between p-3 rounded-lg border border-border cursor-pointer hover:bg-accent/50 transition-colors">
              <div>
                <p className="text-sm font-medium text-foreground">Show courses on profile</p>
                <p className="text-xs text-muted-foreground">Display your published courses on your public instructor profile</p>
              </div>
              <input
                type="checkbox"
                checked={settings.visibility?.showOnProfile !== false}
                onChange={(e) => update('visibility', 'showOnProfile', e.target.checked)}
                className="rounded border-border text-primary focus:ring-primary h-4 w-4"
              />
            </label>
          </div>
        </SectionCard>

        {/* Certificate Settings */}
        <SectionCard icon={FileText} title="Certificate Settings" description="Configure course completion certificates">
          <div className="space-y-4">
            <label className="flex items-center justify-between p-3 rounded-lg border border-border cursor-pointer hover:bg-accent/50 transition-colors">
              <div>
                <p className="text-sm font-medium text-foreground">Auto-issue certificates</p>
                <p className="text-xs text-muted-foreground">Automatically issue a certificate when a student completes your course</p>
              </div>
              <input
                type="checkbox"
                checked={settings.certificate?.autoIssue !== false}
                onChange={(e) => update('certificate', 'autoIssue', e.target.checked)}
                className="rounded border-border text-primary focus:ring-primary h-4 w-4"
              />
            </label>
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1.5">Passing Score (%)</label>
              <div className="flex items-center gap-3">
                <input
                  type="range" min="0" max="100" step="5"
                  value={settings.certificate?.passingScore ?? 80}
                  onChange={(e) => update('certificate', 'passingScore', parseInt(e.target.value))}
                  className="flex-1 accent-primary"
                />
                <span className="text-sm font-medium text-foreground w-10 text-right">{settings.certificate?.passingScore ?? 80}%</span>
              </div>
            </div>
          </div>
        </SectionCard>

        {/* Enrollment Settings */}
        <SectionCard icon={Users} title="Enrollment Settings" description="Manage how students enroll in your courses">
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1.5">Max students per course</label>
              <div className="relative">
                <Users size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="number" min="0"
                  value={settings.enrollment?.maxStudents ?? 0}
                  onChange={(e) => update('enrollment', 'maxStudents', parseInt(e.target.value) || 0)}
                  placeholder="0 = unlimited"
                  className="w-full h-10 pl-9 pr-3 rounded-lg border border-input bg-background text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                />
              </div>
              <p className="text-xs text-muted-foreground mt-1">Set to 0 for unlimited enrollment</p>
            </div>
            <label className="flex items-center justify-between p-3 rounded-lg border border-border cursor-pointer hover:bg-accent/50 transition-colors">
              <div>
                <p className="text-sm font-medium text-foreground">Require approval</p>
                <p className="text-xs text-muted-foreground">Manually approve each enrollment request before students can access the course</p>
              </div>
              <input
                type="checkbox"
                checked={settings.enrollment?.requireApproval || false}
                onChange={(e) => update('enrollment', 'requireApproval', e.target.checked)}
                className="rounded border-border text-primary focus:ring-primary h-4 w-4"
              />
            </label>
          </div>
        </SectionCard>
      </div>
    </div>
  );
};

export default Settings;
