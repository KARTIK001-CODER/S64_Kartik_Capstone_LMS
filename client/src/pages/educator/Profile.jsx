import React, { useState, useEffect, useRef } from 'react';
import { User, Plus, X, Globe, Twitter, Linkedin, Github, Camera, Save, BookOpen } from 'lucide-react';
import { useAppContext } from '../../context/AppContext';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Avatar } from '../../components/ui/avatar';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Skeleton } from '../../components/ui/skeleton';
import { ErrorState } from '../../components/ui/empty-state';

const PROFILE_FIELDS = [
  { key: 'name', label: 'Full Name', weight: 10 },
  { key: 'headline', label: 'Headline', weight: 15 },
  { key: 'bio', label: 'Bio', weight: 15 },
  { key: 'avatar', label: 'Profile Photo', weight: 10 },
  { key: 'expertise', label: 'Expertise Tags', weight: 15 },
  { key: 'experience', label: 'Work Experience', weight: 15 },
  { key: 'socialLinks', label: 'Social Links', weight: 10 },
  { key: 'education', label: 'Education', weight: 10 },
];

const calcCompletion = (profile) => {
  let score = 0;
  if (profile?.name) score += 10;
  if (profile?.headline) score += 15;
  if (profile?.bio?.length > 20) score += 15;
  if (profile?.avatar) score += 10;
  if (profile?.expertise?.length > 0) score += 15;
  if (profile?.experience?.length > 0) score += 15;
  if (profile?.socialLinks?.website || profile?.socialLinks?.twitter || profile?.socialLinks?.linkedin || profile?.socialLinks?.github) score += 10;
  if (profile?.education?.degree || profile?.education?.institution) score += 10;
  return Math.min(100, score);
};

