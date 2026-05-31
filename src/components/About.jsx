import { useEffect, useState } from "react";
import { db } from "../firebase";
import { doc, getDoc } from "firebase/firestore";
import { getTeamAllAwards, getTeamYearEvents, isCompetitionEvent } from "../lib/tba";
import { useTranslation } from "react-i18next";

const defaultContent = {
  heroDesc: "NKMTC 是由臺北市立南港高級工業職業學校學生組成的 FRC 機器人隊伍，自 2019 年首場賽事便以新秀之姿踏上底特律世界決賽舞台。我們是一群敢做、敢夢，勇於面對與解決問題的工程人。",
  paragraphs: [
    "NKMTC 成立於 2018 年秋天，原是以集體創作與機器人競賽為方向的學生社群。在其他學校老師的介紹下，隊伍以原有名稱 NKMTC 決定投身 FIRST Robotics Competition，象徵一群敢做、敢夢、勇於解決問題的精神。",
    "2019 年首場賽事在洛杉磯舉行。以新秀身份目標最佳新秀獎 (Rookie All Star Award)，最終於洛杉磯-瓦倫西亞高中賽場同時奪得最佳新秀獎與新秀最高分種子獎，直接晉級底特律總決賽，並在決賽場再度獲得最高分種子獎——成為全台灣首支在底特律賽場獲獎的隊伍。",
    "2020 年因 COVID-19 影響，FRC 全球賽季大幅壓縮，隊伍利用空檔持續深化機構設計與新成員訓練，並在 11 月的台中 5G 數位區域賽中拿下工業設計獎。此後在 2022、2023、2024、2025 年持續出賽並多次獲獎，持續將南港高工的工藝精神帶上國際舞台。"
  ]
};

// Static entries for years without TBA competition data
const STATIC_ENTRIES = {
  "2018": {
    label: "NKMTC 成立",
    label_en: "NKMTC Founded",
    desc: "由臺北市立南港高級工業職業學校的學生組成，於 2018 年秋天轉型投入 FIRST Robotics Competition，正式命名 NKMTC。",
    desc_en: "Formed by students of Taipei Municipal Nangang Vocational High School, the team transitioned into FIRST Robotics Competition in autumn 2018 under the name NKMTC.",
    competed: false
  },
  "2021": {
    label: "COVID-19 全球停賽",
    label_en: "COVID-19 Global Suspension",
    desc: "因疫情延續，FRC 全球賽事持續暫停。隊伍以線上活動與機構研究維持技術積累。",
    desc_en: "FRC global events remained suspended due to the ongoing pandemic. The team maintained technical development through online activities and mechanism research.",
    competed: false
  },
};

const DEFAULT_CORE_VALUES = [
  { title: "專業技藝", desc: "從 3D 建模到金屬加工，每一顆螺帽與每條配線皆符合高精度標準，將機械結構與電控設計發揮至極。" },
  { title: "學生主導", desc: "學生是核心。從策略討論到程式實作，皆由學長姐親自指導新生，落實技術與經驗的完整傳承。" },
  { title: "優雅專業", desc: "Gracious Professionalism — 賽場上全力拼搏，賽場外互助共享技術，與所有隊伍共同提升整體水準。" },
];

