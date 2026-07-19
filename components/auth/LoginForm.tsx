import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../lib/supabase/client";
import { LifeLeadLogo } from "../ui/LifeLeadLogo";

export function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [isInitializing, setIsInitializing] = useState(false);
  const [progress, setProgress] = useState(0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMsg("");
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) {
        setErrorMsg(error.message);
        setIsLoading(false);
        return;
      }
      
      localStorage.setItem("lifelead-user", JSON.stringify({
        email: data.user.email,
        name: data.user.user_metadata?.full_name || data.user.email?.split("@")[0].split(".").map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" ")
      }));
      
      setIsLoading(false);
      setIsInitializing(true);
      setTimeout(() => setProgress(100), 50);
      setTimeout(() => {
        router.push("/dashboard");
      }, 3000);
    } catch (err: any) {
      setErrorMsg(err.message || "An unexpected error occurred.");
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full md:w-[45%] lg:w-[40%] h-full flex items-center justify-center bg-[#f5eedb] dark:bg-[#0d0b09] p-6 transition-colors duration-300">
      <div className="w-full max-w-[400px] min-h-[500px] bg-white dark:bg-[#181512] rounded-3xl shadow-[0_10px_35px_rgba(0,0,0,0.03)] border border-gray-100 dark:border-white/5 p-7 flex flex-col items-center justify-center transition-colors duration-300 relative overflow-hidden">
        
        {isInitializing ? (
          <div className="w-full flex flex-col items-center justify-center animate-in fade-in duration-700">
            {/* Logo fading in/out softly */}
            <div className="mb-10 opacity-50 animate-pulse">
              <LifeLeadLogo />
            </div>

            {/* Progress Bar Container */}
            <div className="w-full max-w-[240px] h-[2px] bg-gray-100 dark:bg-white/5 rounded-full mb-6 overflow-hidden relative">
              {/* Gradient Progress Fill */}
              <div 
                className="absolute top-0 left-0 h-full bg-gradient-to-r from-transparent via-[#133020] dark:via-[#ffb347] to-transparent transition-all ease-out"
                style={{ width: `${progress}%`, transitionDuration: '3000ms' }}
              />
            </div>

            {/* Initializing Text */}
            <div className="flex items-center gap-2 text-[11px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-[0.2em]">
              <span className="flex gap-1">
                <span className="w-1 h-1 rounded-full bg-gray-400 dark:bg-gray-500 animate-ping" style={{ animationDelay: "0ms" }} />
                <span className="w-1 h-1 rounded-full bg-gray-400 dark:bg-gray-500 animate-ping" style={{ animationDelay: "150ms" }} />
                <span className="w-1 h-1 rounded-full bg-gray-400 dark:bg-gray-500 animate-ping" style={{ animationDelay: "300ms" }} />
              </span>
              INITIALIZING SYSTEM
            </div>
          </div>
        ) : (
          <div className="w-full flex flex-col items-center animate-in fade-in duration-500">
            {/* Logo */}
            <div className="mb-4">
              <LifeLeadLogo />
            </div>

            {/* Header */}
            <h1 className="text-[24px] font-extrabold text-[#133020] dark:text-white tracking-tight text-center mb-1.5 transition-colors duration-300">
              Log in to LifeLead
            </h1>
            <p className="text-[13px] text-gray-500 dark:text-gray-400 text-center leading-relaxed max-w-[270px] mb-5 transition-colors duration-300">
              Enter your credentials to continue monitoring and managing potential clients.
            </p>

            {/* Error Banner */}
            {errorMsg && (
              <div className="w-full mb-4 text-xs text-red-600 bg-red-50 border border-red-200 rounded-xl p-3 text-center">
                {errorMsg}
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="w-full flex flex-col gap-4">
              {/* Email field */}
              <div className="flex flex-col gap-1.5">
                <label htmlFor="email" className="text-[13px] font-bold text-gray-800 dark:text-gray-200 tracking-wide transition-colors duration-300">
                  Work Email
                </label>
                <div className="relative w-full">
                  <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                    <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
                    </svg>
                  </span>
                  <input
                    id="email"
                    type="email"
                    required
                    value={email}
                    disabled={isLoading}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@lifelead.app"
                    className="w-full pl-11 pr-4 py-2.5 bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#046241]/15 focus:border-[#046241] transition-all disabled:opacity-50"
                  />
                </div>
              </div>

              {/* Password field */}
              <div className="flex flex-col gap-1.5">
                <label htmlFor="password" className="text-[13px] font-bold text-gray-800 dark:text-gray-200 tracking-wide transition-colors duration-300">
                  Password
                </label>
                <div className="relative w-full">
                  <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                    <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
                    </svg>
                  </span>
                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    required
                    value={password}
                    disabled={isLoading}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter Your Password"
                    className="w-full pl-11 pr-11 py-2.5 bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#046241]/15 focus:border-[#046241] transition-all disabled:opacity-50"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-gray-400 hover:text-gray-600 transition-colors"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
                      </svg>
                    ) : (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>

              {/* Remember me & Forgot Password */}
              <div className="flex items-center justify-between text-xs">
                <label className="flex items-center gap-2 cursor-pointer select-none text-gray-600 dark:text-gray-400 font-medium transition-colors duration-300">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    disabled={isLoading}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="w-4 h-4 rounded border-gray-300 text-[#046241] focus:ring-[#046241] cursor-pointer disabled:opacity-50"
                  />
                  Remember me
                </label>
                <a
                  href="#forgot-password"
                  className="text-[#046241] font-bold hover:underline transition-all"
                >
                  Forgot password?
                </a>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isLoading}
                className="group w-full py-3 px-4 bg-gradient-to-r from-[#046241] to-[#ffb347] text-white font-bold rounded-xl shadow-md hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-[#046241]/30 transition-all flex items-center justify-center cursor-pointer mt-1 text-sm disabled:opacity-50"
              >
                {isLoading ? "Logging in..." : "Log in"}
                {!isLoading && (
                  <svg className="w-4 h-4 ml-2 transition-transform duration-200 group-hover:translate-x-1" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                  </svg>
                )}
              </button>
            </form>

            {/* Security Footer Box */}
            <div className="w-full bg-[#046241]/5 dark:bg-white/5 border border-[#046241]/10 dark:border-white/10 rounded-2xl p-4 flex gap-3 mt-6 items-start transition-colors duration-300">
              <svg className="w-5 h-5 text-[#046241] flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.57-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
              </svg>
              <p className="text-[11.5px] leading-relaxed text-[#046241] dark:text-gray-300 font-semibold transition-colors duration-300">
                Protected workspace access for client records and lead activity.
              </p>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}

