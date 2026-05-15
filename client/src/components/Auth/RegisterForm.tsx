import React, { useState } from "react";
import "./Auth.css";
import { useAuth } from "../../context/authContext";

import { usePopup } from "../../context/popupContext";
import axios from "axios";
import ButtonLoader from "../Utility/ButtonLoader/ButtonLoader";
import { Camera, Eye, EyeOff, User, X } from "lucide-react";

const AVATAR_MAX_SIZE = 512;
const AVATAR_QUALITY = 0.82;
const AVATAR_MAX_UPLOAD_SIZE = 10 * 1024 * 1024;

const fileToCompressedAvatar = (file: File) => {
  return new Promise<{ previewUrl: string; file: File }>((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => {
      const image = new Image();

      image.onload = () => {
        const scale = Math.min(
          AVATAR_MAX_SIZE / image.width,
          AVATAR_MAX_SIZE / image.height,
          1
        );
        const canvas = document.createElement("canvas");
        canvas.width = Math.round(image.width * scale);
        canvas.height = Math.round(image.height * scale);

        const context = canvas.getContext("2d");
        if (!context) {
          reject(new Error("Unable to process image"));
          return;
        }

        context.drawImage(image, 0, 0, canvas.width, canvas.height);
        canvas.toBlob(
          (blob) => {
            if (!blob) {
              reject(new Error("Unable to process image"));
              return;
            }

            resolve({
              previewUrl: canvas.toDataURL("image/jpeg", AVATAR_QUALITY),
              file: new File([blob], "avatar.jpg", { type: "image/jpeg" }),
            });
          },
          "image/jpeg",
          AVATAR_QUALITY
        );
      };

      image.onerror = () => reject(new Error("Unable to read image"));
      image.src = reader.result as string;
    };

    reader.onerror = () => reject(new Error("Unable to read image"));
    reader.readAsDataURL(file);
  });
};

const RegisterForm: React.FC = () => {
  const { setOpenAuthFormType } = useAuth();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [avatar, setAvatar] = useState("");
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
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

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) {
      return;
    }

    if (!file.type.startsWith("image/")) {
      showPopup("Please choose an image file", "WARNING");
      return;
    }

    if (file.size > AVATAR_MAX_UPLOAD_SIZE) {
      showPopup("Profile image must be 10 MB or smaller", "WARNING");
      return;
    }

    try {
      const compressedAvatar = await fileToCompressedAvatar(file);
      setAvatar(compressedAvatar.previewUrl);
      setAvatarFile(compressedAvatar.file);
    } catch (error) {
      showPopup("Unable to process image", "ERROR");
    }
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
      const registerPayload = new FormData();
      registerPayload.append("name", formData.name);
      registerPayload.append("email", formData.email);
      registerPayload.append("password", formData.password);

      if (avatarFile) {
        registerPayload.append("avatar", avatarFile);
      }

      const res = await axios.post(
        `${process.env.REACT_APP_BACKEND_URL}/api/auth/register`,
        registerPayload
      );

      showPopup(res.data.msg, res.data.type);

      setFormData({
        name: "",
        email: "",
        password: "",
        confirmPassword: "",
      });
      setAvatar("");
      setAvatarFile(null);
      
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
            <div className="profile-upload">
              <label className="profile-upload-control">
                {avatar ? (
                  <img src={avatar} alt="Profile preview" />
                ) : (
                  <span>
                    <User size={30} />
                  </span>
                )}
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarChange}
                  disabled={loading}
                />
                <span className="profile-upload-icon">
                  <Camera size={16} />
                </span>
              </label>
            </div>

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
                <button
                  type="button"
                  className="auth-icon-button"
                  onClick={passwordToggle}
                  aria-label="Show password"
                >
                  <Eye size={18} />
                </button>
              ) : (
                <button
                  type="button"
                  className="auth-icon-button"
                  onClick={passwordToggle}
                  aria-label="Hide password"
                >
                  <EyeOff size={18} />
                </button>
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
          <button
            type="button"
            className="cancelIcon"
            onClick={() => setOpenAuthFormType(null)}
            aria-label="Close register form"
          >
            <X size={18} />
          </button>
        </div>
      
  );
};

export default RegisterForm;
