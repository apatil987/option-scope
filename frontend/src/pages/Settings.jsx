import React, { useState, useEffect } from "react";
import { auth } from "../firebase";
import { onAuthStateChanged } from "firebase/auth";

function Settings({ sidebarRef }) {
  const [preferredView, setPreferredView] = useState("table");
  const [accountType, setAccountType] = useState("free");
  const [message, setMessage] = useState("");
  const [firebaseUid, setFirebaseUid] = useState("");

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setFirebaseUid(user.uid);
        fetch(`${process.env.REACT_APP_API_URL}/user_profile/${user.uid}`)
          .then((res) => res.json())
          .then((data) => {
            if (data.preferred_view) setPreferredView(data.preferred_view);
            if (data.account_type) setAccountType(data.account_type);
          })
          .catch(console.error);
      }
    });
    return () => unsubscribe();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const res = await fetch("${process.env.REACT_APP_API_URL}/update_user/", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          firebase_uid: firebaseUid,
          preferred_view: preferredView,
          account_type: accountType,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setMessage("Settings saved ✅");
        if (sidebarRef && sidebarRef.current && sidebarRef.current.fetchProfile) {
          sidebarRef.current.fetchProfile(firebaseUid);
        }
      } else {
        setMessage(`Error: ${data.detail}`);
      }
    } catch (err) {
      console.error("Error updating settings:", err);
      setMessage("Something went wrong.");
    }
  };

  return (
    <div style={{ padding: "20px" }}>
      <h2>Account Settings</h2>
      <form onSubmit={handleSubmit}>
        <label>
          Preferred View:
          <select
            value={preferredView}
            onChange={(e) => setPreferredView(e.target.value)}
            style={{ marginLeft: "10px" }}
          >
            <option value="table">Table</option>
            <option value="graph">Graph</option>
            <option value="compact">Compact</option>
          </select>
        </label>
        <br /><br />
        <label>
          Account Type:
          <select
            value={accountType}
            onChange={(e) => setAccountType(e.target.value)}
            style={{ marginLeft: "10px" }}
          >
            <option value="free">Free</option>
            <option value="pro">Pro</option>
          </select>
        </label>
        <br /><br />
        <button type="submit">Save Settings</button>
      </form>
      {message && <p style={{ marginTop: "10px", color: "green" }}>{message}</p>}
    </div>
  );
}

export default Settings;