const Profile = () => {
  const { api, user, setUser } = useAppContext();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [dirty, setDirty] = useState(false);
  const [uploading, setUploading] = useState(false);
  const expertiseRef = useRef(null);
  const fileRef = useRef(null);

  const fetchProfile = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get('/api/educator/profile');
      setProfile(res.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load profile');
    } finally { setLoading(false); }
  };

  useEffect(() => { fetchProfile(); }, []);

  const handleChange = (field, value) => {
    setProfile(prev => ({ ...prev, [field]: value }));
    setDirty(true);
  };

  const handleExperienceChange = (index, field, value) => {
    const exp = [...(profile.experience || [])];
    exp[index] = { ...exp[index], [field]: value };
    handleChange('experience', exp);
  };

  const addExperience = () => {
    handleChange('experience', [...(profile.experience || []), { title: '', company: '', startDate: '', endDate: '', current: false, description: '' }]);
  };

  const removeExperience = (index) => {
    const exp = [...(profile.experience || [])];
    exp.splice(index, 1);
    handleChange('experience', exp);
  };

  const handleSocialChange = (field, value) => {
    handleChange('socialLinks', { ...(profile.socialLinks || {}), [field]: value });
  };

  const handleEducationChange = (field, value) => {
    handleChange('education', { ...(profile.education || {}), [field]: value });
  };

  const handleAvatarUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const formData = new FormData();
    formData.append('avatar', file);
    try {
      const res = await api.put('/api/educator/profile', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      setProfile(res.data);
      setUser(prev => ({ ...prev, avatar: res.data.avatar }));
    } catch (err) {
      console.error('Avatar upload failed:', err);
    } finally { setUploading(false); }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const { name, headline, bio, experience, socialLinks, expertise, education } = profile;
      const res = await api.put('/api/educator/profile', { name, headline, bio, experience, socialLinks, expertise, education });
      setProfile(res.data);
      setUser(prev => ({ ...prev, name: res.data.name }));
      setDirty(false);
    } catch (err) {
      console.error('Failed to save profile:', err);
    } finally { setSaving(false); }
  };

  const completion = calcCompletion(profile);
  const circumference = 2 * Math.PI * 36;
  const strokeDashoffset = circumference - (completion / 100) * circumference;

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <div className="flex items-center gap-6">
          <Skeleton variant="avatar" className="h-20 w-20" />
          <div className="space-y-2"><Skeleton variant="heading" /><Skeleton variant="text" className="w-48" /></div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Skeleton variant="card" className="h-40" />
          <Skeleton variant="card" className="h-40 lg:col-span-2" />
        </div>
      </div>
    );
  }

  if (error) return <div className="p-6"><ErrorState title="Failed to load profile" description={error} onRetry={fetchProfile} /></div>;
  if (!profile) return null;

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Instructor Profile</h1>
          <p className="text-muted-foreground mt-1">Manage your public instructor profile</p>
        </div>
        <Button variant="primary" size="sm" onClick={handleSave} loading={saving} disabled={!dirty}>
          <Save size={14} /> Save Changes
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile Completion */}
        <Card variant="default" padding="lg" className="lg:col-span-1">
          <div className="flex flex-col items-center text-center">
            <div className="relative mb-4">
              <svg width="80" height="80" className="transform -rotate-90">
                <circle cx="40" cy="40" r="36" fill="none" stroke="hsl(var(--muted))" strokeWidth="6" />
                <circle cx="40" cy="40" r="36" fill="none" stroke="hsl(var(--primary))" strokeWidth="6" strokeDasharray={circumference} strokeDashoffset={strokeDashoffset} strokeLinecap="round" />
              </svg>
              <span className="absolute inset-0 flex items-center justify-center text-lg font-bold text-foreground">{completion}%</span>
            </div>
            <h3 className="text-sm font-semibold text-foreground">Profile Completion</h3>
            <p className="text-xs text-muted-foreground mt-1">Complete all sections to reach 100%</p>
            <div className="w-full mt-4 space-y-1.5">
              {PROFILE_FIELDS.map(f => {
                const filled = f.key === 'name' ? profile.name
                  : f.key === 'headline' ? profile.headline
                  : f.key === 'bio' ? profile.bio?.length > 20
                  : f.key === 'avatar' ? profile.avatar
                  : f.key === 'expertise' ? profile.expertise?.length > 0
                  : f.key === 'experience' ? profile.experience?.length > 0
                  : f.key === 'socialLinks' ? (profile.socialLinks?.website || profile.socialLinks?.twitter || profile.socialLinks?.linkedin || profile.socialLinks?.github)
                  : f.key === 'education' ? (profile.education?.degree || profile.education?.institution)
                  : false;
                return (
                  <div key={f.key} className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">{f.label}</span>
                    <span className={filled ? 'text-success font-medium' : 'text-muted-foreground/50'}>{filled ? 'Done' : 'Missing'}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </Card>

        {/* Main Profile Form */}
        <div className="lg:col-span-2 space-y-6">
          {/* Basic Info */}
          <Card variant="default" padding="lg">
            <CardTitle className="text-base font-semibold text-foreground mb-4">Basic Information</CardTitle>
            <div className="flex items-start gap-6 mb-6">
              <div className="relative flex-shrink-0">
                <Avatar size="xl" src={profile.avatar} alt={profile.name} initials={profile.name?.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)} />
                <button onClick={() => fileRef.current?.click()} aria-label="Upload avatar" className="absolute bottom-0 right-0 p-1.5 rounded-full bg-primary text-primary-foreground shadow hover:bg-primary/90 transition">
                  <Camera size={12} />
                </button>
                <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} />
              </div>
              <div className="flex-1 space-y-4">
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1">Full Name</label>
                  <input type="text" value={profile.name || ''} onChange={(e) => handleChange('name', e.target.value)} className="w-full h-10 px-3 rounded-lg border border-input bg-background text-sm text-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-primary" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1">Headline</label>
                  <input type="text" value={profile.headline || ''} onChange={(e) => handleChange('headline', e.target.value)} placeholder="e.g. Senior Web Developer & Course Creator" className="w-full h-10 px-3 rounded-lg border border-input bg-background text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-primary" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1">Bio</label>
                  <textarea value={profile.bio || ''} onChange={(e) => handleChange('bio', e.target.value)} rows={4} placeholder="Tell students about yourself, your teaching experience, and what you're passionate about..." className="w-full px-3 py-2 rounded-lg border border-input bg-background text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-primary resize-none" />
                </div>
              </div>
            </div>
          </Card>

          {/* Expertise */}
          <Card variant="default" padding="lg">
            <CardTitle className="text-base font-semibold text-foreground mb-4">Expertise</CardTitle>
            <div className="flex flex-wrap gap-2 mb-3">
              {(profile.expertise || []).map((tag, i) => (
                <Badge key={i} variant="secondary" size="sm" className="gap-1 pr-1">
                  {tag}
                  <button onClick={() => handleChange('expertise', (profile.expertise || []).filter((_, j) => j !== i))} className="hover:text-foreground transition-colors">
                    <X size={12} />
                  </button>
                </Badge>
              ))}
            </div>
            <div className="flex gap-2">
              <input
                ref={expertiseRef}
                type="text"
                placeholder="Add a skill or expertise..."
                className="flex-1 h-10 px-3 rounded-lg border border-input bg-background text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && e.target.value.trim()) {
                    handleChange('expertise', [...(profile.expertise || []), e.target.value.trim()]);
                    e.target.value = '';
                  }
                }}
              />
              <Button variant="outline" size="sm" onClick={() => {
                if (expertiseRef.current?.value?.trim()) {
                  handleChange('expertise', [...(profile.expertise || []), expertiseRef.current.value.trim()]);
                  expertiseRef.current.value = '';
                }
              }}>
                <Plus size={14} /> Add
              </Button>
            </div>
          </Card>

          {/* Experience */}
          <Card variant="default" padding="lg">
            <div className="flex items-center justify-between mb-4">
              <CardTitle className="text-base font-semibold text-foreground">Work Experience</CardTitle>
              <Button variant="outline" size="sm" onClick={addExperience}><Plus size={14} /> Add</Button>
            </div>
            {(profile.experience || []).length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">No experience added yet. Click "Add" to include your work history.</p>
            ) : (
              <div className="space-y-4">
                {(profile.experience || []).map((exp, i) => (
                  <div key={i} className="p-4 rounded-xl border border-border space-y-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-medium text-muted-foreground mb-1">Title</label>
                          <input type="text" value={exp.title} onChange={(e) => handleExperienceChange(i, 'title', e.target.value)} className="w-full h-9 px-3 rounded-lg border border-input bg-background text-sm text-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-primary" />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-muted-foreground mb-1">Company</label>
                          <input type="text" value={exp.company} onChange={(e) => handleExperienceChange(i, 'company', e.target.value)} className="w-full h-9 px-3 rounded-lg border border-input bg-background text-sm text-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-primary" />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-muted-foreground mb-1">Start Date</label>
                          <input type="text" value={exp.startDate || ''} onChange={(e) => handleExperienceChange(i, 'startDate', e.target.value)} placeholder="e.g. 2020" className="w-full h-9 px-3 rounded-lg border border-input bg-background text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-primary" />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-muted-foreground mb-1">End Date</label>
                          <input type="text" value={exp.endDate || ''} onChange={(e) => handleExperienceChange(i, 'endDate', e.target.value)} placeholder="e.g. 2023" disabled={exp.current} className="w-full h-9 px-3 rounded-lg border border-input bg-background text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:opacity-50" />
                        </div>
                      </div>
                      <button onClick={() => removeExperience(i)} aria-label="Remove experience" className="p-1.5 text-muted-foreground hover:text-error transition-colors ml-2 flex-shrink-0">
                        <X size={16} />
                      </button>
                    </div>
                    <label className="flex items-center gap-2 text-sm text-muted-foreground">
                      <input type="checkbox" checked={exp.current || false} onChange={(e) => handleExperienceChange(i, 'current', e.target.checked)} className="rounded border-border" />
                      I currently work here
                    </label>
                    <div>
                      <label className="block text-xs font-medium text-muted-foreground mb-1">Description</label>
                      <textarea value={exp.description || ''} onChange={(e) => handleExperienceChange(i, 'description', e.target.value)} rows={2} className="w-full px-3 py-2 rounded-lg border border-input bg-background text-sm text-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-primary resize-none" />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>

          {/* Social Links */}
          <Card variant="default" padding="lg">
            <CardTitle className="text-base font-semibold text-foreground mb-4">Social Links</CardTitle>
            <div className="space-y-3">
              <SocialInput icon={<Globe size={16} />} value={profile.socialLinks?.website || ''} onChange={(v) => handleSocialChange('website', v)} placeholder="https://yourwebsite.com" />
              <SocialInput icon={<Twitter size={16} />} value={profile.socialLinks?.twitter || ''} onChange={(v) => handleSocialChange('twitter', v)} placeholder="https://twitter.com/yourhandle" />
              <SocialInput icon={<Linkedin size={16} />} value={profile.socialLinks?.linkedin || ''} onChange={(v) => handleSocialChange('linkedin', v)} placeholder="https://linkedin.com/in/yourprofile" />
              <SocialInput icon={<Github size={16} />} value={profile.socialLinks?.github || ''} onChange={(v) => handleSocialChange('github', v)} placeholder="https://github.com/yourhandle" />
            </div>
          </Card>

          {/* Education */}
          <Card variant="default" padding="lg">
            <CardTitle className="text-base font-semibold text-foreground mb-4">Education</CardTitle>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">Degree</label>
                <input type="text" value={profile.education?.degree || ''} onChange={(e) => handleEducationChange('degree', e.target.value)} placeholder="e.g. B.Sc. Computer Science" className="w-full h-10 px-3 rounded-lg border border-input bg-background text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-primary" />
              </div>
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">Institution</label>
                <input type="text" value={profile.education?.institution || ''} onChange={(e) => handleEducationChange('institution', e.target.value)} placeholder="e.g. MIT" className="w-full h-10 px-3 rounded-lg border border-input bg-background text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-primary" />
              </div>
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">Year</label>
                <input type="text" value={profile.education?.year || ''} onChange={(e) => handleEducationChange('year', e.target.value)} placeholder="e.g. 2018" className="w-full h-10 px-3 rounded-lg border border-input bg-background text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-primary" />
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

const SocialInput = ({ icon, value, onChange, placeholder }) => (
  <div className="flex items-center gap-3 px-3 h-10 rounded-lg border border-input bg-background">
    <span className="text-muted-foreground flex-shrink-0">{icon}</span>
    <input type="url" value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground focus:outline-none" />
  </div>
);

export default Profile;
