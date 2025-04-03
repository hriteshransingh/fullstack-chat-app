const AuthSpacePlanets = ({ title, subtitle }) => {
  return (
    <div className="hidden lg:flex items-center justify-center bg-gray-900 p-8 relative overflow-hidden min-h-[400px]">
      {/* Tiny stars background */}
      <div className="absolute inset-0">
        {[...Array(20)].map((_, i) => (
          <div
            key={i}
            className="absolute rounded-full bg-white"
            style={{
              width: '1px',
              height: '1px',
              top: `${Math.random() * 100}%`,
              left: `${Math.random() * 100}%`,
              opacity: Math.random(),
            }}
          />
        ))}
      </div>

      {/* Animated planets system */}
      <div className="relative w-40 h-40 mx-auto mb-8">
        {/* Central sun */}
        <div className="absolute inset-0 rounded-full bg-gradient-to-br from-yellow-400 to-orange-500 shadow-lg shadow-yellow-500/30 animate-pulse"></div>
        
        {/* Orbiting planets */}
        <div className="absolute top-0 left-1/2 w-6 h-6 rounded-full bg-blue-400 animate-[orbit_8s_linear_infinite] origin-[0_75px]">
          <div className="absolute -right-1 top-1/2 w-2 h-2 rounded-full bg-blue-200"></div>
        </div>
        
        <div className="absolute top-0 left-1/2 w-4 h-4 rounded-full bg-purple-400 animate-[orbit_5s_linear_infinite] origin-[0_50px]">
          <div className="absolute -right-1 top-1/2 w-1 h-1 rounded-full bg-purple-200"></div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-xs text-center relative z-10 mt-40">
        <h2 className="text-2xl font-bold bg-gradient-to-r from-cyan-300 to-blue-400 bg-clip-text text-transparent mb-2">
          {title}
        </h2>
        <p className="text-gray-300/70 text-sm">
          {subtitle}
        </p>
      </div>

      {/* Required animations */}
      <style>{`
        @keyframes orbit {
          from { transform: rotate(0deg) translateX(60px) rotate(0deg); }
          to { transform: rotate(360deg) translateX(60px) rotate(-360deg); }
        }
      `}</style>
    </div>
  );
};

export default AuthSpacePlanets;