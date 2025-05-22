import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyDxVwt-j8tSjvpV8PdDw2xIN5T9m6e83Yg",
  authDomain: "optivue-28af2.firebaseapp.com",
  projectId: "optivue-28af2",
  storageBucket: "optivue-28af2.firebasestorage.app",
  messagingSenderId: "161770521957",
  appId: "1:161770521957:web:4ae0c2bc6ad3e46a9d8d8c",
  measurementId: "G-RNXGZLZQ7K"
};
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const provider = new GoogleAuthProvider();

export { auth, provider };