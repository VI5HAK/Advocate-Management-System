import homeBg from "../assets/home-bg.jpg";

function Home() {
  return (
    <div
      className="relative w-full h-full min-h-[calc(100vh-7rem)] overflow-hidden bg-cover bg-center bg-no-repeat rounded-none bg-gradient-to-tr from-sky-400 via-indigo-500 to-purple-600 flex items-center justify-center"
      style={{ backgroundImage: `url(${homeBg})` }}
    >
      {/* Semi-transparent Glass Overlay */}
      <div className="absolute inset-0 bg-slate-900/35 backdrop-blur-[2px] z-[1]" />

      {/* Marquee Banner Container */}
      <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 z-[2] py-8 bg-white/40 backdrop-blur-md border-y border-white/50 shadow-2xl overflow-hidden flex items-center">
        <div className="home-marquee-track">
          <div className="whitespace-nowrap text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-black text-white drop-shadow-[0_4px_12px_rgba(0,0,0,0.4)] pr-12 select-none tracking-wide">
            WELCOME TO ADVOCATE APPOINTMENT SYSTEM &bull; WELCOME TO ADVOCATE APPOINTMENT SYSTEM &bull; WELCOME TO ADVOCATE APPOINTMENT SYSTEM &bull;&nbsp;
          </div>
          <div className="whitespace-nowrap text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-black text-white drop-shadow-[0_4px_12px_rgba(0,0,0,0.4)] pr-12 select-none tracking-wide">
            WELCOME TO ADVOCATE APPOINTMENT SYSTEM &bull; WELCOME TO ADVOCATE APPOINTMENT SYSTEM &bull; WELCOME TO ADVOCATE APPOINTMENT SYSTEM &bull;&nbsp;
          </div>
        </div>
      </div>
    </div>
  );
}

export default Home;
