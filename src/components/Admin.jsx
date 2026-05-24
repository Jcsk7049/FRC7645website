import { useEffect, useState } from "react";
import { auth, db } from "../firebase";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc, collection, getDocs, updateDoc, deleteDoc } from "firebase/firestore";
import { useNavigate } from "react-router-dom";

export default function Admin() {
  const [isAdmin, setIsAdmin] = useState(false);
  const [myRole, setMyRole] = useState("students");
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);
  const navigate = useNavigate();

  const ROLE_ORDER = { pending: 0, students: 1, teacher: 2, admin: 3 };

  const fetchUsers = async () => {
    try {
      const usersSnapshot = await getDocs(collection(db, "users"));
      const list = [];
      usersSnapshot.forEach((doc) => {
        list.push(doc.data());
      });
      list.sort((a, b) => (ROLE_ORDER[a.role] ?? 1) - (ROLE_ORDER[b.role] ?? 1));
      setUsers(list);
    } catch (err) {
      console.warn("Failed to fetch users: ", err);
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        try {
          const userDocRef = doc(db, "users", currentUser.uid);
          const docSnap = await getDoc(userDocRef);
          
          const role = docSnap.exists() ? (docSnap.data().role || "pending") : "pending";
          setMyRole(role);

          if (role === "teacher" || role === "admin") {
            setIsAdmin(true);
            await fetchUsers();
          } else {
            navigate("/");
          }
        } catch (err) {
          console.error("Admin verification failed: ", err);
          navigate("/");
        } finally {
          setLoading(false);
        }
      } else {
        navigate("/");
      }
    });

    return () => unsubscribe();
  }, [navigate]);

  const handleRoleChange = async (userId, newRole) => {
    const targetUser = users.find(u => u.uid === userId);
    if (targetUser && targetUser.role === "admin" && myRole !== "admin") {
      alert("您沒有修改管理員權限的權限！");
      return;
    }
    if (newRole === "admin" && myRole !== "admin") {
      alert("只有系統管理員才可以指派新的管理員！");
      return;
    }

    setActionLoading(userId);
    try {
      const userRef = doc(db, "users", userId);
      await updateDoc(userRef, { role: newRole });
      
      // Update local state
      setUsers(prev => prev.map(u => u.uid === userId ? { ...u, role: newRole } : u));
      alert("變更權限成功！");
    } catch (err) {
      alert("修改權限失敗。");
      console.error(err);
    } finally {
      setActionLoading(null);
    }
  };

  const handleUserDelete = async (userId) => {
    const targetUser = users.find(u => u.uid === userId);
    if (targetUser && targetUser.role === "admin" && myRole !== "admin") {
      alert("您沒有刪除管理員帳號的權限！");
      return;
    }

    if (!window.confirm("您確定要刪除此成員的網站存取權嗎？")) return;
    
    setActionLoading(userId);
    try {
      const userRef = doc(db, "users", userId);
      await deleteDoc(userRef);
      setUsers(prev => prev.filter(u => u.uid !== userId));
      alert("帳號已成功刪除。");
    } catch (err) {
      alert("刪除成員失敗。");
      console.error(err);
    } finally {
      setActionLoading(null);
    }
  };

  if (loading) {
    return (
      <div className="container" style={{ paddingTop: "100px", paddingBottom: "100px", textAlign: "center" }}>
        <div className="spinner" style={{ margin: "0 auto" }}></div>
        <p style={{ marginTop: "20px" }}>教師與管理權限驗證中...</p>
      </div>
    );
  }

  if (!isAdmin) return null;

  return (
    <main className="container" style={{ paddingTop: "40px", paddingBottom: "80px" }} id="admin-page">
      <div style={{ borderBottom: "1px solid rgba(0, 0, 0, 0.06)", paddingBottom: "16px", marginBottom: "32px" }}>
        <h2>成員帳號審核與身份管理</h2>
        <p>新註冊帳號預設為「待審核 (pending)」，無任何操作權限。請在下方審核後指派身份組。</p>
        {users.filter(u => (u.role || "pending") === "pending").length > 0 && (
          <div style={{ marginTop: "12px", padding: "10px 14px", background: "#FEF3C7", border: "1px solid #FCD34D", borderRadius: "8px", fontSize: "13px", color: "#92400E", fontWeight: 600 }}>
            ⚠ 有 {users.filter(u => (u.role || "pending") === "pending").length} 位成員待審核，請指派身份組。
          </div>
        )}
      </div>

      <div className="admin-table-container">
        <table className="admin-table">
          <thead>
            <tr>
              <th>姓名/稱呼</th>
              <th>電子信箱 Email</th>
              <th>目前角色權限</th>
              <th>管理操作</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.uid}>
                <td style={{ fontWeight: 700 }}>{user.displayName || "未知"}</td>
                <td style={{ fontFamily: "monospace" }}>{user.email}</td>
                <td>
                  <select
                    className="role-select"
                    value={user.role || "pending"}
                    disabled={actionLoading === user.uid || (user.role === "admin" && myRole !== "admin")}
                    onChange={(e) => handleRoleChange(user.uid, e.target.value)}
                    style={(user.role || "pending") === "pending" ? { borderColor: "#FCD34D", background: "#FFFBEB" } : {}}
                  >
                    <option value="pending">待審核 (pending)</option>
                    <option value="students">學生 (students)</option>
                    <option value="teacher">指導老師 (teacher)</option>
                    {(myRole === "admin" || user.role === "admin") && (
                      <option value="admin">系統管理員 (admin)</option>
                    )}
                  </select>
                </td>
                <td>
                  <button
                    onClick={() => handleUserDelete(user.uid)}
                    disabled={actionLoading === user.uid || (user.role === "admin" && myRole !== "admin")}
                    className="btn btn-outline"
                    style={{ padding: "6px 12px", fontSize: "11px", borderColor: "#fee2e2", color: "#ef4444" }}
                  >
                    {actionLoading === user.uid ? "處理中..." : "刪除帳號"}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </main>
  );
}
