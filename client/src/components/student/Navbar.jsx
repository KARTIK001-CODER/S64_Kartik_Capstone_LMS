import React, { useContext, useState, useEffect, useRef } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Menu, X, ChevronDown } from "lucide-react";
import logo from "../../assets/logo.svg";
import { AppContext } from "../../context/AppContext";
import { Button } from "../ui/button";
import { Avatar } from "../ui/avatar";
import ThemeToggle from "../ui/ThemeToggle";
import NotificationDropdown from "./NotificationDropdown";

const Navbar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useContext(AppContext);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef(null);

  const isHome = location.pathname === "/";

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    setMobileOpen(false);
    setShowDropdown(false);
  }, [location]);

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  const navLinks = user
    ? [
        { label: "Browse Courses", path: "/courses-list" },
        ...(user.role === "student"
          ? [
              { label: "Dashboard", path: "/dashboard" },
              { label: "My Learning", path: "/my-enrollments" },
            ]
          : []),
        ...(user.role === "educator"
          ? [
              { label: "Educator", path: "/educator/dashboard" },
              { label: "My Courses", path: "/educator/my-courses" },
            ]
          : []),
      ]
    : [{ label: "Browse Courses", path: "/courses-list" }];

  return (
    <header
      className={`sticky top-0 z-50 w-full transition-all duration-300 ${
        scrolled || !isHome
          ? "bg-background/80 backdrop-blur-xl border-b border-border shadow-xs"
          : "bg-transparent"
      }`}
    >
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link to="/" className="flex items-center gap-2 flex-shrink-0">
          <img src={logo} alt="Learnova" className="h-8 w-auto" />
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-1">
          {navLinks.map((link) => (
            <Link
              key={link.path}
              to={link.path}
              className={`px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                location.pathname === link.path
                  ? "text-foreground bg-accent"
                  : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
              }`}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="hidden md:flex items-center gap-3">
          <ThemeToggle />
          {user ? (
            <>
              {user.role === "student" && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => navigate("/educator")}
                >
                  Become an Educator
                </Button>
              )}
              <NotificationDropdown />
              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => setShowDropdown(!showDropdown)}
                  className="flex items-center gap-2 rounded-lg hover:bg-accent p-1.5 transition-colors"
                >
                  <Avatar
                    size="sm"
                    alt={user.name}
                    initials={user.name?.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2)}
                  />
                  <ChevronDown size={14} className="text-muted-foreground" />
                </button>

                {showDropdown && (
                  <div className="absolute right-0 mt-2 w-56 rounded-xl border border-border bg-card shadow-lg animate-scale-in overflow-hidden">
                    <div className="px-4 py-3 border-b border-border">
                      <p className="text-sm font-medium text-foreground truncate">
                        {user.name}
                      </p>
                      <p className="text-xs text-muted-foreground truncate mt-0.5">
                        {user.email}
                      </p>
                    </div>
                    <div className="p-1">
                      <Link
                        to="/profile"
                        className="flex items-center gap-2 px-3 py-2 text-sm text-foreground rounded-md hover:bg-accent transition-colors"
                      >
                        Profile
                      </Link>
                      <Link
                        to={user.role === "educator" ? "/educator/settings" : "/settings"}
                        className="flex items-center gap-2 px-3 py-2 text-sm text-foreground rounded-md hover:bg-accent transition-colors"
                      >
                        Settings
                      </Link>
                      <button
                        onClick={handleLogout}
                        className="flex w-full items-center gap-2 px-3 py-2 text-sm text-error rounded-md hover:bg-error/5 transition-colors"
                      >
                        Log out
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </>
          ) : (
            <>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate("/login")}
              >
                Log in
              </Button>
              <Button size="sm" onClick={() => navigate("/register")}>
                Get started
              </Button>
            </>
          )}
        </div>

        {/* Mobile menu button */}
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="md:hidden p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
          aria-label={mobileOpen ? "Close menu" : "Open menu"}
        >
          {mobileOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {/* Mobile nav */}
      {mobileOpen && (
        <div className="md:hidden border-t border-border bg-background animate-slide-down">
          <div className="px-4 py-3 space-y-1">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                className={`block px-3 py-2.5 text-sm font-medium rounded-md transition-colors ${
                  location.pathname === link.path
                    ? "text-foreground bg-accent"
                    : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
                }`}
              >
                {link.label}
              </Link>
            ))}
          </div>
          <div className="border-t border-border px-4 py-3 flex flex-col gap-2">
            {user ? (
              <>
                <div className="flex items-center gap-3 px-3 py-2">
                  <Avatar size="sm" alt={user.name} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">
                      {user.name}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">
                      {user.email}
                    </p>
                  </div>
                </div>
                <Link
                  to="/profile"
                  className="block px-3 py-2.5 text-sm text-foreground rounded-md hover:bg-accent transition-colors"
                >
                  Profile
                </Link>
                <button
                  onClick={handleLogout}
                  className="block w-full text-left px-3 py-2.5 text-sm text-error rounded-md hover:bg-error/5 transition-colors"
                >
                  Log out
                </button>
              </>
            ) : (
              <>
                <Button
                  variant="outline"
                  size="md"
                  onClick={() => navigate("/login")}
                  className="w-full"
                >
                  Log in
                </Button>
                <Button size="md" onClick={() => navigate("/register")} className="w-full">
                  Get started
                </Button>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
};

export default Navbar;
