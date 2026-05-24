import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { db } from "../firebase";
import { collection, getDocs, doc, setDoc } from "firebase/firestore";
import { useTranslation } from "react-i18next";

const stripMarkdown = (md = "") =>
  md
    .replace(/!\[.*?\]\(.*?\)/g, "")
    .replace(/\[(.+?)\]\(.*?\)/g, "$1")
    .replace(/#{1,6}\s+/g, "")
    .replace(/\*\*(.+?)\*\*/g, "$1")
    .replace(/\*(.+?)\*/g, "$1")
    .replace(/~~(.+?)~~/g, "$1")
    .replace(/`{1,3}[^`\n]*`{1,3}/g, "")
    .replace(/^[-*+]\s+/gm, "")
    .replace(/^\d+\.\s+/gm, "")
    .replace(/^>\s+/gm, "")
    .replace(/^-{3,}$/gm, "")
    .replace(/\n{2,}/g, " · ")
    .replace(/\n/g, " ")
    .trim();

const defaultPosts = [
  {
    id: "p1",
    title: "2024 Arizona 賽季回顧 — 雙料獎項",
    content: "2024 年是 NKMTC 豐收的一年。我們在 Arizona East Regional 拿下工程卓越獎，緊接著在 Arizona Valley Regional 再度獲頒意象獎 (Imagery Award in honor of Jack Kamen)。感謝每一位隊員在賽季中全力以赴。",
    image: "https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=800&q=80",
    author: "宣傳組",
    category: "賽事報導",
    createdAt: "2024-04-15T10:00:00.000Z"
  },
  {
    id: "p2",
    title: "機械組：零件加工與底盤組裝紀實",
    content: "每個賽季的準備都從工具機房開始。機械組隊員在加工鋁材、切削結構件的過程中，將藍圖上的設計一步步化為實體。這種手與腦並用的工程訓練，正是 FRC 最珍貴的學習核心。",
    image: "https://images.unsplash.com/photo-1504384308090-c894fdcc538d?auto=format&fit=crop&w=800&q=80",
    author: "宣傳組",
    category: "機械機構",
    createdAt: "2024-01-20T14:30:00.000Z"
  }
];

export default function Blog() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState("全部");
  const { t, i18n } = useTranslation();

  useEffect(() => {
    const fetchPosts = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, "blog"));
        let list = [];

        if (querySnapshot.empty) {
          for (const post of defaultPosts) {
            await setDoc(doc(db, "blog", post.id), post);
          }
          list = defaultPosts;
        } else {
          querySnapshot.forEach((doc) => {
            list.push({ id: doc.id, ...doc.data() });
          });
        }

        list.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        setPosts(list);
      } catch (err) {
        console.warn("Firestore fetch failed, fallback to defaults: ", err);
        setPosts(defaultPosts);
      } finally {
        setLoading(false);
      }
    };

    fetchPosts();
  }, []);

  // Keep internal keys as Chinese (matching Firestore values) for filtering
  const categories = [
    { key: "全部", label: t("blog.categories.all") },
    { key: "日常花絮", label: t("blog.categories.daily") },
    { key: "賽事報導", label: t("blog.categories.competition") },
    { key: "機械機構", label: t("blog.categories.mechanical") },
    { key: "程式控制", label: t("blog.categories.programming") },
    { key: "公關行銷", label: t("blog.categories.marketing") },
  ];

  const filteredPosts = selectedCategory === "全部"
    ? posts
    : posts.filter(post => post.category === selectedCategory);

  const dateLocale = i18n.language === "en" ? "en-US" : "zh-TW";

  const getCategoryLabel = (cat) => {
    const found = categories.find(c => c.key === cat);
    return found ? found.label : cat;
  };

  if (loading) {
    return (
      <div className="container" style={{ paddingTop: "100px", paddingBottom: "100px", textAlign: "center" }}>
        <div className="spinner" style={{ margin: "0 auto" }}></div>
        <p style={{ marginTop: "20px" }}>{t("blog.loading")}</p>
      </div>
    );
  }

  return (
    <main className="container" style={{ paddingTop: "40px", paddingBottom: "80px" }} id="blog-page">
      <div style={{ borderBottom: "1px solid rgba(0, 0, 0, 0.06)", paddingBottom: "16px", marginBottom: "32px" }}>
        <span className="badge">{t("blog.badge")}</span>
        <h2 style={{ marginTop: "12px" }}>{t("blog.pageTitle")}</h2>
        <p>{t("blog.pageDesc")}</p>
      </div>

      {/* Category Filter Tabs */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", marginBottom: "40px" }}>
        {categories.map((cat) => (
          <button
            key={cat.key}
            onClick={() => setSelectedCategory(cat.key)}
            className={`btn ${selectedCategory === cat.key ? "btn-primary" : "btn-outline"}`}
            style={{ padding: "8px 16px", fontSize: "12px" }}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Blog Feed Grid */}
      {filteredPosts.length === 0 ? (
        <div style={{ textAlign: "center", padding: "60px 0", color: "var(--text-muted)", background: "#ffffff", borderRadius: "16px", border: "var(--card-border)" }}>
          <p>{t("blog.noPostsInCategory")}</p>
        </div>
      ) : (
        <div className="blog-feed-grid" style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "30px" }}>
          {filteredPosts.map((post) => (
            <article
              key={post.id}
              style={{
                background: "#ffffff",
                border: "1px solid #E4E7EC",
                borderRadius: "16px",
                overflow: "hidden",
                boxShadow: "var(--card-shadow)",
                display: "flex",
                flexDirection: "column"
              }}
            >
              <div style={{ height: "240px", overflow: "hidden", background: "#EAECF0", position: "relative" }}>
                <img src={post.image} alt={post.title} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                <span
                  style={{
                    position: "absolute",
                    top: "16px",
                    left: "16px",
                    background: "var(--accent)",
                    color: "#ffffff",
                    padding: "4px 10px",
                    fontSize: "11px",
                    fontWeight: 700,
                    borderRadius: "4px",
                    zIndex: 2
                  }}
                >
                  {getCategoryLabel(post.category) || t("blog.categories.daily")}
                </span>
              </div>

              <div style={{ padding: "28px", display: "flex", flexDirection: "column", gap: "16px", flex: 1, justifyContent: "space-between" }}>
                <div>
                  <span style={{ fontSize: "11px", color: "var(--text-muted)", fontWeight: 700 }}>
                    {post.createdAt ? new Date(post.createdAt).toLocaleDateString(dateLocale) : "N/A"}
                  </span>
                  <h3 style={{ marginTop: "8px", fontSize: "20px", lineHeight: "1.3" }}>
                    <Link to={`/blog/${post.id}`} style={{ textDecoration: "none", color: "var(--text-main)" }} className="blog-title-link">
                      {i18n.language === "en" ? (post.title_en || post.title) : post.title}
                    </Link>
                  </h3>
                  <p style={{ marginTop: "12px", fontSize: "14px", color: "var(--text-muted)", display: "-webkit-box", WebkitLineClamp: 3, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                    {stripMarkdown(i18n.language === "en" ? (post.content_en || post.content) : post.content)}
                  </p>
                </div>
                <div style={{ borderTop: "1px solid #EAECF0", paddingTop: "12px", display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "12px" }}>
                  <span style={{ color: "var(--text-muted)" }}>{t("blog.author")}：<strong>{post.author}</strong></span>
                  <Link to={`/blog/${post.id}`} style={{ textDecoration: "none", color: "var(--accent)", fontWeight: 700 }}>
                    {t("blog.readMore")}
                  </Link>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </main>
  );
}
