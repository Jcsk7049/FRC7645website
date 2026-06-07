import { useEffect, useState, useRef } from "react";
import { auth, db, storage } from "../firebase";
import { getTeamYearAwards, FRC_GAMES } from "../lib/tba";
import { translateText } from "../lib/translate";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc, setDoc, deleteDoc, collection, getDocs, addDoc } from "firebase/firestore";
import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import { useNavigate } from "react-router-dom";
import TiptapEditor from "./TiptapEditor";
import imageCompression from "browser-image-compression";

// ---- Defaults ----
const DEFAULT_BENTO_CARDS = [
  { id: "default_bento_number", title: "7645", content: "NKMTC 在 FIRST Robotics Competition 的隊伍編號，代表來自南港高工的工藝與熱忱。", size: "1x1", theme: "brass", order: 1 },
  { id: "default_bento_mechanical", title: "機械組", content: "使用 Autodesk Inventor 進行 3D 結構設計，完成底盤、升降、夾爪等機構的加工與組裝。", size: "1x1", theme: "white", order: 2 },
  { id: "default_bento_electrical", title: "電控組", content: "負責全車電氣配線、感測器整合與電控系統設計，確保機器人每個電子元件穩定運作。", size: "1x1", theme: "white", order: 3 },
  { id: "default_bento_programming", title: "程式組", content: "以 Java 與 WPILib 框架開發自動與手動控制程式，整合視覺辨識與路徑規劃演算法。", size: "1x1", theme: "white", order: 4 },
  { id: "default_bento_marketing", title: "宣傳組", content: "負責團隊對外形象、社群媒體經營、商業企劃撰寫與贊助商接洽。", size: "1x1", theme: "white", order: 5 },
  { id: "default_bento_mentors", title: "指導師資", content: "由南港高工物理與資訊學科教師帶領，搭配學長姐傳承制度，讓新生快速接軌工程實務。", size: "1x1", theme: "dark", order: 6 }
];

const DEFAULT_SLIDES = [
  { id: "default_slide_1", image: "https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=1200&q=80", title: "用計算與熱血，將藍圖化為鋼鐵", subtitle: "我們是 FRC 7645 機器人隊伍。在這裡，學生自主設計、精密加工、編寫程式，利用 Autodesk Inventor 機構設計與 Java 控制演算法，設計能在國際賽事上奔馳的高精度機器人。" },
  { id: "default_slide_2", image: "https://images.unsplash.com/photo-1485827404703-89b55fcc595e?auto=format&fit=crop&w=1200&q=80", title: "傳承與卓越工藝", subtitle: "指導老師與學長姐協同創作，物理、機電與程式控制知識全方位融合，以極致工程美學打造高精度賽季機器人。" }
];

const DEFAULT_ABOUT = {
  heroDesc: "NKMTC 是由臺北市立南港高級工業職業學校學生組成的 FRC 機器人隊伍，自 2019 年首場賽事便以新秀之姿踏上底特律世界決賽舞台。我們是一群敢做、敢夢，勇於面對與解決問題的工程人。",
  historyP1: "NKMTC 成立於 2018 年秋天，原是以集體創作與機器人競賽為方向的學生社群。在其他學校老師的介紹下，隊伍以原有名稱 NKMTC 決定投身 FIRST Robotics Competition，象徵一群敢做、敢夢、勇於解決問題的精神。",
  historyP2: "2019 年首場賽事在洛杉磯舉行。以新秀身份目標最佳新秀獎 (Rookie All Star Award)，最終於洛杉磯-瓦倫西亞高中賽場同時奪得最佳新秀獎與新秀最高分種子獎，直接晉級底特律總決賽，並在決賽場再度獲得最高分種子獎——成為全台灣首支在底特律賽場獲獎的隊伍。",
  historyP3: "2020 年因 COVID-19 影響，FRC 全球賽季大幅壓縮，隊伍利用空檔持續深化機構設計與新成員訓練，並在 11 月的台中 5G 數位區域賽中拿下工業設計獎。此後在 2022、2023、2024、2025 年持續出賽並多次獲獎，持續將南港高工的工藝精神帶上國際舞台。",
};

const DEFAULT_CONTACT = {
  email: "nkmtc7645@gmail.com",
  phone: "",
  address: "臺北市南港區興中街19號",
  city: "臺北市"
};

