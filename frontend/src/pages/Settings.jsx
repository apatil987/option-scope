import React, { useState } from "react";
import { auth } from "../firebase";
import { onAuthStateChanged } from "firebase/auth";

function Settings() {
  const [preferredView, setPreferredView] = useState("table");
  const [accountType, setAccountType] = useState("free");
  const [message, setMessage] = useState("");
  const [firebaseUid, setFirebaseUid] = useState("");

  // Grab UID on load
  React.useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setFirebaseUid(user.uid);
      }
    });
    return () => unsubscribe();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const res = await fetch("http://127.0.0.1:8000/update_user/", {
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
