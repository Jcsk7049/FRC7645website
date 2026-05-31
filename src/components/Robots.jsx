import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { db } from "../firebase";
import { collection, getDocs } from "firebase/firestore";
import { getTeamYearAwards } from "../lib/tba";
import { useTranslation } from "react-i18next";

export default function Robots() {
  const [robots, setRobots] = useState([]);
  const [awardsMap, setAwardsMap] = useState({});
  const [loading, setLoading] = useState(true);
  const { t } = useTranslation();

  useEffect(() => {
    const load = async () => {
      try {
        const robotSnap = await getDocs(collection(db, "robots"));
        const list = [];
        robotSnap.forEach(d => list.push({ id: d.id, ...d.data() }));
        list.sort((a, b) => parseInt(b.year) - parseInt(a.year));
        setRobots(list);

        const awardResults = await Promise.allSettled(
          list.map(r => getTeamYearAwards(r.year).then(awards => [r.year, awards]))
        );
        const aMap = {};
        awardResults.forEach(r => {
          if (r.status === "fulfilled") {
            const [year, awards] = r.value;
            aMap[year] = awards;
          }
        });
        setAwardsMap(aMap);
      } catch (err) {
        console.warn(err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  return (
    <main className="container" style={{ paddingTop: "40px", paddingBottom: "80px" }} id="robots-page">
      <section style={{ borderBottom: "1px solid rgba(26, 22, 18, 0.06)", paddingBottom: "32px", marginBottom: "48px" }}>
        <span className="badge">{t("robots.badge")}</span>
        <h1 style={{ marginTop: "12px", fontSize: "38px" }}>{t("robots.pageTitle")}</h1>
        <p style={{ fontSize: "16px", marginTop: "16px", lineHeight: "1.7", color: "var(--text-muted)" }}>
          {t("robots.pageDesc")}
        </p>
      </section>

      {loading ? (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "20px" }}>
          {[1, 2, 3, 4].map(i => (
            <div key={i} style={{ height: "280px", background: "var(--bg-elevated)", borderRadius: "16px", animation: "pulse 1.5s infinite" }} />
          ))}
        </div>
      ) : robots.length === 0 ? (
        <p style={{ color: "var(--text-muted)", fontSize: "15px" }}>{t("robots.noData")}</p>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "20px" }}>
          {robots.map(robot => {
            const awards = awardsMap[robot.year] || [];
            return (
              <div key={robot.year} style={{
                background: "var(--card-bg)", border: "1px solid rgba(26, 22, 18, 0.06)", borderRadius: "16px",
                overflow: "hidden", display: "flex", flexDirection: "column",
                transition: "box-shadow 0.15s, transform 0.15s"
              }}
                onMouseEnter={e => { e.currentTarget.style.boxShadow = "0 4px 20px rgba(0,0,0,0.10)"; e.currentTarget.style.transform = "translateY(-2px)"; }}
                onMouseLeave={e => { e.currentTarget.style.boxShadow = "none"; e.currentTarget.style.transform = "none"; }}
              >
                <div style={{ height: "160px", background: "var(--bg-elevated)", overflow: "hidden", position: "relative" }}>
                  {robot.image ? (
                    <img src={robot.image} alt={robot.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  ) : (
                    <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <span style={{ fontSize: "52px", fontWeight: 900, color: "#D0D5DD", fontFamily: "var(--font-display)" }}>{robot.year}</span>
                    </div>
                  )}
                  <div style={{ position: "absolute", top: "12px", left: "12px" }}>
                    <span style={{ fontSize: "11px", fontWeight: 800, background: "var(--accent)", color: "#fff", padding: "3px 8px", borderRadius: "6px" }}>
                      {robot.year}
                    </span>
                  </div>
                </div>

                <div style={{ padding: "18px 20px", flex: 1, display: "flex", flexDirection: "column", gap: "6px" }}>
                  <div style={{ fontSize: "17px", fontWeight: 800 }}>{robot.name}</div>
                  <div style={{ fontSize: "12px", color: "var(--text-muted)" }}>{robot.game}</div>

                  {awards.length > 0 && (
                    <div style={{ display: "flex", flexWrap: "wrap", gap: "4px", marginTop: "6px" }}>
                      {awards.slice(0, 2).map((a, i) => (
                        <span key={i} style={{ fontSize: "10px", fontWeight: 700, background: "rgba(10,174,232,0.10)", color: "var(--accent)", padding: "2px 8px", borderRadius: "4px" }}>
                          {a.name}
                        </span>
                      ))}
                      {awards.length > 2 && (
                        <span style={{ fontSize: "10px", color: "var(--text-muted)", padding: "2px 4px" }}>+{awards.length - 2}</span>
                      )}
                    </div>
                  )}

                  <div style={{ marginTop: "auto", paddingTop: "14px" }}>
                    <Link to={`/robot/${robot.year}`} className="btn btn-outline" style={{ width: "100%", textAlign: "center", padding: "9px 0", fontSize: "13px", fontWeight: 700 }}>
                      {t("robots.viewDetail")}
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </main>
  );
}
