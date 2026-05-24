import { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { db } from "../firebase";
import { doc, getDoc, collection, getDocs } from "firebase/firestore";
import RobotViewer from "./RobotViewer";
import { getTeamYearEvents, getTeamYearAwards, getTeamEventStatus, isCompetitionEvent } from "../lib/tba";
import { useTranslation } from "react-i18next";

export default function RobotDetail() {
  const { year } = useParams();
  const navigate = useNavigate();
  const [robot, setRobot] = useState(null);
  const [loading, setLoading] = useState(true);
  const [exploded, setExploded] = useState(false);
  const [seasons, setSeasons] = useState([]);
  const { t } = useTranslation();

  // TBA state
  const [tbaEvents, setTbaEvents] = useState([]);
  const [tbaStatuses, setTbaStatuses] = useState({});
  const [tbaAwards, setTbaAwards] = useState([]);
  const [tbaLoading, setTbaLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    setExploded(false);
    setTbaEvents([]);
    setTbaStatuses({});
    setTbaAwards([]);
    setTbaLoading(true);

    const getRobotDetails = async () => {
      try {
        const docSnap = await getDoc(doc(db, "robots", year));
        if (docSnap.exists()) {
          setRobot(docSnap.data());
        } else {
          navigate("/robot");
        }
      } catch (err) {
        console.warn("Firestore robot fetch failed:", err);
        navigate("/robot");
      } finally {
        setLoading(false);
      }
    };

    const fetchSeasons = async () => {
      try {
        const snap = await getDocs(collection(db, "robots"));
        const list = [];
        snap.forEach(d => list.push(d.id));
        setSeasons(list.sort((a, b) => parseInt(b) - parseInt(a)));
      } catch (err) {
        setSeasons([year]);
      }
    };

    const fetchTBA = async () => {
      try {
        const [events, awards] = await Promise.all([
          getTeamYearEvents(year),
          getTeamYearAwards(year)
        ]);

        const competitionEvents = events.filter(e => isCompetitionEvent(e.event_type));
        setTbaEvents(competitionEvents);
        setTbaAwards(awards);

        const statusEntries = await Promise.allSettled(
          competitionEvents.map(e => getTeamEventStatus(e.key).then(s => [e.key, s]))
        );

        const statusMap = {};
        statusEntries.forEach(result => {
          if (result.status === "fulfilled" && result.value) {
            const [key, status] = result.value;
            statusMap[key] = status;
          }
        });
        setTbaStatuses(statusMap);
      } catch (err) {
        console.warn("TBA fetch failed:", err);
      } finally {
        setTbaLoading(false);
      }
    };

    getRobotDetails();
    fetchSeasons();
    fetchTBA();
  }, [year, navigate]);

  if (loading) {
    return (
      <div className="container" style={{ paddingTop: "100px", paddingBottom: "100px", textAlign: "center" }}>
        <div className="spinner" style={{ margin: "0 auto" }} />
        <p style={{ marginTop: "20px" }}>{t("robotDetail.loadingRobot")}</p>
      </div>
    );
  }

  if (!robot) return null;

  const getPlayoffResult = (status) => {
    if (!status?.playoff) return null;
    const p = status.playoff;
    if (p.status === "won") return { label: t("robotDetail.champion"), color: "#0AAEE8", bg: "rgba(10,174,232,0.12)" };
    if (p.status === "eliminated") {
      const level = p.level;
      if (level === "f") return { label: t("robotDetail.finalist"), color: "#F59E0B", bg: "#FEF3C7" };
      if (level === "sf") return { label: t("robotDetail.semifinalist"), color: "#6366F1", bg: "#EEF2FF" };
      return { label: t("robotDetail.quarterfinalist"), color: "#6B7280", bg: "#F3F4F6" };
    }
    return null;
  };

  const formatRecord = (record) => {
    if (!record) return "—";
    return `${record.wins}W-${record.losses}L-${record.ties}T`;
  };

  return (
    <main className="container" id="robot-detail-page">
      <div style={{ marginTop: "24px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <Link to="/" className="btn btn-outline" style={{ padding: "8px 16px" }}>
          {t("robotDetail.back")}
        </Link>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <span style={{ fontSize: "14px", fontWeight: 700, color: "var(--text-muted)" }}>{t("robotDetail.switchSeason")}</span>
          <select className="role-select" value={year} onChange={e => navigate(`/robot/${e.target.value}`)}>
            {seasons.map(s => <option key={s} value={s}>{s} {t("robotDetail.season")}</option>)}
          </select>
        </div>
      </div>

      <div className="robot-details-layout">

        {/* Left: 3D Stage or Photo */}
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          {robot.glbUrl ? (
            <>
              <div className="stage-container">
                <RobotViewer exploded={exploded} glbUrl={robot.glbUrl} />
                <div className="stage-instructions">
                  <span className="stage-badge">{t("robotDetail.dragHint")}</span>
                  <span className="stage-badge" style={{ background: "var(--accent)" }}>
                    MODEL: {robot.name?.toUpperCase()}
                  </span>
                </div>
              </div>
              {!robot.glbUrl && (
                <button onClick={() => setExploded(!exploded)} className="btn btn-secondary"
                  style={{ width: "100%", padding: "14px", fontSize: "14px", letterSpacing: "1px", fontWeight: 800 }}>
                  {exploded ? t("robotDetail.assemble") : t("robotDetail.explode")}
                </button>
              )}
            </>
          ) : (
            <div className="stage-container" style={{ overflow: "hidden" }}>
              <img
                src={robot.image}
                alt={robot.name}
                style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
              />
              <div className="stage-instructions">
                <span className="stage-badge">{robot.year} {t("robotDetail.season")}</span>
                <span className="stage-badge" style={{ background: "var(--accent)" }}>
                  {robot.name?.toUpperCase()}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Right: Specs */}
        <div className="robot-specs-panel">
          <div>
            <span className="badge">{robot.year} {t("robotDetail.seasonRobot")}</span>
            <h1>{robot.name}</h1>
            <p style={{ fontSize: "15px" }}>{t("robotDetail.game")}：{robot.game}</p>
          </div>

          <div className="spec-list">
            <h3>{t("robotDetail.specs")}</h3>
            <div className="spec-row"><span className="spec-label">{t("robotDetail.drivetrain")}</span><span className="spec-value">{robot.drivetrain}</span></div>
            {robot.weight && <div className="spec-row"><span className="spec-label">{t("robotDetail.weight")}</span><span className="spec-value">{robot.weight}</span></div>}
          </div>

          {robot.achievements && robot.achievements.length > 0 && (
            <div className="specs-achievements-list">
              <h3>{t("robotDetail.achievements")}</h3>
              {robot.achievements.map((a, i) => (
                <div className="achievement-item" key={i}>{a}</div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* TBA Live Event Results Section */}
      <section style={{ marginTop: "40px", marginBottom: "60px" }}>
        <div style={{ borderBottom: "1px solid rgba(0,0,0,0.06)", paddingBottom: "14px", marginBottom: "24px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <h2 style={{ marginBottom: "4px" }}>{year} {t("robotDetail.seasonRecord")}</h2>
            <p style={{ color: "var(--text-muted)", fontSize: "13px" }}>{t("robotDetail.tbaSource")}</p>
          </div>
          {tbaAwards.length > 0 && (
            <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", justifyContent: "flex-end" }}>
              {tbaAwards.map((award, i) => (
                <span key={i} style={{ fontSize: "11px", fontWeight: 700, background: "rgba(10,174,232,0.10)", color: "var(--accent)", padding: "4px 10px", borderRadius: "20px" }}>
                  {award.name}
                </span>
              ))}
            </div>
          )}
        </div>

        {tbaLoading ? (
          <div style={{ textAlign: "center", padding: "40px", color: "var(--text-muted)" }}>
            <div className="spinner" style={{ margin: "0 auto 12px" }} />
            <p style={{ fontSize: "13px" }}>{t("common.loading")}</p>
          </div>
        ) : tbaEvents.length === 0 ? (
          <div style={{ textAlign: "center", padding: "40px", color: "var(--text-muted)", fontSize: "14px" }}>
            {year} {t("robotDetail.season")} — No TBA data available.
          </div>
        ) : (
          <div className="tba-events-grid" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: "20px" }}>
            {tbaEvents.map(event => {
              const status = tbaStatuses[event.key];
              const playoffResult = getPlayoffResult(status);
              const qual = status?.qual?.ranking;
              const playoff = status?.playoff;
              const yearAwardsAtEvent = tbaAwards.filter(a => a.event_key === event.key);

              return (
                <div key={event.key} style={{ background: "#ffffff", border: "1px solid #E4E7EC", borderRadius: "16px", padding: "24px", display: "flex", flexDirection: "column", gap: "14px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                    <div>
                      <div style={{ fontSize: "15px", fontWeight: 700 }}>{event.name}</div>
                      <div style={{ fontSize: "12px", color: "var(--text-muted)", marginTop: "3px" }}>
                        {event.city}, {event.country} · {event.start_date}
                      </div>
                    </div>
                    {playoffResult && (
                      <span style={{ fontSize: "12px", fontWeight: 800, background: playoffResult.bg, color: playoffResult.color, padding: "4px 10px", borderRadius: "6px", flexShrink: 0, marginLeft: "8px" }}>
                        {playoffResult.label}
                      </span>
                    )}
                  </div>

                  {qual ? (
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                      <div style={{ background: "#F6F7F9", borderRadius: "8px", padding: "10px 12px" }}>
                        <div style={{ fontSize: "10px", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.5px" }}>Qualification</div>
                        <div style={{ fontSize: "16px", fontWeight: 800, marginTop: "4px" }}>{formatRecord(qual.record)}</div>
                        <div style={{ fontSize: "11px", color: "var(--text-muted)", marginTop: "2px" }}>Rank {qual.rank}/{status.qual.num_teams}</div>
                      </div>
                      {playoff && playoff.record && (
                        <div style={{ background: "#F6F7F9", borderRadius: "8px", padding: "10px 12px" }}>
                          <div style={{ fontSize: "10px", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.5px" }}>Playoff</div>
                          <div style={{ fontSize: "16px", fontWeight: 800, marginTop: "4px" }}>{formatRecord(playoff.record)}</div>
                          <div style={{ fontSize: "11px", color: "var(--text-muted)", marginTop: "2px" }}>
                            {status.alliance ? `Alliance ${status.alliance.number}` : ""}
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div style={{ fontSize: "13px", color: "var(--text-muted)" }}>{t("common.loading")}</div>
                  )}

                  {yearAwardsAtEvent.length > 0 && (
                    <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", borderTop: "1px solid #EAECF0", paddingTop: "12px" }}>
                      {yearAwardsAtEvent.map((award, i) => (
                        <span key={i} style={{ fontSize: "11px", fontWeight: 700, background: "rgba(10,174,232,0.10)", color: "var(--accent)", padding: "3px 8px", borderRadius: "4px" }}>
                          {award.name}
                        </span>
                      ))}
                    </div>
                  )}

                  <a href={`https://www.thebluealliance.com/event/${event.key}`} target="_blank" rel="noopener noreferrer"
                    style={{ fontSize: "12px", color: "var(--text-muted)", textDecoration: "none", display: "flex", alignItems: "center", gap: "4px" }}>
                    View on TBA →
                  </a>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </main>
  );
}