export default function About() {
  const { t, i18n } = useTranslation();
  const [heroDesc, setHeroDesc] = useState(null);
  const [heroDescEn, setHeroDescEn] = useState("");
  const [paragraphs, setParagraphs] = useState(null);
  const [paragraphsEn, setParagraphsEn] = useState([]);
  const [coreValues, setCoreValues] = useState(null);
  const [contentLoading, setContentLoading] = useState(true);
  const [timeline, setTimeline] = useState([]);
  const [timelineLoading, setTimelineLoading] = useState(true);

  useEffect(() => {
    const fetchContent = async () => {
      try {
        const snap = await getDoc(doc(db, "pages", "about"));
        if (snap.exists()) {
          const d = snap.data();
          setHeroDesc(d.heroDesc || defaultContent.heroDesc);
          setHeroDescEn(d.heroDesc_en || "");
          if (d.paragraphs && d.paragraphs.length > 0) {
            setParagraphs(d.paragraphs);
          } else {
            setParagraphs([d.historyP1, d.historyP2, d.historyP3].filter(Boolean));
          }
          setParagraphsEn(d.paragraphs_en || []);
          setCoreValues(d.coreValues && d.coreValues.length > 0 ? d.coreValues : DEFAULT_CORE_VALUES);
        } else {
          setHeroDesc(defaultContent.heroDesc);
          setParagraphs(defaultContent.paragraphs);
          setCoreValues(DEFAULT_CORE_VALUES);
        }
      } catch (err) {
        console.warn("About Firestore read failed:", err);
        setHeroDesc(defaultContent.heroDesc);
        setParagraphs(defaultContent.paragraphs);
        setCoreValues(DEFAULT_CORE_VALUES);
      } finally {
        setContentLoading(false);
      }
    };

    const buildTimeline = async () => {
      try {
        // Fetch all awards from TBA
        const awards = await getTeamAllAwards();

        // Group awards by year
        const awardsByYear = {};
        awards.forEach(a => {
          if (!awardsByYear[a.year]) awardsByYear[a.year] = [];
          awardsByYear[a.year].push(a);
        });

        // Collect all competition years from TBA
        const tbaYears = new Set(Object.keys(awardsByYear));

        // Also add known competition years (2019-2025 based on data)
        ["2019", "2020", "2022", "2023", "2024", "2025"].forEach(y => tbaYears.add(y));

        // Build year entries
        const entries = [];

        for (const year of [...tbaYears].sort((a, b) => parseInt(b) - parseInt(a))) {
          const yearAwards = awardsByYear[year] || [];
          const isCompeted = !STATIC_ENTRIES[year] || STATIC_ENTRIES[year].competed;

          // Try to fetch events for this year (only competition events)
          let events = [];
          try {
            const all = await getTeamYearEvents(year);
            events = all.filter(e => isCompetitionEvent(e.event_type));
          } catch { /* ignore */ }

          entries.push({ year, awards: yearAwards, events, competed: isCompeted, static: STATIC_ENTRIES[year] || null });
        }

        // Add static-only entries (2018, 2021)
        for (const [year, data] of Object.entries(STATIC_ENTRIES)) {
          if (!entries.find(e => e.year === year)) {
            entries.push({ year, awards: [], events: [], competed: data.competed, static: data });
          }
        }

        entries.sort((a, b) => parseInt(b.year) - parseInt(a.year));
        setTimeline(entries);
      } catch (err) {
        console.warn("TBA timeline build failed:", err);
        setTimeline([]);
      } finally {
        setTimelineLoading(false);
      }
    };

    fetchContent();
    buildTimeline();
  }, []);

  return (
    <main className="container" style={{ paddingTop: "40px", paddingBottom: "80px" }} id="about-page">
      {/* Hero Header */}
      <section style={{ borderBottom: "1px solid rgba(255, 255, 255, 0.06)", paddingBottom: "32px", marginBottom: "48px" }}>
        <span className="badge">{t("about.badge")}</span>
        <h1 style={{ marginTop: "12px", fontSize: "38px" }}>{t("about.pageTitle")}</h1>
        {contentLoading
          ? <div style={{ marginTop: "16px", height: "20px", width: "70%", background: "var(--bg-elevated)", borderRadius: "6px" }} />
          : <p style={{ fontSize: "16px", marginTop: "16px", maxWidth: "760px", lineHeight: "1.7", color: "var(--text-muted)" }}>
              {i18n.language === "en" ? (heroDescEn || heroDesc) : heroDesc}
            </p>
        }
      </section>

      {/* Team Description */}
      <section style={{ marginBottom: "64px" }} className="bento-card">
        <div style={{ padding: "40px", lineHeight: "1.8", color: "var(--text-main)" }}>
          <h2 style={{ marginBottom: "24px" }}>{t("about.historyTitle")}</h2>
          {contentLoading
            ? [1,2,3].map(i => <div key={i} style={{ height: "14px", background: "var(--bg-elevated)", borderRadius: "4px", marginBottom: "16px", width: i === 3 ? "55%" : "100%" }} />)
            : paragraphs && paragraphs.map((p, i) => (
                <p key={i} style={{ marginBottom: i < paragraphs.length - 1 ? "20px" : 0, fontSize: "15px" }}>
                  {i18n.language === "en" ? (paragraphsEn[i] || p) : p}
                </p>
              ))
          }
        </div>
      </section>

      {/* Core Values */}
      <section style={{ marginBottom: "64px" }}>
        <h2 style={{ marginBottom: "24px" }}>{t("about.valuesTitle")}</h2>
        <div className="core-values-grid" style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "24px" }}>
          {(coreValues || DEFAULT_CORE_VALUES).map((cv, i) => (
            <div key={i} className="bento-card" style={{ padding: "28px" }}>
              <h3 style={{ marginBottom: "12px" }}>
                {i18n.language === "en" ? (cv.title_en || cv.title) : cv.title}
              </h3>
              <p style={{ fontSize: "14px", lineHeight: "1.6" }}>
                {i18n.language === "en" ? (cv.desc_en || cv.desc) : cv.desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* TBA-powered Timeline */}
      <section>
        <h2 style={{ marginBottom: "40px" }}>{t("about.milestonesTitle")}</h2>

        {timelineLoading ? (
          <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
            {[1, 2, 3].map(i => (
              <div key={i} style={{ height: "80px", background: "#F0F2F5", borderRadius: "12px", animation: "pulse 1.5s infinite" }} />
            ))}
          </div>
        ) : (
          <div style={{ position: "relative", paddingLeft: "32px", borderLeft: "2px solid #E4E7EC" }}>
            {timeline.map((entry) => (
              <div key={entry.year} style={{ marginBottom: "40px", position: "relative" }}>
                {/* Timeline dot */}
                <div style={{
                  position: "absolute", left: "-42px", top: "6px",
                  width: "16px", height: "16px", borderRadius: "50%",
                  background: entry.competed ? (entry.awards.some(a => a.award_type === 1) ? "var(--accent)" : "var(--accent)") : "#CBD5E1",
                  border: "3px solid #F6F7F9",
                  boxShadow: entry.awards.some(a => a.award_type === 1) ? "0 0 0 3px rgba(10,174,232,0.2)" : "none"
                }} />

                <div style={{ display: "flex", alignItems: "baseline", gap: "12px", flexWrap: "wrap", marginBottom: "10px" }}>
                  <span style={{ fontSize: "22px", fontWeight: 800, fontFamily: "var(--font-display)" }}>{entry.year}</span>
                  {entry.competed && (
                    <span style={{ fontSize: "10px", fontWeight: 700, background: "rgba(10,174,232,0.10)", color: "var(--accent)", padding: "2px 8px", borderRadius: "4px" }}>
                      {t("about.competed")}
                    </span>
                  )}
                  {entry.awards.some(a => a.award_type === 1) && (
                    <span style={{ fontSize: "10px", fontWeight: 700, background: "rgba(10,174,232,0.18)", color: "var(--accent)", padding: "2px 8px", borderRadius: "4px", border: "1px solid rgba(10,174,232,0.3)" }}>
                      {t("about.champion")}
                    </span>
                  )}
                </div>

                {/* Static description (founding / COVID) */}
                {entry.static && (
                  <div style={{ marginBottom: "10px" }}>
                    <span style={{ fontSize: "15px", fontWeight: 700 }}>
                      {i18n.language === "en" ? (entry.static.label_en || entry.static.label) : entry.static.label}
                    </span>
                    <p style={{ fontSize: "14px", marginTop: "6px", maxWidth: "680px", lineHeight: "1.7", color: "var(--text-muted)" }}>
                      {i18n.language === "en" ? (entry.static.desc_en || entry.static.desc) : entry.static.desc}
                    </p>
                  </div>
                )}

                {/* Events */}
                {entry.events.length > 0 && (
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", marginBottom: entry.awards.length > 0 ? "10px" : "0" }}>
                    {entry.events.map((event, i) => (
                      <a key={i} href={`https://www.thebluealliance.com/event/${event.key}`} target="_blank" rel="noopener noreferrer"
                        style={{ fontSize: "13px", fontWeight: 600, color: "var(--text-main)", background: "#F0F2F5", padding: "4px 12px", borderRadius: "6px", textDecoration: "none", border: "1px solid #E4E7EC" }}>
                        {event.name}
                      </a>
                    ))}
                  </div>
                )}

                {/* Awards */}
                {entry.awards.length > 0 && (
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                    {entry.awards.map((award, i) => (
                      <span key={i} style={{
                        fontSize: "12px", fontWeight: 700, padding: "4px 10px", borderRadius: "6px",
                        background: award.award_type <= 2 ? "rgba(10,174,232,0.12)" : "#FFF",
                        color: award.award_type <= 2 ? "var(--accent)" : "var(--text-main)",
                        border: award.award_type <= 2 ? "1px solid rgba(10,174,232,0.25)" : "1px solid #E4E7EC"
                      }}>
                        {award.name}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
