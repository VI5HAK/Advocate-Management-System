import homeBg from "../assets/home-bg.jpg";

function Home() {
  return (
    <div
      className="relative w-full min-h-[calc(100vh-12rem)] overflow-hidden bg-cover bg-center bg-no-repeat rounded-3xl shadow-sm"
      style={{ backgroundImage: `url(${homeBg})` }}
    >
      {/* White Overlay */}
      <div className="absolute inset-0 bg-white/45 z-[1]" />

      {/* Scrolling Text */}
      <div className="absolute top-1/2 left-0 w-full overflow-hidden -translate-y-1/2 z-[2]">
        <div className="home-marquee-track">
          <div className="whitespace-nowrap text-6xl md:text-7xl lg:text-[80px] font-bold text-slate-900 pr-24 select-none">
            WELCOME TO ADVOCATE APPOINTMENT SYSTEM &bull; WELCOME TO ADVOCATE
            APPOINTMENT SYSTEM &bull; WELCOME TO ADVOCATE APPOINTMENT SYSTEM
            &bull; WELCOME TO ADVOCATE APPOINTMENT SYSTEM &bull;
          </div>
          <div className="whitespace-nowrap text-6xl md:text-7xl lg:text-[80px] font-bold text-slate-900 pr-24 select-none">
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
