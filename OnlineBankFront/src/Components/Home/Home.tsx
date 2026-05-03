import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./Home.scss";
import logo from "../../assets/Payment.jpg";
import clothing from "../../assets/Clothing.jpg";
import cosmetics from "../../assets/Cosmetics.jpg";
import fuel from "../../assets/Fuel.jpg";
import grocery from "../../assets/Grocery.jpg";
import technology from "../../assets/Technology.jpg";
import ticket from "../../assets/Ticket.jpg";
import transit from "../../assets/Transit.webp";
import utility from "../../assets/Utility.avif";
import stock from "../../assets/Stock.jpg";


const topCards = [
  { label: "Technologies", img: technology },
  { label: "Cosmetics",    img: cosmetics  },
];

const leftCards = [
  { label: "Clothings",      img: clothing },
  { label: "Public Transit", img: transit  },
  { label: "Groceries",      img: grocery  },
];

const rightCards = [
  { label: "Tickets",    img: ticket  },
  { label: "Utilities",  img: utility },
  { label: "Fuel",       img: fuel    },
];

export default function Home() {
  const navigate = useNavigate();
  const bannerRef   = useRef<HTMLDivElement>(null);
  const cashbackRef = useRef<HTMLDivElement>(null);
  const investRef   = useRef<HTMLDivElement>(null);
  const [bannerVisible,   setBannerVisible]   = useState(false);
  const [cashbackVisible, setCashbackVisible] = useState(false);
  const [investVisible,   setInvestVisible]   = useState(false);

  useEffect(() => {
    const bannerObs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) setBannerVisible(true); },
      { threshold: 0.35 }
    );
    const cashbackObs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) setCashbackVisible(true); },
      { threshold: 0.15 }
    );
    const investObs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) setInvestVisible(true); },
      { threshold: 0.35 }
    );
    if (bannerRef.current)   bannerObs.observe(bannerRef.current);
    if (cashbackRef.current) cashbackObs.observe(cashbackRef.current);
    if (investRef.current)   investObs.observe(investRef.current);
    return () => { bannerObs.disconnect(); cashbackObs.disconnect(); investObs.disconnect(); };
  }, []);

  return (
    <div className="home">

      <section className="home__hero">
        <div className="home__hero-glow home__hero-glow--1" />
        <div className="home__hero-glow home__hero-glow--2" />
        <h1 className="home__hero-title">
          Pay, send, and<br />
          <span className="home__hero-title--accent">save smarter.</span>
        </h1>
      </section>

      <div
        ref={bannerRef}
        className={`home__banner${bannerVisible ? " home__banner--visible" : ""}`}
      >
        <img src={logo} alt="Payment" className="home__banner-img" />
        <div className="home__banner-overlay" />
        <div className="home__banner-content">
          <h2 className="home__banner-title">Pay smarter.</h2>
          <button
            className="home__banner-btn"
            onClick={() => navigate("/transactions")}
          >
            Start
          </button>
        </div>
      </div>

      <div
        ref={cashbackRef}
        className={`home__cashback${cashbackVisible ? " home__cashback--visible" : ""}`}
      >
        <div className="home__cashback-top">
          {topCards.map(cat => (
            <div key={cat.label} className="home__card home__card--top">
              <img src={cat.img} alt={cat.label} className="home__card-img" />
              <span className="home__card-label">{cat.label}</span>
            </div>
          ))}
        </div>

        <div className="home__cashback-middle">
          <div className="home__cashback-col">
            {leftCards.map(cat => (
              <div key={cat.label} className="home__card home__card--side">
                <img src={cat.img} alt={cat.label} className="home__card-img" />
                <span className="home__card-label">{cat.label}</span>
              </div>
            ))}
          </div>

          <div className="home__cashback-center">
            <span className="home__cashback-badge">5% cash back</span>
            <h2 className="home__cashback-headline">
              Get hundreds of<br />cash back offers.
            </h2>
            <button className="home__cashback-btn">Browse Offers</button>
          </div>

          <div className="home__cashback-col">
            {rightCards.map(cat => (
              <div key={cat.label} className="home__card home__card--side">
                <img src={cat.img} alt={cat.label} className="home__card-img" />
                <span className="home__card-label">{cat.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

     <div
  ref={investRef}
  className={`home__invest${investVisible ? " home__invest--visible" : ""}`}
>
  <img src={stock} alt="Stock Market" className="home__banner-img" />
  <div className="home__banner-overlay" />
  <div className="home__banner-content">
    <h2 className="home__banner-title">Invest In The Future.</h2>
    <button
      className="home__banner-btn"
      onClick={() => navigate("/stock-market")}
    >
      Start
    </button>
  </div>
</div>

    </div>
  );
}