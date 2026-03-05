import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

const GuestBook: React.FC = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [nickname, setNickname] = useState("");
  const [message, setMessage] = useState("");
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const maxMessageLength = 200;

  const handleOpenModal = () => {
    setIsModalOpen(true);
    setIsSubmitted(false);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setNickname("");
    setMessage("");
  };

  const handleSubmit = async () => {
    if (!nickname.trim() || !message.trim()) return;

    setIsLoading(true);

    try {
      const response = await fetch("/api/guestbook", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          nickname: nickname.trim(),
          message: message.trim(),
          timestamp: new Date().toISOString(),
        }),
      });

      if (response.ok) {
        setIsSubmitted(true);
        setTimeout(() => {
          handleCloseModal();
        }, 2000);
      }
    } catch (error) {
      console.error("Failed to save message:", error);
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

  const buttonVariants = {
    initial: { scale: 0, opacity: 0 },
    animate: {
      scale: 1,
      opacity: 1,
      transition: {
        type: "spring" as const,
        stiffness: 300,
        damping: 20,
        delay: 1,
      },
    },
    tap: { scale: 0.95 },
    hover: { scale: 1.05 },
  };

  return (
    <>
      {/* Floating Button */}
      <motion.button
        className="guestbook-fab"
        variants={buttonVariants}
        initial="initial"
        animate="animate"
        whileHover="hover"
        whileTap="tap"
        onClick={handleOpenModal}
        aria-label="Leave a message"
      >
        <span className="fab-icon">✉</span>
      </motion.button>

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
              className="modal-content guestbook-modal"
              variants={modalVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              onClick={(e) => e.stopPropagation()}
            >
              <button className="modal-close" onClick={handleCloseModal}>
                ×
              </button>

              {!isSubmitted ? (
                <>
                  <h3 className="modal-title">방명록을 남겨주세요!</h3>
                  <p className="modal-subtitle">
                   신랑과 신부에게 축하 메세지를 남겨주세요 ㅎ.ㅎ
                  </p>

                  <input
                    type="text"
                    className="modal-input"
                    placeholder="이름 또는 별명을 입력해주세요."
                    value={nickname}
                    onChange={(e) => setNickname(e.target.value)}
                    maxLength={30}
                  />

                  <div className="guestbook-textarea-wrapper">
                    <textarea
                      className="modal-input guestbook-textarea"
                      placeholder="축하 메세지를 남겨주세요! (최대 200자)"
                      value={message}
                      onChange={(e) => setMessage(e.target.value.slice(0, maxMessageLength))}
                      rows={5}
                    />
                    <span className="char-count">
                      {message.length}/{maxMessageLength}
                    </span>
                  </div>

                  <motion.button
                    className="modal-submit"
                    onClick={handleSubmit}
                    disabled={!nickname.trim() || !message.trim() || isLoading}
                    whileHover={{ scale: nickname.trim() && message.trim() ? 1.02 : 1 }}
                    whileTap={{ scale: nickname.trim() && message.trim() ? 0.98 : 1 }}
                  >
                    {isLoading ? "저장 중..." : "방명록 남기기"}
                  </motion.button>
                </>
              ) : (
                <motion.div
                  className="guestbook-success"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.3 }}
                >
                  <span className="success-icon">💌</span>
                  <h3 className="success-title">감사합니다!</h3>
                  <p className="success-message">
                   방명록이 성공적으로 저장되었습니다.
                  </p>
                </motion.div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default GuestBook;
