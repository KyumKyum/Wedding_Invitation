import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";

type GuestSide = "bride" | "groom" | null;

const RSVP: React.FC = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [name, setName] = useState("");
  const [side, setSide] = useState<GuestSide>(null);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleAcceptClick = () => {
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setName("");
    setSide(null);
  };

  const handleSubmit = async () => {
    if (!name.trim() || !side) return;

    setIsLoading(true);

    try {
      const response = await fetch("/api/rsvp", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: name.trim(),
          side: side,
          timestamp: new Date().toISOString(),
        }),
      });

      if (response.ok) {
        setIsSubmitted(true);
        setIsModalOpen(false);
        setName("");
        setSide(null);
      }
    } catch (error) {
      console.error("Failed to save RSVP:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const backdropVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1 },
  };

  const modalVariants = {
    hidden: { opacity: 0, scale: 0.9, y: 20 },
    visible: {
      opacity: 1,
      scale: 1,
      y: 0,
      transition: {
        type: "spring" as const,
        stiffness: 300,
        damping: 25,
      },
    },
    exit: {
      opacity: 0,
      scale: 0.9,
      y: 20,
      transition: {
        duration: 0.2,
      },
    },
  };

  const isFormValid = name.trim() && side;

  return (
    <>
      <motion.section
        className="rsvp-section"
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        viewport={{ once: true, amount: 0.3 }}
      >
        <span className="section-label">RSVP</span>

        <h2 className="rsvp-title">
          {isSubmitted ? "감사합니다! :)" : "결혼식에 참석하시나요?"}
        </h2>

        <p className="rsvp-subtitle">
          {isSubmitted
            ? "가장 행복한 모습으로 뵙겠습니다."
            : "참석 여부를 알려주세요. (하객 수 파악용)"}
        </p>

        {!isSubmitted && (
          <motion.button
            className="rsvp-accept-btn"
            onClick={handleAcceptClick}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <span className="btn-icon">✓</span>
            네! 참석하겠습니다.
          </motion.button>
        )}

        {isSubmitted && (
          <motion.div
            className="rsvp-confirmed"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4 }}
          >
            <span className="confirmed-icon">♥</span>
            <span>참석 확인 완료!</span>
          </motion.div>
        )}
      </motion.section>

      {/* Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <motion.div
            className="modal-backdrop"
            variants={backdropVariants}
            initial="hidden"
            animate="visible"
            exit="hidden"
            onClick={handleCloseModal}
          >
            <motion.div
              className="modal-content"
              variants={modalVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              onClick={(e) => e.stopPropagation()}
            >
              <button className="modal-close" onClick={handleCloseModal}>
                ×
              </button>

              <h3 className="modal-title">안녕하세요! :)</h3>
              <p className="modal-subtitle">
               저희 결혼식에 참석해주신다니 감사드립니다. <br />
         아래에 성함과 누구의 하객인지 입력해주세요! <br />
               (입력하신 정보는 하객 수 파악용으로만 사용됩니다.)
              </p>

              <input
                type="text"
                className="modal-input"
                placeholder="성함을 입력해주세요"
                value={name}
                onChange={(e) => setName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && isFormValid && handleSubmit()}
              />

              {/* Bride/Groom Radio Selection */}
              <div className="side-selection">
                <p className="side-label">누구의 하객이신가요?</p>
                <div className="side-options">
                  <label className={`side-option ${side === "bride" ? "selected" : ""}`}>
                    <input
                      type="radio"
                      name="side"
                      value="bride"
                      checked={side === "bride"}
                      onChange={() => setSide("bride")}
                    />
                    <span className="radio-custom"></span>
                    <span className="side-text">신부 (김은빈)</span>
                  </label>

                  <label className={`side-option ${side === "groom" ? "selected" : ""}`}>
                    <input
                      type="radio"
                      name="side"
                      value="groom"
                      checked={side === "groom"}
                      onChange={() => setSide("groom")}
                    />
                    <span className="radio-custom"></span>
                    <span className="side-text">신랑 (임규민)</span>
                  </label>
                </div>
              </div>

              <motion.button
                className="modal-submit"
                onClick={handleSubmit}
                disabled={!isFormValid || isLoading}
                whileHover={{ scale: isFormValid ? 1.02 : 1 }}
                whileTap={{ scale: isFormValid ? 0.98 : 1 }}
              >
                {isLoading ? "저장 중..." : "결혼식에 참여하겠습니다!"}
              </motion.button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default RSVP;
