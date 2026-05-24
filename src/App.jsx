import { useEffect, useState } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Navbar from "./components/Navbar";
import Home from "./components/Home";
import Robots from "./components/Robots";
import RobotDetail from "./components/RobotDetail";
import Auth from "./components/Auth";

import Admin from "./components/Admin";
import Blog from "./components/Blog";
import BlogDetail from "./components/BlogDetail";
import CMS from "./components/CMS";
import Privacy from "./components/Privacy";
import Terms from "./components/Terms";
import About from "./components/About";
import Team from "./components/Team";
import TeamMentor from "./components/TeamMentor";
import TeamGroup from "./components/TeamGroup";
import Sponsors from "./components/Sponsors";
import Contact from "./components/Contact";
import { Link } from "react-router-dom";
import { db } from "./firebase";
import { doc, collection, onSnapshot } from "firebase/firestore";

export default function App() {
  const [socials, setSocials] = useState({});
  const [divisions, setDivisions] = useState([]);

  useEffect(() => {
    const docRef = doc(db, "settings", "socials");
    const unsubSocials = onSnapshot(docRef, (docSnap) => {
      if (docSnap.exists()) {
        setSocials(docSnap.data());
      } else {
        setSocials({});
      }
    }, (err) => {
      console.warn("Firestore social settings read warning (likely unauthenticated): ", err);
    });

    const unsubDivisions = onSnapshot(collection(db, "divisions"), (snap) => {
      const list = [];
      snap.forEach(d => list.push({ id: d.id, ...d.data() }));
      list.sort((a, b) => (a.order || 0) - (b.order || 0));
      setDivisions(list);
    }, (err) => {
      console.warn("Firestore divisions read warning: ", err);
    });

    return () => { unsubSocials(); unsubDivisions(); };
  }, []);

  return (
    <BrowserRouter>
      {/* Top safety colored strip */}
      <div className="top-strip"></div>
      
      {/* Universal navigation */}
      <Navbar divisions={divisions} />
      
      {/* Dynamic Floating Social Media Sidebar (Team 254 style) */}
      <div className="floating-socials">
        {socials.instagram && (
          <a href={socials.instagram} target="_blank" rel="noopener noreferrer" className="floating-social-btn" title="Instagram">
            <svg viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.051.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 1 0 0 12.324 6.162 6.162 0 0 0 0-12.324zM12 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm6.406-11.845a1.44 1.44 0 1 0 0 2.881 1.44 1.44 0 0 0 0-2.881z"/></svg>
          </a>
        )}
        {socials.facebook && (
          <a href={socials.facebook} target="_blank" rel="noopener noreferrer" className="floating-social-btn" title="Facebook">
            <svg viewBox="0 0 24 24"><path d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z"/></svg>
          </a>
        )}
        {socials.youtube && (
          <a href={socials.youtube} target="_blank" rel="noopener noreferrer" className="floating-social-btn" title="YouTube">
            <svg viewBox="0 0 24 24"><path d="M23.498 6.163a3.003 3.003 0 0 0-2.11-2.11C19.518 3.5 12 3.5 12 3.5s-7.518 0-9.388.553a3.003 3.003 0 0 0-2.11 2.11C0 8.033 0 12 0 12s0 3.967.502 5.837a3.003 3.003 0 0 0 2.11 2.11C4.482 20.5 12 20.5 12 20.5s7.518 0 9.388-.553a3.003 3.003 0 0 0 2.11-2.11C24 15.967 24 12 24 12s0-3.967-.502-5.837zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>
          </a>
        )}
        {socials.github && (
          <a href={socials.github} target="_blank" rel="noopener noreferrer" className="floating-social-btn" title="GitHub">
            <svg viewBox="0 0 24 24"><path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12"/></svg>
          </a>
        )}
        {socials.twitter && (
          <a href={socials.twitter} target="_blank" rel="noopener noreferrer" className="floating-social-btn" title="Twitter / X">
            <svg viewBox="0 0 24 24"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
          </a>
        )}
        {socials.tba && (
          <a href={socials.tba} target="_blank" rel="noopener noreferrer" className="floating-social-btn" title="The Blue Alliance"
            style={{ fontSize: "9px", fontWeight: 900, letterSpacing: "0.5px" }}>
            TBA
          </a>
        )}
        {socials.first && (
          <a href={socials.first} target="_blank" rel="noopener noreferrer" className="floating-social-btn" title="FIRST Inspires"
            style={{ fontSize: "8px", fontWeight: 900, letterSpacing: "0.5px" }}>
            FIRST
          </a>
        )}
      </div>

      {/* Pages switcher */}
      <div style={{ flex: 1 }}>
        <Routes>
          <Route path="/" element={<Home />} />

          <Route path="/robot" element={<Robots />} />
          <Route path="/robot/:year" element={<RobotDetail />} />

          <Route path="/login" element={<Auth />} />
          <Route path="/blog" element={<Blog />} />
          <Route path="/blog/:postId" element={<BlogDetail />} />
          <Route path="/admin" element={<Admin />} />
          <Route path="/cms" element={<CMS />} />
          <Route path="/about" element={<Navigate to="/team" replace />} />
          <Route path="/team" element={<Team />} />
          <Route path="/team/mentor" element={<TeamMentor />} />
          <Route path="/team/:groupId" element={<TeamGroup />} />
          <Route path="/sponsors" element={<Sponsors />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/privacy" element={<Privacy />} />
          <Route path="/terms" element={<Terms />} />

          {/* Catch-all redirects back to home */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>

      {/* Universal Footer */}
      <footer>
        <div className="container footer-flex">
          <div className="logo" style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <img src="/logo.png" alt="FRC 7645 Logo" style={{ height: "28px", width: "28px", borderRadius: "50%", objectFit: "cover", opacity: 0.8 }} />
            <span>FRC</span> 7645
          </div>

          <p>&copy; {new Date().getFullYear()} FRC Team 7645. All Rights Reserved. Aligned with engineering & craftsmanship.</p>

          <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "12px" }}>
            {/* Inline Footer Socials */}
            <div className="footer-socials" style={{ display: "flex", gap: "16px" }}>
              {socials.instagram && (
                <a href={socials.instagram} target="_blank" rel="noopener noreferrer" style={{ color: "#888888" }} title="Instagram">
                  <svg style={{ width: "18px", height: "18px", fill: "currentColor" }} viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.051.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 1 0 0 12.324 6.162 6.162 0 0 0 0-12.324zM12 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm6.406-11.845a1.44 1.44 0 1 0 0 2.881 1.44 1.44 0 0 0 0-2.881z"/></svg>
                </a>
              )}
              {socials.facebook && (
                <a href={socials.facebook} target="_blank" rel="noopener noreferrer" style={{ color: "#888888" }} title="Facebook">
                  <svg style={{ width: "18px", height: "18px", fill: "currentColor" }} viewBox="0 0 24 24"><path d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z"/></svg>
                </a>
              )}
              {socials.youtube && (
                <a href={socials.youtube} target="_blank" rel="noopener noreferrer" style={{ color: "#888888" }} title="YouTube">
                  <svg style={{ width: "18px", height: "18px", fill: "currentColor" }} viewBox="0 0 24 24"><path d="M23.498 6.163a3.003 3.003 0 0 0-2.11-2.11C19.518 3.5 12 3.5 12 3.5s-7.518 0-9.388.553a3.003 3.003 0 0 0-2.11 2.11C0 8.033 0 12 0 12s0 3.967.502 5.837a3.003 3.003 0 0 0 2.11 2.11C4.482 20.5 12 20.5 12 20.5s7.518 0 9.388-.553a3.003 3.003 0 0 0 2.11-2.11C24 15.967 24 12 24 12s0-3.967-.502-5.837zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>
                </a>
              )}
              {socials.github && (
                <a href={socials.github} target="_blank" rel="noopener noreferrer" style={{ color: "#888888" }} title="GitHub">
                  <svg style={{ width: "18px", height: "18px", fill: "currentColor" }} viewBox="0 0 24 24"><path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12"/></svg>
                </a>
              )}
              {socials.twitter && (
                <a href={socials.twitter} target="_blank" rel="noopener noreferrer" style={{ color: "#888888" }} title="Twitter / X">
                  <svg style={{ width: "18px", height: "18px", fill: "currentColor" }} viewBox="0 0 24 24"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
                </a>
              )}
            </div>

            <div style={{ display: "flex", gap: "20px", fontSize: "12px" }}>
              <Link to="/privacy" style={{ color: "#888888", textDecoration: "none" }}>隱私權政策</Link>
              <Link to="/terms" style={{ color: "#888888", textDecoration: "none" }}>服務條款</Link>
            </div>
          </div>
        </div>
      </footer>
    </BrowserRouter>
  );
}
