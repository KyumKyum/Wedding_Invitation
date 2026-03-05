import { motion } from "framer-motion";

const Footer: React.FC = () => {
  return (
    <motion.footer
      className="footer"
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      transition={{ duration: 0.8 }}
      viewport={{ once: true, margin: "-50px" }}
    >
      <div className="footer-content">
        <motion.p
          className="footer-quote"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          viewport={{ once: true }}
        >
         마음을 같이 하여 같은 사랑을 가지고<br/>뜻을 합하여 한 마음을 품어 (빌 2: 2)
        </motion.p>

        <motion.p
          className="footer-thanks"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.6 }}
          viewport={{ once: true }}
        >
         감사합니다 :)
        </motion.p>

        <motion.div
          className="footer-hearts"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.8 }}
          viewport={{ once: true }}
        >
          ♥ ♥ ♥
        </motion.div>
      </div>
    </motion.footer>
  );
};

export default Footer;
