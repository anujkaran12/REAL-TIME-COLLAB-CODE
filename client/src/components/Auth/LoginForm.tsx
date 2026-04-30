import React, { useState } from "react";
import "./Auth.css";
import { useAuth } from "../../context/authContext";


import { useAppDispatch } from "../../hooks";
import { usePopup } from "../../context/popupContext";

import ButtonLoader from "../Utility/ButtonLoader/ButtonLoader";
import axios from "axios";
import { setUser } from "../../redux/userSlice";

const LoginForm: React.FC = () => {
  const { setOpenAuthFormType } = useAuth();
  const dispatch = useAppDispatch();
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const [passwordType, setPasswordType] = useState("password");

  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [loading, setLoading] = useState(false);
 

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
    if (!formData.email) newErrors.email = "Email is required";
    if (!formData.password) newErrors.password = "Password is required";
    else if (formData.password.length < 6)
      newErrors.password = "Password must be at least 6 characters";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // method for login user
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) {
      return;
    }
    setLoading(true)
    try {
      const res = await axios.post(
        `${process.env.REACT_APP_BACKEND_URL}/api/auth/login`,
        { email: formData.email, password: formData.password }
      );

      showPopup(res.data.msg, res.data.type);
      localStorage.setItem(
        process.env.REACT_APP_AUTH_TOKEN as string,
        res.data.token
      );
      dispatch(setUser(res.data.user));
      setOpenAuthFormType(null);
    } catch (error: any) {
      console.log(error);
      showPopup(
        error.response?.data.msg || "Network error",
        error.response?.data.type || "ERROR"
      );
    }
    setLoading(false)
  };



  return (
    <div className="auth-form-container" onClick={(e) => e.stopPropagation()}>
      <h2 className="auth-form-title">Welcome Back</h2>

      <form className="auth-form" onSubmit={handleSubmit}>
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
            <p className="auth-form-helper auth-form-error">{errors.email}</p>
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

        <button
          type="submit"
          className="auth-form-button form-btn"
          disabled={loading}
        >
          {loading ? <ButtonLoader /> : "Continue"}
        </button>
      </form>

      {/* <button
        className="auth-form-button google-button"
        onClick={handleGoogleLogin}
        disabled={loading}
      >
        
        Sign in with Google
      </button> */}

      <p className="auth-form-signin-text">
        Don’t have an account?{" "}
        <span onClick={() => setOpenAuthFormType("REGISTER")}>Create one</span>
      </p>
      <i
        className="bi bi-x-lg cancelIcon"
        onClick={() => setOpenAuthFormType(null)}
      ></i>
    </div>
  );
};

export default LoginForm;
