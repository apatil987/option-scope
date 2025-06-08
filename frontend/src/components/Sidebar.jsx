import React, { useState, useEffect, useImperativeHandle, forwardRef } from 'react';
import { auth, provider } from '../firebase';
import { signInWithPopup, signOut, onAuthStateChanged } from 'firebase/auth';
import { useNavigate } from 'react-router-dom';
import SidebarUI from '../UI/SidebarUI';

const Sidebar = forwardRef((props, ref) => {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [isExpanded, setIsExpanded] = useState(false); // Track hover state
  const navigate = useNavigate();

  useImperativeHandle(ref, () => ({
    fetchProfile: (uid) => {
      const fetchUid = uid || user?.uid;
      if (fetchUid) {
        fetch(`${process.env.REACT_APP_API_URL}/user_profile/${fetchUid}`)
          .then((res) => res.json())
          .then(setProfile)
          .catch(console.error);
      }
    }
  }));

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        setUser(currentUser);

        // Register user in backend if not already registered
        try {
          await fetch("${process.env.REACT_APP_API_URL}/register_user/", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              firebase_uid: currentUser.uid,
              email: currentUser.email,
              name: currentUser.displayName,
            }),
          });
        } catch (err) {
          console.error("Registration error:", err);
        }

        // Fetch user profile from backend
        try {
          const res = await fetch(`${process.env.REACT_APP_API_URL}/user_profile/${currentUser.uid}`);
          const data = await res.json();
          setProfile(data);
        } catch (err) {
          console.error("Profile fetch error:", err);
        }
      } else {
        setUser(null);
        setProfile(null);
      }
    });

    return () => unsubscribe();
  }, []);

  const handleLogin = async () => {
    try {
      const result = await signInWithPopup(auth, provider);
      // Update last_login in backend
      await fetch("${process.env.REACT_APP_API_URL}/update_last_login/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ firebase_uid: result.user.uid }),
      });
    } catch (err) {
      console.error("Login error:", err);
    }
  };

  const handleLogout = () => {
    signOut(auth).then(() => {
      navigate("/");
    });
  };

  const handleMouseEnter = () => setIsExpanded(true);
  const handleMouseLeave = () => setIsExpanded(false);

  return (
    <div
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      style={{ width: isExpanded ? '250px' : '80px', transition: 'width 0.3s ease' }}
    >
      <SidebarUI
        user={user}
        profile={profile}
        handleLogin={handleLogin}
        handleLogout={handleLogout}
        isExpanded={isExpanded}
        navigate={navigate}
      />
    </div>
  );
});

export default Sidebar;
