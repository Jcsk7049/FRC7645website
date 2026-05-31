import { useEffect, useState } from "react";
import { db } from "../firebase";
import { doc, onSnapshot, getDoc } from "firebase/firestore";
import { useTranslation } from "react-i18next";

const DEFAULT_CONTACT = {
  email: "nkmtc7645@gmail.com",
  phone: "",
  address: "臺北市南港區興中街19號",
  address_en: "No. 29, Nanganglixingzhong Rd., Nangang Dist., Taipei City",
  city: "臺北市"
};
const DEFAULT_TIERS = [
  { tier: "鑽石級", amount: "$5,000+ USD", desc: "主機甲最大面積 Logo、全套文宣、社群媒體特別致謝" },
  { tier: "黃金級", amount: "$2,000+ USD", desc: "機甲中型 Logo、隊服印製、網站首頁 Logo" },
  { tier: "白銀級", amount: "$500+ USD", desc: "機身精緻 Logo、網站首頁 Logo" },
];

export default function Contact() {
  const [socials, setSocials] = useState({});
  const [contactInfo, setContactInfo] = useState(null);
  const [showTiers, setShowTiers] = useState(true);
  const [tiers, setTiers] = useState(null);
  const [loading, setLoading] = useState(true);
  const { t, i18n } = useTranslation();

  useEffect(() => {
    const unsubSocials = onSnapshot(doc(db, "settings", "socials"), (snap) => {
      if (snap.exists()) setSocials(snap.data());
    }, err => console.warn(err));

    const fetchContact = async () => {
      try {
        const snap = await getDoc(doc(db, "settings", "contact"));
        if (snap.exists()) {
          const d = snap.data();
          setContactInfo({
            email: d.email || DEFAULT_CONTACT.email,
            phone: d.phone || "",
            address: d.address || DEFAULT_CONTACT.address,
            address_en: d.address_en || DEFAULT_CONTACT.address_en,
            city: d.city || DEFAULT_CONTACT.city
          });
          setShowTiers(d.showTiers !== false);
          setTiers(Array.isArray(d.tiers) ? d.tiers : DEFAULT_TIERS);
        } else {
          setContactInfo({ ...DEFAULT_CONTACT });
          setTiers(DEFAULT_TIERS);
        }
      } catch (err) {
        console.warn(err);
        setContactInfo(DEFAULT_CONTACT);
        setTiers(DEFAULT_TIERS);
      } finally {
        setLoading(false);
      }
    };

    fetchContact();
    return () => unsubSocials();
  }, []);

  if (loading) {
    return (
      <div className="container" style={{ paddingTop: "100px", paddingBottom: "100px", textAlign: "center" }}>
        <div className="spinner" style={{ margin: "0 auto" }} />
        <p style={{ marginTop: "20px" }}>{t("contact.loading")}</p>
      </div>
    );
  }

  return (
    <main className="container" style={{ paddingTop: "40px", paddingBottom: "80px" }} id="contact-page">
      <section style={{ borderBottom: "1px solid rgba(255, 255, 255, 0.06)", paddingBottom: "32px", marginBottom: "48px" }}>
        <span className="badge">{t("contact.badge")}</span>
        <h1 style={{ marginTop: "12px", fontSize: "38px" }}>{t("contact.pageTitle")}</h1>
        <p style={{ fontSize: "16px", marginTop: "16px", maxWidth: "800px", lineHeight: "1.6", color: "var(--text-muted)" }}>
          {t("contact.pageDesc")}
        </p>
      </section>

      <div className="robot-details-layout contact-grid">

        {/* Left: Contact Info */}
        <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>

          <div className="bento-card" style={{ padding: "32px" }}>
            <h3 style={{ fontSize: "18px", fontWeight: 700, marginBottom: "12px" }}>{t("contact.emailTitle")}</h3>
            <p style={{ fontSize: "15px", fontWeight: 600, color: "var(--text-main)" }}>
              {contactInfo.email}
            </p>
            <p style={{ marginTop: "8px", fontSize: "13px", color: "var(--text-muted)" }}>
              {t("contact.emailNote")}
            </p>
          </div>

          <div className="bento-card" style={{ padding: "32px" }}>
            <h3 style={{ fontSize: "18px", fontWeight: 700, marginBottom: "12px" }}>{t("contact.baseTitle")}</h3>
            <p style={{ fontSize: "15px", fontWeight: 600, color: "var(--text-main)" }}>
              {t("contact.schoolName")}
            </p>
            <p style={{ marginTop: "8px", fontSize: "13px", color: "var(--text-muted)", lineHeight: "1.6" }}>
              {t("contact.address")}：{i18n.language === "en" ? (contactInfo.address_en || contactInfo.address) : contactInfo.address}
              {contactInfo.phone && <><br />{t("contact.phone")}：{contactInfo.phone}</>}
            </p>
          </div>

          {(socials.instagram || socials.facebook || socials.youtube || socials.github || socials.tba || socials.first) && (
            <div className="bento-card" style={{ padding: "32px" }}>
              <h3 style={{ fontSize: "18px", fontWeight: 700, marginBottom: "16px" }}>{t("contact.socialTitle")}</h3>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "10px" }}>
                {socials.instagram && (
                  <a href={socials.instagram} target="_blank" rel="noopener noreferrer" className="btn btn-outline" style={{ padding: "8px 16px", fontSize: "13px" }}>
                    Instagram
                  </a>
                )}
                {socials.facebook && (
                  <a href={socials.facebook} target="_blank" rel="noopener noreferrer" className="btn btn-outline" style={{ padding: "8px 16px", fontSize: "13px" }}>
                    Facebook
                  </a>
                )}
                {socials.youtube && (
                  <a href={socials.youtube} target="_blank" rel="noopener noreferrer" className="btn btn-outline" style={{ padding: "8px 16px", fontSize: "13px" }}>
                    YouTube
                  </a>
                )}
                {socials.github && (
                  <a href={socials.github} target="_blank" rel="noopener noreferrer" className="btn btn-outline" style={{ padding: "8px 16px", fontSize: "13px" }}>
                    GitHub
                  </a>
                )}
                {socials.tba && (
                  <a href={socials.tba} target="_blank" rel="noopener noreferrer" className="btn btn-outline" style={{ padding: "8px 16px", fontSize: "13px" }}>
                    The Blue Alliance
                  </a>
                )}
                {socials.first && (
                  <a href={socials.first} target="_blank" rel="noopener noreferrer" className="btn btn-outline" style={{ padding: "8px 16px", fontSize: "13px" }}>
                    FIRST Inspires
                  </a>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Right: Sponsorship info */}
        <div className="bento-card" style={{ padding: "40px" }}>
          <span className="badge">{t("contact.sponsorBadge")}</span>
          <h3 style={{ fontSize: "24px", marginTop: "12px", marginBottom: "16px" }}>{t("contact.sponsorTitle")}</h3>
          <p style={{ fontSize: "14px", lineHeight: "1.7", marginBottom: "16px", color: "var(--text-muted)" }}>
            {t("contact.sponsorDesc1")}
          </p>
          <p style={{ fontSize: "14px", lineHeight: "1.7", marginBottom: "24px", color: "var(--text-muted)" }}>
            {t("contact.sponsorDesc2")}
          </p>

          {showTiers && tiers && tiers.length > 0 && (
            <div style={{ borderTop: "1px dashed rgba(255,255,255,0.08)", paddingTop: "20px" }}>
              <h4 style={{ fontSize: "15px", fontWeight: 700, marginBottom: "12px" }}>{t("contact.tiersTitle")}</h4>
              <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                {tiers.map(({ tier, amount, desc }) => (
                  <div key={tier} style={{ padding: "12px 16px", background: "var(--bg-elevated)", borderRadius: "10px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                      <span style={{ fontSize: "14px", fontWeight: 700 }}>{tier}</span>
                      <span style={{ fontSize: "12px", color: "var(--text-muted)", fontWeight: 600 }}>{amount}</span>
                    </div>
                    <p style={{ fontSize: "12px", color: "var(--text-muted)", marginTop: "4px" }}>{desc}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div style={{ marginTop: "28px" }}>
            <a href={`mailto:${contactInfo.email}`} className="btn btn-primary" style={{ width: "100%", padding: "14px", fontSize: "14px", textAlign: "center" }}>
              {t("contact.ctaEmail")}
            </a>
          </div>
        </div>

      </div>
    </main>
  );
}
