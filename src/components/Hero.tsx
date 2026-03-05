import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { FC } from "react";

// Import photos from assets
import photo1 from "../assets/1.jpg";
import photo2 from "../assets/2.jpg";
import photo3 from "../assets/3.jpg";
import photo4 from "../assets/4.jpg";
import photo5 from "../assets/5.jpg";
import photo6 from "../assets/6.jpg";

const Hero: FC = () => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [direction, setDirection] = useState(1);

  const carouselImages = [
    { id: 1, src: photo1, alt: "Photo 1" },
    { id: 2, src: photo2, alt: "Photo 2" },
    { id: 3, src: photo3, alt: "Photo 3" },
    { id: 4, src: photo4, alt: "Photo 4" },
    { id: 5, src: photo5, alt: "Photo 5" },
    { id: 6, src: photo6, alt: "Photo 6" },
  ];

  const nextSlide = useCallback(() => {
    setDirection(1);
    setCurrentIndex((prev) => (prev + 1) % carouselImages.length);
  }, [carouselImages.length]);

  // Auto-rotate carousel
  useEffect(() => {
    const interval = setInterval(nextSlide, 4000);
    return () => clearInterval(interval);
  }, [nextSlide]);

  const slideVariants = {
    enter: (dir: number) => ({
      x: dir > 0 ? "100%" : "-100%",
      opacity: 1,
    }),
    center: {
      x: 0,
      opacity: 1,
    },
    exit: (dir: number) => ({
      x: dir > 0 ? "-100%" : "100%",
      opacity: 1,
    }),
  };

  const swipeToImage = (index: number) => {
    setDirection(index > currentIndex ? 1 : -1);
    setCurrentIndex(index);
  };

  return (
    <section className="hero-section">
      <motion.div
        className="hero-carousel-container"
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
      >
        <div className="carousel-wrapper">
          <AnimatePresence initial={false} custom={direction} mode="popLayout">
            <motion.div
              key={currentIndex}
              className="carousel-slide"
              custom={direction}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{
                x: { type: "tween", duration: 0.5, ease: "easeInOut" },
              }}
            >
              <img
                src={carouselImages[currentIndex].src}
                alt={carouselImages[currentIndex].alt}
                className="carousel-image"
              />
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Carousel Indicators */}
        <div className="carousel-indicators">
          {carouselImages.map((_, index) => (
            <button
              key={index}
              className={`indicator ${index === currentIndex ? "active" : ""}`}
              onClick={() => swipeToImage(index)}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>
      </motion.div>

      <motion.div
        className="hero-text"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.3, ease: "easeOut" }}
      >
       <p className="hero-subtitle">내가 주와 또는 선생이 되어 너희 발을 씻었으니<br/>너희도 서로 발을 씻어 주는 것이 옳으니라 (요 13:14)</p>
        <h1 className="hero-names">
          <span className="name">Lim Kyu Min</span>
          <span className="ampersand">&</span>
          <span className="name">Kim Eun Bin</span>
        </h1>
        <p className="hero-tagline">임수영 · 김미정의 장남, 신랑 임규민과,<br/>김상규 · 강유미의 장녀, 신부 김은빈이 결혼합니다.<br/><br/>주님의 인도하심으로 만난 두 사람이<br/>이제 사랑과 섬김으로 하나가 되려고 합니다.<br/><br/>축복과 격려로 함께 해주신다면<br/>더없는 기쁨으로 간직하겠습니다. :)</p>
      </motion.div>
    </section>
  );
};

export default Hero;
