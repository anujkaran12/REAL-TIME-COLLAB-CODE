import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import "./Navbar.css";
import { useAuth } from "../../context/authContext";
import { useSelector } from "react-redux";
import { RootState } from "../../redux/store";
import { useAppDispatch } from "../../hooks";
import { fetchUser } from "../../redux/userSlice";
import ReactAvatar from "react-avatar";
const Navbar: React.FC = () => {
  const navigate = useNavigate();
  const [darkMode, setDarkMode] = useState(true);
  const { setOpenAuthFormType } = useAuth();

  const dispatch = useAppDispatch();
  const location = useLocation();
  // toggle dark mode on root
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [darkMode]);

  const { userData } = useSelector((state: RootState) => state.User);

  useEffect(() => {
    if (!userData) {
      dispatch(fetchUser(""));
    }
  }, [dispatch,userData]);
  const onLogout = () => {
    localStorage.setItem(process.env.REACT_APP_AUTH_TOKEN as string, "");
    dispatch(fetchUser(""));
  };
  if (
    ["/room", "/playground"].includes(location.pathname.toLowerCase())
  ) {
    return <></>;
  }
  return (
    <nav className="navbar">
      <div className="navbar-left" onClick={() => navigate("/")}>
        <span className="logo">Code Sync</span>
      </div>

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
            <div className="user-profile auth-btn" title="profile">
              {userData?.avatar?.secure_url ? (
                <img
                  src={userData?.avatar?.secure_url}
                  alt="User Avatar"
                  className="user-avatar"
                />
              ) : (
                <div className="user-avatar">
                  <ReactAvatar name={userData.name} size="100%" round={true} />
                </div>
              )}
              <span className="user-name">Hi, {userData?.name}</span>
            </div>
            <button
              className="auth-btn "
              onClick={() => onLogout()}
              title="Join or Create Room"
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
            <i className="bi bi-moon-stars-fill" title="dark mode"></i>
          ) : (
            <i className="bi bi-sun-fill" title="ligth mdoe"></i>
          )}
        </button>
      </div>
    </nav>
  );
};

export default Navbar;
