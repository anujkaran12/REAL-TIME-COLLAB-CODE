import React, { useState } from "react";
import "./Auth.css";
import { useAuth } from "../../context/authContext";

import { usePopup } from "../../context/popupContext";
import axios from "axios";
import ButtonLoader from "../Utility/ButtonLoader/ButtonLoader";


const RegisterForm: React.FC = () => {
  const { setOpenAuthFormType } = useAuth();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    gender: "",
  });
  const [passwordType, setPasswordType] = useState("password");

  
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  const { showPopup } = usePopup();
  const passwordToggle = () => {
    if (passwordType === "text") {
      setPasswordType("password");
    } else {
      setPasswordType("text");
    }
  };
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const validate = () => {
    const newErrors: { [key: string]: string } = {};
    if (!formData.name.trim()) newErrors.name = "Name is required";
    if (!formData.email) newErrors.email = "Email is required";
    if (!formData.password) newErrors.password = "Password is required";
    else if (formData.password.length < 6)
      newErrors.password = "Password must be at least 6 characters";
    if (formData.confirmPassword !== formData.password)
      newErrors.confirmPassword = "Passwords do not match";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) {
      return;
    }

    setLoading(true);
   try {
      const res = await axios.post(
        `${process.env.REACT_APP_BACKEND_URL}/api/auth/register`,
        formData
      );

      showPopup(res.data.msg, res.data.type);

      setFormData({
        name: "",
        email: "",
        password: "",
        confirmPassword: "",
        gender: "",
      });
      
      setOpenAuthFormType("LOGIN");
    } catch (error: any) {
      showPopup(
        error.response?.data.msg || "Network error",
        error.response?.data.type || "ERROR"
      );
    }
    setLoading(false);
  };



  return (
  
        <div
          className="auth-form-container"
          onClick={(e) => e.stopPropagation()}
        >
          <h2 className="auth-form-title">Create An Account</h2>

          <form className="auth-form" onSubmit={handleSubmit}>
            <div className="auth-form-group">
              <input
                className="auth-form-input"
                type="text"
                name="name"
                placeholder="Name"
                value={formData.name}
                onChange={handleChange}
                required
                disabled={loading}
                autoComplete={"name"}
              />
              {errors.name && (
                <p className="auth-form-helper auth-form-error">
                  {errors.name}
                </p>
              )}
            </div>

            <div className="auth-form-group">
              <input
                className="auth-form-input"
                type="email"
                name="email"
                placeholder="Email"
                value={formData.email}
                onChange={handleChange}
                required
                disabled={loading}
                autoComplete={"email"}
              />
              {errors.email && (
                <p className="auth-form-helper auth-form-error">
                  {errors.email}
                </p>
              )}
            </div>

            <div className="auth-form-group">
              <input
                className="auth-form-input"
                type={passwordType}
                name="password"
                placeholder="Password"
                value={formData.password}
                onChange={handleChange}
                required
                disabled={loading}
                autoComplete={"current-password"}
              />
              <p className="auth-form-helper">Minimum 6 characters</p>
              {errors.password && (
                <p className="auth-form-helper auth-form-error">
                  {errors.password}
                </p>
              )}
              {passwordType === "password" ? (
                <i className="bi bi-eye" onClick={passwordToggle}></i>
              ) : (
                <i className="bi bi-eye-slash" onClick={passwordToggle}></i>
              )}
            </div>

            <div className="auth-form-group">
              <input
                className="auth-form-input"
                type="password"
                name="confirmPassword"
                placeholder="Confirm Password"
                value={formData.confirmPassword}
                onChange={handleChange}
                required
                disabled={loading}
                autoComplete={"current-password"}
              />
              {errors.confirmPassword && (
                <p className="auth-form-helper auth-form-error">
                  {errors.confirmPassword}
                </p>
              )}
            </div>
            <div className="auth-form-group">
              <div className="custom-select-wrapper">
                <select
                  className="auth-form-input custom-select"
                  name="gender"
                  value={formData.gender}
                  onChange={(e) =>
                    setFormData({ ...formData, gender: e.target.value })
                  }
                  required
                  disabled={loading}
                >
                  <option value="" disabled>
                    Select Gender
                  </option>
                  <option value="male" disabled={loading}>
                    Male
                  </option>
                  <option value="female" disabled={loading}>
                    Female
                  </option>
                  <option value="other" disabled={loading}>
                    Other
                  </option>
                </select>
              </div>
              {errors.gender && (
                <p className="auth-form-helper auth-form-error">
                  {errors.gender}
                </p>
              )}
            </div>

            <button
              type="submit"
              className="form-btn auth-form-button"
              disabled={loading}
            >
              {loading ? <ButtonLoader /> : "Continue"}
            </button>
          </form>

          {/* <button
        className="auth-form-button google-button"
        onClick={handleGoogleSignup}
        disabled={loading}
      >
        Sign up with Google
      </button> */}
          <p className="auth-form-signin-text">
            Already have an account?{" "}
            <span onClick={() => setOpenAuthFormType("LOGIN")}>Sign in</span>
          </p>
          <i
            className="bi bi-x-lg  cancelIcon"
            onClick={() => setOpenAuthFormType(null)}
          ></i>
        </div>
      
  );
};

export default RegisterForm;
