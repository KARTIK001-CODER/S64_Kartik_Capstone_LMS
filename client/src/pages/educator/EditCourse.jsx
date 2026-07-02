import React, { useRef, useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Plus, Trash2, Upload, Video, BookOpen, Save, ArrowLeft } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

const EditCourse = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('error');
  const [form, setForm] = useState({
    courseTitle: '', courseDescription: '', coursePrice: '', isPublished: false, discount: 0, courseThumbnail: '', courseContent: []
  });
  const [thumbnailFile, setThumbnailFile] = useState(null);
  const fileInputRef = useRef();
  const [currentChapter, setCurrentChapter] = useState({ title: '', description: '', lectures: [] });
  const [currentLecture, setCurrentLecture] = useState({ title: '', description: '', videoUrl: '', duration: '', isPreviewFree: false });

  const showMessage = (msg, type = 'error') => { setMessage(msg); setMessageType(type); };

  useEffect(() => {
    const fetchCourse = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) throw new Error('No token');
        const res = await fetch(`${API_BASE}/api/courses/${id}`, { headers: { Authorization: `Bearer ${token}` } });
        const data = await res.json();
        if (data) {
          setForm({ courseTitle: data.courseTitle, courseDescription: data.courseDescription, coursePrice: data.coursePrice, isPublished: data.isPublished, discount: data.discount || 0, courseThumbnail: data.courseThumbnail || '', courseContent: data.courseContent || [] });
        }
      } catch (err) { showMessage('Failed to load course'); } finally { setLoading(false); }
    };
    fetchCourse();
  }, [id]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  const addLecture = () => {
    if (!currentLecture.title || !currentLecture.videoUrl || !currentLecture.duration) {
      showMessage('Please fill in all required lecture fields'); return;
    }
    setCurrentChapter(prev => ({ ...prev, lectures: [...prev.lectures, { title: currentLecture.title, description: currentLecture.description, videoUrl: currentLecture.videoUrl, duration: Number(currentLecture.duration), isPreviewFree: currentLecture.isPreviewFree, order: prev.lectures.length }] }));
    setCurrentLecture({ title: '', description: '', videoUrl: '', duration: '', isPreviewFree: false });
  };

  const addChapter = () => {
    if (!currentChapter.title || currentChapter.lectures.length === 0) { showMessage('Please add title and lectures'); return; }
    setForm(prev => ({ ...prev, courseContent: [...prev.courseContent, { title: currentChapter.title, description: currentChapter.description, lectures: currentChapter.lectures, order: prev.courseContent.length }] }));
    setCurrentChapter({ title: '', description: '', lectures: [] });
    setMessage('');
  };

  const removeLecture = (chIdx, lecIdx) => {
    setForm(prev => { const c = [...prev.courseContent]; c[chIdx].lectures.splice(lecIdx, 1); return { ...prev, courseContent: c }; });
  };

  const removeChapter = (idx) => {
    setForm(prev => { const c = [...prev.courseContent]; c.splice(idx, 1); return { ...prev, courseContent: c }; });
  };

  const handleThumbnailChange = (e) => {
    if (e.target.files?.[0]) { setThumbnailFile(e.target.files[0]); setForm(prev => ({ ...prev, courseThumbnail: URL.createObjectURL(e.target.files[0]) })); }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.courseTitle || !form.courseDescription || !form.coursePrice) { showMessage('Please fill in required fields'); return; }
    try {
      const token = localStorage.getItem('token');
      if (!token) { showMessage('Authentication required'); return; }
      const formData = new FormData();
      formData.append('courseTitle', form.courseTitle); formData.append('courseDescription', form.courseDescription);
      formData.append('coursePrice', Number(form.coursePrice)); formData.append('discount', Number(form.discount));
      formData.append('isPublished', form.isPublished); formData.append('courseContent', JSON.stringify(form.courseContent));
      if (thumbnailFile) formData.append('courseThumbnail', thumbnailFile);
      const res = await fetch(`${API_BASE}/api/courses/${id}`, {
        method: 'PUT', headers: { Authorization: `Bearer ${token}` }, body: formData
      });
      const data = await res.json();
      if (res.ok) { showMessage('Course updated!', 'success'); setTimeout(() => navigate('/educator/my-courses'), 1500); }
      else showMessage(data.message || 'Failed to update');
    } catch (err) { showMessage(`Error: ${err.message}`); }
  };

  if (loading) {
    return <div className="p-6 flex items-center justify-center"><div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div>;
  }

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon-sm" onClick={() => navigate('/educator/my-courses')}><ArrowLeft size={18} /></Button>
        <div><h1 className="text-2xl font-bold text-foreground">Edit Course</h1><p className="text-muted-foreground mt-1">{form.courseTitle}</p></div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card variant="default" padding="md">
          <CardTitle className="text-base mb-4">Basic Information</CardTitle>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">Course Title</label>
              <input name="courseTitle" value={form.courseTitle} onChange={handleChange} className="w-full h-10 rounded-lg border border-input bg-background px-3 text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-primary" />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">Description</label>
              <textarea name="courseDescription" value={form.courseDescription} onChange={handleChange} rows={5} className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-primary resize-none" />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">Price ($)</label>
                <input name="coursePrice" value={form.coursePrice} onChange={handleChange} type="number" min="0" className="w-full h-10 rounded-lg border border-input bg-background px-3 text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-primary" />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">Discount (%)</label>
                <input name="discount" value={form.discount} onChange={handleChange} type="number" min="0" max="100" className="w-full h-10 rounded-lg border border-input bg-background px-3 text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-primary" />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">Thumbnail</label>
                <button type="button" onClick={() => fileInputRef.current.click()} className="h-10 px-3 rounded-lg border border-input bg-background text-sm text-muted-foreground hover:bg-accent flex items-center gap-2">
                  <Upload size={14} /> {form.courseThumbnail ? 'Change' : 'Upload'}
                </button>
                <input type="file" accept="image/*" ref={fileInputRef} className="hidden" onChange={handleThumbnailChange} />
                {form.courseThumbnail && <img src={form.courseThumbnail} alt="" className="mt-2 h-16 w-28 object-cover rounded border border-border" />}
              </div>
            </div>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" name="isPublished" checked={form.isPublished} onChange={handleChange} className="rounded border-input text-primary focus:ring-primary" />
              Published
            </label>
          </div>
        </Card>

        <Card variant="default" padding="md">
          <CardTitle className="text-base mb-4">Course Content</CardTitle>

          <div className="rounded-lg border border-border p-4 mb-4 bg-muted/20">
            <h4 className="text-sm font-semibold text-foreground mb-3">New Chapter</h4>
            <div className="space-y-3">
              <input value={currentChapter.title} onChange={(e) => setCurrentChapter(prev => ({ ...prev, title: e.target.value }))} placeholder="Chapter title" className="w-full h-10 rounded-lg border border-input bg-background px-3 text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-primary" />
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
                  <Button type="button" variant="outline" size="sm" onClick={addLecture}><Plus size={14} /> Add Lecture</Button>
                </div>
              </div>
              {currentChapter.lectures.length > 0 && (
                <div className="space-y-1">
                  {currentChapter.lectures.map((lec, idx) => (
                    <div key={idx} className="flex items-center justify-between rounded bg-muted/50 px-3 py-2 text-sm">
                      <span className="flex items-center gap-2"><Video size={12} /> {lec.title}</span>
                      <button type="button" onClick={() => { const u = [...currentChapter.lectures]; u.splice(idx, 1); setCurrentChapter(prev => ({ ...prev, lectures: u })); }} className="text-muted-foreground hover:text-error"><Trash2 size={12} /></button>
                    </div>
                  ))}
                </div>
              )}
              <Button type="button" onClick={addChapter} disabled={!currentChapter.title || currentChapter.lectures.length === 0}><BookOpen size={14} /> Add Chapter</Button>
            </div>
          </div>

          {form.courseContent.length > 0 && (
            <div className="space-y-3">
              {form.courseContent.map((chapter, chapterIdx) => (
                <div key={chapterIdx} className="rounded-lg border border-border overflow-hidden">
                  <div className="flex items-center justify-between px-4 py-3 bg-muted/30">
                    <div className="flex items-center gap-2"><BookOpen size={14} className="text-primary" /> <span className="text-sm font-medium">{chapter.title}</span> <Badge variant="neutral" size="sm">{chapter.lectures.length} lectures</Badge></div>
                    <button type="button" onClick={() => removeChapter(chapterIdx)} className="p-1 text-muted-foreground hover:text-error"><Trash2 size={14} /></button>
                  </div>
                  <div className="divide-y divide-border">
                    {chapter.lectures.map((lecture, lectureIdx) => (
                      <div key={lectureIdx} className="flex items-center justify-between px-4 py-2.5 text-sm">
                        <span className="flex items-center gap-2 text-muted-foreground"><Video size={12} /> {lecture.title}</span>
                        <div className="flex items-center gap-3">
                          <span className="text-xs text-muted-foreground">{lecture.duration} min</span>
                          {lecture.isPreviewFree && <Badge variant="warning" size="sm">Free</Badge>}
                          <button type="button" onClick={() => removeLecture(chapterIdx, lectureIdx)} className="text-muted-foreground hover:text-error"><Trash2 size={12} /></button>
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
          <Button type="submit" size="lg"><Save size={16} /> Save Changes</Button>
          {message && <p className={`text-sm ${messageType === 'success' ? 'text-success' : 'text-error'}`}>{message}</p>}
        </div>
      </form>
    </div>
  );
};

export default EditCourse;
