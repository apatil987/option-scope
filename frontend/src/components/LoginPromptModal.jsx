import React from 'react';
import { signInWithPopup, GoogleAuthProvider } from 'firebase/auth';
import { auth } from '../firebase';
import styles from './LoginPromptModal.module.css';

const LoginPromptModal = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  const handleLogin = async () => {
    try {
      await signInWithPopup(auth, new GoogleAuthProvider());
      onClose();
    } catch (error) {
      console.error('Login error:', error);
    }
  };

  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modalContent}>
        <div className={styles.modalHeader}>
          <h2>🔒 Login Required</h2>
        </div>
        <div className={styles.modalBody}>
          <p>Please login to add items to your watchlist.</p>
          <button className={styles.loginButton} onClick={handleLogin}>
            <i className="fab fa-google"></i> Continue with Google
          </button>
          <p className={styles.cancelText} onClick={onClose}>
            Cancel
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginPromptModal;