// ---- EN sub-field component ----
function EnField({ zhValue, value, onChange, multiline, rows, label, rich, onImageUpload }) {
  const [busy, setBusy] = useState(false);
  const handleTranslate = async () => {
    if (!zhValue) return;
    setBusy(true);
    try {
      const result = await translateText(zhValue);
      onChange(result);
    } catch { alert("翻譯失敗，請稍後再試。"); }
    finally { setBusy(false); }
  };
  return (
    <div style={{ marginTop: "8px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "4px" }}>
        <span style={{ fontSize: "11px", fontWeight: 700, color: "#0AAEE8" }}>🌐 {label || "英文版本"}</span>
        <button type="button" onClick={handleTranslate} disabled={busy || !zhValue}
          style={{ fontSize: "10px", padding: "2px 8px", border: "1px solid #0AAEE8", borderRadius: "4px", background: "rgba(10,174,232,0.06)", color: "#0AAEE8", cursor: "pointer", fontWeight: 700 }}>
          {busy ? "翻譯中…" : "自動翻譯"}
        </button>
      </div>
      {rich
        ? <TiptapEditor value={value} onChange={onChange} onImageUpload={onImageUpload} placeholder="English version…" />
        : multiline
          ? <textarea rows={rows || 3} value={value} onChange={e => onChange(e.target.value)} placeholder="English version…"
              style={{ width: "100%", padding: "8px", border: "1px solid #BAE6FD", borderRadius: "6px", background: "#F0F9FF", fontFamily: "inherit", resize: "vertical", fontSize: "13px" }} />
          : <input value={value} onChange={e => onChange(e.target.value)} placeholder="English version…"
              style={{ width: "100%", padding: "8px 10px", border: "1px solid #BAE6FD", borderRadius: "6px", background: "#F0F9FF", fontSize: "13px" }} />
      }
    </div>
  );
}


const PANEL = { background: "#ffffff", border: "1px solid #E4E7EC", borderRadius: "16px", padding: "28px" };
const V_STACK = { display: "flex", flexDirection: "column", gap: "28px" };
const DEL_BTN = { padding: "4px 10px", fontSize: "11px", border: "1px solid #fee2e2", borderRadius: "6px", background: "#fff5f5", color: "#ef4444", cursor: "pointer", fontWeight: 600, flexShrink: 0 };
const EDIT_BTN = { padding: "4px 10px", fontSize: "11px", border: "1px solid #E4E7EC", borderRadius: "6px", background: "#F6F7F9", cursor: "pointer", fontWeight: 600 };

export default function CMS() {
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("carousel");
  const navigate = useNavigate();
  const [uploadProgress, setUploadProgress] = useState({});

  // Blog
  const [blogPosts, setBlogPosts] = useState([]);
  const [blogEditId, setBlogEditId] = useState("");
  const [blogEditImage, setBlogEditImage] = useState("");
  const [blogTitle, setBlogTitle] = useState("");
  const [blogTitleEn, setBlogTitleEn] = useState("");
  const [blogContent, setBlogContent] = useState("");
  const [blogContentEn, setBlogContentEn] = useState("");
  const [blogAuthor, setBlogAuthor] = useState("");
  const [blogCategory, setBlogCategory] = useState("日常花絮");
  const [blogImageFile, setBlogImageFile] = useState(null);
  const [blogSubmitLoading, setBlogSubmitLoading] = useState(false);
  const [batchTranslating, setBatchTranslating] = useState(false);

  // Carousel
  const [carouselSlides, setCarouselSlides] = useState([]);
  const [slideEditId, setSlideEditId] = useState("");
  const [slideImageFile, setSlideImageFile] = useState(null);
  const [slideTitle, setSlideTitle] = useState("");
  const [slideTitleEn, setSlideTitleEn] = useState("");
  const [slideSubtitle, setSlideSubtitle] = useState("");
  const [slideSubtitleEn, setSlideSubtitleEn] = useState("");
  const [carouselSaveLoading, setCarouselSaveLoading] = useState(false);

  // Bento
  const [bentoCards, setBentoCards] = useState([]);
  const [bentoId, setBentoId] = useState("");
  const [bentoTitle, setBentoTitle] = useState("");
  const [bentoTitleEn, setBentoTitleEn] = useState("");
  const [bentoContent, setBentoContent] = useState("");
  const [bentoContentEn, setBentoContentEn] = useState("");
  const [bentoSize, setBentoSize] = useState("1x1");
  const [bentoTheme, setBentoTheme] = useState("white");
  const [bentoOrder, setBentoOrder] = useState(0);
  const [bentoLink, setBentoLink] = useState("");
  const [bentoSaveLoading, setBentoSaveLoading] = useState(false);

  // Sponsors
  const [sponsors, setSponsors] = useState([]);
  const [sponsorEditId, setSponsorEditId] = useState("");
  const [sponsorEditLogo, setSponsorEditLogo] = useState("");
  const [sponsorName, setSponsorName] = useState("");
  const [sponsorUrl, setSponsorUrl] = useState("");
  const [sponsorLogoFile, setSponsorLogoFile] = useState(null);
  const [sponsorTier, setSponsorTier] = useState("");
  const [sponsorSubmitLoading, setSponsorSubmitLoading] = useState(false);

  const [financeEntries, setFinanceEntries] = useState([]);
  const [financeEditId, setFinanceEditId] = useState("");
  const [financeEditReceipt, setFinanceEditReceipt] = useState("");
  const [financeType, setFinanceType] = useState("income");
  const [financeDate, setFinanceDate] = useState("");
  const [financeTitle, setFinanceTitle] = useState("");
  const [financeCategory, setFinanceCategory] = useState("贊助");
  const [financeAmount, setFinanceAmount] = useState("");
  const [financeNote, setFinanceNote] = useState("");
  const [financeReceiptFile, setFinanceReceiptFile] = useState(null);
  const [financeSubmitLoading, setFinanceSubmitLoading] = useState(false);

  // Robots
  const [robots, setRobots] = useState([]);
  const [robotYear, setRobotYear] = useState("");
  const [robotName, setRobotName] = useState("");
  const [robotGame, setRobotGame] = useState("");
  const [robotDrivetrain, setRobotDrivetrain] = useState("");
  const [robotWeight, setRobotWeight] = useState("");
  const [robotAchievements, setRobotAchievements] = useState("");
  const [robotAutoLoading, setRobotAutoLoading] = useState(false);
  const [robotImageFile, setRobotImageFile] = useState(null);
  const [robotGlbFile, setRobotGlbFile] = useState(null);
  const [robotGlbUrl, setRobotGlbUrl] = useState("");
  const [robotSubmitLoading, setRobotSubmitLoading] = useState(false);
  const [robotEditId, setRobotEditId] = useState("");
  const [robotEditImage, setRobotEditImage] = useState("");

  // Socials
  const [instagram, setInstagram] = useState("");
  const [facebook, setFacebook] = useState("");
  const [youtube, setYoutube] = useState("");
  const [github, setGithub] = useState("");
  const [twitter, setTwitter] = useState("");
  const [tbaLink, setTbaLink] = useState("");
  const [firstLink, setFirstLink] = useState("");
  const [socialsSaveLoading, setSocialsSaveLoading] = useState(false);

  const DEFAULT_CORE_VALUES = [
    { title: "專業技藝", desc: "從 3D 建模到金屬加工，每一顆螺帽與每條配線皆符合高精度標準，將機械結構與電控設計發揮至極。" },
    { title: "學生主導", desc: "學生是核心。從策略討論到程式實作，皆由學長姐親自指導新生，落實技術與經驗的完整傳承。" },
    { title: "優雅專業", desc: "Gracious Professionalism — 賽場上全力拼搏，賽場外互助共享技術，與所有隊伍共同提升整體水準。" },
  ];

  // About
  const [aboutHeroDesc, setAboutHeroDesc] = useState(DEFAULT_ABOUT.heroDesc);
  const [aboutHeroDescEn, setAboutHeroDescEn] = useState("");
  const [aboutParagraphs, setAboutParagraphs] = useState([DEFAULT_ABOUT.historyP1, DEFAULT_ABOUT.historyP2, DEFAULT_ABOUT.historyP3]);
  const [aboutParagraphsEn, setAboutParagraphsEn] = useState(["", "", ""]);
  const [aboutCoreValues, setAboutCoreValues] = useState(DEFAULT_CORE_VALUES);
  const [aboutSaveLoading, setAboutSaveLoading] = useState(false);

  // Divisions
  const [divisions, setDivisions] = useState([]);
  const [divEditId, setDivEditId] = useState("");
  const [divEditCoverUrl, setDivEditCoverUrl] = useState("");
  const [divName, setDivName] = useState("");
  const [divNameEn, setDivNameEn] = useState("");
  const [divDesc, setDivDesc] = useState("");
  const [divDescEn, setDivDescEn] = useState("");
  const [divOrder, setDivOrder] = useState(0);
  const [divCoverFile, setDivCoverFile] = useState(null);
  const [divSaveLoading, setDivSaveLoading] = useState(false);

  // Mentors
  const [mentors, setMentors] = useState([]);
  const [mentorEditId, setMentorEditId] = useState("");
  const [mentorEditPhotoUrl, setMentorEditPhotoUrl] = useState("");
  const [mentorName, setMentorName] = useState("");
  const [mentorSubject, setMentorSubject] = useState("");
  const [mentorStartYear, setMentorStartYear] = useState("");
  const [mentorEndYear, setMentorEndYear] = useState("");
  const [mentorOrder, setMentorOrder] = useState(0);
  const [mentorEmail, setMentorEmail] = useState("");
  const [mentorPhone, setMentorPhone] = useState("");
  const [mentorBio, setMentorBio] = useState("");
  const [mentorPhotoFile, setMentorPhotoFile] = useState(null);
  const [mentorSaveLoading, setMentorSaveLoading] = useState(false);

  // Contact
  const [contactEmail, setContactEmail] = useState(DEFAULT_CONTACT.email);
  const [contactPhone, setContactPhone] = useState(DEFAULT_CONTACT.phone);
  const [contactAddress, setContactAddress] = useState(DEFAULT_CONTACT.address);
  const [contactAddressEn, setContactAddressEn] = useState("No. 29, Nanganglixingzhong Rd., Nangang Dist., Taipei City");
  const [contactCity, setContactCity] = useState(DEFAULT_CONTACT.city);
  const [contactSaveLoading, setContactSaveLoading] = useState(false);

  const DEFAULT_TIERS = [
    { key: "diamond", tier: "鑽石級", amount: "$5,000+ USD", desc: "主機甲最大面積 Logo、全套文宣、社群媒體特別致謝" },
    { key: "gold",    tier: "黃金級", amount: "$2,000+ USD", desc: "機甲中型 Logo、隊服印製、網站首頁 Logo" },
    { key: "silver",  tier: "白銀級", amount: "$500+ USD",   desc: "機身精緻 Logo、網站首頁 Logo" },
  ];
  const [showSponsorTiers, setShowSponsorTiers] = useState(true);
  const [sponsorTiers, setSponsorTiers] = useState(DEFAULT_TIERS);
  const [packetUrl, setPacketUrl] = useState("");
  const [packetFile, setPacketFile] = useState(null);
  const [packetSaveLoading, setPacketSaveLoading] = useState(false);

  // ---- Fetch functions ----
  const fetchBlogPosts = async () => {
    try {
      const snap = await getDocs(collection(db, "blog"));
      const list = [];
      snap.forEach(d => list.push({ id: d.id, ...d.data() }));
      list.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      setBlogPosts(list);
    } catch (err) { console.warn(err); }
  };

  const fetchCarousel = async () => {
    try {
      const snap = await getDoc(doc(db, "settings", "homepage"));
      if (snap.exists() && snap.data().carousel && snap.data().carousel.length > 0) {
        setCarouselSlides(snap.data().carousel);
      } else {
        await setDoc(doc(db, "settings", "homepage"), { carousel: DEFAULT_SLIDES }, { merge: true });
        setCarouselSlides(DEFAULT_SLIDES);
      }
    } catch (err) { console.warn(err); setCarouselSlides([]); }
  };

  const fetchBentoCards = async () => {
    try {
      const snap = await getDocs(collection(db, "bento_cards"));
      if (snap.empty) {
        for (const card of DEFAULT_BENTO_CARDS) {
          await setDoc(doc(db, "bento_cards", card.id), card);
        }
        setBentoCards(DEFAULT_BENTO_CARDS);
      } else {
        const list = [];
        snap.forEach(d => list.push({ id: d.id, ...d.data() }));
        list.sort((a, b) => (a.order || 0) - (b.order || 0));
        setBentoCards(list);
      }
    } catch (err) { console.warn(err); }
  };

  const fetchSponsors = async () => {
    try {
      const snap = await getDocs(collection(db, "sponsors"));
      const list = [];
      snap.forEach(d => list.push({ id: d.id, ...d.data() }));
      setSponsors(list);
    } catch (err) { console.warn(err); }
  };

  const fetchFinance = async () => {
    try {
      const snap = await getDocs(collection(db, "finance"));
      const list = [];
      snap.forEach(d => list.push({ id: d.id, ...d.data() }));
      list.sort((a, b) => (b.date || "").localeCompare(a.date || ""));
      setFinanceEntries(list);
    } catch (err) { console.warn(err); }
  };

  const fetchRobots = async () => {
    try {
      const snap = await getDocs(collection(db, "robots"));
      const list = [];
      snap.forEach(d => list.push({ id: d.id, ...d.data() }));
      list.sort((a, b) => parseInt(b.year) - parseInt(a.year));
      setRobots(list);
    } catch (err) { console.warn(err); }
  };

  const fetchSocials = async () => {
    try {
      const snap = await getDoc(doc(db, "settings", "socials"));
      if (snap.exists()) {
        const d = snap.data();
        setInstagram(d.instagram || ""); setFacebook(d.facebook || "");
        setYoutube(d.youtube || ""); setGithub(d.github || "");
        setTwitter(d.twitter || ""); setTbaLink(d.tba || ""); setFirstLink(d.first || "");
      }
    } catch (err) { console.warn(err); }
  };

  const fetchAbout = async () => {
    try {
      const snap = await getDoc(doc(db, "pages", "about"));
      if (snap.exists()) {
        const d = snap.data();
        setAboutHeroDesc(d.heroDesc || DEFAULT_ABOUT.heroDesc);
        setAboutHeroDescEn(d.heroDesc_en || "");
        const paras = d.paragraphs && d.paragraphs.length > 0
          ? d.paragraphs
          : [d.historyP1, d.historyP2, d.historyP3].filter(Boolean);
        setAboutParagraphs(paras);
        setAboutParagraphsEn(d.paragraphs_en && d.paragraphs_en.length > 0 ? d.paragraphs_en : paras.map(() => ""));
        if (d.coreValues && d.coreValues.length > 0) setAboutCoreValues(d.coreValues);
      }
    } catch (err) { console.warn(err); }
  };

  const fetchDivisions = async () => {
    try {
      const snap = await getDocs(collection(db, "divisions"));
      const list = [];
      snap.forEach(d => list.push({ id: d.id, ...d.data() }));
      list.sort((a, b) => (a.order || 0) - (b.order || 0));
      setDivisions(list);
    } catch (err) { console.warn(err); }
  };

  const fetchMentors = async () => {
    try {
      const snap = await getDocs(collection(db, "mentors"));
      const list = [];
      snap.forEach(d => list.push({ id: d.id, ...d.data() }));
      list.sort((a, b) => (a.order ?? 99) - (b.order ?? 99) || (a.startYear || 0) - (b.startYear || 0));
      setMentors(list);
    } catch (err) { console.warn(err); }
  };

  const fetchContact = async () => {
    try {
      const snap = await getDoc(doc(db, "settings", "contact"));
      if (snap.exists()) {
        const d = snap.data();
        setContactEmail(d.email || DEFAULT_CONTACT.email);
        setContactPhone(d.phone || "");
        setContactAddress(d.address || DEFAULT_CONTACT.address);
        setContactAddressEn(d.address_en || "No. 29, Nanganglixingzhong Rd., Nangang Dist., Taipei City");
        setContactCity(d.city || DEFAULT_CONTACT.city);
        setShowSponsorTiers(d.showTiers !== false);
        const LEGACY_KEYS = ["diamond", "gold", "silver"];
        const loaded = Array.isArray(d.tiers) ? d.tiers : DEFAULT_TIERS;
        setSponsorTiers(loaded.map((t, i) => ({ ...t, key: t.key || LEGACY_KEYS[i] || `tier_${i}` })));
        setPacketUrl(d.packetUrl || "");
      }
    } catch (err) { console.warn(err); }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        try {
          const docSnap = await getDoc(doc(db, "users", currentUser.uid));
          const role = docSnap.exists() ? (docSnap.data().role || "visitor") : "visitor";
          if (role === "students" || role === "teacher" || role === "admin") {
            await Promise.all([
              fetchBlogPosts(), fetchCarousel(), fetchBentoCards(),
              fetchSponsors(), fetchRobots(), fetchSocials(),
              fetchAbout(), fetchContact(), fetchDivisions(), fetchMentors(),
              fetchFinance()
            ]);
          } else {
            navigate("/");
          }
        } catch (err) { console.error(err); navigate("/"); }
        finally { setLoading(false); }
      } else {
        navigate("/");
      }
    });
    return () => unsubscribe();
  }, [navigate]);

  // ---- Upload helper (with client-side compression for images) ----
  const handleUpload = async (file, folder, customId) => {
    let fileToUpload = file;
    if (file.type.startsWith("image/") && !file.type.includes("gif")) {
      try {
        fileToUpload = await imageCompression(file, {
          maxSizeMB: 1.5,
          maxWidthOrHeight: 1920,
          useWebWorker: true,
        });
      } catch { /* fallback to original if compression fails */ }
    }
    const cleanName = file.name.replace(/[^a-zA-Z0-9.]/g, "_");
    const storageRef = ref(storage, `${folder}/${customId}_${cleanName}`);
    const task = uploadBytesResumable(storageRef, fileToUpload);
    return new Promise((resolve, reject) => {
      task.on("state_changed",
        s => setUploadProgress(p => ({ ...p, [folder]: Math.round(s.bytesTransferred / s.totalBytes * 100) })),
        err => { setUploadProgress(p => ({ ...p, [folder]: null })); reject(err); },
        async () => { const url = await getDownloadURL(task.snapshot.ref); setUploadProgress(p => ({ ...p, [folder]: null })); resolve(url); }
      );
    });
  };

  const ProgressBar = ({ folder }) => uploadProgress[folder] != null
    ? <div style={{ marginTop: "6px" }}><div style={{ width: `${uploadProgress[folder]}%`, height: "3px", background: "var(--accent)", borderRadius: "2px" }} /><span style={{ fontSize: "11px", color: "var(--text-muted)" }}>上傳中 {uploadProgress[folder]}%</span></div>
    : null;

  // ---- Blog ----
  const resetBlogForm = () => {
    setBlogEditId(""); setBlogEditImage(""); setBlogTitle(""); setBlogTitleEn("");
    setBlogContent(""); setBlogContentEn(""); setBlogAuthor(""); setBlogImageFile(null);
    const fi = document.getElementById("blog-img-input"); if (fi) fi.value = "";
  };

  const handleBlogEditLoad = (post) => {
    setBlogEditId(post.id); setBlogEditImage(post.image || "");
    setBlogTitle(post.title || ""); setBlogTitleEn(post.title_en || "");
    setBlogContent(post.content || ""); setBlogContentEn(post.content_en || "");
    setBlogAuthor(post.author || ""); setBlogCategory(post.category || "日常花絮");
    setBlogImageFile(null);
    document.getElementById("blog-form-section")?.scrollIntoView({ behavior: "smooth" });
  };

  const handleBlogSubmit = async (e) => {
    e.preventDefault();
    if (!blogTitle || !blogContent || !blogAuthor) { alert("請填寫所有必填欄位！"); return; }
    if (!blogEditId && !blogImageFile) { alert("請上傳封面圖片！"); return; }
    setBlogSubmitLoading(true);
    try {
      let imageUrl = blogEditImage || "https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=800&q=80";
      if (blogImageFile) imageUrl = await handleUpload(blogImageFile, "blog", Date.now());

      // Auto-translate if English fields are empty
      let titleEn = blogTitleEn;
      let contentEn = blogContentEn;
      if (!titleEn && blogTitle) titleEn = await translateText(blogTitle);
      if (!contentEn && blogContent) contentEn = await translateText(blogContent);

      const data = {
        title: blogTitle, title_en: titleEn,
        content: blogContent, content_en: contentEn,
        author: blogAuthor, category: blogCategory, image: imageUrl,
      };
      if (blogEditId) {
        await setDoc(doc(db, "blog", blogEditId), { ...data, updatedAt: new Date().toISOString() }, { merge: true });
        alert("文章更新成功！");
      } else {
        await addDoc(collection(db, "blog"), { ...data, createdAt: new Date().toISOString() });
        alert("日誌發布成功！");
      }
      resetBlogForm();
      await fetchBlogPosts();
    } catch (err) { console.error(err); alert("儲存失敗！"); }
    finally { setBlogSubmitLoading(false); }
  };

  const handleBlogDelete = async (id) => {
    if (!window.confirm("確定要刪除這篇文章嗎？")) return;
    try { await deleteDoc(doc(db, "blog", id)); if (blogEditId === id) resetBlogForm(); await fetchBlogPosts(); }
    catch (err) { console.error(err); alert("刪除失敗。"); }
  };

  const handleBatchTranslatePosts = async () => {
    const missing = blogPosts.filter(p => !p.title_en || !p.content_en);
    if (missing.length === 0) { alert("所有文章都已有英文版本！"); return; }
    if (!window.confirm(`將對 ${missing.length} 篇缺少英文版的文章進行自動翻譯，可能需要數分鐘。確認繼續？`)) return;
    setBatchTranslating(true);
    let count = 0;
    try {
      for (const post of missing) {
        const updates = {};
        if (!post.title_en && post.title) updates.title_en = await translateText(post.title);
        if (!post.content_en && post.content) updates.content_en = await translateText(post.content);
        if (Object.keys(updates).length > 0) {
          await setDoc(doc(db, "blog", post.id), updates, { merge: true });
          count++;
        }
      }
      alert(`完成！已翻譯 ${count} 篇文章。`);
      await fetchBlogPosts();
    } catch (err) { console.error(err); alert("部分文章翻譯失敗，請再試一次。"); }
    finally { setBatchTranslating(false); }
  };

  // ---- Carousel ----
  const resetCarouselForm = () => {
    setSlideEditId(""); setSlideTitle(""); setSlideTitleEn(""); setSlideSubtitle(""); setSlideSubtitleEn(""); setSlideImageFile(null);
    const fi = document.getElementById("carousel-file-input"); if (fi) fi.value = "";
  };

  const handleSlideEditLoad = (slide) => {
    setSlideEditId(slide.id); setSlideTitle(slide.title || ""); setSlideTitleEn(slide.title_en || "");
    setSlideSubtitle(slide.subtitle || ""); setSlideSubtitleEn(slide.subtitle_en || ""); setSlideImageFile(null);
    document.getElementById("carousel-form-section")?.scrollIntoView({ behavior: "smooth" });
  };

  const handleCarouselSave = async (e) => {
    e.preventDefault();
    if (!slideEditId && !slideImageFile) { alert("請上傳一張輪播相片！"); return; }
    setCarouselSaveLoading(true);
    try {
      if (slideEditId) {
        // Edit existing slide
        let updated = carouselSlides.map(s => s.id === slideEditId
          ? { ...s, title: slideTitle, title_en: slideTitleEn, subtitle: slideSubtitle, subtitle_en: slideSubtitleEn,
              ...(slideImageFile ? {} : {}) } // image only updates if file selected below
          : s
        );
        if (slideImageFile) {
          const imageUrl = await handleUpload(slideImageFile, "carousel", slideEditId);
          updated = updated.map(s => s.id === slideEditId ? { ...s, image: imageUrl } : s);
        }
        await setDoc(doc(db, "settings", "homepage"), { carousel: updated }, { merge: true });
        alert("輪播圖更新成功！");
        resetCarouselForm();
      } else {
        // New slide
        const slideId = "slide_" + Date.now();
        const imageUrl = await handleUpload(slideImageFile, "carousel", slideId);
        const updated = [...carouselSlides, { id: slideId, image: imageUrl, title: slideTitle, title_en: slideTitleEn, subtitle: slideSubtitle, subtitle_en: slideSubtitleEn }];
        await setDoc(doc(db, "settings", "homepage"), { carousel: updated }, { merge: true });
        alert("新增輪播相片成功！");
        resetCarouselForm();
      }
      await fetchCarousel();
    } catch (err) { console.error(err); alert("儲存失敗。"); }
    finally { setCarouselSaveLoading(false); }
  };

  const handleDeleteCarouselSlide = async (slideId) => {
    if (!window.confirm("確定要刪除此輪播圖嗎？")) return;
    setCarouselSaveLoading(true);
    try {
      const updated = carouselSlides.filter(s => s.id !== slideId);
      await setDoc(doc(db, "settings", "homepage"), { carousel: updated }, { merge: true });
      if (slideEditId === slideId) resetCarouselForm();
      await fetchCarousel();
    } catch (err) { console.error(err); alert("刪除失敗。"); }
    finally { setCarouselSaveLoading(false); }
  };

  // ---- Bento ----
  const handleBentoSave = async (e) => {
    e.preventDefault();
    if (!bentoTitle || !bentoContent) { alert("請填寫標題與內容！"); return; }
    setBentoSaveLoading(true);
    try {
      const id = bentoId || "bento_" + Date.now();
      await setDoc(doc(db, "bento_cards", id), { id, title: bentoTitle, title_en: bentoTitleEn, content: bentoContent, content_en: bentoContentEn, size: bentoSize, theme: bentoTheme, order: parseInt(bentoOrder) || 0, link: bentoLink || "" });
      alert(bentoId ? "卡片更新成功！" : "卡片新增成功！");
      setBentoId(""); setBentoTitle(""); setBentoTitleEn(""); setBentoContent(""); setBentoContentEn(""); setBentoSize("1x1"); setBentoTheme("white"); setBentoOrder(0); setBentoLink("");
      await fetchBentoCards();
    } catch (err) { console.error(err); alert("儲存失敗。"); }
    finally { setBentoSaveLoading(false); }
  };

  const handleBentoEditLoad = (card) => {
    setBentoId(card.id); setBentoTitle(card.title || ""); setBentoTitleEn(card.title_en || "");
    setBentoContent(card.content || ""); setBentoContentEn(card.content_en || "");
    setBentoSize(card.size || "1x1"); setBentoTheme(card.theme || "white"); setBentoOrder(card.order || 0); setBentoLink(card.link || "");
    document.getElementById("bento-form-section")?.scrollIntoView({ behavior: "smooth" });
  };

  const handleBentoDelete = async (id) => {
    if (!window.confirm("確定要刪除此卡片嗎？")) return;
    try { await deleteDoc(doc(db, "bento_cards", id)); await fetchBentoCards(); }
    catch (err) { console.error(err); alert("刪除失敗。"); }
  };

  // ---- Sponsors ----
  const resetSponsorForm = () => {
    setSponsorEditId(""); setSponsorEditLogo(""); setSponsorName(""); setSponsorUrl("");
    setSponsorLogoFile(null); setSponsorTier("");
    const fi = document.getElementById("sponsor-file-input"); if (fi) fi.value = "";
  };

  const handleSponsorEditLoad = (sponsor) => {
    setSponsorEditId(sponsor.id); setSponsorEditLogo(sponsor.logo || "");
    setSponsorName(sponsor.name || ""); setSponsorUrl(sponsor.url || "");
    setSponsorTier(sponsor.tier || "diamond"); setSponsorLogoFile(null);
    document.getElementById("sponsor-form-section")?.scrollIntoView({ behavior: "smooth" });
  };

  const handleSponsorSubmit = async (e) => {
    e.preventDefault();
    if (!sponsorName) { alert("請填寫名稱！"); return; }
    if (!sponsorEditId && !sponsorLogoFile) { alert("請上傳 LOGO！"); return; }
    setSponsorSubmitLoading(true);
    try {
      const id = sponsorEditId || "sponsor_" + Date.now();
      const logoUrl = sponsorLogoFile ? await handleUpload(sponsorLogoFile, "sponsors", id) : sponsorEditLogo;
      await setDoc(doc(db, "sponsors", id), { id, name: sponsorName, logo: logoUrl, url: sponsorUrl, tier: sponsorTier, createdAt: new Date().toISOString() });
      alert(sponsorEditId ? "贊助商更新成功！" : "贊助商新增成功！");
      resetSponsorForm();
      await fetchSponsors();
    } catch (err) { console.error(err); alert("儲存失敗。"); }
    finally { setSponsorSubmitLoading(false); }
  };

  const handleSponsorDelete = async (id) => {
    if (!window.confirm("確定要刪除此贊助商嗎？")) return;
    try { await deleteDoc(doc(db, "sponsors", id)); if (sponsorEditId === id) resetSponsorForm(); await fetchSponsors(); }
    catch (err) { console.error(err); alert("刪除失敗。"); }
  };

  const resetFinanceForm = () => {
    setFinanceEditId(""); setFinanceEditReceipt(""); setFinanceType("income");
    setFinanceDate(""); setFinanceTitle(""); setFinanceCategory("贊助");
    setFinanceAmount(""); setFinanceNote(""); setFinanceReceiptFile(null);
    const fi = document.getElementById("finance-receipt-input"); if (fi) fi.value = "";
  };

  const handleFinanceEditLoad = (entry) => {
    setFinanceEditId(entry.id); setFinanceEditReceipt(entry.receiptUrl || "");
    setFinanceType(entry.type || "income"); setFinanceDate(entry.date || "");
    setFinanceTitle(entry.title || ""); setFinanceCategory(entry.category || "贊助");
    setFinanceAmount(entry.amount != null ? String(entry.amount) : "");
    setFinanceNote(entry.note || ""); setFinanceReceiptFile(null);
    document.getElementById("finance-form-section")?.scrollIntoView({ behavior: "smooth" });
  };

  const handleFinanceSubmit = async (e) => {
    e.preventDefault();
    if (!financeDate || !financeTitle || !financeAmount) { alert("請填寫日期、項目名稱與金額！"); return; }
    setFinanceSubmitLoading(true);
    try {
      const id = financeEditId || "finance_" + Date.now();
      const receiptUrl = financeReceiptFile ? await handleUpload(financeReceiptFile, "finance", id) : financeEditReceipt;
      await setDoc(doc(db, "finance", id), {
        id,
        type: financeType,
        date: financeDate,
        title: financeTitle,
        category: financeCategory,
        amount: Number(financeAmount),
        note: financeNote,
        receiptUrl,
        createdBy: auth.currentUser?.uid || "",
        createdAt: financeEditId ? (financeEntries.find(f => f.id === financeEditId)?.createdAt || new Date().toISOString()) : new Date().toISOString()
      });
      alert(financeEditId ? "收支紀錄更新成功！" : "收支紀錄新增成功！");
      resetFinanceForm();
      await fetchFinance();
    } catch (err) { console.error(err); alert("儲存失敗。"); }
    finally { setFinanceSubmitLoading(false); }
  };

  const handleFinanceDelete = async (id) => {
    if (!window.confirm("確定要刪除此筆收支紀錄嗎？")) return;
    try { await deleteDoc(doc(db, "finance", id)); if (financeEditId === id) resetFinanceForm(); await fetchFinance(); }
    catch (err) { console.error(err); alert("刪除失敗。"); }
  };

  const handleFinanceExportCsv = () => {
    const header = ["日期", "類型", "項目", "類別", "金額", "備註"];
    const rows = financeEntries.map(en => [
      en.date || "", en.type === "income" ? "收入" : "支出", en.title || "", en.category || "", en.amount ?? 0, (en.note || "").replace(/\n/g, " ")
    ]);
    const csv = [header, ...rows].map(r => r.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(",")).join("\r\n");
    const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `財務收支紀錄_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handlePacketSave = async (e) => {
    e.preventDefault();
    if (!packetFile && !packetUrl) { alert("請選擇 PDF 檔案或清除現有連結。"); return; }
    setPacketSaveLoading(true);
    try {
      let url = packetUrl;
      if (packetFile) url = await handleUpload(packetFile, "packet", "sponsorship_packet");
      await setDoc(doc(db, "settings", "contact"), { packetUrl: url }, { merge: true });
      setPacketUrl(url);
      setPacketFile(null);
      const fi = document.getElementById("packet-file-input"); if (fi) fi.value = "";
      alert("贊助企劃書上傳成功！");
    } catch (err) { console.error(err); alert("儲存失敗。"); }
    finally { setPacketSaveLoading(false); }
  };

  // ---- Robots ----
  const handleRobotAutoFill = async () => {
    const yr = robotEditId || robotYear;
    if (!yr) return;
    setRobotAutoLoading(true);
    try {
      const game = FRC_GAMES[parseInt(yr)];
      if (game) setRobotGame(game);
      const awards = await getTeamYearAwards(yr);
      if (awards.length > 0) setRobotAchievements(awards.map(a => a.name).join(", "));
    } catch { }
    finally { setRobotAutoLoading(false); }
  };

  const handleRobotSubmit = async (e) => {
    e.preventDefault();
    const docId = robotEditId || robotYear;
    if (!docId || !robotName || !robotGame || !robotDrivetrain) { alert("年份、名稱、競賽主題、底盤為必填！"); return; }
    if (!robotEditId && !robotImageFile) { alert("請上傳機器人實體照片！(必填)"); return; }
    setRobotSubmitLoading(true);
    try {
      let imageUrl = robotEditImage || "";
      if (robotImageFile) imageUrl = await handleUpload(robotImageFile, "robots", docId);
      let glbLink = robotGlbUrl;
      if (robotGlbFile) glbLink = await handleUpload(robotGlbFile, "robots_models", docId);
      await setDoc(doc(db, "robots", docId), {
        id: docId, year: docId, name: robotName, game: robotGame, drivetrain: robotDrivetrain,
        weight: robotWeight || "", image: imageUrl, glbUrl: glbLink || "",
        achievements: robotAchievements ? robotAchievements.split(",").map(a => a.trim()).filter(Boolean) : []
      });
      alert(robotEditId ? "機器人資料更新成功！" : "機器人資料新增成功！");
      resetRobotForm();
      await fetchRobots();
    } catch (err) { console.error(err); alert("儲存失敗。"); }
    finally { setRobotSubmitLoading(false); }
  };

  const resetRobotForm = () => {
    setRobotEditId(""); setRobotEditImage(""); setRobotYear(""); setRobotName("");
    setRobotGame(""); setRobotDrivetrain(""); setRobotWeight(""); setRobotAchievements("");
    setRobotGlbUrl(""); setRobotImageFile(null); setRobotGlbFile(null);
    const ii = document.getElementById("robot-img-input"); if (ii) ii.value = "";
    const gi = document.getElementById("robot-glb-input"); if (gi) gi.value = "";
  };

  const handleRobotEditLoad = (robot) => {
    setRobotEditId(robot.year); setRobotEditImage(robot.image || "");
    setRobotYear(robot.year); setRobotName(robot.name || ""); setRobotGame(robot.game || "");
    setRobotDrivetrain(robot.drivetrain || ""); setRobotWeight(robot.weight || "");
    setRobotAchievements((robot.achievements || []).join(", "));
    setRobotGlbUrl(robot.glbUrl || ""); setRobotImageFile(null); setRobotGlbFile(null);
    document.getElementById("robot-form-section")?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const handleRobotDelete = async (id) => {
    if (!window.confirm("確定要刪除此機器人嗎？")) return;
    try { await deleteDoc(doc(db, "robots", id)); if (robotEditId === id) resetRobotForm(); await fetchRobots(); }
    catch (err) { console.error(err); alert("刪除失敗。"); }
  };

  // ---- Socials ----
  const handleSocialsSave = async (e) => {
    e.preventDefault();
    setSocialsSaveLoading(true);
    try {
      await setDoc(doc(db, "settings", "socials"), { instagram, facebook, youtube, github, twitter, tba: tbaLink, first: firstLink, updatedAt: new Date().toISOString() }, { merge: true });
      alert("社群設定儲存成功！");
    } catch (err) { console.error(err); alert("儲存失敗。"); }
    finally { setSocialsSaveLoading(false); }
  };

  // ---- About ----
  const handleAboutSave = async (e) => {
    e.preventDefault();
    setAboutSaveLoading(true);
    try {
      await setDoc(doc(db, "pages", "about"), {
        heroDesc: aboutHeroDesc, heroDesc_en: aboutHeroDescEn,
        paragraphs: aboutParagraphs, paragraphs_en: aboutParagraphsEn,
        coreValues: aboutCoreValues
      });
      alert("關於頁面儲存成功！");
    }
    catch (err) { console.error(err); alert("儲存失敗。"); }
    finally { setAboutSaveLoading(false); }
  };

  const handleParagraphChange = (idx, val) => setAboutParagraphs(p => p.map((x, i) => i === idx ? val : x));
  const handleParagraphEnChange = (idx, val) => setAboutParagraphsEn(p => p.map((x, i) => i === idx ? val : x));
  const handleParagraphDelete = (idx) => {
    setAboutParagraphs(p => p.filter((_, i) => i !== idx));
    setAboutParagraphsEn(p => p.filter((_, i) => i !== idx));
  };
  const handleParagraphAdd = () => { setAboutParagraphs(p => [...p, ""]); setAboutParagraphsEn(p => [...p, ""]); };

  // ---- Divisions ----
  const resetDivForm = () => {
    setDivEditId(""); setDivEditCoverUrl(""); setDivName(""); setDivNameEn("");
    setDivDesc(""); setDivDescEn(""); setDivOrder(0); setDivCoverFile(null);
    const fi = document.getElementById("div-cover-input"); if (fi) fi.value = "";
  };

  const handleDivEditLoad = (div) => {
    setDivEditId(div.id); setDivEditCoverUrl(div.coverImage || "");
    setDivName(div.name || ""); setDivNameEn(div.name_en || "");
    setDivDesc(div.description || ""); setDivDescEn(div.description_en || "");
    setDivOrder(div.order || 0); setDivCoverFile(null);
    document.getElementById("div-form-section")?.scrollIntoView({ behavior: "smooth" });
  };

  const handleDivSave = async (e) => {
    e.preventDefault();
    if (!divName) { alert("請填寫組別名稱！"); return; }
    setDivSaveLoading(true);
    try {
      let coverUrl = divEditCoverUrl || "";
      if (divCoverFile) coverUrl = await handleUpload(divCoverFile, "div_covers", divEditId || Date.now());
      const data = {
        name: divName, name_en: divNameEn,
        description: divDesc, description_en: divDescEn,
        coverImage: coverUrl, order: parseInt(divOrder) || 0
      };
      if (divEditId) {
        await setDoc(doc(db, "divisions", divEditId), data, { merge: true });
        alert("組別更新成功！");
      } else {
        await addDoc(collection(db, "divisions"), data);
        alert("組別新增成功！");
      }
      resetDivForm();
      await fetchDivisions();
    } catch (err) { console.error(err); alert("儲存失敗。"); }
    finally { setDivSaveLoading(false); }
  };

  const handleDivDelete = async (id) => {
    if (!window.confirm("確定要刪除此組別嗎？")) return;
    try { await deleteDoc(doc(db, "divisions", id)); if (divEditId === id) resetDivForm(); await fetchDivisions(); }
    catch (err) { console.error(err); alert("刪除失敗。"); }
  };

  // ---- Mentors ----
  const resetMentorForm = () => {
    setMentorEditId(""); setMentorEditPhotoUrl(""); setMentorName(""); setMentorSubject("");
    setMentorStartYear(""); setMentorEndYear(""); setMentorOrder(0); setMentorEmail(""); setMentorPhone(""); setMentorBio(""); setMentorPhotoFile(null);
    const fi = document.getElementById("mentor-photo-input"); if (fi) fi.value = "";
  };

  const handleMentorEditLoad = (mentor) => {
    setMentorEditId(mentor.id); setMentorEditPhotoUrl(mentor.photo || "");
    setMentorName(mentor.name || ""); setMentorSubject(mentor.subject || "");
    setMentorStartYear(mentor.startYear || ""); setMentorEndYear(mentor.endYear || "");
    setMentorOrder(mentor.order ?? 0); setMentorEmail(mentor.email || ""); setMentorPhone(mentor.phone || ""); setMentorBio(mentor.bio || ""); setMentorPhotoFile(null);
    document.getElementById("mentor-form-section")?.scrollIntoView({ behavior: "smooth" });
  };

  const handleMentorSave = async (e) => {
    e.preventDefault();
    if (!mentorName || !mentorStartYear) { alert("請填寫姓名和起始年！"); return; }
    setMentorSaveLoading(true);
    try {
      let photoUrl = mentorEditPhotoUrl || "";
      if (mentorPhotoFile) photoUrl = await handleUpload(mentorPhotoFile, "mentor_photos", mentorEditId || Date.now());
      const data = {
        name: mentorName, subject: mentorSubject,
        startYear: parseInt(mentorStartYear) || null,
        endYear: mentorEndYear ? parseInt(mentorEndYear) : null,
        order: parseInt(mentorOrder) || 0,
        email: mentorEmail, phone: mentorPhone,
        photo: photoUrl, bio: mentorBio
      };
      if (mentorEditId) {
        await setDoc(doc(db, "mentors", mentorEditId), data, { merge: true });
        alert("老師資料更新成功！");
      } else {
        await addDoc(collection(db, "mentors"), data);
        alert("老師新增成功！");
      }
      resetMentorForm();
      await fetchMentors();
    } catch (err) { console.error(err); alert("儲存失敗。"); }
    finally { setMentorSaveLoading(false); }
  };

  const handleMentorDelete = async (id) => {
    if (!window.confirm("確定要刪除此老師嗎？")) return;
    try { await deleteDoc(doc(db, "mentors", id)); if (mentorEditId === id) resetMentorForm(); await fetchMentors(); }
    catch (err) { console.error(err); alert("刪除失敗。"); }
  };

  // ---- Contact ----
  const handleContactSave = async (e) => {
    e.preventDefault();
    setContactSaveLoading(true);
    try {
      await setDoc(doc(db, "settings", "contact"), { email: contactEmail, phone: contactPhone, address: contactAddress, address_en: contactAddressEn, city: contactCity, showTiers: showSponsorTiers, tiers: sponsorTiers, updatedAt: new Date().toISOString() }, { merge: true });
      alert("聯絡資訊儲存成功！");
    } catch (err) { console.error(err); alert("儲存失敗。"); }
    finally { setContactSaveLoading(false); }
  };

  if (loading) {
    return (
      <div className="container" style={{ paddingTop: "100px", paddingBottom: "100px", textAlign: "center" }}>
        <div className="spinner" style={{ margin: "0 auto" }} />
        <p style={{ marginTop: "20px" }}>載入內容管理系統中...</p>
      </div>
    );
  }

  const TABS = [
    { id: "carousel", label: "首頁輪播" },
    { id: "bento", label: "首頁卡片" },
    { id: "robots", label: "歷年機器人" },
    { id: "blog", label: "活動花絮" },
    { id: "sponsors", label: "合作夥伴" },
    { id: "finance", label: "財務管理" },
    { id: "about", label: "隊伍總覽" },
    { id: "divisions", label: "組別管理" },
    { id: "mentors", label: "指導老師" },
    { id: "contact", label: "聯絡我們" },
    { id: "socials", label: "社群設定" },
  ];

  return (
    <main className="container" style={{ paddingTop: "40px", paddingBottom: "80px" }} id="cms-page">
      <div className="cms-mobile-notice">
        <span style={{ fontSize: "28px" }}>🖥️</span>
        <h3 style={{ marginTop: "12px", fontSize: "18px", fontWeight: 700 }}>請使用電腦或平板操作</h3>
        <p style={{ marginTop: "8px", fontSize: "14px", color: "var(--text-muted)", lineHeight: "1.6", maxWidth: "260px" }}>
          內容管理中心需要較大的螢幕空間。請切換至電腦或平板瀏覽器以使用 CMS 後台。
        </p>
      </div>

      <div className="cms-desktop-content">
        <div style={{ borderBottom: "1px solid rgba(0,0,0,0.06)", paddingBottom: "16px", marginBottom: "28px" }}>
          <h2>內容管理中心</h2>
          <p>管理網站各頁面內容、媒體資源與發布設定。藍色欄位為英文版本，可點「自動翻譯」填入。</p>
        </div>

        <div style={{ display: "flex", gap: "4px", flexWrap: "wrap", marginBottom: "32px", padding: "5px", background: "#EAECF0", borderRadius: "12px" }}>
          {TABS.map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)} style={{
              padding: "8px 16px", fontSize: "13px", fontWeight: 600, border: "none", cursor: "pointer",
              borderRadius: "8px", background: activeTab === tab.id ? "#ffffff" : "transparent",
              color: activeTab === tab.id ? "var(--text-main)" : "var(--text-muted)",
              boxShadow: activeTab === tab.id ? "0 1px 4px rgba(0,0,0,0.08)" : "none", transition: "all 0.15s"
            }}>
              {tab.label}
            </button>
          ))}
        </div>

        {/* ====== BLOG ====== */}
        {activeTab === "blog" && (
          <div style={V_STACK}>
            <div style={PANEL}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
                <h3>已發布文章 ({blogPosts.length})</h3>
                <button
                  type="button"
                  onClick={handleBatchTranslatePosts}
                  disabled={batchTranslating || blogPosts.length === 0}
                  style={{ fontSize: "12px", padding: "6px 14px", border: "1px solid #0AAEE8", borderRadius: "6px", background: "rgba(10,174,232,0.06)", color: "#0AAEE8", cursor: "pointer", fontWeight: 700 }}
                >
                  {batchTranslating ? "翻譯中…" : "🌐 批量補齊英文"}
                </button>
              </div>
              {blogPosts.length === 0
                ? <p style={{ color: "var(--text-muted)", fontSize: "14px" }}>尚無已發布文章。</p>
                : <div style={{ display: "flex", flexDirection: "column", gap: "10px", maxHeight: "400px", overflowY: "auto" }}>
                    {blogPosts.map(post => (
                      <div key={post.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 14px", border: `1px solid ${blogEditId === post.id ? "var(--accent)" : "#EAECF0"}`, borderRadius: "10px", background: blogEditId === post.id ? "rgba(10,174,232,0.04)" : "#fff", gap: "12px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "12px", flex: 1, minWidth: 0 }}>
                          <img src={post.image} alt={post.title} style={{ height: "44px", width: "44px", objectFit: "cover", borderRadius: "6px", flexShrink: 0 }} />
                          <div style={{ minWidth: 0 }}>
                            <div style={{ fontSize: "14px", fontWeight: 700, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{post.title}</div>
                            <div style={{ fontSize: "11px", color: "var(--text-muted)", marginTop: "2px" }}>{post.author} · {post.category} · {post.createdAt ? new Date(post.createdAt).toLocaleDateString("zh-TW") : ""}</div>
                          </div>
                        </div>
                        <div style={{ display: "flex", gap: "6px" }}>
                          <button onClick={() => handleBlogEditLoad(post)} style={EDIT_BTN}>編輯</button>
                          <button onClick={() => handleBlogDelete(post.id)} style={DEL_BTN}>刪除</button>
                        </div>
                      </div>
                    ))}
                  </div>
              }
            </div>

            <div style={PANEL} id="blog-form-section">
              <h3 style={{ marginBottom: "20px" }}>{blogEditId ? "編輯文章" : "撰寫新花絮日誌"}</h3>
              <form onSubmit={handleBlogSubmit}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "16px" }}>
                  <div className="form-group">
                    <label>文章標題</label>
                    <input type="text" placeholder="例如：2024 賽季組裝日常" value={blogTitle} onChange={e => setBlogTitle(e.target.value)} required />
                    <EnField zhValue={blogTitle} value={blogTitleEn} onChange={setBlogTitleEn} label="Title" />
                  </div>
                  <div className="form-group">
                    <label>作者與組別</label>
                    <input type="text" placeholder="例如：宣傳組 小明" value={blogAuthor} onChange={e => setBlogAuthor(e.target.value)} required />
                  </div>
                  <div className="form-group">
                    <label>分類標籤</label>
                    <select value={blogCategory} onChange={e => setBlogCategory(e.target.value)} className="role-select" style={{ width: "100%", padding: "12px" }}>
                      <option value="日常花絮">日常花絮</option>
                      <option value="賽事報導">賽事報導</option>
                      <option value="機械機構">機械機構</option>
                      <option value="程式控制">程式控制</option>
                      <option value="公關行銷">公關行銷</option>
                    </select>
                  </div>
                </div>
                <div className="form-group">
                  <label>封面圖片{blogEditId ? " (不選則保留原圖)" : " *必填"}</label>
                  {blogEditId && blogEditImage && (
                    <img src={blogEditImage} alt="" style={{ height: "48px", width: "80px", objectFit: "cover", borderRadius: "6px", marginBottom: "6px", display: "block" }} />
                  )}
                  <input type="file" id="blog-img-input" accept="image/*" onChange={e => setBlogImageFile(e.target.files[0])} />
                  <ProgressBar folder="blog" />
                </div>
                <div className="form-group">
                  <label>文章內容</label>
                  <TiptapEditor
                    key={blogEditId || "new"}
                    value={blogContent}
                    onChange={setBlogContent}
                    onImageUpload={file => handleUpload(file, "blog_images", Date.now())}
                    placeholder="開始撰寫文章... (# 標題、**粗體**、- 清單)"
                  />
                  <EnField zhValue={blogContent} value={blogContentEn} onChange={setBlogContentEn} label="Content (EN)" rich onImageUpload={file => handleUpload(file, "blog_images", Date.now())} />
                </div>
                <div style={{ display: "flex", gap: "10px" }}>
                  <button type="submit" disabled={blogSubmitLoading} className="btn btn-primary" style={{ padding: "12px 28px" }}>
                    {blogSubmitLoading ? "儲存中..." : blogEditId ? "更新文章" : "確認發布文章"}
                  </button>
                  {blogEditId && (
                    <button type="button" className="btn btn-outline" onClick={resetBlogForm}>取消編輯</button>
                  )}
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ====== CAROUSEL ====== */}
        {activeTab === "carousel" && (
          <div style={V_STACK}>
            <div style={PANEL}>
              <h3 style={{ marginBottom: "20px" }}>目前輪播圖片 ({carouselSlides.length})</h3>
              {carouselSlides.length === 0
                ? <p style={{ color: "var(--text-muted)", fontSize: "14px" }}>尚無輪播圖片。</p>
                : <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: "16px" }}>
                    {carouselSlides.map(slide => (
                      <div key={slide.id} style={{ border: `1px solid ${slideEditId === slide.id ? "var(--accent)" : "#EAECF0"}`, borderRadius: "10px", overflow: "hidden" }}>
                        <img src={slide.image} alt={slide.title} style={{ width: "100%", height: "120px", objectFit: "cover" }} />
                        <div style={{ padding: "10px 12px", display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "8px" }}>
                          <div>
                            <div style={{ fontSize: "13px", fontWeight: 700 }}>{slide.title || "無標題"}</div>
                            <div style={{ fontSize: "11px", color: "var(--text-muted)", marginTop: "2px" }}>{slide.subtitle ? slide.subtitle.slice(0, 30) + "…" : "無描述"}</div>
                          </div>
                          <div style={{ display: "flex", gap: "4px", flexShrink: 0 }}>
                            <button onClick={() => handleSlideEditLoad(slide)} style={EDIT_BTN}>編輯</button>
                            <button onClick={() => handleDeleteCarouselSlide(slide.id)} style={DEL_BTN}>刪除</button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
              }
            </div>

            <div style={PANEL} id="carousel-form-section">
              <h3 style={{ marginBottom: "20px" }}>{slideEditId ? "編輯輪播圖" : "新增首頁輪播圖"}</h3>
              <form onSubmit={handleCarouselSave}>
                <div className="form-group">
                  <label>上傳輪播圖片{slideEditId ? " (不選則保留原圖)" : " *必填"}</label>
                  <input type="file" id="carousel-file-input" accept="image/*" onChange={e => setSlideImageFile(e.target.files[0])} />
                  <ProgressBar folder="carousel" />
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                  <div className="form-group">
                    <label>覆蓋主標題 (選填)</label>
                    <input type="text" placeholder="例如：用計算與熱血，將藍圖化為鋼鐵" value={slideTitle} onChange={e => setSlideTitle(e.target.value)} />
                    <EnField zhValue={slideTitle} value={slideTitleEn} onChange={setSlideTitleEn} label="Title (EN)" />
                  </div>
                  <div className="form-group">
                    <label>覆蓋描述文字 (選填)</label>
                    <input type="text" placeholder="例如：我們是 FRC 7645..." value={slideSubtitle} onChange={e => setSlideSubtitle(e.target.value)} />
                    <EnField zhValue={slideSubtitle} value={slideSubtitleEn} onChange={setSlideSubtitleEn} label="Subtitle (EN)" />
                  </div>
                </div>
                <div style={{ display: "flex", gap: "10px" }}>
                  <button type="submit" disabled={carouselSaveLoading} className="btn btn-primary" style={{ padding: "12px 28px" }}>
                    {carouselSaveLoading ? "儲存中..." : slideEditId ? "更新輪播圖" : "新增至輪播清單"}
                  </button>
                  {slideEditId && (
                    <button type="button" className="btn btn-outline" onClick={resetCarouselForm}>取消編輯</button>
                  )}
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ====== BENTO ====== */}
        {activeTab === "bento" && (
          <div style={V_STACK}>
            <div style={PANEL}>
              <h3 style={{ marginBottom: "20px" }}>首頁 Bento 卡片 ({bentoCards.length})</h3>
              {bentoCards.length === 0
                ? <p style={{ color: "var(--text-muted)", fontSize: "14px" }}>尚無卡片。</p>
                : <div style={{ display: "flex", flexDirection: "column", gap: "10px", maxHeight: "360px", overflowY: "auto" }}>
                    {bentoCards.map(card => (
                      <div key={card.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 14px", border: "1px solid #EAECF0", borderRadius: "10px" }}>
                        <div>
                          <div style={{ fontSize: "14px", fontWeight: 700 }}>{card.title}</div>
                          <div style={{ fontSize: "11px", color: "var(--text-muted)", marginTop: "2px" }}>尺寸: {card.size} · 主題: {card.theme} · 排序: {card.order}{card.link ? ` · 🔗 ${card.link}` : ""}</div>
                        </div>
                        <div style={{ display: "flex", gap: "6px" }}>
                          <button onClick={() => handleBentoEditLoad(card)} style={EDIT_BTN}>編輯</button>
                          <button onClick={() => handleBentoDelete(card.id)} style={DEL_BTN}>刪除</button>
                        </div>
                      </div>
                    ))}
                  </div>
              }
            </div>

            <div style={PANEL} id="bento-form-section">
              <h3 style={{ marginBottom: "20px" }}>{bentoId ? "編輯 Bento 卡片" : "新增 Bento 卡片"}</h3>
              <form onSubmit={handleBentoSave}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 160px 160px 80px", gap: "16px" }}>
                  <div className="form-group">
                    <label>卡片標題</label>
                    <input type="text" placeholder="例如：機械組" value={bentoTitle} onChange={e => setBentoTitle(e.target.value)} required />
                    <EnField zhValue={bentoTitle} value={bentoTitleEn} onChange={setBentoTitleEn} label="Title (EN)" />
                  </div>
                  <div className="form-group">
                    <label>尺寸</label>
                    <select value={bentoSize} onChange={e => setBentoSize(e.target.value)} className="role-select" style={{ width: "100%", padding: "12px" }}>
                      <option value="1x1">1×1 標準</option>
                      <option value="2x1">2×1 橫向寬</option>
                      <option value="1x2">1×2 縱向高</option>
                      <option value="2x2">2×2 大型</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label>配色主題</label>
                    <select value={bentoTheme} onChange={e => setBentoTheme(e.target.value)} className="role-select" style={{ width: "100%", padding: "12px" }}>
                      <option value="white">白色</option>
                      <option value="brass">隊伍藍</option>
                      <option value="dark">深色</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label>排序</label>
                    <input type="number" value={bentoOrder} onChange={e => setBentoOrder(e.target.value)} />
                  </div>
                </div>
                <div className="form-group">
                  <label>詳細介紹</label>
                  <textarea rows="3" value={bentoContent} onChange={e => setBentoContent(e.target.value)} required
                    style={{ padding: "12px", border: "1px solid #E4E7EC", borderRadius: "8px", width: "100%", fontFamily: "inherit" }} />
                  <EnField zhValue={bentoContent} value={bentoContentEn} onChange={setBentoContentEn} label="Content (EN)" multiline rows={3} />
                </div>
                <div className="form-group">
                  <label>點擊連結 (選填)</label>
                  <input type="text" placeholder="例如：/team/mechanics 或 https://example.com" value={bentoLink} onChange={e => setBentoLink(e.target.value)}
                    style={{ fontFamily: "monospace", fontSize: "13px" }} />
                  <p style={{ fontSize: "11px", color: "var(--text-muted)", marginTop: "4px" }}>/開頭為站內連結，http 開頭為外部連結（新分頁）</p>
                </div>
                <div style={{ display: "flex", gap: "10px" }}>
                  <button type="submit" disabled={bentoSaveLoading} className="btn btn-primary" style={{ padding: "12px 28px" }}>
                    {bentoSaveLoading ? "儲存中..." : bentoId ? "更新卡片" : "新增卡片"}
                  </button>
                  {bentoId && (
                    <button type="button" className="btn btn-outline" onClick={() => { setBentoId(""); setBentoTitle(""); setBentoTitleEn(""); setBentoContent(""); setBentoContentEn(""); setBentoSize("1x1"); setBentoTheme("white"); setBentoOrder(0); setBentoLink(""); }}>
                      取消編輯
                    </button>
                  )}
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ====== SPONSORS ====== */}
        {activeTab === "sponsors" && (
          <div style={V_STACK}>
            <div style={PANEL}>
              <h3 style={{ marginBottom: "20px" }}>合作夥伴清單 ({sponsors.length})</h3>
              {sponsors.length === 0
                ? <p style={{ color: "var(--text-muted)", fontSize: "14px" }}>尚無合作夥伴。</p>
                : <div style={{ display: "flex", flexDirection: "column", gap: "10px", maxHeight: "360px", overflowY: "auto" }}>
                    {sponsors.map(sponsor => (
                      <div key={sponsor.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 14px", border: `1px solid ${sponsorEditId === sponsor.id ? "var(--accent)" : "#EAECF0"}`, borderRadius: "10px", background: sponsorEditId === sponsor.id ? "rgba(10,174,232,0.04)" : "#fff" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                          <img src={sponsor.logo} alt={sponsor.name} style={{ height: "28px", width: "60px", objectFit: "contain" }} />
                          <div>
                            <div style={{ fontSize: "14px", fontWeight: 700 }}>{sponsor.name}</div>
                            <div style={{ fontSize: "11px", color: "var(--text-muted)" }}>{sponsor.tier}{sponsor.url ? " · 有連結" : ""}</div>
                          </div>
                        </div>
                        <div style={{ display: "flex", gap: "6px" }}>
                          <button onClick={() => handleSponsorEditLoad(sponsor)} style={EDIT_BTN}>編輯</button>
                          <button onClick={() => handleSponsorDelete(sponsor.id)} style={DEL_BTN}>刪除</button>
                        </div>
                      </div>
                    ))}
                  </div>
              }
            </div>

            <div style={PANEL} id="sponsor-form-section">
              <h3 style={{ marginBottom: "20px" }}>{sponsorEditId ? "編輯合作夥伴" : "新增合作夥伴"}</h3>
              <form onSubmit={handleSponsorSubmit}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                  <div className="form-group">
                    <label>贊助商名稱</label>
                    <input type="text" placeholder="例如：NASA" value={sponsorName} onChange={e => setSponsorName(e.target.value)} required />
                  </div>
                  <div className="form-group">
                    <label>官方網站連結 (選填)</label>
                    <input type="url" placeholder="https://www.example.com" value={sponsorUrl} onChange={e => setSponsorUrl(e.target.value)} />
                  </div>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 180px", gap: "16px" }}>
                  <div className="form-group">
                    <label>LOGO 圖片{sponsorEditId ? " (不選則保留原圖)" : ""}</label>
                    {sponsorEditId && sponsorEditLogo && (
                      <img src={sponsorEditLogo} alt="目前 logo" style={{ height: "32px", objectFit: "contain", marginBottom: "6px", display: "block" }} />
                    )}
                    <input type="file" id="sponsor-file-input" accept="image/*" onChange={e => setSponsorLogoFile(e.target.files[0])} />
                    <ProgressBar folder="sponsors" />
                  </div>
                  <div className="form-group">
                    <label>合作等級</label>
                    <select value={sponsorTier} onChange={e => setSponsorTier(e.target.value)} className="role-select" style={{ width: "100%", padding: "12px" }}>
                      <option value="">— 不分類 —</option>
                      {sponsorTiers.map(t => (
                        <option key={t.key} value={t.key}>{t.tier}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div style={{ display: "flex", gap: "10px" }}>
                  <button type="submit" disabled={sponsorSubmitLoading} className="btn btn-primary" style={{ padding: "12px 28px" }}>
                    {sponsorSubmitLoading ? "儲存中..." : sponsorEditId ? "更新合作夥伴" : "確認新增"}
                  </button>
                  {sponsorEditId && (
                    <button type="button" className="btn btn-outline" onClick={resetSponsorForm}>取消編輯</button>
                  )}
                </div>
              </form>
            </div>

            <div style={PANEL}>
              <h3 style={{ marginBottom: "8px" }}>贊助企劃書 (PDF)</h3>
              <p style={{ fontSize: "13px", color: "var(--text-muted)", marginBottom: "20px" }}>上傳後，合作夥伴頁面的「下載贊助企劃包」按鈕會直接連到此 PDF。</p>
              {packetUrl && (
                <div style={{ marginBottom: "16px", padding: "12px 14px", background: "#F6F7F9", borderRadius: "10px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontSize: "13px", color: "var(--text-muted)" }}>目前已上傳</span>
                  <div style={{ display: "flex", gap: "8px" }}>
                    <a href={packetUrl} target="_blank" rel="noopener noreferrer" className="btn btn-outline" style={{ padding: "6px 14px", fontSize: "12px" }}>預覽</a>
                    <button type="button" className="btn btn-outline" style={{ padding: "6px 14px", fontSize: "12px", color: "#ef4444", borderColor: "#ef4444" }}
                      onClick={async () => { if (!window.confirm("確定要移除企劃書連結嗎？")) return; await setDoc(doc(db, "settings", "contact"), { packetUrl: "" }, { merge: true }); setPacketUrl(""); }}>
                      移除
                    </button>
                  </div>
                </div>
              )}
              <form onSubmit={handlePacketSave}>
                <div className="form-group">
                  <label>選擇 PDF 檔案{packetUrl ? "（重新上傳會取代現有版本）" : ""}</label>
                  <input type="file" id="packet-file-input" accept="application/pdf" onChange={e => setPacketFile(e.target.files[0])} />
                  <ProgressBar folder="packet" />
                </div>
                <button type="submit" disabled={packetSaveLoading || !packetFile} className="btn btn-primary" style={{ padding: "12px 28px" }}>
                  {packetSaveLoading ? "上傳中..." : "上傳並儲存"}
                </button>
              </form>
            </div>

            <div style={PANEL}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                <h3>贊助分級管理</h3>
                <label style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "13px", cursor: "pointer", fontWeight: 600 }}>
                  <input type="checkbox" checked={showSponsorTiers} onChange={e => setShowSponsorTiers(e.target.checked)} />
                  顯示於聯絡頁面
                </label>
              </div>
              <p style={{ fontSize: "13px", color: "var(--text-muted)", marginBottom: "20px" }}>
                設定後，合作夥伴頁面會依等級分組顯示。若無等級，則所有贊助商顯示在同一區塊。
              </p>
              {sponsorTiers.map((t, i) => (
                <div key={t.key} style={{ background: "#F6F7F9", borderRadius: "10px", padding: "16px", marginBottom: "12px" }}>
                  <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: "8px" }}>
                    <button type="button" style={{ ...DEL_BTN, padding: "4px 10px", fontSize: "12px" }}
                      onClick={() => { if (window.confirm(`確定要刪除「${t.tier}」等級嗎？`)) setSponsorTiers(prev => prev.filter((_, idx) => idx !== i)); }}>
                      刪除此等級
                    </button>
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label>分級名稱</label>
                      <input type="text" value={t.tier} onChange={e => { const n = [...sponsorTiers]; n[i] = { ...n[i], tier: e.target.value }; setSponsorTiers(n); }} />
                    </div>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label>金額 / 門檻</label>
                      <input type="text" value={t.amount} onChange={e => { const n = [...sponsorTiers]; n[i] = { ...n[i], amount: e.target.value }; setSponsorTiers(n); }} />
                    </div>
                  </div>
                  <div className="form-group" style={{ marginBottom: 0, marginTop: "12px" }}>
                    <label>回饋說明</label>
                    <input type="text" value={t.desc} onChange={e => { const n = [...sponsorTiers]; n[i] = { ...n[i], desc: e.target.value }; setSponsorTiers(n); }} />
                  </div>
                </div>
              ))}
              <div style={{ display: "flex", gap: "10px", marginTop: "4px" }}>
                <button type="button" className="btn btn-outline" style={{ fontSize: "13px", padding: "8px 18px" }}
                  onClick={() => setSponsorTiers(prev => [...prev, { key: `tier_${Date.now()}`, tier: "新等級", amount: "", desc: "" }])}>
                  + 新增等級
                </button>
                <button type="button" className="btn btn-primary" style={{ fontSize: "13px", padding: "8px 18px" }}
                  onClick={async () => {
                    try {
                      await setDoc(doc(db, "settings", "contact"), { showTiers: showSponsorTiers, tiers: sponsorTiers }, { merge: true });
                      alert("分級設定儲存成功！");
                    } catch (err) { console.error(err); alert("儲存失敗。"); }
                  }}>
                  儲存分級設定
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ====== FINANCE ====== */}
        {activeTab === "finance" && (() => {
          const totalIncome = financeEntries.filter(e => e.type === "income").reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
          const totalExpense = financeEntries.filter(e => e.type === "expense").reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
          const balance = totalIncome - totalExpense;
          const categoryTotals = {};
          financeEntries.forEach(en => {
            const key = en.category || "其他";
            categoryTotals[key] = (categoryTotals[key] || 0) + (Number(en.amount) || 0);
          });
          const maxCategoryTotal = Math.max(1, ...Object.values(categoryTotals));
          const fmt = (n) => `NT$ ${Number(n || 0).toLocaleString("zh-TW")}`;

          return (
            <div style={V_STACK}>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "16px" }}>
                <div style={{ ...PANEL, padding: "20px" }}>
                  <div style={{ fontSize: "12px", color: "var(--text-muted)", fontWeight: 600 }}>總收入</div>
                  <div style={{ fontSize: "24px", fontWeight: 800, color: "#15803d", marginTop: "6px" }}>{fmt(totalIncome)}</div>
                </div>
                <div style={{ ...PANEL, padding: "20px" }}>
                  <div style={{ fontSize: "12px", color: "var(--text-muted)", fontWeight: 600 }}>總支出</div>
                  <div style={{ fontSize: "24px", fontWeight: 800, color: "#ef4444", marginTop: "6px" }}>{fmt(totalExpense)}</div>
                </div>
                <div style={{ ...PANEL, padding: "20px" }}>
                  <div style={{ fontSize: "12px", color: "var(--text-muted)", fontWeight: 600 }}>結餘</div>
                  <div style={{ fontSize: "24px", fontWeight: 800, color: balance >= 0 ? "var(--text-main)" : "#ef4444", marginTop: "6px" }}>{fmt(balance)}</div>
                </div>
              </div>

              <div style={PANEL}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
                  <h3>收支紀錄 ({financeEntries.length})</h3>
                  <button type="button" onClick={handleFinanceExportCsv} disabled={financeEntries.length === 0}
                    style={{ fontSize: "12px", padding: "6px 14px", border: "1px solid #0AAEE8", borderRadius: "6px", background: "rgba(10,174,232,0.06)", color: "#0AAEE8", cursor: "pointer", fontWeight: 700 }}>
                    📊 匯出 CSV
                  </button>
                </div>
                {financeEntries.length === 0
                  ? <p style={{ color: "var(--text-muted)", fontSize: "14px" }}>尚無收支紀錄。</p>
                  : <div style={{ display: "flex", flexDirection: "column", gap: "10px", maxHeight: "420px", overflowY: "auto" }}>
                      {financeEntries.map(entry => (
                        <div key={entry.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 14px", border: `1px solid ${financeEditId === entry.id ? "var(--accent)" : "#EAECF0"}`, borderRadius: "10px", background: financeEditId === entry.id ? "rgba(10,174,232,0.04)" : "#fff", gap: "12px" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: "12px", flex: 1, minWidth: 0 }}>
                            <span style={{ fontSize: "11px", fontWeight: 700, padding: "3px 8px", borderRadius: "6px", flexShrink: 0, background: entry.type === "income" ? "#dcfce7" : "#fee2e2", color: entry.type === "income" ? "#15803d" : "#ef4444" }}>
                              {entry.type === "income" ? "收入" : "支出"}
                            </span>
                            <div style={{ minWidth: 0 }}>
                              <div style={{ fontSize: "14px", fontWeight: 700, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{entry.title}</div>
                              <div style={{ fontSize: "11px", color: "var(--text-muted)", marginTop: "2px" }}>{entry.date} · {entry.category}{entry.receiptUrl ? " · 已附收據" : ""}</div>
                            </div>
                          </div>
                          <div style={{ fontSize: "15px", fontWeight: 800, color: entry.type === "income" ? "#15803d" : "#ef4444", flexShrink: 0 }}>
                            {entry.type === "income" ? "+" : "-"}{fmt(entry.amount)}
                          </div>
                          <div style={{ display: "flex", gap: "6px", flexShrink: 0 }}>
                            {entry.receiptUrl && <a href={entry.receiptUrl} target="_blank" rel="noopener noreferrer" style={EDIT_BTN}>收據</a>}
                            <button onClick={() => handleFinanceEditLoad(entry)} style={EDIT_BTN}>編輯</button>
                            <button onClick={() => handleFinanceDelete(entry.id)} style={DEL_BTN}>刪除</button>
                          </div>
                        </div>
                      ))}
                    </div>
                }
              </div>

              <div style={PANEL} id="finance-form-section">
                <h3 style={{ marginBottom: "20px" }}>{financeEditId ? "編輯收支紀錄" : "新增收支紀錄"}</h3>
                <form onSubmit={handleFinanceSubmit}>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "16px" }}>
                    <div className="form-group">
                      <label>收支類型</label>
                      <select value={financeType} onChange={e => setFinanceType(e.target.value)} className="role-select" style={{ width: "100%", padding: "12px" }}>
                        <option value="income">收入</option>
                        <option value="expense">支出</option>
                      </select>
                    </div>
                    <div className="form-group">
                      <label>日期</label>
                      <input type="date" value={financeDate} onChange={e => setFinanceDate(e.target.value)} required />
                    </div>
                    <div className="form-group">
                      <label>金額 (NT$)</label>
                      <input type="number" min="0" step="1" placeholder="例如：5000" value={financeAmount} onChange={e => setFinanceAmount(e.target.value)} required />
                    </div>
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                    <div className="form-group">
                      <label>項目名稱</label>
                      <input type="text" placeholder="例如：鑽石級贊助 - OO公司" value={financeTitle} onChange={e => setFinanceTitle(e.target.value)} required />
                    </div>
                    <div className="form-group">
                      <label>類別</label>
                      <select value={financeCategory} onChange={e => setFinanceCategory(e.target.value)} className="role-select" style={{ width: "100%", padding: "12px" }}>
                        <option value="贊助">贊助</option>
                        <option value="比賽報名">比賽報名</option>
                        <option value="零件採購">零件採購</option>
                        <option value="交通">交通</option>
                        <option value="場地與住宿">場地與住宿</option>
                        <option value="其他">其他</option>
                      </select>
                    </div>
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                    <div className="form-group">
                      <label>備註 (選填)</label>
                      <input type="text" placeholder="補充說明" value={financeNote} onChange={e => setFinanceNote(e.target.value)} />
                    </div>
                    <div className="form-group">
                      <label>收據附件 (選填，圖片或 PDF){financeEditId ? "（不選則保留原附件）" : ""}</label>
                      {financeEditId && financeEditReceipt && (
                        <a href={financeEditReceipt} target="_blank" rel="noopener noreferrer" style={{ fontSize: "12px", color: "#0AAEE8", display: "block", marginBottom: "6px" }}>目前附件（點擊預覽）</a>
                      )}
                      <input type="file" id="finance-receipt-input" accept="image/*,application/pdf" onChange={e => setFinanceReceiptFile(e.target.files[0])} />
                      <ProgressBar folder="finance" />
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: "10px" }}>
                    <button type="submit" disabled={financeSubmitLoading} className="btn btn-primary" style={{ padding: "12px 28px" }}>
                      {financeSubmitLoading ? "儲存中..." : financeEditId ? "更新紀錄" : "新增紀錄"}
                    </button>
                    {financeEditId && (
                      <button type="button" className="btn btn-outline" onClick={resetFinanceForm}>取消編輯</button>
                    )}
                  </div>
                </form>
              </div>

              <div style={PANEL}>
                <h3 style={{ marginBottom: "20px" }}>類別佔比（依收支總額）</h3>
                {Object.keys(categoryTotals).length === 0
                  ? <p style={{ color: "var(--text-muted)", fontSize: "14px" }}>尚無資料可供統計。</p>
                  : <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                      {Object.entries(categoryTotals).sort((a, b) => b[1] - a[1]).map(([category, total]) => (
                        <div key={category}>
                          <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13px", marginBottom: "4px" }}>
                            <span style={{ fontWeight: 600 }}>{category}</span>
                            <span style={{ color: "var(--text-muted)" }}>{fmt(total)}</span>
                          </div>
                          <div style={{ height: "8px", background: "#EAECF0", borderRadius: "4px", overflow: "hidden" }}>
                            <div style={{ height: "100%", width: `${(total / maxCategoryTotal) * 100}%`, background: "var(--accent)", borderRadius: "4px" }} />
                          </div>
                        </div>
                      ))}
                    </div>
                }
              </div>
            </div>
          );
        })()}

        {/* ====== ROBOTS ====== */}
        {activeTab === "robots" && (
          <div style={V_STACK}>
            <div style={PANEL}>
              <h3 style={{ marginBottom: "20px" }}>歷年機器人存檔 ({robots.length})</h3>
              {robots.length === 0
                ? <p style={{ color: "var(--text-muted)", fontSize: "14px" }}>尚無機器人資料。</p>
                : <div style={{ display: "flex", flexDirection: "column", gap: "10px", maxHeight: "360px", overflowY: "auto" }}>
                    {robots.map(robot => (
                      <div key={robot.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 14px", border: `1px solid ${robotEditId === robot.year ? "var(--accent)" : "#EAECF0"}`, borderRadius: "10px", background: robotEditId === robot.year ? "rgba(10,174,232,0.04)" : "#fff" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                          <img src={robot.image} alt={robot.name} style={{ height: "40px", width: "60px", objectFit: "cover", borderRadius: "6px" }} />
                          <div>
                            <div style={{ fontSize: "14px", fontWeight: 700 }}>{robot.name} ({robot.year})</div>
                            <div style={{ fontSize: "11px", color: "var(--text-muted)" }}>{robot.game} · {robot.drivetrain}</div>
                          </div>
                        </div>
                        <div style={{ display: "flex", gap: "6px" }}>
                          <button onClick={() => handleRobotEditLoad(robot)} style={EDIT_BTN}>編輯</button>
                          <button onClick={() => handleRobotDelete(robot.id)} style={DEL_BTN}>刪除</button>
                        </div>
                      </div>
                    ))}
                  </div>
              }
            </div>

            <div style={PANEL} id="robot-form-section">
              <h3 style={{ marginBottom: "20px" }}>{robotEditId ? `編輯機器人 — ${robotEditId}` : "新增歷年機器人"}</h3>
              <form onSubmit={handleRobotSubmit}>
                <div style={{ display: "grid", gridTemplateColumns: "120px auto 1fr 1fr", gap: "16px", alignItems: "end" }}>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label>賽季年份 *</label>
                    {robotEditId
                      ? <input type="text" value={robotEditId} readOnly style={{ background: "#F6F7F9", color: "var(--text-muted)" }} />
                      : <input type="text" placeholder="2025" value={robotYear} onChange={e => setRobotYear(e.target.value)} required />
                    }
                  </div>
                  <button type="button" onClick={handleRobotAutoFill} disabled={!(robotEditId || robotYear) || robotAutoLoading}
                    className="btn btn-outline" style={{ padding: "11px 16px", fontSize: "13px", whiteSpace: "nowrap" }}>
                    {robotAutoLoading ? "載入中..." : "自動帶入資料"}
                  </button>
                  <div className="form-group" style={{ marginBottom: 0 }}><label>機器人名稱 *</label><input type="text" placeholder="Vanguard" value={robotName} onChange={e => setRobotName(e.target.value)} required /></div>
                  <div className="form-group" style={{ marginBottom: 0 }}><label>底盤傳動 *</label><input type="text" placeholder="Swerve Drive" value={robotDrivetrain} onChange={e => setRobotDrivetrain(e.target.value)} required /></div>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 140px", gap: "16px", marginTop: "16px" }}>
                  <div className="form-group"><label>競賽主題 *</label><input type="text" placeholder="REEFSCAPE" value={robotGame} onChange={e => setRobotGame(e.target.value)} required /></div>
                  <div className="form-group"><label>重量</label><input type="text" placeholder="55 kg" value={robotWeight} onChange={e => setRobotWeight(e.target.value)} /></div>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                  <div className="form-group">
                    <label>實體照片{robotEditId ? " (不選則保留原圖)" : " *必填"}</label>
                    {robotEditId && robotEditImage && (
                      <img src={robotEditImage} alt="目前圖片" style={{ height: "48px", width: "80px", objectFit: "cover", borderRadius: "6px", marginBottom: "6px", display: "block" }} />
                    )}
                    <input type="file" id="robot-img-input" accept="image/*" onChange={e => setRobotImageFile(e.target.files[0])} />
                    <ProgressBar folder="robots" />
                  </div>
                  <div className="form-group">
                    <label>3D 模型 (.glb) 選填</label>
                    <input type="file" id="robot-glb-input" accept=".glb" onChange={e => setRobotGlbFile(e.target.files[0])} />
                    <ProgressBar folder="robots_models" />
                    <input type="url" placeholder="或貼上模型 URL…" value={robotGlbUrl} onChange={e => setRobotGlbUrl(e.target.value)} style={{ marginTop: "6px" }} />
                  </div>
                </div>
                <div className="form-group">
                  <label>榮譽獲獎 (逗號分隔，可由「自動帶入資料」抓取)</label>
                  <input type="text" placeholder="Regional Winners, Excellence in Engineering Award" value={robotAchievements} onChange={e => setRobotAchievements(e.target.value)} />
                </div>
                <div style={{ display: "flex", gap: "10px" }}>
                  <button type="submit" disabled={robotSubmitLoading} className="btn btn-primary" style={{ padding: "12px 28px" }}>
                    {robotSubmitLoading ? "儲存中..." : robotEditId ? "更新機器人" : "新增機器人"}
                  </button>
                  {robotEditId && (
                    <button type="button" className="btn btn-outline" onClick={resetRobotForm}>取消編輯</button>
                  )}
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ====== SOCIALS ====== */}
        {activeTab === "socials" && (
          <div style={PANEL}>
            <h3 style={{ marginBottom: "20px" }}>全站社群媒體連結</h3>
            <form onSubmit={handleSocialsSave}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                <div className="form-group"><label>Instagram</label><input type="url" value={instagram} onChange={e => setInstagram(e.target.value)} placeholder="https://instagram.com/…" /></div>
                <div className="form-group"><label>Facebook</label><input type="url" value={facebook} onChange={e => setFacebook(e.target.value)} placeholder="https://facebook.com/…" /></div>
                <div className="form-group"><label>YouTube</label><input type="url" value={youtube} onChange={e => setYoutube(e.target.value)} placeholder="https://youtube.com/…" /></div>
                <div className="form-group"><label>GitHub</label><input type="url" value={github} onChange={e => setGithub(e.target.value)} placeholder="https://github.com/…" /></div>
                <div className="form-group"><label>Twitter / X</label><input type="url" value={twitter} onChange={e => setTwitter(e.target.value)} placeholder="https://x.com/…" /></div>
                <div className="form-group"><label>The Blue Alliance</label><input type="url" value={tbaLink} onChange={e => setTbaLink(e.target.value)} placeholder="https://www.thebluealliance.com/team/frc7645" /></div>
                <div className="form-group"><label>FIRST Inspires</label><input type="url" value={firstLink} onChange={e => setFirstLink(e.target.value)} placeholder="https://www.firstinspires.org/team#7645" /></div>
              </div>
              <button type="submit" disabled={socialsSaveLoading} className="btn btn-primary" style={{ padding: "12px 28px", marginTop: "8px" }}>
                {socialsSaveLoading ? "儲存中..." : "儲存社群設定"}
              </button>
            </form>
          </div>
        )}

        {/* ====== ABOUT ====== */}
        {activeTab === "about" && (
          <div style={V_STACK}>
            <div style={PANEL}>
              <h3 style={{ marginBottom: "4px" }}>頁面文字內容</h3>
              <p style={{ fontSize: "13px", color: "var(--text-muted)", marginBottom: "20px" }}>歷史與里程碑由 TBA 自動同步，無需手動維護。</p>
              <form onSubmit={handleAboutSave}>
                <div className="form-group">
                  <label>頁面副標題 (Hero 說明文字)</label>
                  <textarea rows="3" value={aboutHeroDesc} onChange={e => setAboutHeroDesc(e.target.value)}
                    style={{ padding: "12px", border: "1px solid #E4E7EC", borderRadius: "8px", width: "100%", fontFamily: "inherit" }} />
                  <EnField zhValue={aboutHeroDesc} value={aboutHeroDescEn} onChange={setAboutHeroDescEn} label="Hero description (EN)" multiline rows={3} />
                </div>

                <div style={{ marginBottom: "8px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <label style={{ fontWeight: 600, fontSize: "14px" }}>團隊歷史段落</label>
                  <button type="button" onClick={handleParagraphAdd} className="btn btn-outline" style={{ padding: "5px 14px", fontSize: "12px" }}>+ 新增段落</button>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: "12px", marginBottom: "20px" }}>
                  {aboutParagraphs.map((p, idx) => (
                    <div key={idx} style={{ border: "1px solid #EAECF0", borderRadius: "8px", padding: "12px" }}>
                      <div style={{ display: "flex", gap: "8px", alignItems: "flex-start" }}>
                        <textarea rows="4" value={p} onChange={e => handleParagraphChange(idx, e.target.value)}
                          style={{ flex: 1, padding: "12px", border: "1px solid #E4E7EC", borderRadius: "8px", fontFamily: "inherit", resize: "vertical" }} />
                        <button type="button" onClick={() => handleParagraphDelete(idx)} style={{ ...DEL_BTN, marginTop: "4px", flexShrink: 0 }}>刪除</button>
                      </div>
                      <EnField zhValue={p} value={aboutParagraphsEn[idx] || ""} onChange={v => handleParagraphEnChange(idx, v)} label={`段落 ${idx + 1} (EN)`} multiline rows={4} />
                    </div>
                  ))}
                </div>

                <div style={{ marginTop: "28px", paddingTop: "20px", borderTop: "1px dashed #E4E7EC" }}>
                  <label style={{ fontWeight: 600, fontSize: "14px", display: "block", marginBottom: "12px" }}>核心理念卡片 (最多 3 張)</label>
                  <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                    {aboutCoreValues.map((cv, i) => (
                      <div key={i} style={{ padding: "12px", border: "1px solid #EAECF0", borderRadius: "8px" }}>
                        <div style={{ display: "grid", gridTemplateColumns: "140px 1fr", gap: "10px" }}>
                          <div className="form-group" style={{ marginBottom: 0 }}>
                            <label style={{ fontSize: "12px" }}>標題</label>
                            <input type="text" value={cv.title} onChange={e => { const n = [...aboutCoreValues]; n[i] = { ...n[i], title: e.target.value }; setAboutCoreValues(n); }} />
                          </div>
                          <div className="form-group" style={{ marginBottom: 0 }}>
                            <label style={{ fontSize: "12px" }}>說明</label>
                            <input type="text" value={cv.desc} onChange={e => { const n = [...aboutCoreValues]; n[i] = { ...n[i], desc: e.target.value }; setAboutCoreValues(n); }} />
                          </div>
                        </div>
                        <div style={{ display: "grid", gridTemplateColumns: "140px 1fr", gap: "10px", marginTop: "8px" }}>
                          <EnField zhValue={cv.title} value={cv.title_en || ""} onChange={v => { const n = [...aboutCoreValues]; n[i] = { ...n[i], title_en: v }; setAboutCoreValues(n); }} label="Title EN" />
                          <EnField zhValue={cv.desc} value={cv.desc_en || ""} onChange={v => { const n = [...aboutCoreValues]; n[i] = { ...n[i], desc_en: v }; setAboutCoreValues(n); }} label="Desc EN" />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <button type="submit" disabled={aboutSaveLoading} className="btn btn-primary" style={{ padding: "12px 28px", marginTop: "20px" }}>
                  {aboutSaveLoading ? "儲存中..." : "儲存關於頁面文字"}
                </button>
              </form>
            </div>
          </div>
        )}

        {/* ====== DIVISIONS ====== */}
        {activeTab === "divisions" && (
          <div style={V_STACK}>
            <div style={PANEL}>
              <h3 style={{ marginBottom: "20px" }}>組別列表 ({divisions.length})</h3>
              {divisions.length === 0
                ? <p style={{ color: "var(--text-muted)", fontSize: "14px" }}>尚無組別，請使用下方表單新增。</p>
                : <div style={{ display: "flex", flexDirection: "column", gap: "10px", maxHeight: "360px", overflowY: "auto" }}>
                    {divisions.map(div => (
                      <div key={div.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 14px", border: `1px solid ${divEditId === div.id ? "var(--accent)" : "#EAECF0"}`, borderRadius: "10px", background: divEditId === div.id ? "rgba(10,174,232,0.04)" : "#fff", gap: "12px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "12px", minWidth: 0 }}>
                          {div.coverImage && <img src={div.coverImage} alt={div.name} style={{ height: "40px", width: "60px", objectFit: "cover", borderRadius: "6px", flexShrink: 0 }} />}
                          <div style={{ minWidth: 0 }}>
                            <div style={{ fontSize: "14px", fontWeight: 700 }}>{div.name}</div>
                            <div style={{ fontSize: "11px", color: "var(--text-muted)", marginTop: "2px" }}>排序: {div.order || 0}{div.name_en ? ` · ${div.name_en}` : ""}</div>
                          </div>
                        </div>
                        <div style={{ display: "flex", gap: "6px" }}>
                          <button onClick={() => handleDivEditLoad(div)} style={EDIT_BTN}>編輯</button>
                          <button onClick={() => handleDivDelete(div.id)} style={DEL_BTN}>刪除</button>
                        </div>
                      </div>
                    ))}
                  </div>
              }
            </div>

            <div style={PANEL} id="div-form-section">
              <h3 style={{ marginBottom: "20px" }}>{divEditId ? "編輯組別" : "新增組別"}</h3>
              <form onSubmit={handleDivSave}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 80px", gap: "16px" }}>
                  <div className="form-group">
                    <label>組別名稱</label>
                    <input type="text" placeholder="例如：機械組" value={divName} onChange={e => setDivName(e.target.value)} required />
                    <EnField zhValue={divName} value={divNameEn} onChange={setDivNameEn} label="Name (EN)" />
                  </div>
                  <div className="form-group">
                    <label>排序</label>
                    <input type="number" value={divOrder} onChange={e => setDivOrder(e.target.value)} />
                  </div>
                </div>
                <div className="form-group">
                  <label>封面圖片{divEditId ? " (不選則保留原圖)" : ""}</label>
                  {divEditId && divEditCoverUrl && (
                    <img src={divEditCoverUrl} alt="" style={{ height: "48px", width: "80px", objectFit: "cover", borderRadius: "6px", marginBottom: "6px", display: "block" }} />
                  )}
                  <input type="file" id="div-cover-input" accept="image/*" onChange={e => setDivCoverFile(e.target.files[0])} />
                  <ProgressBar folder="div_covers" />
                </div>
                <div className="form-group">
                  <label>組別介紹 (支援 Markdown)</label>
                  <TiptapEditor
                    key={divEditId || "new-div"}
                    value={divDesc}
                    onChange={setDivDesc}
                    onImageUpload={file => handleUpload(file, "div_images", Date.now())}
                    placeholder="介紹這個組別的工作內容、技術方向等..."
                  />
                  <EnField
                    zhValue={divDesc}
                    value={divDescEn}
                    onChange={setDivDescEn}
                    label="Description (EN)"
                    rich
                    onImageUpload={file => handleUpload(file, "div_images", Date.now())}
                  />
                </div>
                <div style={{ display: "flex", gap: "10px" }}>
                  <button type="submit" disabled={divSaveLoading} className="btn btn-primary" style={{ padding: "12px 28px" }}>
                    {divSaveLoading ? "儲存中..." : divEditId ? "更新組別" : "新增組別"}
                  </button>
                  {divEditId && (
                    <button type="button" className="btn btn-outline" onClick={resetDivForm}>取消編輯</button>
                  )}
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ====== MENTORS ====== */}
        {activeTab === "mentors" && (
          <div style={V_STACK}>
            <div style={PANEL}>
              <h3 style={{ marginBottom: "20px" }}>指導老師列表 ({mentors.length})</h3>
              {mentors.length === 0
                ? <p style={{ color: "var(--text-muted)", fontSize: "14px" }}>尚無老師資料，請使用下方表單新增。</p>
                : <div style={{ display: "flex", flexDirection: "column", gap: "10px", maxHeight: "360px", overflowY: "auto" }}>
                    {mentors.map(mentor => (
                      <div key={mentor.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 14px", border: `1px solid ${mentorEditId === mentor.id ? "var(--accent)" : "#EAECF0"}`, borderRadius: "10px", background: mentorEditId === mentor.id ? "rgba(10,174,232,0.04)" : "#fff", gap: "12px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                          {mentor.photo && <img src={mentor.photo} alt={mentor.name} style={{ height: "44px", width: "44px", objectFit: "cover", borderRadius: "50%", flexShrink: 0 }} />}
                          <div>
                            <div style={{ fontSize: "14px", fontWeight: 700 }}>{mentor.name}</div>
                            <div style={{ fontSize: "11px", color: "var(--text-muted)", marginTop: "2px" }}>
                              {mentor.endYear ? "退役" : "現役"}{mentor.subject ? ` · ${mentor.subject}` : ""}{mentor.startYear ? ` · ${mentor.startYear}–${mentor.endYear || "至今"}` : ""}{mentor.order != null ? ` · 排序 ${mentor.order}` : ""}
                            </div>
                          </div>
                        </div>
                        <div style={{ display: "flex", gap: "6px" }}>
                          <button onClick={() => handleMentorEditLoad(mentor)} style={EDIT_BTN}>編輯</button>
                          <button onClick={() => handleMentorDelete(mentor.id)} style={DEL_BTN}>刪除</button>
                        </div>
                      </div>
                    ))}
                  </div>
              }
            </div>

            <div style={PANEL} id="mentor-form-section">
              <h3 style={{ marginBottom: "20px" }}>{mentorEditId ? "編輯老師資料" : "新增指導老師"}</h3>
              <form onSubmit={handleMentorSave}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                  <div className="form-group">
                    <label>姓名 *</label>
                    <input type="text" placeholder="例如：陳老師" value={mentorName} onChange={e => setMentorName(e.target.value)} required />
                  </div>
                  <div className="form-group">
                    <label>負責科目</label>
                    <input type="text" placeholder="例如：物理、資訊" value={mentorSubject} onChange={e => setMentorSubject(e.target.value)} />
                  </div>
                  <div className="form-group">
                    <label>起始年 *</label>
                    <input type="number" placeholder="2018" value={mentorStartYear} onChange={e => setMentorStartYear(e.target.value)} required />
                  </div>
                  <div className="form-group">
                    <label>結束年 (空白 = 現役)</label>
                    <input type="number" placeholder="留空表示目前仍在職" value={mentorEndYear} onChange={e => setMentorEndYear(e.target.value)} />
                  </div>
                  <div className="form-group">
                    <label>排序</label>
                    <input type="number" value={mentorOrder} onChange={e => setMentorOrder(e.target.value)} />
                  </div>
                </div>
                <div className="form-group">
                  <label>照片{mentorEditId ? " (不選則保留原圖)" : ""}</label>
                  {mentorEditId && mentorEditPhotoUrl && (
                    <img src={mentorEditPhotoUrl} alt="" style={{ height: "56px", width: "56px", objectFit: "cover", borderRadius: "50%", marginBottom: "6px", display: "block" }} />
                  )}
                  <input type="file" id="mentor-photo-input" accept="image/*" onChange={e => setMentorPhotoFile(e.target.files[0])} />
                  <ProgressBar folder="mentor_photos" />
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                  <div className="form-group">
                    <label>Email（選填）</label>
                    <input type="email" placeholder="teacher@school.edu.tw" value={mentorEmail} onChange={e => setMentorEmail(e.target.value)} />
                  </div>
                  <div className="form-group">
                    <label>電話（選填）</label>
                    <input type="tel" placeholder="+886 2 xxxx-xxxx" value={mentorPhone} onChange={e => setMentorPhone(e.target.value)} />
                  </div>
                </div>
                <div className="form-group">
                  <label>個人簡介</label>
                  <textarea rows="4" value={mentorBio} onChange={e => setMentorBio(e.target.value)} placeholder="簡介這位老師的背景與對隊伍的貢獻..."
                    style={{ padding: "12px", border: "1px solid #E4E7EC", borderRadius: "8px", width: "100%", fontFamily: "inherit", resize: "vertical" }} />
                </div>
                <div style={{ display: "flex", gap: "10px" }}>
                  <button type="submit" disabled={mentorSaveLoading} className="btn btn-primary" style={{ padding: "12px 28px" }}>
                    {mentorSaveLoading ? "儲存中..." : mentorEditId ? "更新老師" : "新增老師"}
                  </button>
                  {mentorEditId && (
                    <button type="button" className="btn btn-outline" onClick={resetMentorForm}>取消編輯</button>
                  )}
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ====== CONTACT ====== */}
        {activeTab === "contact" && (
          <div style={PANEL}>
            <h3 style={{ marginBottom: "20px" }}>聯絡資訊設定</h3>
            <form onSubmit={handleContactSave}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                <div className="form-group"><label>電子信箱</label><input type="email" value={contactEmail} onChange={e => setContactEmail(e.target.value)} placeholder="nkmtc7645@gmail.com" /></div>
                <div className="form-group"><label>聯絡電話 (選填)</label><input type="text" value={contactPhone} onChange={e => setContactPhone(e.target.value)} placeholder="+886 2 xxxx-xxxx" /></div>
                <div className="form-group"><label>城市</label><input type="text" value={contactCity} onChange={e => setContactCity(e.target.value)} placeholder="臺北市" /></div>
                <div className="form-group">
                  <label>完整地址</label>
                  <input type="text" value={contactAddress} onChange={e => setContactAddress(e.target.value)} placeholder="臺北市南港區興中街19號" />
                  <EnField zhValue={contactAddress} value={contactAddressEn} onChange={setContactAddressEn} label="English Address" />
                </div>
              </div>
              <button type="submit" disabled={contactSaveLoading} className="btn btn-primary" style={{ padding: "12px 28px", marginTop: "8px" }}>
                {contactSaveLoading ? "儲存中..." : "儲存聯絡資訊"}
              </button>
            </form>
          </div>
        )}
      </div>
    </main>
  );
}
