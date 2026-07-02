import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Home } from 'lucide-react';
import { Button } from '../components/ui/button';

const NotFound = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-background">
      <div className="text-center max-w-md">
        <p className="text-[8rem] sm:text-[10rem] font-bold leading-none text-primary/10 select-none">404</p>
        <h1 className="text-2xl font-bold text-foreground mt-[-1.5rem] mb-2">Page not found</h1>
        <p className="text-muted-foreground mb-8 leading-relaxed">
          The page you are looking for doesn&apos;t exist or has been moved.
        </p>
        <div className="flex items-center justify-center gap-3">
          <Button variant="outline" onClick={() => navigate(-1)}>
            <ArrowLeft size={16} />
            Go Back
          </Button>
          <Button onClick={() => navigate('/')}>
            <Home size={16} />
            Home
          </Button>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
