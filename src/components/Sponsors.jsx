import React, { useEffect, useState } from "react";
import { db } from "../firebase";
import { collection, getDocs, getDoc, doc } from "firebase/firestore";
import { useTranslation } from "react-i18next";

const defaultSponsors = [
  { name: "NASA", logo: "/sponsors/nasa.svg", tier: "diamond" },
  { name: "Boeing", logo: "/sponsors/boeing.svg", tier: "diamond" },
  { name: "Autodesk", logo: "/sponsors/autodesk.svg", tier: "gold" },
  { name: "National Instruments", logo: "/sponsors/ni.png", tier: "gold" },
  { name: "GitHub", logo: "/sponsors/github.svg", tier: "silver" }
];

const DEFAULT_TIERS = [
  { key: "diamond", tier: "鑽石級合作夥伴", color: "#B45309" },
  { key: "gold",    tier: "黃金級合作夥伴", color: "#475569" },
  { key: "silver",  tier: "白銀級合作夥伴", color: "#5C5C6A" },
];

export default function Sponsors() {
  const [sponsors, setSponsors] = useState([]);
  const [tiers, setTiers] = useState(DEFAULT_TIERS);
  const [packetUrl, setPacketUrl] = useState("");
  const [loading, setLoading] = useState(true);
  const { t } = useTranslation();

  useEffect(() => {
    const fetchSponsors = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, "sponsors"));
        if (querySnapshot.empty) {
          setSponsors(defaultSponsors);
        } else {
          const list = [];
          querySnapshot.forEach((doc) => {
            list.push({ id: doc.id, ...doc.data() });
          });
          setSponsors(list);
        }
      } catch (err) {
        console.warn("Failed to fetch sponsors from db, using defaults: ", err);
        setSponsors(defaultSponsors);
      } finally {
        setLoading(false);
      }
    };
    const fetchContact = async () => {
      try {
        const snap = await getDoc(doc(db, "settings", "contact"));
        if (snap.exists()) {
          const d = snap.data();
          setPacketUrl(d.packetUrl || "");
          if (Array.isArray(d.tiers)) {
            const TIER_COLORS = ["#B45309", "#475569", "#5C5C6A", "#0A6B3C", "#7C3AED"];
            const LEGACY_KEYS = ["diamond", "gold", "silver"];
            setTiers(d.tiers.map((tier, i) => ({
              key: tier.key || LEGACY_KEYS[i] || `tier_${i}`,
              tier: tier.tier,
              color: TIER_COLORS[i % TIER_COLORS.length],
            })));
          }
        }
      } catch { /* non-critical */ }
    };
    fetchSponsors();
    fetchContact();
  }, []);

  const getSponsorsByTier = (tierKey) => sponsors.filter(s => s.tier === tierKey);

  if (loading) {
    return (
      <div className="container" style={{ paddingTop: "100px", paddingBottom: "100px", textAlign: "center" }}>
        <div className="spinner" style={{ margin: "0 auto" }}></div>
        <p style={{ marginTop: "20px" }}>{t("sponsors.loading")}</p>
      </div>
    );
  }

  return (
    <main className="container" style={{ paddingTop: "40px", paddingBottom: "80px" }} id="sponsors-page">
      <section style={{ borderBottom: "1px solid rgba(26, 22, 18, 0.06)", paddingBottom: "32px", marginBottom: "48px" }}>
        <span className="badge">{t("sponsors.badge")}</span>
        <h1 style={{ marginTop: "12px", fontSize: "38px" }}>{t("sponsors.pageTitle")}</h1>
        <p style={{ fontSize: "16px", marginTop: "16px", maxWidth: "800px", lineHeight: "1.6" }}>
          {t("sponsors.pageDesc")}
        </p>
      </section>

      {(() => {
        const renderCard = (sponsor, sIdx) => {
          const inner = (
            <img src={sponsor.logo} alt={sponsor.name} title={sponsor.name}
              style={{ maxHeight: "80px", maxWidth: "90%", objectFit: "contain" }} />
          );
          return sponsor.url ? (
            <a key={sIdx} href={sponsor.url} target="_blank" rel="noopener noreferrer" className="bento-card"
              style={{ display: "flex", justifyContent: "center", alignItems: "center", padding: "24px", height: "160px", background: "var(--card-bg)", border: "1px solid rgba(26, 22, 18, 0.06)", textDecoration: "none", transition: "box-shadow 0.15s" }}
              onMouseEnter={e => e.currentTarget.style.boxShadow = "0 4px 16px rgba(0,0,0,0.10)"}
              onMouseLeave={e => e.currentTarget.style.boxShadow = "none"}>
              {inner}
            </a>
          ) : (
            <div key={sIdx} className="bento-card" style={{ display: "flex", justifyContent: "center", alignItems: "center", padding: "24px", height: "160px", background: "var(--card-bg)", border: "1px solid rgba(26, 22, 18, 0.06)" }}>
              {inner}
            </div>
          );
        };

        const ungrouped = sponsors.filter(s => !s.tier || !tiers.find(t => t.key === s.tier));

        // No tiers defined — show all sponsors flat
        if (tiers.length === 0) {
          return (
            <section style={{ marginBottom: "56px" }}>
              {sponsors.length === 0
                ? <p style={{ fontSize: "14px", color: "var(--text-muted)", fontStyle: "italic" }}>{t("sponsors.noPartners")}</p>
                : <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: "28px" }}>
                    {sponsors.map(renderCard)}
                  </div>
              }
            </section>
          );
        }

        // Tiers defined — group by tier, ungrouped sponsors at the bottom without heading
        return (
          <>
            {tiers.map((tier, idx) => (
              <section key={tier.key || idx} style={{ marginBottom: "56px" }}>
                <h2 style={{ fontSize: "20px", borderLeft: `4px solid ${tier.color}`, paddingLeft: "12px", marginBottom: "24px" }}>
                  {tier.tier}
                </h2>
                {getSponsorsByTier(tier.key).length === 0 ? (
                  <p style={{ fontSize: "14px", color: "var(--text-muted)", fontStyle: "italic", marginLeft: "16px" }}>
                    {t("sponsors.noPartners")}
                  </p>
                ) : (
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: "28px" }}>
                    {getSponsorsByTier(tier.key).map(renderCard)}
                  </div>
                )}
              </section>
            ))}
            {ungrouped.length > 0 && (
              <section style={{ marginBottom: "56px" }}>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: "28px" }}>
                  {ungrouped.map(renderCard)}
                </div>
              </section>
            )}
          </>
        );
      })()}

      <section
        style={{
          background: "rgba(180, 83, 9, 0.03)",
          border: "1px dashed var(--accent)",
          borderRadius: "16px",
          padding: "40px",
          textAlign: "center",
          marginTop: "64px"
        }}
      >
        <h2 style={{ fontSize: "24px", color: "var(--accent)" }}>{t("sponsors.supportTitle")}</h2>
        <p style={{ marginTop: "12px", fontSize: "15px", maxWidth: "600px", margin: "12px auto 0", lineHeight: "1.6" }}>
          {t("sponsors.supportDesc1")} {t("sponsors.supportDesc2")}
        </p>
        {packetUrl && (
          <a
            href={packetUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-secondary"
            style={{ width: "fit-content", margin: "24px auto 0", display: "inline-block", padding: "12px 28px" }}
          >
            {t("sponsors.downloadPacket")}
          </a>
        )}
      </section>
    </main>
  );
}
