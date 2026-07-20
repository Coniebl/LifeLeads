import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../lib/supabase/client";
import { LifeLeadLogo } from "../ui/LifeLeadLogo";

export function ResetPasswordForm() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [isValidating, setIsValidating] = useState(true);

  useEffect(() => {
    const handleAuth = async () => {
      try {
        // Check for 'code' in URL (PKCE Flow)
        const url = new URL(window.location.href);
        const code = url.searchParams.get("code");
        
        if (code) {
          const { error } = await supabase.auth.exchangeCodeForSession(code);
          if (error) {
            setErrorMsg("Invalid or expired password reset link.");
            setIsValidating(false);
            return;
          }
          // Clean up the URL
          window.history.replaceState({}, document.title, window.location.pathname);
        }

        // Check if a session was successfully established
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          setErrorMsg("Invalid or expired password reset link. Please request a new one.");
        }
      } catch (err) {
        setErrorMsg("Failed to validate reset link.");
      } finally {
        setIsValidating(false);
      }
    };
    
    handleAuth();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMsg("");
    setSuccessMsg("");

    if (password !== confirmPassword) {
      setErrorMsg("Passwords do not match. Please try again.");
      setIsLoading(false);
      return;
    }

    if (password.length < 6) {
      setErrorMsg("Password must be at least 6 characters long.");
      setIsLoading(false);
      return;
    }

    try {
      const { error } = await supabase.auth.updateUser({
        password: password
      });

      if (error) {
        setErrorMsg(error.message);
        setIsLoading(false);
        return;
      }
      
      setSuccessMsg("Password updated successfully! Redirecting...");
      setTimeout(() => {
        router.push("/");
      }, 2000);
    } catch (err: any) {
      setErrorMsg(err.message || "An unexpected error occurred.");
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full md:w-[45%] lg:w-[40%] h-full flex items-center justify-center bg-[#f5eedb] dark:bg-[#0d0b09] p-6 transition-colors duration-300">
      <div className="w-full max-w-[400px] min-h-[400px] bg-white dark:bg-[#181512] rounded-3xl shadow-[0_10px_35px_rgba(0,0,0,0.03)] border border-gray-100 dark:border-white/5 p-7 flex flex-col items-center justify-center transition-colors duration-300 relative overflow-hidden">
        
        <div className="w-full flex flex-col items-center animate-in fade-in duration-500">
          <div className="mb-4">
            <LifeLeadLogo />
          </div>

          <h1 className="text-[24px] font-extrabold text-[#133020] dark:text-white tracking-tight text-center mb-1.5 transition-colors duration-300">
            Set New Password
          </h1>
          <p className="text-[13px] text-gray-500 dark:text-gray-400 text-center leading-relaxed max-w-[270px] mb-5 transition-colors duration-300">
            {isValidating ? "Validating your secure link..." : "Enter a new password for your account."}
          </p>

          {errorMsg && (
            <div className="w-full mb-4 text-xs text-red-600 bg-red-50 border border-red-200 rounded-xl p-3 text-center">
              {errorMsg}
            </div>
          )}
          
          {successMsg && (
            <div className="w-full mb-4 text-xs text-[#046241] bg-[#046241]/10 border border-[#046241]/20 rounded-xl p-3 text-center">
              {successMsg}
            </div>
          )}

          {!isValidating && !errorMsg && (
            <form onSubmit={handleSubmit} className="w-full flex flex-col gap-4">
              
              {/* New Password */}
              <div className="flex flex-col gap-1.5">
                <label htmlFor="password" className="text-[13px] font-bold text-gray-800 dark:text-gray-200 tracking-wide transition-colors duration-300">
                  New Password
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
                    disabled={isLoading || successMsg !== ""}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter New Password"
                    className="w-full pl-11 pr-11 py-2.5 bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#046241]/15 focus:border-[#046241] transition-all disabled:opacity-50"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
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

              {/* Confirm Password */}
              <div className="flex flex-col gap-1.5">
                <label htmlFor="confirmPassword" className="text-[13px] font-bold text-gray-800 dark:text-gray-200 tracking-wide transition-colors duration-300">
                  Re-enter New Password
                </label>
                <div className="relative w-full">
                  <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                    <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
                    </svg>
                  </span>
                  <input
                    id="confirmPassword"
                    type={showPassword ? "text" : "password"}
                    required
                    value={confirmPassword}
                    disabled={isLoading || successMsg !== ""}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirm New Password"
                    className="w-full pl-11 pr-4 py-2.5 bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#046241]/15 focus:border-[#046241] transition-all disabled:opacity-50"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading || successMsg !== ""}
                className="group w-full py-3 px-4 bg-gradient-to-r from-[#046241] to-[#ffb347] text-white font-bold rounded-xl shadow-md hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-[#046241]/30 transition-all flex items-center justify-center cursor-pointer mt-1 text-sm disabled:opacity-50"
              >
                {isLoading ? "Updating..." : "Update Password"}
              </button>
            </form>
          )}
          
          <button
            type="button"
            onClick={() => router.push("/")}
            className="mt-4 text-xs font-bold text-gray-500 hover:text-gray-800 dark:hover:text-gray-200 transition-colors cursor-pointer text-center"
          >
            Back to log in
          </button>
        </div>
      </div>
    </div>
  );
}
