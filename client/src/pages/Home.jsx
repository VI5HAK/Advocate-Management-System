import "../styles/Home.css";

function Home() {
  return (
    <div className="home-page-container">
      {/* White Overlay */}
      <div className="home-overlay" />

      {/* Scrolling Text */}
      <div className="home-marquee-container">
        <div className="home-marquee-track">
          <div className="home-marquee-content">
            WELCOME TO ADVOCATE APPOINTMENT SYSTEM &bull; WELCOME TO ADVOCATE
            APPOINTMENT SYSTEM &bull; WELCOME TO ADVOCATE APPOINTMENT SYSTEM
            &bull; WELCOME TO ADVOCATE APPOINTMENT SYSTEM &bull;
          </div>
          <div className="home-marquee-content">
            WELCOME TO ADVOCATE APPOINTMENT SYSTEM &bull; WELCOME TO ADVOCATE
            APPOINTMENT SYSTEM &bull; WELCOME TO ADVOCATE APPOINTMENT SYSTEM
            &bull; WELCOME TO ADVOCATE APPOINTMENT SYSTEM &bull;
          </div>
        </div>
      </div>
    </div>
  );
}

export default Home;
