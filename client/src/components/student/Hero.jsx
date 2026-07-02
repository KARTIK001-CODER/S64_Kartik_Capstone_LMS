import React from "react";
import { useNavigate } from "react-router-dom";
import { Search, Sparkles, ArrowRight, BookOpen, Users, Award } from "lucide-react";
import { Button } from "../ui/button";

const Hero = () => {
  const navigate = useNavigate();
  const [search, setSearch] = React.useState("");

  const handleSearch = (e) => {
    e.preventDefault();
    if (search.trim()) {
      navigate(`/courses-list/${encodeURIComponent(search.trim())}`);
    }
  };

  return (
    <section className="relative overflow-hidden">
      {/* Subtle background gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-primary/[0.03] via-transparent to-transparent pointer-events-none" />
      <div className="absolute top-0 -left-4 w-72 h-72 bg-primary/[0.02] rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-0 -right-4 w-96 h-96 bg-primary/[0.02] rounded-full blur-3xl pointer-events-none" />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-20 pb-16 md:pt-28 md:pb-20">
        <div className="mx-auto max-w-3xl text-center">
          {/* Pill badge */}
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-1.5 text-sm font-medium text-primary mb-8 animate-fade-in">
            <Sparkles size={14} />
            AI-Powered Learning Platform
          </div>

          {/* Headline */}
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight text-foreground leading-[1.1] mb-6 animate-slide-up">
            Master skills that
            <br />
            <span className="bg-gradient-to-r from-primary via-primary to-primary/70 bg-clip-text text-transparent">
              shape your future
            </span>
          </h1>

          {/* Subtitle */}
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed animate-slide-up" style={{animationDelay: '0.1s'}}>
            Learn from world-class instructors, earn recognized certificates,
            and join a community of thousands achieving their goals.
          </p>

          {/* Search bar */}
          <form onSubmit={handleSearch} className="mx-auto max-w-xl mb-12 animate-slide-up" style={{animationDelay: '0.2s'}}>
            <div className="relative flex items-center">
              <Search size={18} className="absolute left-4 text-muted-foreground" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="What do you want to learn today?"
                className="w-full h-13 pl-11 pr-36 rounded-xl border border-border bg-card text-foreground placeholder:text-muted-foreground shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-0 text-sm"
              />
              <div className="absolute right-1.5 flex items-center gap-1">
                <Button type="submit" size="md" className="rounded-lg h-9">
                  Search
                </Button>
              </div>
            </div>
          </form>

          {/* Stats row */}
          <div className="flex items-center justify-center gap-8 md:gap-12 animate-fade-in" style={{animationDelay: '0.3s'}}>
            <div className="text-center">
              <p className="text-2xl md:text-3xl font-bold text-foreground">500+</p>
              <p className="text-sm text-muted-foreground mt-1">Courses</p>
            </div>
            <div className="h-12 w-px bg-border" />
            <div className="text-center">
              <p className="text-2xl md:text-3xl font-bold text-foreground">50K+</p>
              <p className="text-sm text-muted-foreground mt-1">Students</p>
            </div>
            <div className="h-12 w-px bg-border" />
            <div className="text-center">
              <p className="text-2xl md:text-3xl font-bold text-foreground">95%</p>
              <p className="text-sm text-muted-foreground mt-1">Satisfaction</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
