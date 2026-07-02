import React from 'react';
import { dummyTestimonial, assets } from '../../assets/assets';

const TestimonialsSection = () => {
  return (
    <section className='py-16 md:py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-gray-50 to-blue-50'>
      <div className='max-w-7xl mx-auto'>
        <div className='text-center mb-16'>
          <h2 className='text-3xl md:text-4xl font-bold text-gray-800 mb-4'>
            What Our Students Say
          </h2>
          <p className='text-gray-600 max-w-2xl mx-auto text-lg'>
            Hear from our learners as they share their journeys of transformation, success, and how our
            platform has made a difference in their lives.
          </p>
        </div>

        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8'>
          {dummyTestimonial.map((testimonial, index) => (
            <div
              key={index}
              className='bg-white rounded-xl overflow-hidden shadow-lg hover:shadow-xl transition-shadow duration-300 flex flex-col h-full transform hover:-translate-y-1 transition-transform duration-300'
            >
              <div className='bg-indigo-600 p-6 relative'>
                <div className='flex items-center gap-4'>
                  <img
                    className='h-16 w-16 rounded-full border-4 border-white object-cover shadow-md'
                    src={testimonial.image}
                    alt={testimonial.name}
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = assets.profile_img;
                    }}
                  />
                  <div className='text-white'>
                    <h3 className='font-bold text-lg'>{testimonial.name}</h3>
                    <p className='opacity-90 text-sm'>{testimonial.role}</p>
                  </div>
                </div>

                <div className='absolute -bottom-4 left-6 flex gap-1 bg-white px-3 py-1 rounded-full shadow-md'>
                  {[...Array(5)].map((_, i) => (
                    <img
                      key={i}
                      className='h-4 w-4'
                      src={Math.floor(testimonial.rating) > i ? assets.star : assets.star_blank}
                      alt={i < Math.floor(testimonial.rating) ? 'filled star' : 'empty star'}
                    />
                  ))}
                  <span className='text-xs font-medium text-gray-700 ml-1'>{testimonial.rating.toFixed(1)}</span>
                </div>
              </div>

              <div className='p-6 flex flex-col flex-grow'>
                <p className='text-gray-600 italic mb-6 flex-grow'>
                  "{testimonial.feedback.length > 150
                    ? `${testimonial.feedback.substring(0, 150)}...`
                    : testimonial.feedback}"
                </p>

                <div className='mt-auto'>
                  <a
                    href="#"
                    className='text-indigo-600 font-medium hover:text-indigo-800 inline-flex items-center transition-colors duration-200'
                  >
                    Read Full Story
                    <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path>
                    </svg>
                  </a>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default TestimonialsSection;