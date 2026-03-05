import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface Guest {
  id: number;
  name: string;
  side: "bride" | "groom";
  timestamp: string;
}

interface GuestBookMessage {
  id: number;
  nickname: string;
  message: string;
  timestamp: string;
}

type Tab = "dashboard" | "guestbook";

const Admin: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState("");
  const [passwordError, setPasswordError] = useState(false);
  const [activeTab, setActiveTab] = useState<Tab>("dashboard");
  const [guests, setGuests] = useState<Guest[]>([]);
  const [messages, setMessages] = useState<GuestBookMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [adminPassword, setAdminPassword] = useState("");

  const handleLogin = async () => {
    try {
      const response = await fetch("/api/admin/verify", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ password }),
      });

      if (response.ok) {
        setIsAuthenticated(true);
        setAdminPassword(password);
        setPasswordError(false);
        fetchData();
      } else {
        setPasswordError(true);
      }
    } catch (error) {
      console.error("Login error:", error);
      setPasswordError(true);
    }
  };

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [rsvpRes, guestbookRes] = await Promise.all([
        fetch("/api/rsvp"),
        fetch("/api/guestbook"),
      ]);

      if (rsvpRes.ok) {
        const rsvpData = await rsvpRes.json();
        setGuests(rsvpData.guests || []);
      }

      if (guestbookRes.ok) {
        const guestbookData = await guestbookRes.json();
        setMessages(guestbookData.messages || []);
      }
    } catch (error) {
      console.error("Failed to fetch data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteGuest = async (id: number) => {
    if (!confirm("Are you sure you want to remove this guest?")) return;

    try {
      const response = await fetch(`/api/rsvp/${id}`, {
        method: "DELETE",
        headers: {
          "x-admin-password": adminPassword,
        },
      });

      if (response.ok) {
        setGuests((prev) => prev.filter((g) => g.id !== id));
      }
    } catch (error) {
      console.error("Failed to delete guest:", error);
    }
  };

  const handleDeleteMessage = async (id: number) => {
    if (!confirm("Are you sure you want to remove this message?")) return;

    try {
      const response = await fetch(`/api/guestbook/${id}`, {
        method: "DELETE",
        headers: {
          "x-admin-password": adminPassword,
        },
      });

      if (response.ok) {
        setMessages((prev) => prev.filter((m) => m.id !== id));
      }
    } catch (error) {
      console.error("Failed to delete message:", error);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      fetchData();
    }
  }, [isAuthenticated]);

  const brideGuests = guests.filter((g) => g.side === "bride");
  const groomGuests = guests.filter((g) => g.side === "groom");

  // Login Screen
  if (!isAuthenticated) {
    return (
      <div className="admin-wrapper">
        <div className="admin-login">
          <motion.div
            className="login-card"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <h1 className="login-title">비밀 페이지</h1>
            <p className="login-subtitle">자격을 증명하세요!</p>

            <input
              type="password"
              className={`login-input ${passwordError ? "error" : ""}`}
              placeholder="Passphrase"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                setPasswordError(false);
              }}
              onKeyDown={(e) => e.key === "Enter" && handleLogin()}
            />

            {passwordError && (
              <motion.p
                className="login-error"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              >
               땡! 다시 시도해보세요 ㅎ.ㅎ
              </motion.p>
            )}

            <button className="login-btn" onClick={handleLogin}>
             열려라 참깨!
            </button>
          </motion.div>
        </div>
      </div>
    );
  }

  // Admin Dashboard
  return (
    <div className="admin-wrapper">
      <div className="admin-container">
        {/* Header */}
        <header className="admin-header">
          <h1 className="admin-title">관리자 페이지</h1>
          <button
            className="logout-btn"
            onClick={() => {
              setIsAuthenticated(false);
              setPassword("");
              setAdminPassword("");
            }}
          >
           로그아웃
          </button>
        </header>

        {/* Tabs */}
        <div className="admin-tabs">
          <button
            className={`tab-btn ${activeTab === "dashboard" ? "active" : ""}`}
            onClick={() => setActiveTab("dashboard")}
          >
           하객 수
          </button>
          <button
            className={`tab-btn ${activeTab === "guestbook" ? "active" : ""}`}
            onClick={() => setActiveTab("guestbook")}
          >
           방명록
          </button>
        </div>

        {/* Content */}
        <AnimatePresence mode="wait">
          {isLoading ? (
            <motion.div
              className="loading-state"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              Loading...
            </motion.div>
          ) : activeTab === "dashboard" ? (
            <motion.div
              key="dashboard"
              className="tab-content"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.3 }}
            >
              {/* Stats */}
              <div className="stats-row">
                <div className="stat-card">
                  <span className="stat-number">{guests.length}</span>
                  <span className="stat-label">총 하객 수</span>
                </div>
                <div className="stat-card bride">
                  <span className="stat-number">{brideGuests.length}</span>
                  <span className="stat-label">신부 측 하객 수</span>
                </div>
                <div className="stat-card groom">
                  <span className="stat-number">{groomGuests.length}</span>
                  <span className="stat-label">신랑 측 하객 수</span>
                </div>
              </div>

              {/* Guest Lists */}
              <div className="guest-lists">
                {/* Bride's Guests */}
                <div className="guest-list-section">
                  <h3 className="list-title">
                    <span className="title-icon">👰</span>
                    신부 측 하객들
                  </h3>
                  <div className="guest-scroll-list">
                    {brideGuests.length === 0 ? (
                      <p className="empty-state">하객이 없습니다</p>
                    ) : (
                      brideGuests.map((guest) => (
                        <div key={guest.id} className="guest-item">
                          <span className="guest-name">{guest.name}</span>
                          <button
                            className="delete-btn"
                            onClick={() => handleDeleteGuest(guest.id)}
                            aria-label="Remove guest"
                          >
                            ×
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* Groom's Guests */}
                <div className="guest-list-section">
                  <h3 className="list-title">
                    <span className="title-icon">🤵</span>
                    신랑 측 하객들
                  </h3>
                  <div className="guest-scroll-list">
                    {groomGuests.length === 0 ? (
                      <p className="empty-state">하객이 없습니다</p>
                    ) : (
                      groomGuests.map((guest) => (
                        <div key={guest.id} className="guest-item">
                          <span className="guest-name">{guest.name}</span>
                          <button
                            className="delete-btn"
                            onClick={() => handleDeleteGuest(guest.id)}
                            aria-label="Remove guest"
                          >
                            ×
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="guestbook"
              className="tab-content"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.3 }}
            >
              <div className="guestbook-header">
                <h3 className="list-title">
                  <span className="title-icon">💌</span>
                  방명록 ({messages.length})
                </h3>
              </div>

              <div className="messages-scroll-list">
                {messages.length === 0 ? (
                  <p className="empty-state">아직 방명록이 없어요!</p>
                ) : (
                  messages.map((msg) => (
                    <div key={msg.id} className="message-card">
                      <div className="message-header">
                        <span className="message-nickname">{msg.nickname}</span>
                        <button
                          className="delete-btn"
                          onClick={() => handleDeleteMessage(msg.id)}
                          aria-label="Remove message"
                        >
                          ×
                        </button>
                      </div>
                      <p className="message-text">{msg.message}</p>
                      <span className="message-date">
                        {new Date(msg.timestamp).toLocaleDateString("ko-KR", {
                          year: "numeric",
                          month: "2-digit",
                          day: "2-digit",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default Admin;
