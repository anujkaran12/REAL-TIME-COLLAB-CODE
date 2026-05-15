import React, { useCallback, useEffect, useState } from "react";
import axios from "axios";
import { ArrowLeft, Camera, RefreshCcw, Save, Trash2, User } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { RootState } from "../../redux/store";
import { setUser } from "../../redux/userSlice";
import { useAppDispatch } from "../../hooks";
import { usePopup } from "../../context/popupContext";
import Loading from "../../components/Utility/Loading/Loading";
import NotLoggedIn from "../../components/Utility/NotLoggedIn/NotLoggedIn";
import ButtonLoader from "../../components/Utility/ButtonLoader/ButtonLoader";
import "./Profile.css";

const AVATAR_MAX_UPLOAD_SIZE = 10 * 1024 * 1024;

type ProfileUser = {
  _id: string;
  name: string;
  email: string;
  avatar?: {
    secure_url?: string;
    public_id?: string;
  };
};

const Profile: React.FC = () => {
  const { userData, loading: userLoading } = useSelector(
    (state: RootState) => state.User
  );
  const [profile, setProfile] = useState<ProfileUser | null>(null);
  const [name, setName] = useState("");
  const [avatarPreview, setAvatarPreview] = useState("");
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [localAvatarPreview, setLocalAvatarPreview] = useState("");
  const [removeAvatar, setRemoveAvatar] = useState(false);
  const [pageLoading, setPageLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const { showPopup } = usePopup();
  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  const fetchProfile = useCallback(async () => {
    const token = localStorage.getItem(process.env.REACT_APP_AUTH_TOKEN as string);

    if (!token) {
      return;
    }

    try {
      setPageLoading(true);
      const response = await axios.get(
        `${process.env.REACT_APP_BACKEND_URL}/api/profile`,
        {
          headers: {
            Authorization: token,
          },
        }
      );
      const fetchedUser = response.data.user;
      setProfile(fetchedUser);
      setName(fetchedUser.name || "");
      setAvatarPreview(fetchedUser.avatar?.secure_url || "");
      setLocalAvatarPreview("");
      setRemoveAvatar(false);
      setAvatarFile(null);
    } catch (error: any) {
      showPopup(
        error.response?.data?.msg || "Unable to load profile",
        error.response?.data?.type || "ERROR"
      );
    } finally {
      setPageLoading(false);
    }
  }, [showPopup]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  useEffect(() => {
    return () => {
      if (localAvatarPreview) {
        URL.revokeObjectURL(localAvatarPreview);
      }
    };
  }, [localAvatarPreview]);

  const handleAvatarChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
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

    const previewUrl = URL.createObjectURL(file);
    setLocalAvatarPreview((previousPreview) => {
      if (previousPreview) {
        URL.revokeObjectURL(previousPreview);
      }

      return previewUrl;
    });
    setAvatarPreview(previewUrl);
    setAvatarFile(file);
    setRemoveAvatar(false);
  };

  const handleRemoveAvatar = () => {
    if (localAvatarPreview) {
      URL.revokeObjectURL(localAvatarPreview);
      setLocalAvatarPreview("");
    }

    setAvatarPreview("");
    setAvatarFile(null);
    setRemoveAvatar(true);
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!name.trim()) {
      showPopup("Name is required", "WARNING");
      return;
    }

    const token = localStorage.getItem(process.env.REACT_APP_AUTH_TOKEN as string);
    if (!token) {
      showPopup("Please login again", "ERROR");
      return;
    }

    const payload = new FormData();
    payload.append("name", name.trim());

    if (removeAvatar) {
      payload.append("removeAvatar", "true");
    }

    if (avatarFile) {
      payload.append("avatar", avatarFile);
    }

    try {
      setSaving(true);
      const response = await axios.put(
        `${process.env.REACT_APP_BACKEND_URL}/api/profile`,
        payload,
        {
          headers: {
            Authorization: token,
          },
        }
      );

      setProfile(response.data.user);
      setName(response.data.user.name || "");
      setAvatarPreview(response.data.user.avatar?.secure_url || "");
      if (localAvatarPreview) {
        URL.revokeObjectURL(localAvatarPreview);
        setLocalAvatarPreview("");
      }
      setAvatarFile(null);
      setRemoveAvatar(false);
      dispatch(setUser(response.data.user));
      showPopup(response.data.msg, response.data.type);
    } catch (error: any) {
      showPopup(
        error.response?.data?.msg || "Unable to update profile",
        error.response?.data?.type || "ERROR"
      );
    } finally {
      setSaving(false);
    }
  };

  if (userLoading || pageLoading) {
    return <Loading />;
  }

  if (!userData) {
    return <NotLoggedIn />;
  }

  return (
    <main className="profile-page">
      <section className="profile-shell">
        <button className="profile-back" onClick={() => navigate("/dashboard")}>
          <ArrowLeft size={16} /> Dashboard
        </button>

        <div className="profile-header">
          <p className="profile-kicker">Profile</p>
          <h1>Your account</h1>
          <p>Update how your name and avatar appear in rooms.</p>
        </div>

        <form className="profile-card" onSubmit={handleSubmit}>
          <div className="profile-avatar-block">
            <label className="profile-avatar-picker">
              <span className="profile-avatar-frame">
                {avatarPreview ? (
                  <img src={avatarPreview} alt={name || "Profile preview"} />
                ) : (
                  <span>
                    <User size={38} />
                  </span>
                )}
              </span>
              <input
                type="file"
                accept="image/*"
                onChange={handleAvatarChange}
                disabled={saving}
              />
              <span className="profile-avatar-action">
                {avatarPreview ? <RefreshCcw size={16} /> : <Camera size={16} />}
              </span>
            </label>
            <button
              type="button"
              className="profile-remove-avatar"
              onClick={handleRemoveAvatar}
              disabled={saving || (!avatarPreview && !profile?.avatar?.secure_url)}
            >
              <Trash2 size={16} />
              Remove photo
            </button>
          </div>

          <div className="profile-fields">
            <label>
              <span>Name</span>
              <input
                value={name}
                onChange={(event) => setName(event.target.value)}
                disabled={saving}
                maxLength={60}
              />
            </label>

            <label>
              <span>Email</span>
              <input value={profile?.email || ""} disabled />
            </label>

            <button className="profile-save" type="submit" disabled={saving}>
              {saving ? (
                <ButtonLoader />
              ) : (
                <>
                  <Save size={16} />
                  Save changes
                </>
              )}
            </button>
          </div>
        </form>
      </section>
    </main>
  );
};

export default Profile;
