import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import "./Navbar.css";
import { useAuth } from "../../context/authContext";
import { useSelector } from "react-redux";
import { RootState } from "../../redux/store";
import { useAppDispatch } from "../../hooks";
import { fetchUser, setUser } from "../../redux/userSlice";
import { getInitials } from "../../utils/avatarInitials";
import { Menu, X } from "lucide-react";
import ConfirmationDialog from "../Utility/ConfirmationDialog/ConfirmationDialog";
const Navbar: React.FC = () => {
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [darkMode, setDarkMode] = useState(() => {
    return localStorage.getItem("CODE_SYNC_THEME") !== "light";
  });
  const { setOpenAuthFormType } = useAuth();

  const dispatch = useAppDispatch();
  const location = useLocation();
  // toggle dark mode on root
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("CODE_SYNC_THEME", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("CODE_SYNC_THEME", "light");
    }
  }, [darkMode]);

  const { userData } = useSelector((state: RootState) => state.User);

  useEffect(() => {
    if (!userData) {
      dispatch(fetchUser(""));
    }
  }, [dispatch,userData]);

  useEffect(() => {
    setMenuOpen(false);
  }, [location.pathname]);

  const onLogout = () => {
    localStorage.setItem(process.env.REACT_APP_AUTH_TOKEN as string, "");
    dispatch(setUser(null));
    setShowLogoutConfirm(false);
    setMenuOpen(false);
    navigate("/");
  };
  if (
    ["/room", "/playground"].includes(location.pathname.toLowerCase())
  ) {
    return <></>;
  }
  return (
    <nav className={`navbar ${menuOpen ? "menu-open" : ""}`}>
      <div className="navbar-left" onClick={() => navigate("/")}>
        <span className="logo">Code Sync</span>
      </div>

      <button
        className="navbar-menu-toggle"
        type="button"
        onClick={() => setMenuOpen((open) => !open)}
        aria-label={menuOpen ? "Close menu" : "Open menu"}
        aria-expanded={menuOpen}
      >
        {menuOpen ? <X size={18} /> : <Menu size={18} />}
      </button>

      <div className="navbar-right">
        {userData ? (
          <>
            <button
              className="auth-btn "
              onClick={() => navigate("/dashboard")}
              title="Join or Create Room"
            >
              Join | Create Rooms
            </button>
            {/* // User is logged in: show avatar + name */}
            <button
              className="user-profile auth-btn"
              title="Profile"
              onClick={() => navigate("/profile")}
            >
              {userData?.avatar?.secure_url ? (
                <img
                  src={userData?.avatar?.secure_url}
                  alt="User Avatar"
                  className="user-avatar"
                />
              ) : (
                <div className="user-avatar user-avatar-initials">
                  {getInitials(userData.name)}
                </div>
              )}
              <span className="user-name">Hi, {userData?.name}</span>
            </button>
            <button
              className="auth-btn "
              onClick={() => setShowLogoutConfirm(true)}
              title="Logout"
            >
              Logout
            </button>
          </>
        ) : (
          // User not logged in: show auth buttons
          <>
            <button
              className="auth-btn"
              onClick={() => setOpenAuthFormType("LOGIN")}
            >
              Sign In
            </button>
            <button
              className="auth-btn primary"
              onClick={() => setOpenAuthFormType("REGISTER")}
            >
              Get Started
            </button>
          </>
        )}

        {/* Dark Mode Toggle */}
        <button
          className="mode-toggle"
          onClick={() => setDarkMode(!darkMode)}
          aria-label="Toggle Dark Mode"
        >
          {darkMode ? (
            <i className="bi bi-sun-fill" title="Switch to light mode"></i>
          ) : (
            <i className="bi bi-moon-stars-fill" title="Switch to dark mode"></i>
          )}
        </button>
      </div>

      <ConfirmationDialog
        open={showLogoutConfirm}
        title="Logout?"
        message="You will be returned to the home page."
        confirmLabel="Logout"
        cancelLabel="Cancel"
        onConfirm={onLogout}
        onCancel={() => setShowLogoutConfirm(false)}
      />
    </nav>
  );
};

export default Navbar;
