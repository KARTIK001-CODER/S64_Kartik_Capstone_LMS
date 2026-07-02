import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { Eye, EyeOff, Mail, Lock, User, ArrowRight, Sparkles } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import GoogleAuth from './GoogleAuth';
import { Button } from './ui/button';
import logo from '../assets/logo.svg';

const AuthForm = ({ isLogin }) => {
  const initialForm = isLogin
    ? { email: '', password: '' }
    : { name: '', email: '', password: '' };

  const [form, setForm] = useState(initialForm);
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { setUser, setIsEducator } = useAppContext();

  useEffect(() => {
    if (location.state?.message) {
      setMessage(location.state.message);
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const token = params.get('token');
    if (token) {
      try {
        localStorage.setItem('token', token);
        const user = JSON.parse(atob(token.split('.')[1]));
        localStorage.setItem('user', JSON.stringify(user));
        setUser(user);
        setIsEducator(user.role === 'educator');
        navigate(user.role === 'educator' ? '/educator' : '/dashboard');
      } catch {
        setMessage('Error processing authentication');
      }
    }
  }, [location, navigate, setUser, setIsEducator]);

  const validateForm = () => {
    const newErrors = {};
    if (!isLogin && !form.name.trim()) newErrors.name = 'Name is required';
    if (!form.email.trim()) newErrors.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(form.email)) newErrors.email = 'Invalid email';
    if (!form.password) newErrors.password = 'Password is required';
    else if (form.password.length < 6) newErrors.password = 'Must be at least 6 characters';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsLoading(true);
    setMessage('');

    const trimmedForm = Object.entries(form).reduce((acc, [key, value]) => {
      acc[key] = typeof value === 'string' ? value.trim() : value;
      return acc;
    }, {});

    try {
      const endpoint = `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000'}/api/auth/${isLogin ? 'login' : 'register'}`;
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(trimmedForm)
      });
      const data = await response.json();

      if (response.ok) {
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        setUser(data.user);
        setIsEducator(data.user.role === 'educator');
        navigate(data.user.role === 'educator' ? '/educator' : '/dashboard');
      } else {
        setMessage(data.message || 'Authentication failed');
      }
    } catch {
      setMessage('Error connecting to server');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen">
      {/* Left panel - Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-primary via-primary/95 to-primary/90 relative overflow-hidden items-center justify-center">
        <div className="absolute top-0 right-0 w-96 h-96 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2 blur-3xl" />
        <div className="relative text-center px-12 max-w-lg">
          <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-1.5 text-sm font-medium text-white/90 mb-8">
            <Sparkles size={14} />
            {isLogin ? 'Welcome back' : 'Join us today'}
          </div>
          <h2 className="text-4xl font-bold text-white mb-4 leading-tight">
            {isLogin ? 'Ready to continue your journey?' : 'Start your learning journey'}
          </h2>
          <p className="text-lg text-white/80 leading-relaxed">
            {isLogin
              ? 'Access your courses, track your progress, and pick up right where you left off.'
              : 'Create an account and unlock access to hundreds of expert-led courses.'}
          </p>
          <div className="mt-10 flex items-center justify-center gap-8">
            <div className="text-center">
              <p className="text-2xl font-bold text-white">500+</p>
              <p className="text-sm text-white/70 mt-1">Courses</p>
            </div>
            <div className="h-10 w-px bg-white/20" />
            <div className="text-center">
              <p className="text-2xl font-bold text-white">50K+</p>
              <p className="text-sm text-white/70 mt-1">Students</p>
            </div>
            <div className="h-10 w-px bg-white/20" />
            <div className="text-center">
              <p className="text-2xl font-bold text-white">95%</p>
              <p className="text-sm text-white/70 mt-1">Satisfaction</p>
            </div>
          </div>
        </div>
      </div>

      {/* Right panel - Form */}
      <div className="flex-1 flex items-center justify-center px-6 py-12 bg-background">
        <div className="w-full max-w-md">
          {/* Logo */}
          <div className="text-center mb-8">
            <Link to="/" className="inline-block mb-6">
              <img src={logo} alt="Learnova" className="h-8 w-auto mx-auto" />
            </Link>
            <h1 className="text-2xl font-bold text-foreground">
              {isLogin ? 'Sign in to your account' : 'Create your account'}
            </h1>
            <p className="text-sm text-muted-foreground mt-2">
              {isLogin ? "Don't have an account? " : 'Already have an account? '}
              <Link
                to={isLogin ? '/register' : '/login'}
                className="text-primary font-medium hover:text-primary/80 transition-colors"
              >
                {isLogin ? 'Sign up' : 'Sign in'}
              </Link>
            </p>
          </div>

          {message && (
            <div className={`mb-6 px-4 py-3 rounded-lg text-sm ${
              message.includes('successful') || message.includes('Welcome')
                ? 'bg-success/10 text-success border border-success/20'
                : 'bg-error/10 text-error border border-error/20'
            }`}>
              {message}
            </div>
          )}

          {/* Google Auth */}
          <div className="mb-6">
            <GoogleAuth />
          </div>

          {/* Divider */}
          <div className="relative mb-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-border" />
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="bg-background px-2 text-muted-foreground">Or continue with email</span>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-foreground mb-1.5">
                  Full name
                </label>
                <div className="relative">
                  <User size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <input
                    id="name"
                    name="name"
                    value={form.name || ''}
                    onChange={handleChange}
                    className={`w-full h-10 pl-10 pr-3 rounded-lg border text-sm bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
                      errors.name ? 'border-error' : 'border-input hover:border-neutral-300 dark:hover:border-neutral-600'
                    }`}
                    placeholder="John Doe"
                  />
                </div>
                {errors.name && <p className="text-xs text-error mt-1">{errors.name}</p>}
              </div>
            )}

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-foreground mb-1.5">
                Email address
              </label>
              <div className="relative">
                <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <input
                  id="email"
                  name="email"
                  type="email"
                  value={form.email}
                  onChange={handleChange}
                  className={`w-full h-10 pl-10 pr-3 rounded-lg border text-sm bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
                    errors.email ? 'border-error' : 'border-input hover:border-neutral-300 dark:hover:border-neutral-600'
                  }`}
                  placeholder="john@example.com"
                />
              </div>
              {errors.email && <p className="text-xs text-error mt-1">{errors.email}</p>}
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-foreground mb-1.5">
                Password
              </label>
              <div className="relative">
                <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  value={form.password}
                  onChange={handleChange}
                  className={`w-full h-10 pl-10 pr-10 rounded-lg border text-sm bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
                    errors.password ? 'border-error' : 'border-input hover:border-neutral-300 dark:hover:border-neutral-600'
                  }`}
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {errors.password && <p className="text-xs text-error mt-1">{errors.password}</p>}
            </div>

            {isLogin && (
              <div className="flex justify-end">
                <button type="button" className="text-xs text-primary font-medium hover:text-primary/80 transition-colors">
                  Forgot password?
                </button>
              </div>
            )}

            <Button
              type="submit"
              size="lg"
              className="w-full"
              loading={isLoading}
            >
              {isLogin ? 'Sign in' : 'Create account'}
              {!isLoading && <ArrowRight size={16} />}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AuthForm;
