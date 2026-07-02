import React, { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Plus, Trash2, Upload, Video, BookOpen, Save, X,
  Target, ListChecks, FileText
} from 'lucide-react';
import { useAppContext } from '../../context/AppContext';
import { Button } from '../../components/ui/button';
import { Card, CardTitle } from '../../components/ui/card';
import { Input } from '../../components/ui/input';
import { Badge } from '../../components/ui/badge';
import { Select } from '../../components/ui/select';

const DIFFICULTY_OPTIONS = [
  { value: 'All Levels', label: 'All Levels' },
  { value: 'Beginner', label: 'Beginner' },
  { value: 'Intermediate', label: 'Intermediate' },
  { value: 'Advanced', label: 'Advanced' },
];

const CATEGORY_OPTIONS = [
  { value: 'General', label: 'General' },
  { value: 'Web Development', label: 'Web Development' },
  { value: 'Mobile Development', label: 'Mobile Development' },
  { value: 'Data Science', label: 'Data Science' },
  { value: 'AI & Machine Learning', label: 'AI & Machine Learning' },
  { value: 'DevOps', label: 'DevOps' },
  { value: 'Design', label: 'Design' },
  { value: 'Business', label: 'Business' },
  { value: 'Marketing', label: 'Marketing' },
  { value: 'Photography', label: 'Photography' },
  { value: 'Music', label: 'Music' },
  { value: 'Health & Fitness', label: 'Health & Fitness' },
];

const emptyLecture = { title: '', description: '', videoUrl: '', duration: '', isPreviewFree: false, resources: [], externalLinks: [] };
const emptyChapter = { title: '', description: '', lectures: [] };
const emptyResource = { title: '', url: '', type: 'link' };
const emptyLink = { title: '', url: '' };

