import { useEffect, useState } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { auth, db } from "../firebase";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { doc, onSnapshot } from "firebase/firestore";
import { useTranslation } from "react-i18next";
import i18n from "../i18n";

export default function Navbar({ divisions = [] }) {
  const [user, setUser] = useState(null);
  const [role, setRole] = useState("visitor");
  const [showDropdown, setShowDropdown] = useState(false);
  const [showTeamDropdown, setShowTeamDropdown] = useState(false);
  const [teamMobileExpanded, setTeamMobileExpanded] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [lang, setLang] = useState(i18n.language || "zh");
  const navigate = useNavigate();
  const { t } = useTranslation();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        const userDocRef = doc(db, "users", currentUser.uid);
        const unsubDoc = onSnapshot(userDocRef, (docSnap) => {
          if (docSnap.exists()) {
            setRole(docSnap.data().role || "visitor");
          } else {
            setRole("visitor");
          }
        });
        return () => unsubDoc();
      } else {
        setRole("visitor");
      }
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const handleOutsideClick = (event) => {
      if (showDropdown && !event.target.closest(".nav-dropdown")) {
        setShowDropdown(false);
      }
      if (showTeamDropdown && !event.target.closest(".nav-team-dropdown")) {
        setShowTeamDropdown(false);
      }
    };
    document.addEventListener("click", handleOutsideClick);
    return () => document.removeEventListener("click", handleOutsideClick);
  }, [showDropdown, showTeamDropdown]);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate("/");
    } catch (error) {
      console.error("Logout failed: ", error);
    }
  };

  const toggleLang = () => {
    const next = lang === "zh" ? "en" : "zh";
    i18n.changeLanguage(next);
    localStorage.setItem("lang", next);
    setLang(next);
  };

  return (
    <header className="navbar">
      <div className="container nav-flex">
        {/* Left Brand Logo */}
        <Link to="/" className="logo" id="nav-logo" onClick={() => setIsMobileMenuOpen(false)} style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <img src="/logo.png" alt="FRC 7645 Logo" style={{ height: "30px", width: "30px", borderRadius: "50%", objectFit: "cover", border: "1px solid rgba(0, 0, 0, 0.06)" }} />
          <span>FRC</span> 7645
        </Link>

        {/* Hamburger Menu Button */}
        <button
          className={`hamburger-btn ${isMobileMenuOpen ? "active" : ""}`}
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          aria-label="Toggle menu"
          id="btn-hamburger"
        >
          <span className="bar"></span>
          <span className="bar"></span>
          <span className="bar"></span>
        </button>

        {/* Main Public Nav Links & Portal */}
        <nav className={`nav-menu ${isMobileMenuOpen ? "active" : ""}`}>
          <NavLink to="/" className={({ isActive }) => isActive ? "active" : ""} end id="nav-home" onClick={() => setIsMobileMenuOpen(false)}>
            {t("nav.home")}
          </NavLink>

          {/* Team dropdown */}
          <div className="nav-team-dropdown" style={{ position: "relative" }}>
            {/* Desktop trigger */}
            <button
              onClick={() => setShowTeamDropdown(!showTeamDropdown)}
              style={{
                background: "none", border: "none", cursor: "pointer", padding: "0",
                fontSize: "14px", fontFamily: "inherit", fontWeight: 600,
                color: showTeamDropdown ? "var(--accent)" : "var(--text-muted)",
                display: "flex", alignItems: "center", gap: "4px"
              }}
              className="nav-team-dropdown-trigger desktop-only"
            >
              {t("nav.team")}
              <span style={{ fontSize: "9px", opacity: 0.7, transition: "transform 0.2s", display: "inline-block", transform: showTeamDropdown ? "rotate(180deg)" : "none" }}>▼</span>
            </button>

            {/* Mobile trigger — expand inline */}
            <button
              onClick={() => setTeamMobileExpanded(!teamMobileExpanded)}
              style={{
                background: "none", border: "none", cursor: "pointer", padding: "0",
                fontSize: "15px", fontFamily: "inherit", fontWeight: 600,
                color: "var(--text-main)",
                display: "flex", alignItems: "center", gap: "4px",
                width: "100%", justifyContent: "space-between"
              }}
              className="nav-team-dropdown-trigger mobile-only"
            >
              {t("nav.team")}
              <span style={{ fontSize: "9px", opacity: 0.7, transition: "transform 0.2s", display: "inline-block", transform: teamMobileExpanded ? "rotate(180deg)" : "none" }}>▼</span>
            </button>

            {/* Mobile sub-items */}
            {teamMobileExpanded && (
              <div className="mobile-only" style={{ paddingLeft: "12px", display: "flex", flexDirection: "column", gap: "8px", marginTop: "8px" }}>
                <NavLink to="/team" end className={({ isActive }) => isActive ? "active" : ""} onClick={() => setIsMobileMenuOpen(false)} style={{ fontSize: "13px" }}>
                  {t("nav.teamOverview")}
                </NavLink>
                <NavLink to="/team/mentor" className={({ isActive }) => isActive ? "active" : ""} onClick={() => setIsMobileMenuOpen(false)} style={{ fontSize: "13px" }}>
                  {t("nav.teamMentor")}
                </NavLink>
                {divisions.length > 0 && (
                  <>
                    {divisions.map(div => (
                      <NavLink key={div.id} to={`/team/${div.id}`} className={({ isActive }) => isActive ? "active" : ""} onClick={() => setIsMobileMenuOpen(false)} style={{ fontSize: "13px" }}>
                        {i18n.language === "en" ? (div.name_en || div.name) : div.name}
                      </NavLink>
                    ))}
                  </>
                )}
              </div>
            )}

            {/* Desktop dropdown panel */}
            {showTeamDropdown && (
              <div
                className="desktop-only"
                style={{
                  position: "absolute",
                  left: 0,
                  top: "calc(100% + 10px)",
                  background: "#ffffff",
                  border: "1px solid #E4E7EC",
                  borderRadius: "12px",
                  boxShadow: "0 10px 25px -5px rgba(0,0,0,0.1), 0 8px 10px -6px rgba(0,0,0,0.1)",
                  minWidth: "180px",
                  zIndex: 1000,
                  padding: "8px 0",
                  display: "flex",
                  flexDirection: "column"
                }}
              >
                <Link
                  to="/team"
                  className="dropdown-item-link"
                  onClick={() => { setShowTeamDropdown(false); setIsMobileMenuOpen(false); }}
                  style={{ padding: "10px 16px", textDecoration: "none", color: "#111111", fontSize: "13px", display: "block", fontWeight: 600 }}
                >
                  {t("nav.teamOverview")}
                </Link>
                <Link
                  to="/team/mentor"
                  className="dropdown-item-link"
                  onClick={() => { setShowTeamDropdown(false); setIsMobileMenuOpen(false); }}
                  style={{ padding: "10px 16px", textDecoration: "none", color: "#111111", fontSize: "13px", display: "block", fontWeight: 600 }}
                >
                  {t("nav.teamMentor")}
                </Link>
                {divisions.length > 0 && (
                  <>
                    {divisions.map(div => (
                      <Link
                        key={div.id}
                        to={`/team/${div.id}`}
                        className="dropdown-item-link"
                        onClick={() => { setShowTeamDropdown(false); setIsMobileMenuOpen(false); }}
                        style={{ padding: "10px 16px", textDecoration: "none", color: "#111111", fontSize: "13px", display: "block" }}
                      >
                        {i18n.language === "en" ? (div.name_en || div.name) : div.name}
                      </Link>
                    ))}
                  </>
                )}
              </div>
            )}
          </div>

          <NavLink to="/robot" className={({ isActive }) => isActive ? "active" : ""} id="nav-robots" onClick={() => setIsMobileMenuOpen(false)}>
            {t("nav.robots")}
          </NavLink>
          <NavLink to="/blog" className={({ isActive }) => isActive ? "active" : ""} id="nav-blog" onClick={() => setIsMobileMenuOpen(false)}>
            {t("nav.blog")}
          </NavLink>
          <NavLink to="/sponsors" className={({ isActive }) => isActive ? "active" : ""} id="nav-sponsors" onClick={() => setIsMobileMenuOpen(false)}>
            {t("nav.sponsors")}
          </NavLink>
          <NavLink to="/contact" className={({ isActive }) => isActive ? "active" : ""} id="nav-contact" onClick={() => setIsMobileMenuOpen(false)}>
            {t("nav.contact")}
          </NavLink>

          {/* Language toggle */}
          <button
            onClick={toggleLang}
            className="lang-toggle-btn"
            style={{
              background: "none",
              border: "1px solid #E4E7EC",
              borderRadius: "20px",
              padding: "6px 12px",
              fontSize: "12px",
              fontWeight: 700,
              cursor: "pointer",
              color: "var(--text-main)",
              letterSpacing: "0.05em"
            }}
          >
            {lang === "zh" ? "EN" : "中文"}
          </button>

          {/* Right Members Portal Dropdown or Login Button */}
          {user ? (
            <div className="nav-dropdown" style={{ position: "relative" }}>
              <button
                onClick={() => setShowDropdown(!showDropdown)}
                className="btn btn-outline"
                id="btn-member-portal"
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  padding: "8px 16px",
                  cursor: "pointer",
                  borderRadius: "20px",
                  fontSize: "13px",
                  background: showDropdown ? "#F6F7F9" : "transparent"
                }}
              >
                <span>{user.displayName || t("nav.memberPortal")}</span>
                <span style={{
                  fontSize: "10px",
                  fontWeight: 700,
                  background: role === "admin" ? "#fef3c7" : role === "teacher" ? "#fee2e2" : role === "visitor" ? "#e5e7eb" : "#dcfce7",
                  color: role === "admin" ? "#b45309" : role === "teacher" ? "#ef4444" : role === "visitor" ? "#4b5563" : "#15803d",
                  padding: "2px 6px",
                  borderRadius: "4px"
                }}>
                  {role === "admin" && t("nav.roleAdmin")}
                  {role === "teacher" && t("nav.roleTeacher")}
                  {(role === "students" || role === "student") && t("nav.roleStudent")}
                  {role === "visitor" && t("nav.roleVisitor")}
                </span>
                <span style={{ fontSize: "9px", opacity: 0.7 }}>▼</span>
              </button>

              {showDropdown && (
                <div
                  className="dropdown-menu-list"
                  style={{
                    position: "absolute",
                    right: 0,
                    top: "calc(100% + 6px)",
                    background: "#ffffff",
                    border: "1px solid #E4E7EC",
                    borderRadius: "12px",
                    boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)",
                    minWidth: "220px",
                    zIndex: 1000,
                    padding: "8px 0",
                    display: "flex",
                    flexDirection: "column"
                  }}
                >
                  <div style={{ padding: "12px 16px", borderBottom: "1px solid #EAECF0", fontSize: "12px" }}>
                    <div style={{ fontWeight: 700, color: "#111111" }}>{user.displayName || "FRC 7645"}</div>
                    <div style={{ color: "#5C5C6A", fontSize: "11px", marginTop: "2px", wordBreak: "break-all" }}>{user.email}</div>
                  </div>

                  {(role === "admin" || role === "teacher") && (
                    <>
                      <Link
                        to="/cms"
                        className="dropdown-item-link"
                        onClick={() => { setShowDropdown(false); setIsMobileMenuOpen(false); }}
                        style={{ padding: "10px 16px", textDecoration: "none", color: "#111111", fontSize: "13px", display: "flex", alignItems: "center", gap: "8px" }}
                      >
                        {t("nav.cms")}
                      </Link>
                      <Link
                        to="/admin"
                        className="dropdown-item-link"
                        onClick={() => { setShowDropdown(false); setIsMobileMenuOpen(false); }}
                        style={{ padding: "10px 16px", textDecoration: "none", color: "#111111", fontSize: "13px", display: "flex", alignItems: "center", gap: "8px" }}
                      >
                        {t("nav.admin")}
                      </Link>
                    </>
                  )}

                  <div style={{ borderTop: "1px solid #EAECF0", margin: "6px 0" }}></div>

                  <button
                    onClick={() => {
                      setShowDropdown(false);
                      setIsMobileMenuOpen(false);
                      handleLogout();
                    }}
                    className="dropdown-item-link logout-btn"
                    style={{
                      padding: "10px 16px",
                      border: "none",
                      background: "none",
                      textAlign: "left",
                      width: "100%",
                      color: "#ef4444",
                      fontSize: "13px",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                      fontWeight: 700
                    }}
                  >
                    {t("nav.logout")}
                  </button>
                </div>
              )}
            </div>
          ) : (
            <Link
              to="/login"
              className="btn btn-secondary btn-login-nav"
              id="btn-login-nav"
              onClick={() => setIsMobileMenuOpen(false)}
              style={{
                padding: "8px 18px",
                fontSize: "13px",
                fontWeight: 600,
                borderRadius: "20px",
                display: "flex",
                alignItems: "center",
                gap: "6px"
              }}
            >
              {t("nav.login")}
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}
