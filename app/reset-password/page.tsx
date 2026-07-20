"use client";

import React from "react";
import { AuthSlideshow } from "../../components/auth/AuthSlideshow";
import { ResetPasswordForm } from "../../components/auth/ResetPasswordForm";

export default function ResetPasswordPage() {
  return (
    <main className="h-screen w-full flex flex-col md:flex-row overflow-hidden bg-[#f5eedb] dark:bg-[#0d0b09] transition-colors duration-300 select-none">
      <AuthSlideshow />
      <ResetPasswordForm />
    </main>
  );
}
