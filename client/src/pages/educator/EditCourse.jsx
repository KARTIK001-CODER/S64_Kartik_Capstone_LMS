import React, { useRef, useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { assets } from '../../assets/assets';

const EditCourse = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [form, setForm] = useState({
    courseTitle: '',
    courseDescription: '',
    coursePrice: '',
    isPublished: false,
    discount: 0,
    courseThumbnail: '',
    courseContent: []
  });

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

  useEffect(() => {
    const fetchCourse = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          navigate('/login');
          return;
        }

        const response = await fetch(`http://localhost:5000/api/courses/${id}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (response.ok) {
          const course = await response.json();
          setForm({
            courseTitle: course.courseTitle || '',
            courseDescription: course.courseDescription || '',
            coursePrice: course.coursePrice || '',
            isPublished: course.isPublished || false,
            discount: course.discount || 0,
            courseThumbnail: course.courseThumbnail || '',
            courseContent: course.courseContent || []
          });
        } else {
          setMessage('Failed to fetch course details');
        }
      } catch (error) {
        console.error('Error fetching course:', error);
        setMessage('Error fetching course details');
      } finally {
        setLoading(false);
      }
    };

    fetchCourse();
  }, [id, navigate]);

  const addLecture = () => {
    if (!currentLecture.title || !currentLecture.videoUrl) {
      setMessage('Please fill in lecture title and video URL');
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
      }

      const res = await fetch(`http://localhost:5000/api/courses/${id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      const data = await res.json();
      if (res.ok) {
        setMessage('Course updated successfully!');
        setTimeout(() => {
          navigate('/educator/my-courses');
        }, 1500);
      } else {
        setMessage(data.message || data.error || 'Failed to update course');
      }
    } catch (err) {
      setMessage(`Error connecting to server: ${err.message}`);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading course details...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="max-w-4xl mx-auto">
            <h2 className="text-2xl font-bold mb-6 text-gray-800">Edit Course</h2>
            
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Basic Course Information */}
              <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                <h3 className="text-lg font-semibold mb-4">Basic Information</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Course Title *
                    </label>
                    <input
                      type="text"
                      value={form.courseTitle}
                      onChange={(e) => setForm(prev => ({ ...prev, courseTitle: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Course Price *
                    </label>
                    <input
                      type="number"
                      value={form.coursePrice}
                      onChange={(e) => setForm(prev => ({ ...prev, coursePrice: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      min="0"
                      step="0.01"
                      required
                    />
                  </div>
                </div>

                <div className="mt-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Course Description *
                  </label>
                  <textarea
                    value={form.courseDescription}
                    onChange={(e) => setForm(prev => ({ ...prev, courseDescription: e.target.value }))}
                    rows="4"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Discount (%)
                    </label>
                    <input
                      type="number"
                      value={form.discount}
                      onChange={(e) => setForm(prev => ({ ...prev, discount: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      min="0"
                      max="100"
                    />
                  </div>
                  
                  <div className="flex items-center mt-6">
                    <input
                      type="checkbox"
                      id="isPublished"
                      checked={form.isPublished}
                      onChange={(e) => setForm(prev => ({ ...prev, isPublished: e.target.checked }))}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <label htmlFor="isPublished" className="ml-2 block text-sm text-gray-900">
                      Publish this course
                    </label>
                  </div>
                </div>
              </div>

              {/* Course Thumbnail */}
              <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                <h3 className="text-lg font-semibold mb-4">Course Thumbnail</h3>
                <div className="flex items-center space-x-4">
                  <img
                    src={form.courseThumbnail || assets.course_1_thumbnail}
                    alt="Course thumbnail"
                    className="w-32 h-20 rounded object-cover border"
                    onError={e => { e.target.onerror = null; e.target.src = assets.course_1_thumbnail; }}
                  />
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleThumbnailChange}
                    className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                  />
                </div>
              </div>

              {/* Course Content */}
              <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                <h3 className="text-lg font-semibold mb-4">Course Content</h3>
                
                {/* Add New Chapter */}
                <div className="border border-gray-200 rounded-lg p-4 mb-6">
                  <h4 className="font-medium mb-4">Add New Chapter</h4>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Chapter Title
                      </label>
                      <input
                        type="text"
                        value={currentChapter.title}
                        onChange={(e) => setCurrentChapter(prev => ({ ...prev, title: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Chapter Description
                      </label>
                      <input
                        type="text"
                        value={currentChapter.description}
                        onChange={(e) => setCurrentChapter(prev => ({ ...prev, description: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>

                  {/* Add Lecture to Current Chapter */}
                  <div className="border-t pt-4">
                    <h5 className="font-medium mb-3">Add Lecture to Current Chapter</h5>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Lecture Title
                        </label>
                        <input
                          type="text"
                          value={currentLecture.title}
                          onChange={(e) => setCurrentLecture(prev => ({ ...prev, title: e.target.value }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Video URL
                        </label>
                        <input
                          type="url"
                          value={currentLecture.videoUrl}
                          onChange={(e) => setCurrentLecture(prev => ({ ...prev, videoUrl: e.target.value }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Duration (minutes)
                        </label>
                        <input
                          type="number"
                          value={currentLecture.duration}
                          onChange={(e) => setCurrentLecture(prev => ({ ...prev, duration: e.target.value }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          min="0"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Description
                        </label>
                        <input
                          type="text"
                          value={currentLecture.description}
                          onChange={(e) => setCurrentLecture(prev => ({ ...prev, description: e.target.value }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    </div>
                    
                    <div className="flex items-center mb-4">
                      <input
                        type="checkbox"
                        id="isPreviewFree"
                        checked={currentLecture.isPreviewFree}
                        onChange={(e) => setCurrentLecture(prev => ({ ...prev, isPreviewFree: e.target.checked }))}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <label htmlFor="isPreviewFree" className="ml-2 block text-sm text-gray-900">
                        Free preview
                      </label>
                    </div>
                    
                    <button
                      type="button"
                      onClick={addLecture}
                      className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
                    >
                      Add Lecture
                    </button>
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
                    className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 mt-4"
                  >
                    Add Chapter
                  </button>
                </div>
              </div>

              {/* Added Chapters List */}
              {form.courseContent.length > 0 && (
                <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                  <h4 className="font-medium mb-4">Current Course Chapters</h4>
                  <div className="space-y-4">
                    {form.courseContent.map((chapter, chapterIndex) => (
                      <div key={chapterIndex} className="bg-gray-50 p-4 rounded-lg border">
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
                            <li key={lectureIndex} className="flex items-center justify-between bg-white p-2 rounded">
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

              <div className="flex space-x-4">
                <button
                  type="submit"
                  className="bg-blue-600 text-white px-8 py-2 rounded hover:bg-blue-700"
                >
                  Update Course
                </button>
                <button
                  type="button"
                  onClick={() => navigate('/educator/my-courses')}
                  className="bg-gray-500 text-white px-8 py-2 rounded hover:bg-gray-600"
                >
                  Cancel
                </button>
              </div>
            </form>
            
            {message && (
              <div className={`mt-4 text-center ${message.includes('success') ? 'text-green-500' : 'text-red-500'}`}>
                {message}
              </div>
            )}
          </div>
        </div>
  );
};

export default EditCourse; 