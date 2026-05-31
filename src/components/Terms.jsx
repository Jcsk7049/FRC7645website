import React from "react";
import { Link } from "react-router-dom";

export default function Terms() {
  return (
    <main className="container" style={{ padding: "80px 24px", maxWidth: "800px" }}>
      <span className="badge">服務條款 (Terms of Service)</span>
      <h1 style={{ marginBottom: "24px" }}>服務條款</h1>
      
      <p style={{ marginBottom: "20px" }}>
        歡迎使用 FRC Team 7645 官方網站。當您造訪或使用本網站時，即表示您同意遵守以下服務條款：
      </p>

      <section style={{ display: "flex", flexDirection: "column", gap: "24px", marginTop: "30px" }}>
        <div>
          <h3>1. 帳號註冊與安全</h3>
          <p>
            註冊帳號時，您必須提供真實且準確的個人資訊。新帳號預設為遊客權限，您有責任維護自身帳號與密碼的保密性。禁止將帳號借予非本隊成員使用。
          </p>
        </div>

        <div>
          <h3>2. 教材與教學資源之使用規範</h3>
          <p>
            本網站學習資源庫內的所有 Inventor CAD 教學、程式控制代碼及配線圖，其版權均歸屬 FRC Team 7645 隊伍所有。獲得權限之隊員僅能將此用於個人學習、隊伍培訓及競賽準備，禁止轉載、公開散佈、或將其用於商業用途。
          </p>
        </div>

        <div>
          <h3>3. 系統使用權利保留</h3>
          <p>
            指導老師有權查閱註冊人員列表，並有權因安全考量或違反管理規定，隨時調整您的帳號權限或註銷您的網站存取權。
          </p>
        </div>

        <div>
          <h3>4. 服務之中斷與變更</h3>
          <p>
            本網站由 Firebase Hosting 免費託管。我們將盡力維護系統穩定運作，但對於因斷電、網路中斷或伺服器異常導致的資料遺失或連線中斷，本隊伍概不負賠償責任。
          </p>
        </div>
      </section>

      <div style={{ marginTop: "40px", borderTop: "1px solid rgba(255,255,255,0.06)", paddingTop: "20px" }}>
        <Link to="/" className="btn btn-secondary">返回首頁</Link>
      </div>
    </main>
  );
}
