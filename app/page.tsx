"use client";

import React from "react";
import { AuthSlideshow } from "../components/auth/AuthSlideshow";
import { LoginForm } from "../components/auth/LoginForm";

export default function LoginPage() {
  return (
    <main className="h-screen w-full flex flex-col md:flex-row overflow-hidden bg-[#f5eedb] dark:bg-[#0d0b09] transition-colors duration-300 select-none">
      <AuthSlideshow />
      <LoginForm />
    </main>
  );
}