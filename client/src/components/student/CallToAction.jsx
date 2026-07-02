import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Sparkles } from 'lucide-react';
import { Button } from '../ui/button';

const CallToAction = () => {
  const navigate = useNavigate();

  return (
    <section className="py-20 md:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary via-primary/90 to-primary/80 px-8 py-14 md:px-16 md:py-20 text-center">
          {/* Decorative elements */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2 blur-3xl" />

          <div className="relative">
            <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-1.5 text-sm font-medium text-white/90 mb-6">
              <Sparkles size={14} />
              Start learning today
            </div>

            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white max-w-2xl mx-auto leading-tight mb-4">
              Learn anything, anytime, anywhere
            </h2>

            <p className="text-lg text-white/80 max-w-xl mx-auto mb-8 leading-relaxed">
              Join thousands of learners and start mastering new skills that will
              shape your career and future.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Button
                size="xl"
                onClick={() => navigate('/register')}
                className="bg-white text-primary hover:bg-white/90 shadow-lg"
              >
                Get started free
                <ArrowRight size={18} />
              </Button>
              <Button
                size="xl"
                variant="ghost"
                onClick={() => navigate('/courses-list')}
                className="text-white hover:bg-white/10"
              >
                Browse courses
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default CallToAction;
