import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { db } from "../firebase";
import { doc, getDoc } from "firebase/firestore";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { useTranslation } from "react-i18next";

export default function BlogDetail() {
  const { postId } = useParams();
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const { t, i18n } = useTranslation();

  useEffect(() => {
    const fetchPost = async () => {
      try {
        const docRef = doc(db, "blog", postId);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setPost(docSnap.data());
        } else {
          console.warn("Blog post not found: ", postId);
        }
      } catch (err) {
        console.error("Failed to fetch blog post: ", err);
      } finally {
        setLoading(false);
      }
    };
    fetchPost();
  }, [postId]);

  if (loading) {
    return (
      <div className="container" style={{ paddingTop: "100px", paddingBottom: "100px", textAlign: "center" }}>
        <div className="spinner" style={{ margin: "0 auto" }}></div>
        <p style={{ marginTop: "20px" }}>{t("blogDetail.loading")}</p>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="container" style={{ paddingTop: "80px", paddingBottom: "80px", textAlign: "center" }}>
        <h3>{t("blogDetail.notFound")}</h3>
        <p style={{ color: "var(--text-muted)", marginTop: "12px" }}>{t("blogDetail.notFoundDesc")}</p>
        <Link to="/blog" className="btn btn-primary" style={{ marginTop: "20px" }}>
          {t("blogDetail.backToList")}
        </Link>
      </div>
    );
  }

  const isEn = i18n.language === "en";
  const title = isEn ? (post.title_en || post.title) : post.title;
  const content = isEn ? (post.content_en || post.content) : post.content;
  const dateLocale = isEn ? "en-US" : "zh-TW";

  return (
    <main className="container" style={{ paddingTop: "40px", paddingBottom: "80px" }} id="blog-detail-page">
      <Link
        to="/blog"
        className="btn btn-outline"
        style={{
          marginBottom: "32px",
          display: "inline-flex",
          alignItems: "center",
          gap: "8px",
          padding: "8px 16px",
          fontSize: "13px"
        }}
      >
        ← {t("blogDetail.backToList")}
      </Link>

      <article className="blog-detail-view" style={{ maxWidth: "800px", margin: "0 auto" }}>
        <header style={{ marginBottom: "32px" }}>
          <span
            className="badge"
            style={{
              background: "var(--badge-bg)",
              color: "var(--accent)",
              fontWeight: 700,
              fontSize: "12px"
            }}
          >
            {post.category}
          </span>
          <h1 style={{ fontSize: "40px", lineHeight: "1.2", marginTop: "16px", marginBottom: "16px" }}>
            {title}
          </h1>
          <div
            style={{
              display: "flex",
              gap: "20px",
              fontSize: "13px",
              color: "var(--text-muted)",
              borderBottom: "1px solid rgba(26, 22, 18, 0.06)",
              paddingBottom: "24px"
            }}
          >
            <span>{t("blogDetail.author")}：<strong>{post.author}</strong></span>
            <span>{t("blogDetail.publishedAt")}：<strong>{post.createdAt ? new Date(post.createdAt).toLocaleDateString(dateLocale) : "N/A"}</strong></span>
          </div>
        </header>

        {post.image && (
          <div style={{ borderRadius: "var(--radius-lg)", overflow: "hidden", marginBottom: "40px", maxHeight: "480px", boxShadow: "var(--card-shadow)" }}>
            <img src={post.image} alt={title} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          </div>
        )}

        <div className="blog-body-text">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
        </div>
      </article>
    </main>
  );
}
