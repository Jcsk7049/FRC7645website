import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { db } from "../firebase";
import { doc, getDoc } from "firebase/firestore";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { useTranslation } from "react-i18next";

export default function TeamGroup() {
  const { groupId } = useParams();
  const { t, i18n } = useTranslation();
  const [division, setDivision] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDivision = async () => {
      try {
        const snap = await getDoc(doc(db, "divisions", groupId));
        if (snap.exists()) {
          setDivision({ id: snap.id, ...snap.data() });
        }
      } catch (err) {
        console.warn("Division fetch failed:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchDivision();
  }, [groupId]);

  if (loading) {
    return (
      <div className="container" style={{ paddingTop: "100px", paddingBottom: "100px", textAlign: "center" }}>
        <div className="spinner" style={{ margin: "0 auto" }} />
        <p style={{ marginTop: "20px" }}>{t("teamGroup.loading")}</p>
      </div>
    );
  }

  if (!division) {
    return (
      <div className="container" style={{ paddingTop: "80px", paddingBottom: "80px", textAlign: "center" }}>
        <h3>{t("teamGroup.notFound")}</h3>
        <Link to="/team" className="btn btn-primary" style={{ marginTop: "20px" }}>
          {t("teamGroup.backToTeam")}
        </Link>
      </div>
    );
  }

  const isEn = i18n.language === "en";
  const name = isEn ? (division.name_en || division.name) : division.name;
  const content = isEn ? (division.description_en || division.description) : division.description;

  return (
    <main className="container" style={{ paddingTop: "40px", paddingBottom: "80px" }} id="team-group-page">
      <Link
        to="/team"
        className="btn btn-outline"
        style={{ marginBottom: "32px", display: "inline-flex", alignItems: "center", gap: "8px", padding: "8px 16px", fontSize: "13px" }}
      >
        ← {t("teamGroup.backToTeam")}
      </Link>

      <article style={{ maxWidth: "800px", margin: "0 auto" }}>
        {division.coverImage && (
          <div style={{ borderRadius: "var(--radius-lg)", overflow: "hidden", marginBottom: "40px", maxHeight: "420px", boxShadow: "var(--card-shadow)" }}>
            <img src={division.coverImage} alt={name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          </div>
        )}

        <header style={{ marginBottom: "32px", paddingBottom: "24px", borderBottom: "1px solid rgba(0,0,0,0.06)" }}>
          <span className="badge">{t("team.badge")}</span>
          <h1 style={{ fontSize: "38px", lineHeight: "1.2", marginTop: "12px" }}>{name}</h1>
        </header>

        {content ? (
          <div className="blog-body-text">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
          </div>
        ) : (
          <p style={{ color: "var(--text-muted)" }}>{t("teamGroup.noContent")}</p>
        )}
      </article>
    </main>
  );
}
