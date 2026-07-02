import React, { useContext, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import logo from "../../assets/logo.svg";
import { assets } from "../../assets/assets";
import { AppContext } from "../../context/AppContext";
import NotificationDropdown from "./NotificationDropdown";

const Navbar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, isEducator, logout } = useContext(AppContext);
  const isCourseListPage = location.pathname.includes("/courses-list");
  const [showDropdown, setShowDropdown] = useState(false);

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  const getInitials = (name) => {
    if (!name) return 'U';
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };


  return (
    <div
      className={`sticky top-0 z-50 flex items-center justify-between px-4 sm:px-10 md:px-14 lg:px-36 border-b border-gray-200 py-4 shadow-md ${
        isCourseListPage ? "bg-white" : "bg-cyan-100"
      }`}
      style={{ backdropFilter: "blur(8px)" }}
    >
      <Link to="/">
        <img src={logo} alt="logo" className="w-28 lg:w-32 cursor-pointer" />
      </Link>

      <div className="hidden md:flex items-center gap-5 text-gray-500">
        <div className="flex items-center gap-5">
          {user ? (
            <>
              {user.role === "educator" ? (
                <Link to="/educator/dashboard" className="hover:text-blue-600 transition">
                  Educator Dashboard
                </Link>
              ) : (
                <button
                  onClick={() => navigate("/educator")}
                  className="hover:text-blue-600 transition"
                >
                  Become Educator
                </button>
              )}
              {user.role === "educator" && (
                <Link to="/educator/reports" className="hover:text-blue-600 transition">
                  Reports
                </Link>
              )}
              <Link to="/my-enrollments" className="hover:text-blue-600 transition">
                My Enrollments
              </Link>
              {user.role === "educator" && (
                <Link to="/educator/my-courses" className="hover:text-blue-600 transition">
                  My Courses
                </Link>
              )}
              <Link to="/courses-list" className="hover:text-blue-600 transition">
                Browse Courses
              </Link>
            </>
          ) : (
            <Link to="/courses-list" className="hover:text-blue-600 transition">
              Browse Courses
            </Link>
          )}
        </div>

        {user && <NotificationDropdown />}

        {user ? (
          <div className="flex items-center gap-4">
            <div className="relative">
              <button
                onClick={() => setShowDropdown(!showDropdown)}
                className="flex items-center gap-2 focus:outline-none"
              >
                <span className="text-gray-700">
                  {user.name || user.email.split('@')[0]}
                </span>
                <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-semibold">
                  {getInitials(user.name)}
                </div>
              </button>

              {showDropdown && (
                <div className="absolute right-0 mt-2 w-56 bg-white rounded-md shadow-lg py-1 border border-gray-200">
                  <div className="px-4 py-2 border-b border-gray-100">
                    <p className="text-sm font-medium text-gray-900">{user.name}</p>
                    <p className="text-xs text-gray-500">{user.email}</p>
                  </div>
                  <Link
                    to="/profile"
                    className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    onClick={() => setShowDropdown(false)}
                  >
                    Profile Settings
                  </Link>
                  {user.role === "educator" && (
                    <Link
                      to="/educator/settings"
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      onClick={() => setShowDropdown(false)}
                    >
                      Educator Settings
                    </Link>
                  )}
                  <button
                    onClick={handleLogout}
                    className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100"
                  >
                    Logout
                  </button>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-3">
            <Link
              to="/login"
              className="text-blue-600 hover:underline transition"
            >
              Login
            </Link>
            <Link
              to="/register"
              className="bg-blue-600 text-white px-5 py-2 rounded-full hover:bg-blue-700 transition duration-300"
            >
              Register
            </Link>
          </div>
        )}
      </div>

      {/* Mobile Navigation */}
      <div className="md:hidden flex items-center gap-2 sm:gap-5 text-gray-500">
        {user && <NotificationDropdown />}
        <div className="flex items-center gap-1 sm:gap-2 max-sm:text-xs">
          {user ? (
            <>
              <div className="relative">
                <button
                  onClick={() => setShowDropdown(!showDropdown)}
                  className="focus:outline-none"
                >
                  <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-semibold text-sm">
                    {getInitials(user.name)}
                  </div>
                </button>

                {showDropdown && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 border border-gray-200">
                    <div className="px-3 py-2 border-b border-gray-100">
                      <p className="text-xs font-medium text-gray-900">{user.name}</p>
                      <p className="text-xs text-gray-500 truncate">{user.email}</p>
                    </div>
                    <Link
                      to="/profile"
                      className="block px-3 py-2 text-xs text-gray-700 hover:bg-gray-100"
                      onClick={() => setShowDropdown(false)}
                    >
                      Profile Settings
                    </Link>
                    {user.role === "educator" && (
                      <Link
                        to="/educator/settings"
                        className="block px-3 py-2 text-xs text-gray-700 hover:bg-gray-100"
                        onClick={() => setShowDropdown(false)}
                      >
                        Educator Settings
                      </Link>
                    )}
                    <button
                      onClick={handleLogout}
                      className="block w-full text-left px-3 py-2 text-xs text-red-600 hover:bg-gray-100"
                    >
                      Logout
                    </button>
                  </div>
                )}
              </div>
            </>
          ) : (
            <Link to="/login">
              <img src={assets.user_icon} alt="User" className="w-6 h-6" />
            </Link>
          )}
        </div>
      </div>
    </div>
  );
};

export default Navbar;