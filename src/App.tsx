import { useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import Hero from "./components/Hero";
import DateSection from "./components/DateSection";
import Venue from "./components/Venue";
import RSVP from "./components/RSVP";
import Footer from "./components/Footer";
import GuestBook from "./components/GuestBook";
import "./App.css";

const App: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ container: containerRef });

  const progressWidth = useTransform(scrollYProgress, [0, 1], ["0%", "100%"]);

  return (
    <div className="app-wrapper">
      <div className="mobile-container" ref={containerRef}>
        {/* Progress Bar */}
        <motion.div className="progress-bar" style={{ width: progressWidth }} />

        {/* Ticket Top Edge */}
        <div className="ticket-edge top">
          <div className="perforation">
            {[...Array(15)].map((_, i) => (
              <span key={i} className="perf-dot" />
            ))}
          </div>
        </div>

        {/* Main Content */}
        <main className="invitation-content">
          <Hero />
          <div className="ticket-divider">
            <span className="divider-icon">♥</span>
          </div>
          <DateSection />
          <div className="ticket-divider">
            <span className="divider-icon">✦</span>
          </div>
          <Venue />
          <div className="ticket-divider">
            <span className="divider-icon">♥</span>
          </div>
          <RSVP />
          <Footer />
        </main>

        {/* Floating Guest Book Button */}
        <GuestBook />

        {/* Ticket Bottom Edge */}
        <div className="ticket-edge bottom">
          <div className="perforation">
            {[...Array(15)].map((_, i) => (
              <span key={i} className="perf-dot" />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default App;
