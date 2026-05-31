import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { db } from "../firebase";
import { collection, getDocs } from "firebase/firestore";
import { useTranslation } from "react-i18next";

function MentorGrid({ mentors, formatPeriod, t, i18n, retired = false }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: "32px" }}>
      {mentors.map(mentor => (
        <div key={mentor.id} className="bento-card" style={{ overflow: "hidden", opacity: retired ? 0.8 : 1 }}>
          {mentor.photo && (
            <div style={{ height: "220px", overflow: "hidden", background: "var(--bg-elevated)" }}>
              <img src={mentor.photo} alt={mentor.name} style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "top", filter: retired ? "grayscale(30%)" : "none" }} />
            </div>
          )}
          <div style={{ padding: "24px" }}>
            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: "8px", marginBottom: "12px" }}>
              <h3 style={{ fontSize: "20px", fontWeight: 800 }}>{mentor.name}</h3>
              <span style={{
                fontSize: "10px", fontWeight: 700, padding: "2px 8px", borderRadius: "4px", flexShrink: 0,
                background: retired ? "var(--bg-elevated)" : "rgba(10,174,232,0.10)",
                color: retired ? "var(--text-muted)" : "var(--accent)"
              }}>
                {retired ? t("teamMentor.retiredBadge") : t("teamMentor.activeBadge")}
              </span>
            </div>
            {mentor.subject && (
              <p style={{ fontSize: "13px", color: "var(--text-muted)", marginBottom: "6px" }}>
                <strong>{t("teamMentor.subject")}：</strong>{mentor.subject}
              </p>
            )}
            {mentor.startYear && (
              <p style={{ fontSize: "13px", color: "var(--text-muted)", marginBottom: "12px" }}>
                <strong>{t("teamMentor.since")}：</strong>{formatPeriod(mentor)}
              </p>
            )}
            {mentor.bio && (
              <p style={{ fontSize: "14px", lineHeight: "1.7", color: "var(--text-main)", borderTop: "1px solid rgba(26, 22, 18, 0.06)", paddingTop: "12px" }}>
                {mentor.bio}
              </p>
            )}
            {(mentor.email || mentor.phone) && (
              <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", marginTop: "12px", borderTop: mentor.bio ? "none" : "1px solid #EAECF0", paddingTop: mentor.bio ? "0" : "12px" }}>
                {mentor.email && (
                  <a href={`mailto:${mentor.email}`} style={{ fontSize: "12px", color: "var(--accent)", textDecoration: "none", background: "rgba(10,174,232,0.07)", padding: "4px 10px", borderRadius: "20px", fontWeight: 600 }}>
                    ✉ {mentor.email}
                  </a>
                )}
                {mentor.phone && (
                  <a href={`tel:${mentor.phone}`} style={{ fontSize: "12px", color: "var(--text-muted)", textDecoration: "none", background: "var(--bg-elevated)", padding: "4px 10px", borderRadius: "20px", fontWeight: 600 }}>
                    ☎ {mentor.phone}
                  </a>
                )}
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

export default function TeamMentor() {
  const { t, i18n } = useTranslation();
  const [mentors, setMentors] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMentors = async () => {
      try {
        const snap = await getDocs(collection(db, "mentors"));
        const list = [];
        snap.forEach(d => list.push({ id: d.id, ...d.data() }));
        list.sort((a, b) => (a.order ?? 99) - (b.order ?? 99) || (a.startYear || 0) - (b.startYear || 0));
        setMentors(list);
      } catch (err) {
        console.warn("Mentors fetch failed:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchMentors();
  }, []);

  const formatPeriod = (mentor) => {
    const start = mentor.startYear || "";
    const end = mentor.endYear ? mentor.endYear : (i18n.language === "en" ? "Present" : "至今");
    if (!start) return "";
    return `${start} – ${end}`;
  };

  return (
    <main className="container" style={{ paddingTop: "40px", paddingBottom: "80px" }} id="mentor-page">
      <Link
        to="/team"
        className="btn btn-outline"
        style={{ marginBottom: "32px", display: "inline-flex", alignItems: "center", gap: "8px", padding: "8px 16px", fontSize: "13px" }}
      >
        ← {t("team.pageTitle")}
      </Link>

      <section style={{ borderBottom: "1px solid rgba(26, 22, 18, 0.06)", paddingBottom: "32px", marginBottom: "48px" }}>
        <span className="badge">{t("teamMentor.badge")}</span>
        <h1 style={{ marginTop: "12px", fontSize: "38px" }}>{t("teamMentor.pageTitle")}</h1>
        <p style={{ fontSize: "16px", marginTop: "16px", maxWidth: "680px", lineHeight: "1.7", color: "var(--text-muted)" }}>
          {t("teamMentor.pageDesc")}
        </p>
      </section>

      {loading ? (
        <div style={{ textAlign: "center", paddingTop: "60px" }}>
          <div className="spinner" style={{ margin: "0 auto" }} />
          <p style={{ marginTop: "20px" }}>{t("teamMentor.loading")}</p>
        </div>
      ) : mentors.length === 0 ? (
        <div style={{ textAlign: "center", padding: "60px 0", color: "var(--text-muted)", background: "var(--card-bg)", borderRadius: "16px", border: "var(--card-border)" }}>
          <p>{t("teamMentor.noMentors")}</p>
        </div>
      ) : (
        <>
          {/* Active mentors */}
          {mentors.filter(m => !m.endYear).length > 0 && (
            <section style={{ marginBottom: "56px" }}>
              <h2 style={{ marginBottom: "24px", fontSize: "22px" }}>{t("teamMentor.active")}</h2>
              <MentorGrid mentors={mentors.filter(m => !m.endYear)} formatPeriod={formatPeriod} t={t} i18n={i18n} />
            </section>
          )}

          {/* Retired mentors */}
          {mentors.filter(m => m.endYear).length > 0 && (
            <section>
              <h2 style={{ marginBottom: "24px", fontSize: "22px", color: "var(--text-muted)" }}>{t("teamMentor.retired")}</h2>
              <MentorGrid mentors={mentors.filter(m => m.endYear)} formatPeriod={formatPeriod} t={t} i18n={i18n} retired />
            </section>
          )}
        </>
      )}
    </main>
  );
}
