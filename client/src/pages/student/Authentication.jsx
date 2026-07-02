import { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import axios from "axios";

// Import icons directly from lucide-react
import { Eye, EyeOff, Mail, User, Lock, UserPlus, LogIn } from "lucide-react";

// API service functions
const loginUser = async (userData) => {
  try {
    const response = await axios.post("/api/auth/login", userData);
    return response.data;
  } catch (error) {
    throw error;
  }
};

const registerUser = async (userData) => {
  try {
    const response = await axios.post("/api/auth/register", userData);
    return response.data;
  } catch (error) {
    throw error;
  }
};

const Input = ({ type, placeholder, value, onChange, className, disabled }) => {
  return (
    <input
      type={type}
      placeholder={placeholder}
      value={value}
      onChange={onChange}
      className={`w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${className}`}
      disabled={disabled}
    />
  );
};

const Button = ({ type, className, disabled, children, onClick }) => {
  return (
    <button
      type={type}
      className={`px-4 py-2 rounded-md transition duration-200 ${className}`}
      disabled={disabled}
      onClick={onClick}
    >
      {children}
    </button>
  );
};

const Alert = ({ className, children }) => {
  return <div className={`p-4 rounded-md ${className}`}>{children}</div>;
};

const AlertDescription = ({ children }) => {
  return <div>{children}</div>;
};

const Authentication = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const location = useLocation();
  const navigate = useNavigate();
  const isLoginPage = location.pathname === "/login" || (location.pathname === "/auth" && location.hash === "#login");

  const togglePasswordVisibility = () => setShowPassword(!showPassword);

  const validateForm = () => {
    setError("");
    if (!email) return setError("Email is required"), false;
    if (!password) return setError("Password is required"), false;
    
    if (!isLoginPage) {
      if (!name) return setError("Name is required"), false;
      if (!username) return setError("Username is required"), false;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) return setError("Please enter a valid email address"), false;
    if (password.length < 6) return setError("Password must be at least 6 characters long"), false;

    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsLoading(true);
    setError("");
    setSuccess("");

    try {
      if (isLoginPage) {
        const response = await loginUser({ email, password });
        setSuccess("Login successful!");
        
        // Store user data and token in localStorage
        localStorage.setItem("user", JSON.stringify(response.user));
        localStorage.setItem("token", response.token);
        
        setTimeout(() => navigate("/"), 1500);
      } else {
        // Include username for registration as required by your backend
        const response = await registerUser({ name, username, email, password });
        setSuccess("Registration successful! Please log in.");
        setTimeout(() => navigate("/auth#login"), 1500);
      }
    } catch (err) {
      const errorMsg = err?.response?.data?.message || err.message || "Authentication failed";
      setError(errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left Column - Gradient Background */}
      <div className="hidden lg:block lg:w-1/2 bg-center bg-cover bg-no-repeat relative overflow-hidden">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage:
              "linear-gradient(135deg, #0061ff 0%, #60efff 100%)",
          }}
        />
        <div className="absolute inset-0 bg-black bg-opacity-30 flex items-center justify-center">
          <div className="text-white text-center p-12">
            <h1 className="text-5xl font-bold mb-6">InsideBox</h1>
            <p className="text-xl max-w-md mx-auto">
              Your secure space for all your ideas, projects, and collaborations.
            </p>
          </div>
        </div>
      </div>

      {/* Right Column - Form */}
      <div className="w-full lg:w-1/2 flex flex-col justify-center p-8 lg:p-16 bg-gray-50">
        <div className="max-w-md w-full mx-auto">
          {/* Logo */}
          <div className="flex items-center gap-2 mb-8">
            <svg viewBox="0 0 24 24" className="w-10 h-10 text-blue-600" fill="currentColor">
              <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
            </svg>
            <span className="text-2xl font-bold text-blue-600">InsideBox</span>
          </div>

          {/* Headings */}
          <div className="space-y-2 mb-8">
            <h4 className="text-blue-600 font-medium">Welcome back</h4>
            <h1 className="text-3xl font-bold text-gray-800">
              {isLoginPage ? "Sign In to InsideBox" : "Create your account"}
            </h1>
            <p className="text-gray-600">
              {isLoginPage ? "Enter your credentials to access your account" : "Fill in your details to get started"}
            </p>
          </div>

          {/* Error / Success Alerts */}
          {error && (
            <Alert className="mb-4 bg-red-50 border border-red-200 text-red-800">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          {success && (
            <Alert className="mb-4 bg-green-50 border border-green-200 text-green-800">
              <AlertDescription>{success}</AlertDescription>
            </Alert>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {!isLoginPage && (
              <>
                <div className="relative">
                  <User className="absolute left-3 top-3 h-5 w-5 text-blue-400" />
                  <Input
                    type="text"
                    placeholder="Your full name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="pl-10 bg-white shadow-sm"
                    disabled={isLoading}
                  />
                </div>
                
                <div className="relative">
                  <UserPlus className="absolute left-3 top-3 h-5 w-5 text-blue-400" />
                  <Input
                    type="text"
                    placeholder="Username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="pl-10 bg-white shadow-sm"
                    disabled={isLoading}
                  />
                </div>
              </>
            )}

            <div className="relative">
              <Mail className="absolute left-3 top-3 h-5 w-5 text-blue-400" />
              <Input
                type="email"
                placeholder="Email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="pl-10 bg-white shadow-sm"
                disabled={isLoading}
              />
            </div>

            <div className="relative">
              <Lock className="absolute left-3 top-3 h-5 w-5 text-blue-400" />
              <Input
                type={showPassword ? "text" : "password"}
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="pl-10 pr-10 bg-white shadow-sm"
                disabled={isLoading}
              />
              <button
                type="button"
                onClick={togglePasswordVisibility}
                className="absolute right-3 top-3 text-gray-400 hover:text-blue-500"
                disabled={isLoading}
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>

            {isLoginPage && (
              <div className="flex justify-end">
                <Link to="/forgot-password" className="text-sm text-blue-600 hover:text-blue-800">
                  Forgot password?
                </Link>
              </div>
            )}

            <Button
              type="submit"
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium shadow-md flex items-center justify-center py-3"
              disabled={isLoading}
            >
              {isLoading ? (
                <span className="flex items-center">
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  {isLoginPage ? "Signing In..." : "Creating Account..."}
                </span>
              ) : (
                <span className="flex items-center">
                  {isLoginPage ? (
                    <>
                      <LogIn className="h-5 w-5 mr-2" />
                      Sign In
                    </>
                  ) : (
                    <>
                      <UserPlus className="h-5 w-5 mr-2" />
                      Create Account
                    </>
                  )}
                </span>
              )}
            </Button>

            {/* OAuth Section */}
            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-gray-50 text-gray-500">
                  {isLoginPage ? "or sign in with" : "or sign up with"}
                </span>
              </div>
            </div>

            <Button
              type="button"
              className="w-full border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 flex items-center justify-center py-3 shadow-sm"
              disabled={isLoading}
              onClick={() => {
                window.location.href = "http://localhost:5000/api/auth/google";
              }}
            >
              <svg className="h-5 w-5 mr-2" viewBox="0 0 24 24">
                <path
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  fill="#4285F4"
                />
                <path
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  fill="#34A853"
                />
                <path
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  fill="#FBBC05"
                />
                <path
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  fill="#EA4335"
                />
                <path d="M1 1h22v22H1z" fill="none" />
              </svg>
              Continue with Google
            </Button>
          </form>

          {/* Link to switch form */}
          <p className="mt-8 text-center text-gray-600">
            {isLoginPage ? "Don't have an account? " : "Already have an account? "}
            <Link
              to={isLoginPage ? "/auth" : "/auth#login"}
              className="text-blue-600 hover:text-blue-800 font-medium"
            >
              {isLoginPage ? "Sign Up" : "Sign In"}
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Authentication;