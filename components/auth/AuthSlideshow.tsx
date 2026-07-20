import React, { useState, useEffect } from "react";

export function AuthSlideshow() {
  const [activeIndex, setActiveIndex] = useState(0);

  const slides = [
    {
      src: "/assets/lead_gen_meeting.jpg",
      alt: "Admin and clients meeting for lead generation",
      title: "Cultivate Connections",
      description: "Build lasting relationships with prospective clients."
    },
    {
      src: "/assets/lead_gen_analytics.jpg",
      alt: "Lead generation analytics dashboard",
      title: "Data-Driven Growth",
      description: "Leverage intelligent analytics to capture every lead."
    },
    {
      src: "/assets/lead_gen_strategy.jpg",
      alt: "Team working on lead conversion strategies",
      title: "Strategic Conversion",
      description: "Empower your team with tools that turn prospects into partners."
    },
    {
      src: "/assets/lead_gen_success.jpg",
      alt: "Successful lead conversion handshake",
      title: "Seamless Onboarding",
      description: "Ensure every new lead feels valued from the very first interaction."
    }
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % slides.length);
    }, 3000);
    return () => clearInterval(timer);
  }, [slides.length]);

  return (
    <div className="hidden md:block relative md:w-[55%] lg:w-[60%] h-full overflow-hidden">
      {slides.map((slide, index) => (
        <div
          key={index}
          className={`absolute inset-0 transition-all duration-1000 ease-in-out ${
            index === activeIndex ? "opacity-100 scale-100" : "opacity-0 scale-105 pointer-events-none"
          }`}
        >
          {/* Slideshow Image */}
          <img
            src={slide.src}
            alt={slide.alt}
            className="w-full h-full object-cover"
          />
          {/* Dark gradient overlay for modern aesthetic & readability */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent pointer-events-none" />
          
          {/* Minimalist Text Overlay */}
          <div className="absolute bottom-24 left-12 right-12 transition-all duration-500">
            <h2 className="text-2xl lg:text-3xl font-light text-white/95 tracking-wider drop-shadow-md mb-2">
              {slide.title}
            </h2>
            <p className="text-sm lg:text-base font-extralight text-white/80 tracking-wide drop-shadow-sm max-w-md">
              {slide.description}
            </p>
          </div>
        </div>
      ))}

      {/* Carousel Indicators (Centered at the bottom) */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-black/20 backdrop-blur-sm px-4 py-2 rounded-full flex gap-2 z-10">
        {slides.map((_, index) => (
          <button
            key={index}
            onClick={() => setActiveIndex(index)}
            className={`w-2.5 h-2.5 rounded-full transition-all duration-300 cursor-pointer ${
              index === activeIndex ? "bg-[#ffb347] scale-110" : "bg-white/50 hover:bg-white/80"
            }`}
            aria-label={`Go to slide ${index + 1}`}
          />
        ))}
      </div>
    </div>
  );
}
