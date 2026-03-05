import { motion, Variants } from "framer-motion";

const DateSection: React.FC = () => {
  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2,
        delayChildren: 0.1,
      },
    },
  };

  const itemVariants: Variants = {
    hidden: { opacity: 0, y: 30 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.8,
        ease: [0.25, 0.46, 0.45, 0.94] as const,
      },
    },
  };

  return (
    <motion.section
      className="date-section"
      variants={containerVariants}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.3 }}
    >
      <motion.p className="date-label" variants={itemVariants}>
        Save the Date
      </motion.p>

      <motion.div className="date-display" variants={itemVariants}>
        <div className="date-part">
          <span className="date-number">2026</span>
          <span className="date-text">Year</span>
        </div>
        <div className="date-separator">•</div>
        <div className="date-part">
          <span className="date-number">08</span>
          <span className="date-text">Month</span>
        </div>
        <div className="date-separator">•</div>
        <div className="date-part">
          <span className="date-number">29</span>
          <span className="date-text">Day</span>
        </div>
      </motion.div>

      <motion.p className="date-day" variants={itemVariants}>
        2026년 8월 29일 토요일 17시
      </motion.p>
    </motion.section>
  );
};

export default DateSection;
