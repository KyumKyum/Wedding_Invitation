import { motion, Variants } from "framer-motion";

const Venue: React.FC = () => {
  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.15,
      },
    },
  };

  const itemVariants: Variants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.5,
        ease: "easeOut",
      },
    },
  };

  const handleMapClick = () => {
    window.open("https://naver.me/GgW8fTWQ", "_blank", "noopener,noreferrer");
  };

  return (
    <section className="venue-section">
      <motion.div
        className="venue-container"
        variants={containerVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.3 }}
      >
        <motion.span className="venue-label" variants={itemVariants}>
          Location
        </motion.span>

        <motion.h2 className="venue-title" variants={itemVariants}>
         H Square 컨벤션 홀
        </motion.h2>

        <motion.div className="venue-address" variants={itemVariants}>
          <p>서울시 성동구 행당동 15-1</p>
          <p>H스퀘어 (한양대동문회관) 6층</p>
        </motion.div>

        {/* Map Button */}
        <motion.div className="map-button-container" variants={itemVariants}>
          <motion.button
            className="map-button"
            onClick={handleMapClick}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <span className="map-button-icon">📍</span>
            <span className="map-button-text">지도 보기</span>
          </motion.button>
        </motion.div>

        {/* Transportation Info */}
        <motion.div className="transport-section" variants={itemVariants}>
          <h3 className="transport-title">오시는 길</h3>

          <div className="transport-item">
            <span className="transport-icon">🚘</span>
            <div className="transport-info">
              <h4>자가용</h4>
              <p>건물 내 1주차장 / 한양대병원 2주차장</p>
              <p className="transport-detail">주차 1시간 30분 무료</p>
            </div>
          </div>

          <div className="transport-item">
            <span className="transport-icon">🚇</span>
            <div className="transport-info">
              <h4>지하철</h4>
              <p>한양대역 (2호선) 1번 출구<br/>왕십리역 (5호선) 6번 출구</p>
              <p className="transport-detail">도보 5분 거리</p>
            </div>
          </div>

          <div className="transport-item">
            <span className="transport-icon">🚌</span>
            <div className="transport-info">
              <h4>버스</h4>
              <p>한양대앞 121, 2013<br/>한양대정문앞 121, 302, 2012<br/>2014, 2016, 2222</p>
              <p className="transport-detail">도보 5분 거리</p>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </section>
  );
};

export default Venue;
