import React, { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';

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
  const fileInputRef = useRef();
  const [thumbnailFile, setThumbnailFile] = useState(null);
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

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleChapterChange = (e) => {
    const { name, value } = e.target;
    setCurrentChapter(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleLectureChange = (e) => {
    const { name, value, type, checked } = e.target;
    setCurrentLecture(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const addLecture = () => {
    if (!currentLecture.title || !currentLecture.videoUrl || !currentLecture.duration) {
      setMessage('Please fill in all required lecture fields');
      return;
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

    setCurrentLecture({
      title: '',
      description: '',
      videoUrl: '',
      duration: '',
      isPreviewFree: false
    });
  };

  const addChapter = () => {
    if (!currentChapter.title || currentChapter.lectures.length === 0) {
      setMessage('Please add a title and at least one lecture to the chapter');
      return;
    }

    setForm(prev => ({
      ...prev,
      courseContent: [...prev.courseContent, {
        title: currentChapter.title,
        description: currentChapter.description,
        lectures: currentChapter.lectures,
        order: prev.courseContent.length
      }]
    }));

    setCurrentChapter({
      title: '',
      description: '',
      lectures: []
    });
  };

  const removeLecture = (chapterIndex, lectureIndex) => {
    setForm(prev => {
      const updatedContent = [...prev.courseContent];
      updatedContent[chapterIndex].lectures.splice(lectureIndex, 1);
      return { ...prev, courseContent: updatedContent };
    });
  };

  const removeChapter = (index) => {
    setForm(prev => {
      const updatedContent = [...prev.courseContent];
      updatedContent.splice(index, 1);
      return { ...prev, courseContent: updatedContent };
    });
  };

  const handleThumbnailChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setThumbnailFile(file);
      setForm(prev => ({
        ...prev,
        courseThumbnail: URL.createObjectURL(file)
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');

    if (!form.courseTitle || !form.courseDescription || !form.coursePrice || !form.courseThumbnail) {
      setMessage('Please fill in all required fields');
      return;
    }

    if (form.courseContent.length === 0) {
      setMessage('Please add at least one chapter with lectures');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setMessage('Authentication token not found. Please log in again.');
        return;
      }

      const formData = new FormData();
      formData.append('courseTitle', form.courseTitle);
      formData.append('courseDescription', form.courseDescription);
      formData.append('coursePrice', Number(form.coursePrice));
      formData.append('discount', Number(form.discount));
      formData.append('isPublished', form.isPublished);
      formData.append('courseContent', JSON.stringify(form.courseContent));

      if (thumbnailFile) {
        formData.append('courseThumbnail', thumbnailFile);
      } else if (form.courseThumbnail) {
        formData.append('courseThumbnail', form.courseThumbnail);
      }

      const res = await fetch('http://localhost:5000/api/courses', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      const data = await res.json();
      if (res.ok) {
        setMessage('Course added successfully!');
        navigate('/educator/my-courses');
      } else {
        setMessage(data.message || data.error || 'Failed to add course');
      }
    } catch (err) {
      setMessage(`Error connecting to server: ${err.message}`);
    }
  };

  return (
    <div className="p-8">
      <form onSubmit={handleSubmit} className="w-full max-w-4xl space-y-6">
            <div>
              <label className="block text-sm font-medium mb-1">Course Title</label>
              <input
                name="courseTitle"
                value={form.courseTitle}
                onChange={handleChange}
                placeholder="Type here"
                className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:border-black"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Course Description</label>
              <textarea
                name="courseDescription"
                value={form.courseDescription}
                onChange={handleChange}
                placeholder="Enter course description"
                rows={6}
                className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:border-black resize-none"
              />
            </div>

            <div className="flex items-center gap-4">
              <div className="flex-1">
                <label className="block text-sm font-medium mb-1">Course Price</label>
                <input
                  name="coursePrice"
                  value={form.coursePrice}
                  onChange={handleChange}
                  placeholder="0"
                  type="number"
                  min="0"
                  className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:border-black"
                />
              </div>
              <div className="flex-1">
                <label className="block text-sm font-medium mb-1">Discount (%)</label>
                <input
                  name="discount"
                  value={form.discount}
                  onChange={handleChange}
                  placeholder="0"
                  type="number"
                  min="0"
                  max="100"
                  className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:border-black"
                />
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-sm">Course Thumbnail</span>
              <button
                type="button"
                className="bg-blue-500 hover:bg-blue-600 text-white px-2 py-2 rounded flex items-center"
                onClick={() => fileInputRef.current.click()}
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 16.5v-9m-4.5 4.5h9" />
                </svg>
              </button>
              <input
                type="file"
                accept="image/*"
                ref={fileInputRef}
                className="hidden"
                onChange={handleThumbnailChange}
              />
              {form.courseThumbnail && (
                <img src={form.courseThumbnail} alt="Thumbnail Preview" className="w-12 h-8 object-cover rounded border" />
              )}
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                name="isPublished"
                checked={form.isPublished}
                onChange={handleChange}
                className="rounded border-gray-300"
              />
              <label className="text-sm font-medium">Publish Course</label>
            </div>

            {/* Chapter and Lecture Management */}
            <div className="border-t pt-6">
              <h3 className="text-lg font-medium mb-4">Course Content</h3>
              
              {/* Current Chapter Form */}
              <div className="bg-gray-50 p-4 rounded-lg mb-4">
                <h4 className="font-medium mb-2">Add Chapter</h4>
                <div className="space-y-4">
                  <input
                    name="title"
                    value={currentChapter.title}
                    onChange={handleChapterChange}
                    placeholder="Chapter Title"
                    className="w-full border border-gray-300 rounded px-3 py-2"
                  />
                  <textarea
                    name="description"
                    value={currentChapter.description}
                    onChange={handleChapterChange}
                    placeholder="Chapter Description"
                    className="w-full border border-gray-300 rounded px-3 py-2"
                  />

                  {/* Current Lecture Form */}
                  <div className="bg-white p-4 rounded-lg">
                    <h5 className="font-medium mb-2">Add Lecture</h5>
                    <div className="space-y-4">
                      <input
                        name="title"
                        value={currentLecture.title}
                        onChange={handleLectureChange}
                        placeholder="Lecture Title"
                        className="w-full border border-gray-300 rounded px-3 py-2"
                      />
                      <textarea
                        name="description"
                        value={currentLecture.description}
                        onChange={handleLectureChange}
                        placeholder="Lecture Description"
                        className="w-full border border-gray-300 rounded px-3 py-2"
                      />
                      <input
                        name="videoUrl"
                        value={currentLecture.videoUrl}
                        onChange={handleLectureChange}
                        placeholder="Video URL"
                        className="w-full border border-gray-300 rounded px-3 py-2"
                      />
                      <input
                        name="duration"
                        value={currentLecture.duration}
                        onChange={handleLectureChange}
                        placeholder="Duration (in minutes)"
                        type="number"
                        min="0"
                        className="w-full border border-gray-300 rounded px-3 py-2"
                      />
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          name="isPreviewFree"
                          checked={currentLecture.isPreviewFree}
                          onChange={handleLectureChange}
                          className="rounded border-gray-300"
                        />
                        <label className="text-sm">Free Preview</label>
                      </div>
                      <button
                        type="button"
                        onClick={addLecture}
                        className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
                      >
                        Add Lecture
                      </button>
                    </div>
                  </div>

                  {/* Current Chapter's Lectures List */}
                  {currentChapter.lectures.length > 0 && (
                    <div className="mt-4">
                      <h5 className="font-medium mb-2">Current Chapter's Lectures</h5>
                      <ul className="space-y-2">
                        {currentChapter.lectures.map((lecture, index) => (
                          <li key={index} className="flex items-center justify-between bg-white p-2 rounded">
                            <span>{lecture.title}</span>
                            <button
                              type="button"
                              onClick={() => {
                                const updatedLectures = [...currentChapter.lectures];
                                updatedLectures.splice(index, 1);
                                setCurrentChapter(prev => ({ ...prev, lectures: updatedLectures }));
                              }}
                              className="text-red-500 hover:text-red-700"
                            >
                              Remove
                            </button>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={addChapter}
                    className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
                  >
                    Add Chapter
                  </button>
                </div>
              </div>

              {/* Added Chapters List */}
              {form.courseContent.length > 0 && (
                <div className="mt-6">
                  <h4 className="font-medium mb-2">Added Chapters</h4>
                  <div className="space-y-4">
                    {form.courseContent.map((chapter, chapterIndex) => (
                      <div key={chapterIndex} className="bg-white p-4 rounded-lg border">
                        <div className="flex items-center justify-between mb-2">
                          <h5 className="font-medium">{chapter.title}</h5>
                          <button
                            type="button"
                            onClick={() => removeChapter(chapterIndex)}
                            className="text-red-500 hover:text-red-700"
                          >
                            Remove Chapter
                          </button>
                        </div>
                        <p className="text-sm text-gray-600 mb-2">{chapter.description}</p>
                        <ul className="space-y-2">
                          {chapter.lectures.map((lecture, lectureIndex) => (
                            <li key={lectureIndex} className="flex items-center justify-between bg-gray-50 p-2 rounded">
                              <span>{lecture.title}</span>
                              <button
                                type="button"
                                onClick={() => removeLecture(chapterIndex, lectureIndex)}
                                className="text-red-500 hover:text-red-700"
                              >
                                Remove
                              </button>
                            </li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <button type="submit" className="bg-black text-white px-8 py-2 rounded mt-2">
              Create Course
            </button>
          </form>
          {message && (
            <div className={`mt-4 text-center ${message.includes('success') ? 'text-green-500' : 'text-red-500'}`}>
              {message}
            </div>
          )}
        </div>
  );
};

export default AddCourse;
