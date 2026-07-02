import React from 'react';
import { Quote } from 'lucide-react';
import { dummyTestimonial, assets } from '../../assets/assets';

const TestimonialsSection = () => {
  return (
    <section className="py-20 md:py-24 bg-muted/30">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-14">
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-foreground mb-4">
            What our students say
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            Hear from learners who have transformed their careers through our platform.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {dummyTestimonial.map((testimonial, index) => (
            <div
              key={index}
              className="relative flex flex-col rounded-xl border border-border bg-card p-6 shadow-sm hover:shadow-md transition-shadow duration-300"
            >
              <Quote size={24} className="text-primary/20 mb-4" />

              <p className="text-sm text-muted-foreground leading-relaxed flex-1">
                &ldquo;{testimonial.feedback.length > 150
                  ? `${testimonial.feedback.substring(0, 150)}...`
                  : testimonial.feedback}&rdquo;
              </p>

              <div className="flex items-center gap-3 mt-6 pt-4 border-t border-border">
                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-sm font-semibold text-primary flex-shrink-0">
                  {testimonial.name.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">
                    {testimonial.name}
                  </p>
                  <p className="text-xs text-muted-foreground truncate">
                    {testimonial.role}
                  </p>
                </div>
                <div className="flex items-center gap-0.5">
                  {[...Array(5)].map((_, i) => (
                    <svg
                      key={i}
                      className={`w-3.5 h-3.5 ${
                        i < Math.floor(testimonial.rating)
                          ? 'text-warning'
                          : 'text-neutral-200 dark:text-neutral-700'
                      }`}
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  ))}
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
