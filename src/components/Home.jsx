import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { db } from "../firebase";
import { collection, getDocs, doc, getDoc, setDoc } from "firebase/firestore";
import { useTranslation } from "react-i18next";

const defaultSponsors = [
  { name: "Autodesk", logo: "/sponsors/autodesk.svg" },
  { name: "FIRST", logo: "/sponsors/first.svg" },
  { name: "National Instruments", logo: "/sponsors/ni.png" },
  { name: "GitHub", logo: "/sponsors/github.svg" },
  { name: "NASA", logo: "/sponsors/nasa.svg" },
  { name: "Boeing", logo: "/sponsors/boeing.svg" }
];

const defaultSlides = [
  {
    id: "default_slide_1",
    image: "https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=1200&q=80",
    title: "用計算與熱血，將藍圖化為鋼鐵",
    subtitle: "我們是 FRC 7645 機器人隊伍。在這裡，學生自主設計、精密加工、編寫程式，利用 Autodesk Inventor 機構設計與 Java 控制演算法，設計能在國際賽事上奔馳的高精度機器人。"
  },
  {
    id: "default_slide_2",
    image: "https://images.unsplash.com/photo-1485827404703-89b55fcc595e?auto=format&fit=crop&w=1200&q=80",
    title: "傳承與卓越工藝",
    subtitle: "指導老師與學長姐協同創作，物理、機電與程式控制知識全方位融合，以極致工程美學打造高精度賽季機器人。"
  }
];

const defaultBentoCards = [
  {
    id: "default_bento_number",
    title: "7645",
    content: "NKMTC 在 FIRST Robotics Competition 的隊伍編號，代表來自南港高工的工藝與熱忱。",
    size: "1x1",
    theme: "brass",
    order: 1
  },
  {
    id: "default_bento_mechanical",
    title: "機械組",
    content: "使用 Autodesk Inventor 進行 3D 結構設計，完成底盤、升降、夾爪等機構的加工與組裝。",
    size: "1x1",
    theme: "white",
    order: 2
  },
  {
    id: "default_bento_electrical",
    title: "電控組",
    content: "負責全車電氣配線、感測器整合與電控系統設計，確保機器人每個電子元件穩定運作。",
    size: "1x1",
    theme: "white",
    order: 3
  },
  {
    id: "default_bento_programming",
    title: "程式組",
    content: "以 Java 與 WPILib 框架開發自動與手動控制程式，整合視覺辨識與路徑規劃演算法。",
    size: "1x1",
    theme: "white",
    order: 4
  },
  {
    id: "default_bento_marketing",
    title: "宣傳組",
    content: "負責團隊對外形象、社群媒體經營、商業企劃撰寫與贊助商接洽。",
    size: "1x1",
    theme: "white",
    order: 5
  },
  {
    id: "default_bento_mentors",
    title: "指導師資",
    content: "由南港高工物理與資訊學科教師帶領，搭配學長姐傳承制度，讓新生快速接軌工程實務。",
    size: "1x1",
    theme: "dark",
    order: 6
  }
];

