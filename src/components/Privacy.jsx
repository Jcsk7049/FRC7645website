import React from "react";
import { Link } from "react-router-dom";

export default function Privacy() {
  return (
    <main className="container" style={{ padding: "80px 24px", maxWidth: "800px" }}>
      <span className="badge">隱私權政策 (Privacy Policy)</span>
      <h1 style={{ marginBottom: "24px" }}>隱私權政策</h1>
      
      <p style={{ marginBottom: "20px" }}>
        歡迎造訪 FRC Team 7645 官方網站。我們非常重視您的隱私，本政策旨在說明我們如何收集、使用及保護您的個人資訊。
      </p>

      <section style={{ display: "flex", flexDirection: "column", gap: "24px", marginTop: "30px" }}>
        <div>
          <h3>1. 資訊收集與使用</h3>
          <p>
            當您在我們的網站上註冊帳號或使用 Google 登入時，我們會收集您的姓名、電子信箱 (Email) 及頭像。這些資訊僅用於識別您的身分、控管學習資源庫瀏覽權限，以及與您進行隊伍內部溝通，絕不作為商業推廣或行銷用途。
          </p>
        </div>

        <div>
          <h3>2. 資料安全防護</h3>
          <p>
            我們使用 Firebase 伺服器級的安全機制來保護您的資料。所有內部教學資源、成員清單皆透過伺服器端安全規則進行嚴密限制，防止未授權的第三方存取或外洩。
          </p>
        </div>

        <div>
          <h3>3. Cookie 技術之使用</h3>
          <p>
            本網站透過 Firebase Authentication 使用 Cookie 以維持您的登入狀態。您可以透過瀏覽器設定停用 Cookie，但這可能會導致您無法登入或瀏覽資源庫。
          </p>
        </div>

        <div>
          <h3>4. 第三方連結</h3>
          <p>
            我們的網站可能包含指向第三方網站（如 FIRST 官網、Autodesk）的連結。我們對這些外部網站的隱私權政策或內容概不負責。
          </p>
        </div>

        <div>
          <h3>5. 政策之修改</h3>
          <p>
            我們可能會適時修正本隱私權政策，修正後的條款將立即公布於本頁面。
          </p>
        </div>
      </section>

      <div style={{ marginTop: "40px", borderTop: "1px solid #E4E7EC", paddingTop: "20px" }}>
        <Link to="/" className="btn btn-secondary">返回首頁</Link>
      </div>
    </main>
  );
}
