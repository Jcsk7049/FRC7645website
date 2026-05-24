import React, { useState } from "react";
import { auth, db, googleProvider } from "../firebase";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup
} from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";

export default function Auth() {
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { t } = useTranslation();

  const setupUserDocument = async (user, defaultName) => {
    const userRef = doc(db, "users", user.uid);
    const docSnap = await getDoc(userRef);
    if (!docSnap.exists()) {
      await setDoc(userRef, {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName || defaultName || "New Member",
        role: "pending",
        createdAt: new Date().toISOString()
      });
    }
  };

  const handleEmailAuth = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      if (isRegister) {
        const credentials = await createUserWithEmailAndPassword(auth, email, password);
        await setupUserDocument(credentials.user, name);
      } else {
        await signInWithEmailAndPassword(auth, email, password);
      }
      navigate("/");
    } catch (err) {
      console.error(err);
      if (err.code === "auth/email-already-in-use") {
        setError(t("auth.errEmailTaken"));
      } else if (err.code === "auth/weak-password") {
        setError(t("auth.errWeakPassword"));
      } else if (err.code === "auth/invalid-credential" || err.code === "auth/user-not-found" || err.code === "auth/wrong-password") {
        setError(t("auth.errWrongCredential"));
      } else {
        setError(t("auth.errGeneral"));
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleAuth = async () => {
    setError("");
    setLoading(true);
    try {
      const credentials = await signInWithPopup(auth, googleProvider);
      await setupUserDocument(credentials.user, credentials.user.displayName);
      navigate("/");
    } catch (err) {
      console.error(err);
      setError(t("auth.errGoogleBlocked"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="container" id="auth-page">
      <div className="auth-page-container">

        <div className="auth-tabs">
          <div
            className={`auth-tab ${!isRegister ? "active" : ""}`}
            onClick={() => { setIsRegister(false); setError(""); }}
            id="tab-login"
          >
            {t("auth.tabLogin")}
          </div>
          <div
            className={`auth-tab ${isRegister ? "active" : ""}`}
            onClick={() => { setIsRegister(true); setError(""); }}
            id="tab-register"
          >
            {t("auth.tabRegister")}
          </div>
        </div>

        {error && <div className="auth-error" id="auth-error-msg">{error}</div>}

        <form onSubmit={handleEmailAuth}>
          {isRegister && (
            <div className="form-group">
              <label htmlFor="reg-name">{t("auth.nameLabel")}</label>
              <input
                type="text"
                id="reg-name"
                placeholder={t("auth.namePlaceholder")}
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
          )}

          <div className="form-group">
            <label htmlFor="auth-email">{t("auth.emailLabel")}</label>
            <input
              type="email"
              id="auth-email"
              placeholder="example@mail.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="auth-password">{t("auth.passwordLabel")}</label>
            <input
              type="password"
              id="auth-password"
              placeholder={t("auth.passwordPlaceholder")}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn btn-secondary"
            id="btn-auth-submit"
            style={{ width: "100%", padding: "12px", marginTop: "10px" }}
          >
            {loading ? t("auth.loading") : (isRegister ? t("auth.submitRegister") : t("auth.submitLogin"))}
          </button>
        </form>

        <div className="divider">{t("auth.divider")}</div>

        <button
          onClick={handleGoogleAuth}
          disabled={loading}
          className="btn-google"
          id="btn-google-login"
        >
          <img src="https://upload.wikimedia.org/wikipedia/commons/c/c1/Google_%22G%22_logo.svg" alt="Google Logo" />
          {t("auth.googleLogin")}
        </button>

      </div>
    </main>
  );
}