export default function Home() {
  const { t, i18n } = useTranslation();
  const [sponsors, setSponsors] = useState([]);
  const [robots, setRobots] = useState([]);
  const [slides, setSlides] = useState([]);
  const [bentoCards, setBentoCards] = useState([]);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [homeLoading, setHomeLoading] = useState(true);

  useEffect(() => {
    const shuffle = (array) => {
      const arr = [...array];
      for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
      }
      return arr;
    };

    // Fetch Carousel Slides — seed to Firestore if empty
    const fetchHomepage = async () => {
      try {
        const docRef = doc(db, "settings", "homepage");
        const docSnap = await getDoc(docRef);
        if (docSnap.exists() && docSnap.data().carousel && docSnap.data().carousel.length > 0) {
          setSlides(docSnap.data().carousel);
        } else {
          await setDoc(docRef, { carousel: defaultSlides }, { merge: true });
          setSlides(defaultSlides);
        }
      } catch (err) {
        console.warn("Firestore fetch homepage failed, using default slides: ", err);
        setSlides(defaultSlides);
      }
    };

    // Fetch Bento Grid Cards — seed to Firestore if empty
    const fetchBentoCards = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, "bento_cards"));
        if (querySnapshot.empty) {
          for (const card of defaultBentoCards) {
            await setDoc(doc(db, "bento_cards", card.id), card);
          }
          setBentoCards(defaultBentoCards);
        } else {
          const list = [];
          querySnapshot.forEach((docSnap) => {
            list.push({ id: docSnap.id, ...docSnap.data() });
          });
          list.sort((a, b) => (a.order || 0) - (b.order || 0));
          setBentoCards(list);
        }
      } catch (err) {
        console.warn("Firestore fetch bento cards failed, using defaults: ", err);
        setBentoCards(defaultBentoCards);
      }
    };

    // Fetch sponsors from Firestore
    const fetchSponsors = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, "sponsors"));
        if (querySnapshot.empty) {
          setSponsors(shuffle(defaultSponsors));
        } else {
          const list = [];
          querySnapshot.forEach((docSnap) => {
            list.push({ id: docSnap.id, ...docSnap.data() });
          });
          setSponsors(shuffle(list));
        }
      } catch (err) {
        console.warn("Firestore fetch sponsors failed: ", err);
        setSponsors(shuffle(defaultSponsors));
      }
    };

    // Fetch robots from Firestore
    const fetchRobots = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, "robots"));
        if (!querySnapshot.empty) {
          const fetched = [];
          querySnapshot.forEach((doc) => {
            fetched.push({ id: doc.id, ...doc.data() });
          });
          fetched.sort((a, b) => parseInt(b.year) - parseInt(a.year));
          setRobots(fetched);
        }
      } catch (err) {
        console.warn("Firestore robots read failed: ", err);
      }
    };

    Promise.allSettled([fetchHomepage(), fetchBentoCards(), fetchSponsors(), fetchRobots()])
      .then(() => setHomeLoading(false));
  }, []);

  // Automatic slide interval
  useEffect(() => {
    if (slides.length <= 1) return;
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 6000);
    return () => clearInterval(timer);
  }, [slides]);

  const handleNextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % slides.length);
  };

  const handlePrevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);
  };

  return (
    <main className="container" id="home-page">

      {/* 1. Full-width Photo Carousel Hero Section */}
      <section className="hero-viewport" style={{ position: "relative", overflow: "hidden", borderRadius: "var(--radius-lg)", border: "var(--card-border)", height: "560px", marginTop: "24px", display: "flex", flexDirection: "column" }}>

        {/* Loading overlay — covers section until Firestore responds */}
        {homeLoading && (
          <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", background: "#0A0B0E", zIndex: 10, borderRadius: "inherit" }}>
            <div className="spinner" />
          </div>
        )}

        {/* Slides list */}
        <div className="carousel-track" style={{ width: "100%", height: "100%", position: "relative" }}>
          {slides.map((slide, index) => (
            <div 
              key={slide.id} 
              className={`carousel-slide ${index === currentSlide ? "active" : ""}`}
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                width: "100%",
                height: "100%",
                opacity: index === currentSlide ? 1 : 0,
                transition: "opacity 1s ease-in-out",
                zIndex: index === currentSlide ? 1 : 0
              }}
            >
              {/* Slide image with dark vignette overlay */}
              <div style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, background: "linear-gradient(to bottom, rgba(0,0,0,0.15) 0%, rgba(0,0,0,0.65) 100%)", zIndex: 1 }} />
              <img 
                src={slide.image} 
                alt={slide.title || "FRC Team 7645"} 
                style={{ width: "100%", height: "100%", objectFit: "cover" }} 
              />

              {/* Glassmorphic Overlay Text Box */}
              <div
                className="carousel-text-overlay"
                style={{
                  position: "absolute",
                  bottom: "48px",
                  left: "72px",
                  maxWidth: "500px",
                  zIndex: 2,
                  color: "#ffffff",
                  background: "rgba(0, 0, 0, 0.50)",
                  backdropFilter: "blur(16px) saturate(110%)",
                  border: "1px solid rgba(255, 255, 255, 0.10)",
                  borderRadius: "var(--radius-md)",
                  padding: "20px 24px",
                  boxShadow: "0 20px 40px rgba(0, 0, 0, 0.3)"
                }}
              >
                <span className="badge" style={{ background: "rgba(255, 255, 255, 0.15)", color: "#FFFFFF", border: "1px solid rgba(255,255,255,0.2)", marginBottom: "10px" }}>
                  FRC Team 7645
                </span>
                <h1 style={{ fontSize: "28px", color: "#FFFFFF", textShadow: "0 2px 8px rgba(0,0,0,0.2)" }}>
                  {i18n.language === "en" ? (slide.title_en || slide.title) : slide.title}
                </h1>
                <p style={{ fontSize: "13px", marginTop: "10px", color: "rgba(255, 255, 255, 0.85)", lineHeight: "1.6" }}>
                  {i18n.language === "en" ? (slide.subtitle_en || slide.subtitle) : slide.subtitle}
                </p>
                <div style={{ display: "flex", gap: "12px", marginTop: "16px" }}>
                  <Link to="/robot" className="btn btn-primary" id="btn-hero-explore">
                    {t("home.exploreRobots")}
                  </Link>
                  <Link to="/team" className="btn btn-outline" style={{ color: "#ffffff", borderColor: "rgba(255,255,255,0.4)", background: "rgba(255,255,255,0.05)" }}>
                    {t("home.aboutTeam")}
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Carousel controls */}
        {slides.length > 1 && (
          <>
            <button 
              onClick={handlePrevSlide} 
              className="carousel-arrow prev"
              style={{
                position: "absolute",
                top: "50%",
                left: "24px",
                transform: "translateY(-50%)",
                zIndex: 3,
                background: "rgba(255, 255, 255, 0.15)",
                border: "1px solid rgba(255, 255, 255, 0.2)",
                color: "#FFFFFF",
                width: "44px",
                height: "44px",
                borderRadius: "50%",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "18px",
                backdropFilter: "blur(4px)"
              }}
              aria-label="Previous slide"
            >
              ❮
            </button>
            <button 
              onClick={handleNextSlide} 
              className="carousel-arrow next"
              style={{
                position: "absolute",
                top: "50%",
                right: "24px",
                transform: "translateY(-50%)",
                zIndex: 3,
                background: "rgba(255, 255, 255, 0.15)",
                border: "1px solid rgba(255, 255, 255, 0.2)",
                color: "#FFFFFF",
                width: "44px",
                height: "44px",
                borderRadius: "50%",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "18px",
                backdropFilter: "blur(4px)"
              }}
              aria-label="Next slide"
            >
              ❯
            </button>

            {/* Dots Indicators */}
            <div 
              className="carousel-dots" 
              style={{
                position: "absolute",
                bottom: "24px",
                left: "50%",
                transform: "translateX(-50%)",
                zIndex: 3,
                display: "flex",
                gap: "8px"
              }}
            >
              {slides.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setCurrentSlide(idx)}
                  style={{
                    width: "8px",
                    height: "8px",
                    borderRadius: "50%",
                    border: "none",
                    background: idx === currentSlide ? "var(--accent)" : "rgba(255,255,255,0.4)",
                    cursor: "pointer",
                    padding: 0
                  }}
                  aria-label={`Go to slide ${idx + 1}`}
                />
              ))}
            </div>
          </>
        )}
      </section>

      {/* Dynamic Sponsor Loop Marquee — placed beautifully below the hero */}
      <section className="marquee-section" style={{ padding: "20px 0", background: "transparent", borderBottom: "1px solid rgba(255, 255, 255, 0.05)" }}>
        <div className="marquee-viewport">
          <div className="marquee-track" style={{ animationDuration: `${sponsors.length * 4}s` }}>
            {[...sponsors, ...sponsors].map((sponsor, idx) => (
              sponsor.url ? (
                <a key={idx} href={sponsor.url} target="_blank" rel="noopener noreferrer" className="sponsor-logo-card" style={{ textDecoration: "none" }}>
                  <img src={sponsor.logo} alt={sponsor.name} title={sponsor.name} />
                </a>
              ) : (
                <div className="sponsor-logo-card" key={idx}>
                  <img src={sponsor.logo} alt={sponsor.name} title={sponsor.name} />
                </div>
              )
            ))}
          </div>
        </div>
      </section>

      {/* 2. Dynamic Bento Grid Info Cards */}
      <section className="bento-grid">
        {homeLoading
          ? [1,2,3,4,5,6].map(i => (
              <div key={i} className="bento-card card-size-1x1" style={{ background: "var(--bg-elevated)", minHeight: "140px", animation: "pulse 1.5s infinite" }} />
            ))
          : null}
        {!homeLoading && bentoCards.map((card) => {
          let sizeClass = "card-size-2x1"; // default
          if (card.size === "1x1") sizeClass = "card-size-1x1";
          if (card.size === "1x2") sizeClass = "card-size-1x2";
          if (card.size === "2x2") sizeClass = "card-size-2x2";

          let themeClass = "card-theme-white";
          if (card.theme === "brass") themeClass = "card-theme-brass";
          if (card.theme === "dark") themeClass = "card-theme-dark";

          const inner = (
            <div>
              <h3 style={{ fontSize: "22px", fontWeight: 800, marginBottom: "12px" }}>
                {i18n.language === "en" ? (card.title_en || card.title) : card.title}
              </h3>
              <p style={{ fontSize: "14px", lineHeight: "1.6", opacity: 0.9 }}>
                {i18n.language === "en" ? (card.content_en || card.content) : card.content}
              </p>
              {card.link && (
                <span style={{ marginTop: "12px", display: "inline-block", fontSize: "12px", fontWeight: 700, opacity: 0.7 }}>
                  {t("home.cardReadMore")} →
                </span>
              )}
            </div>
          );

          const cardStyle = { position: "relative", cursor: card.link ? "pointer" : "default" };
          const isExternal = card.link && (card.link.startsWith("http://") || card.link.startsWith("https://"));

          if (card.link && isExternal) {
            return (
              <a key={card.id} href={card.link} target="_blank" rel="noopener noreferrer" className={`bento-card ${sizeClass} ${themeClass}`} style={{ ...cardStyle, textDecoration: "none", color: "inherit" }}>
                {inner}
              </a>
            );
          }
          if (card.link) {
            const to = card.link.startsWith("/") ? card.link : `/${card.link}`;
            return (
              <Link key={card.id} to={to} className={`bento-card ${sizeClass} ${themeClass}`} style={{ ...cardStyle, textDecoration: "none", color: "inherit" }}>
                {inner}
              </Link>
            );
          }
          return (
            <div key={card.id} className={`bento-card ${sizeClass} ${themeClass}`} style={cardStyle}>
              {inner}
            </div>
          );
        })}
      </section>

      {/* 3. Robots History Section */}
      {robots.length > 0 && (
        <section className="robots-archive-section">
          <div style={{ borderBottom: "1px solid rgba(255, 255, 255, 0.06)", paddingBottom: "16px", marginBottom: "32px" }}>
            <h2>{t("home.robotsArchiveTitle")}</h2>
          </div>

          <div className="robots-grid">
            {robots.map((robot) => (
              <Link to={`/robot/${robot.year}`} className="robot-archive-card" key={robot.id}>
                <div className="robot-card-image">
                  <img src={robot.image} alt={robot.name} />
                </div>
                <div className="robot-card-body">
                  <div className="robot-card-year">{robot.year} {t("home.season")}</div>
                  <h3>{robot.name}</h3>
                  <p>{t("home.game")}：{robot.game} | {t("home.drivetrain")}：{robot.drivetrain}</p>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}
    </main>
  );
}