const AddCourse = () => {
  const navigate = useNavigate();
  const { api } = useAppContext();

  const [form, setForm] = useState({
    courseTitle: '', courseSubtitle: '', courseDescription: '', coursePrice: '',
    discount: 0, category: 'General', tags: '', difficulty: 'All Levels',
    language: 'English', previewVideo: '', isPublished: false,
    learningOutcomes: [], requirements: [], courseContent: [], courseThumbnail: ''
  });

  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('error');
  const [submitting, setSubmitting] = useState(false);
  const fileInputRef = useRef();
  const [thumbnailFile, setThumbnailFile] = useState(null);

  const [currentChapter, setCurrentChapter] = useState({ ...emptyChapter });
  const [currentLecture, setCurrentLecture] = useState({ ...emptyLecture });
  const [expandedChapters, setExpandedChapters] = useState({});

  const notify = (msg, type = 'error') => { setMessage(msg); setMessageType(type); };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  const addArrayItem = (field, value) => {
    setForm(prev => ({ ...prev, [field]: [...prev[field], value] }));
  };

  const removeArrayItem = (field, index) => {
    setForm(prev => ({ ...prev, [field]: prev[field].filter((_, i) => i !== index) }));
  };

  const addLecture = () => {
    if (!currentLecture.title || !currentLecture.videoUrl || !currentLecture.duration) {
      notify('Please fill in required lecture fields'); return;
    }
    setCurrentChapter(prev => ({
      ...prev,
      lectures: [...prev.lectures, {
        ...currentLecture,
        duration: Number(currentLecture.duration),
        order: prev.lectures.length
      }]
    }));
    setCurrentLecture({ ...emptyLecture });
  };

  const addChapter = () => {
    if (!currentChapter.title || currentChapter.lectures.length === 0) {
      notify('Please add a title and at least one lecture'); return;
    }
    setForm(prev => ({
      ...prev,
      courseContent: [...prev.courseContent, { ...currentChapter, order: prev.courseContent.length }]
    }));
    setCurrentChapter({ ...emptyChapter });
    setMessage('');
  };

  const removeLecture = (chapterIdx, lectureIdx) => {
    setForm(prev => {
      const content = [...prev.courseContent];
      content[chapterIdx].lectures.splice(lectureIdx, 1);
      return { ...prev, courseContent: content };
    });
  };

  const removeChapter = (idx) => {
    setForm(prev => {
      const content = [...prev.courseContent];
      content.splice(idx, 1);
      return { ...prev, courseContent: content };
    });
  };

  const handleThumbnailChange = (e) => {
    if (e.target.files?.[0]) {
      setThumbnailFile(e.target.files[0]);
      setForm(prev => ({ ...prev, courseThumbnail: URL.createObjectURL(e.target.files[0]) }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');

    if (!form.courseTitle || !form.courseDescription || !form.coursePrice) {
      notify('Please fill in all required fields'); return;
    }
    if (form.courseContent.length === 0) {
      notify('Please add at least one chapter with lectures'); return;
    }

    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('courseTitle', form.courseTitle);
      formData.append('courseSubtitle', form.courseSubtitle);
      formData.append('courseDescription', form.courseDescription);
      formData.append('coursePrice', Number(form.coursePrice));
      formData.append('discount', Number(form.discount));
      formData.append('category', form.category);
      formData.append('tags', JSON.stringify(form.tags ? form.tags.split(',').map(t => t.trim()).filter(Boolean) : []));
      formData.append('difficulty', form.difficulty);
      formData.append('language', form.language);
      formData.append('previewVideo', form.previewVideo);
      formData.append('learningOutcomes', JSON.stringify(form.learningOutcomes));
      formData.append('requirements', JSON.stringify(form.requirements));
      formData.append('isPublished', form.isPublished);
      formData.append('courseContent', JSON.stringify(form.courseContent));
      if (thumbnailFile) formData.append('courseThumbnail', thumbnailFile);

      await api.post('/api/courses', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      notify('Course created successfully!', 'success');
      setTimeout(() => navigate('/educator/my-courses'), 1500);
    } catch (err) {
      notify(err.response?.data?.message || err.message || 'Failed to create course');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Course Builder</h1>
        <p className="text-muted-foreground mt-1">Create a new course</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card variant="default" padding="md">
          <CardTitle className="text-base mb-4 flex items-center gap-2">
            <FileText size={16} className="text-primary" /> Basic Information
          </CardTitle>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input label="Course Title *" name="courseTitle" value={form.courseTitle} onChange={handleChange} placeholder="e.g. Advanced JavaScript" />
              <Input label="Subtitle" name="courseSubtitle" value={form.courseSubtitle} onChange={handleChange} placeholder="e.g. Master async patterns and closures" />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">Description *</label>
              <textarea name="courseDescription" value={form.courseDescription} onChange={handleChange} placeholder="Describe your course..." rows={5} className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-primary resize-none" />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">Category</label>
                <Select name="category" value={form.category} onChange={(e) => setForm(prev => ({ ...prev, category: e.target.value }))} options={CATEGORY_OPTIONS} />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">Difficulty</label>
                <Select name="difficulty" value={form.difficulty} onChange={(e) => setForm(prev => ({ ...prev, difficulty: e.target.value }))} options={DIFFICULTY_OPTIONS} />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">Language</label>
                <input name="language" value={form.language} onChange={handleChange} placeholder="English" className="w-full h-10 rounded-lg border border-input bg-background px-3 text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-primary" />
              </div>
            </div>
            <div>
              <Input label="Tags (comma-separated)" name="tags" value={form.tags} onChange={handleChange} placeholder="javascript, web, frontend" />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
              <Input label="Price ($) *" name="coursePrice" value={form.coursePrice} onChange={handleChange} type="number" min="0" step="0.01" placeholder="49.99" />
              <Input label="Discount (%)" name="discount" value={form.discount} onChange={handleChange} type="number" min="0" max="100" placeholder="0" />
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-foreground mb-1.5">Preview Video URL (optional)</label>
                <input name="previewVideo" value={form.previewVideo} onChange={handleChange} placeholder="YouTube URL for promotional video" className="w-full h-10 rounded-lg border border-input bg-background px-3 text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-primary" />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">Thumbnail</label>
                <div className="flex items-center gap-3">
                  <button type="button" onClick={() => fileInputRef.current.click()} className="h-10 px-3 rounded-lg border border-input bg-background text-sm text-muted-foreground hover:bg-accent transition-colors flex items-center gap-2">
                    <Upload size={14} /> {form.courseThumbnail ? 'Change' : 'Upload'}
                  </button>
                  {form.courseThumbnail && <img src={form.courseThumbnail} alt="Preview" className="h-10 w-16 object-cover rounded border border-border" />}
                </div>
                <input type="file" accept="image/*" ref={fileInputRef} className="hidden" onChange={handleThumbnailChange} />
              </div>
              <div className="flex items-end pb-2">
                <label className="flex items-center gap-2 text-sm">
                  <input type="checkbox" name="isPublished" checked={form.isPublished} onChange={handleChange} className="rounded border-input text-primary focus:ring-primary" />
                  Publish immediately
                </label>
              </div>
            </div>
          </div>
        </Card>

        <Card variant="default" padding="md">
          <CardTitle className="text-base mb-4 flex items-center gap-2">
            <Target size={16} className="text-primary" /> Learning Outcomes
          </CardTitle>
          <p className="text-xs text-muted-foreground mb-3">What will students learn? Add one outcome per line.</p>
          <div className="space-y-2">
            {form.learningOutcomes.map((outcome, idx) => (
              <div key={idx} className="flex items-center gap-2">
                <span className="text-sm text-primary">✓</span>
                <input value={outcome} onChange={(e) => {
                  const updated = [...form.learningOutcomes];
                  updated[idx] = e.target.value;
                  setForm(prev => ({ ...prev, learningOutcomes: updated }));
                }} className="flex-1 h-9 rounded-lg border border-input bg-background px-3 text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-primary" />
                <button type="button" onClick={() => removeArrayItem('learningOutcomes', idx)} aria-label="Remove outcome" className="p-1 text-muted-foreground hover:text-error"><X size={14} /></button>
              </div>
            ))}
            <Button type="button" variant="outline" size="sm" onClick={() => addArrayItem('learningOutcomes', '')}>
              <Plus size={14} /> Add Outcome
            </Button>
          </div>
        </Card>

        <Card variant="default" padding="md">
          <CardTitle className="text-base mb-4 flex items-center gap-2">
            <ListChecks size={16} className="text-primary" /> Requirements
          </CardTitle>
          <p className="text-xs text-muted-foreground mb-3">What should students know before taking this course?</p>
          <div className="space-y-2">
            {form.requirements.map((req, idx) => (
              <div key={idx} className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">•</span>
                <input value={req} onChange={(e) => {
                  const updated = [...form.requirements];
                  updated[idx] = e.target.value;
                  setForm(prev => ({ ...prev, requirements: updated }));
                }} className="flex-1 h-9 rounded-lg border border-input bg-background px-3 text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-primary" />
                <button type="button" onClick={() => removeArrayItem('requirements', idx)} aria-label="Remove requirement" className="p-1 text-muted-foreground hover:text-error"><X size={14} /></button>
              </div>
            ))}
            <Button type="button" variant="outline" size="sm" onClick={() => addArrayItem('requirements', '')}>
              <Plus size={14} /> Add Requirement
            </Button>
          </div>
        </Card>

        <Card variant="default" padding="md">
          <CardTitle className="text-base mb-4 flex items-center gap-2">
            <BookOpen size={16} className="text-primary" /> Course Curriculum
          </CardTitle>

          <div className="rounded-lg border border-border p-4 mb-4 bg-muted/20">
            <h4 className="text-sm font-semibold text-foreground mb-3">New Chapter</h4>
            <div className="space-y-3">
              <input value={currentChapter.title} onChange={(e) => setCurrentChapter(prev => ({ ...prev, title: e.target.value }))} placeholder="Chapter title" className="w-full h-10 rounded-lg border border-input bg-background px-3 text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-primary" />
              <textarea value={currentChapter.description} onChange={(e) => setCurrentChapter(prev => ({ ...prev, description: e.target.value }))} placeholder="Chapter description (optional)" rows={2} className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-primary resize-none" />

              <div className="rounded-lg border border-border bg-card p-3">
                <h5 className="text-xs font-semibold text-muted-foreground uppercase mb-3">Add Lecture</h5>
                <div className="space-y-3">
                  <input value={currentLecture.title} onChange={(e) => setCurrentLecture(prev => ({ ...prev, title: e.target.value }))} placeholder="Lecture title *" className="w-full h-9 rounded-lg border border-input bg-background px-3 text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-primary" />
                  <input value={currentLecture.videoUrl} onChange={(e) => setCurrentLecture(prev => ({ ...prev, videoUrl: e.target.value }))} placeholder="YouTube URL *" className="w-full h-9 rounded-lg border border-input bg-background px-3 text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-primary" />
                  <div className="flex items-center gap-3">
                    <input value={currentLecture.duration} onChange={(e) => setCurrentLecture(prev => ({ ...prev, duration: e.target.value }))} type="number" min="0" placeholder="Duration (min) *" className="w-40 h-9 rounded-lg border border-input bg-background px-3 text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-primary" />
                    <label className="flex items-center gap-1.5 text-sm text-muted-foreground">
                      <input type="checkbox" checked={currentLecture.isPreviewFree} onChange={(e) => setCurrentLecture(prev => ({ ...prev, isPreviewFree: e.target.checked }))} className="rounded border-input text-primary focus:ring-primary" />
                      Free preview
                    </label>
                  </div>
                  <Button type="button" variant="outline" size="sm" onClick={addLecture}>
                    <Plus size={14} /> Add Lecture
                  </Button>
                </div>
              </div>

              {currentChapter.lectures.length > 0 && (
                <div className="space-y-1">
                  {currentChapter.lectures.map((lec, idx) => (
                    <div key={idx} className="flex items-center justify-between rounded bg-muted/50 px-3 py-2 text-sm">
                      <span className="flex items-center gap-2"><Video size={12} className="text-muted-foreground" /> {lec.title}</span>
                      <button type="button" onClick={() => {
                        const updated = [...currentChapter.lectures]; updated.splice(idx, 1);
                        setCurrentChapter(prev => ({ ...prev, lectures: updated }));
                      }} aria-label="Remove lecture" className="text-muted-foreground hover:text-error"><X size={14} /></button>
                    </div>
                  ))}
                </div>
              )}

              <Button type="button" onClick={addChapter} disabled={!currentChapter.title || currentChapter.lectures.length === 0}>
                <BookOpen size={14} /> Add Chapter
              </Button>
            </div>
          </div>

          {form.courseContent.length > 0 && (
            <div className="space-y-3">
              <h4 className="text-sm font-semibold text-foreground">Course Structure ({form.courseContent.length} chapters)</h4>
              {form.courseContent.map((chapter, chapterIdx) => (
                <div key={chapterIdx} className="rounded-lg border border-border overflow-hidden">
                  <div className="flex items-center justify-between px-4 py-3 bg-muted/30">
                    <div className="flex items-center gap-2">
                      <BookOpen size={14} className="text-primary" />
                      <span className="text-sm font-medium text-foreground">{chapter.title}</span>
                      <Badge variant="neutral" size="sm">{chapter.lectures.length} lectures</Badge>
                    </div>
                    <button type="button" onClick={() => removeChapter(chapterIdx)} aria-label="Remove chapter" className="p-1 text-muted-foreground hover:text-error rounded"><Trash2 size={14} /></button>
                  </div>
                  <div className="divide-y divide-border">
                    {chapter.lectures.map((lecture, lectureIdx) => (
                      <div key={lectureIdx} className="flex items-center justify-between px-4 py-2.5 text-sm">
                        <span className="flex items-center gap-2 text-muted-foreground">
                          <Video size={12} /> {lecture.title}
                        </span>
                        <div className="flex items-center gap-3">
                          <span className="text-xs text-muted-foreground">{lecture.duration} min</span>
                          {lecture.isPreviewFree && <Badge variant="warning" size="sm">Free</Badge>}
                          <button type="button" onClick={() => removeLecture(chapterIdx, lectureIdx)} aria-label="Remove lecture" className="p-0.5 text-muted-foreground hover:text-error"><X size={12} /></button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        <div className="flex items-center justify-between">
          <Button type="submit" size="lg" loading={submitting}>
            <Save size={16} /> {submitting ? 'Creating...' : 'Create Course'}
          </Button>
          {message && (
            <p className={`text-sm ${messageType === 'success' ? 'text-success' : 'text-error'}`}>{message}</p>
          )}
        </div>
      </form>
    </div>
  );
};

export default AddCourse;
