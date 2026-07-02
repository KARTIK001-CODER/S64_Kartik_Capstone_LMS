import React, { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Trash2, ChevronDown, ChevronRight, Upload, X, Video, BookOpen, Save } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Input } from '../../components/ui/input';
import { Badge } from '../../components/ui/badge';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

const AddCourse = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    courseTitle: '',
    courseDescription: '',
    coursePrice: '',
    courseThumbnail: '',
    isPublished: false,
    discount: 0,
    courseContent: []
  });

  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('error');
  const fileInputRef = useRef();
  const [thumbnailFile, setThumbnailFile] = useState(null);
  const [expandedChapters, setExpandedChapters] = useState({});
  const [currentChapter, setCurrentChapter] = useState({
    title: '',
    description: '',
    lectures: []
  });
  const [currentLecture, setCurrentLecture] = useState({
    title: '',
    description: '',
    videoUrl: '',
    duration: '',
    isPreviewFree: false
  });

  const showMessage = (msg, type = 'error') => {
    setMessage(msg);
    setMessageType(type);
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  const addLecture = () => {
    if (!currentLecture.title || !currentLecture.videoUrl || !currentLecture.duration) {
      showMessage('Please fill in all required lecture fields'); return;
    }
    setCurrentChapter(prev => ({
      ...prev,
      lectures: [...prev.lectures, {
        title: currentLecture.title,
        description: currentLecture.description,
        videoUrl: currentLecture.videoUrl,
        duration: Number(currentLecture.duration),
        isPreviewFree: currentLecture.isPreviewFree,
        order: prev.lectures.length
      }]
    }));
    setCurrentLecture({ title: '', description: '', videoUrl: '', duration: '', isPreviewFree: false });
  };

  const addChapter = () => {
    if (!currentChapter.title || currentChapter.lectures.length === 0) {
      showMessage('Please add a title and at least one lecture'); return;
    }
    setForm(prev => ({
      ...prev,
      courseContent: [...prev.courseContent, { title: currentChapter.title, description: currentChapter.description, lectures: currentChapter.lectures, order: prev.courseContent.length }]
    }));
    setCurrentChapter({ title: '', description: '', lectures: [] });
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
      showMessage('Please fill in all required fields'); return;
    }
    if (form.courseContent.length === 0) {
      showMessage('Please add at least one chapter with lectures'); return;
    }

    try {
      const token = localStorage.getItem('token');
      if (!token) { showMessage('Authentication token not found'); return; }

      const formData = new FormData();
      formData.append('courseTitle', form.courseTitle);
      formData.append('courseDescription', form.courseDescription);
      formData.append('coursePrice', Number(form.coursePrice));
      formData.append('discount', Number(form.discount));
      formData.append('isPublished', form.isPublished);
      formData.append('courseContent', JSON.stringify(form.courseContent));
      if (thumbnailFile) formData.append('courseThumbnail', thumbnailFile);

      const res = await fetch(`${API_BASE}/api/courses`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData
      });
      const data = await res.json();
      if (res.ok) {
        showMessage('Course created successfully!', 'success');
        setTimeout(() => navigate('/educator/my-courses'), 1500);
      } else {
        showMessage(data.message || data.error || 'Failed to create course');
      }
    } catch (err) {
      showMessage(`Error: ${err.message}`);
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Create Course</h1>
        <p className="text-muted-foreground mt-1">Add a new course to your catalog</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Info */}
        <Card variant="default" padding="md">
          <CardTitle className="text-base mb-4">Basic Information</CardTitle>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">Course Title *</label>
              <input name="courseTitle" value={form.courseTitle} onChange={handleChange} placeholder="e.g. Advanced JavaScript" className="w-full h-10 rounded-lg border border-input bg-background px-3 text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-primary" />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">Description *</label>
              <textarea name="courseDescription" value={form.courseDescription} onChange={handleChange} placeholder="Describe your course..." rows={5} className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-primary resize-none" />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">Price ($) *</label>
                <input name="coursePrice" value={form.coursePrice} onChange={handleChange} type="number" min="0" step="0.01" placeholder="49.99" className="w-full h-10 rounded-lg border border-input bg-background px-3 text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-primary" />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">Discount (%)</label>
                <input name="discount" value={form.discount} onChange={handleChange} type="number" min="0" max="100" placeholder="0" className="w-full h-10 rounded-lg border border-input bg-background px-3 text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-primary" />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">Thumbnail</label>
                <div className="flex items-center gap-3">
                  <button type="button" onClick={() => fileInputRef.current.click()} className="h-10 px-3 rounded-lg border border-input bg-background text-sm text-muted-foreground hover:bg-accent transition-colors flex items-center gap-2">
                    <Upload size={14} /> Upload
                  </button>
                  {form.courseThumbnail && <img src={form.courseThumbnail} alt="Preview" className="h-10 w-16 object-cover rounded border border-border" />}
                </div>
                <input type="file" accept="image/*" ref={fileInputRef} className="hidden" onChange={handleThumbnailChange} />
              </div>
            </div>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" name="isPublished" checked={form.isPublished} onChange={handleChange} className="rounded border-input text-primary focus:ring-primary" />
              Publish immediately
            </label>
          </div>
        </Card>

        {/* Course Content */}
        <Card variant="default" padding="md">
          <CardTitle className="text-base mb-4">Course Content</CardTitle>

          {/* Add Chapter */}
          <div className="rounded-lg border border-border p-4 mb-4 bg-muted/20">
            <h4 className="text-sm font-semibold text-foreground mb-3">New Chapter</h4>
            <div className="space-y-3">
              <input name="title" value={currentChapter.title} onChange={(e) => setCurrentChapter(prev => ({ ...prev, title: e.target.value }))} placeholder="Chapter title" className="w-full h-10 rounded-lg border border-input bg-background px-3 text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-primary" />
              <textarea name="description" value={currentChapter.description} onChange={(e) => setCurrentChapter(prev => ({ ...prev, description: e.target.value }))} placeholder="Chapter description (optional)" rows={2} className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-primary resize-none" />

              {/* Lectures */}
              <div className="rounded-lg border border-border bg-card p-3">
                <h5 className="text-xs font-semibold text-muted-foreground uppercase mb-3">Add Lecture</h5>
                <div className="space-y-3">
                  <input name="lectureTitle" value={currentLecture.title} onChange={(e) => setCurrentLecture(prev => ({ ...prev, title: e.target.value }))} placeholder="Lecture title *" className="w-full h-9 rounded-lg border border-input bg-background px-3 text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-primary" />
                  <input name="videoUrl" value={currentLecture.videoUrl} onChange={(e) => setCurrentLecture(prev => ({ ...prev, videoUrl: e.target.value }))} placeholder="YouTube URL *" className="w-full h-9 rounded-lg border border-input bg-background px-3 text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-primary" />
                  <div className="flex items-center gap-3">
                    <input name="duration" value={currentLecture.duration} onChange={(e) => setCurrentLecture(prev => ({ ...prev, duration: e.target.value }))} type="number" min="0" placeholder="Duration (min) *" className="w-40 h-9 rounded-lg border border-input bg-background px-3 text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-primary" />
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

              {/* Current chapter's lectures */}
              {currentChapter.lectures.length > 0 && (
                <div className="space-y-1">
                  {currentChapter.lectures.map((lec, idx) => (
                    <div key={idx} className="flex items-center justify-between rounded bg-muted/50 px-3 py-2 text-sm">
                      <span className="flex items-center gap-2"><Video size={12} className="text-muted-foreground" /> {lec.title}</span>
                      <button type="button" onClick={() => {
                        const updated = [...currentChapter.lectures]; updated.splice(idx, 1);
                        setCurrentChapter(prev => ({ ...prev, lectures: updated }));
                      }} className="text-muted-foreground hover:text-error"><X size={14} /></button>
                    </div>
                  ))}
                </div>
              )}

              <Button type="button" onClick={addChapter} disabled={!currentChapter.title || currentChapter.lectures.length === 0}>
                <BookOpen size={14} /> Add Chapter
              </Button>
            </div>
          </div>

          {/* Existing chapters */}
          {form.courseContent.length > 0 && (
            <div className="space-y-3">
              <h4 className="text-sm font-semibold text-foreground">Course Chapters ({form.courseContent.length})</h4>
              {form.courseContent.map((chapter, chapterIdx) => (
                <div key={chapterIdx} className="rounded-lg border border-border overflow-hidden">
                  <div className="flex items-center justify-between px-4 py-3 bg-muted/30">
                    <div className="flex items-center gap-2">
                      <BookOpen size={14} className="text-primary" />
                      <span className="text-sm font-medium text-foreground">{chapter.title}</span>
                      <Badge variant="neutral" size="sm">{chapter.lectures.length} lectures</Badge>
                    </div>
                    <button type="button" onClick={() => removeChapter(chapterIdx)} className="p-1 text-muted-foreground hover:text-error rounded"><Trash2 size={14} /></button>
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
                          <button type="button" onClick={() => removeLecture(chapterIdx, lectureIdx)} className="p-0.5 text-muted-foreground hover:text-error"><X size={12} /></button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Submit */}
        <div className="flex items-center justify-between">
          <Button type="submit" size="lg">
            <Save size={16} /> Create Course
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
