"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../lib/supabase/client";

interface Profile {
  id: string;
  first_name: string;
  last_name: string;
  phone: string;
  role: string;
  created_at: string;
}

export default function AdminManagementPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    password: "",
    role: "user"
  });

  useEffect(() => {
    fetchProfiles();
  }, []);

  const fetchProfiles = async () => {
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .order("created_at", { ascending: false });

    if (!error && data) {
      setProfiles(data);
    }
    setIsLoading(false);
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMsg("");
    setSuccessMsg("");

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("No session found");

      const response = await fetch("/api/admin/create-user", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${session.access_token}`
        },
        body: JSON.stringify(formData)
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to create user");
      }

      setSuccessMsg("User created successfully!");
      setShowModal(false);
      
      // Reset form
      setFormData({
        firstName: "",
        lastName: "",
        email: "",
        phone: "",
        password: "",
        role: "user"
      });

      // Refresh list
      fetchProfiles();
    } catch (err: any) {
      setErrorMsg(err.message || "An unexpected error occurred.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-[#f5eedb] dark:bg-[#0d0b09]">
        <div className="w-8 h-8 rounded-full bg-gray-400 animate-ping"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full bg-[#f5eedb] dark:bg-[#0d0b09] p-8 transition-colors duration-300">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-extrabold text-[#133020] dark:text-white tracking-tight">Admin Management</h1>
            <p className="text-gray-500 dark:text-gray-400 mt-2 text-sm">Manage team access and roles.</p>
          </div>
          <div className="flex gap-4">
            <button
              onClick={() => router.push("/dashboard")}
              className="px-5 py-2.5 rounded-xl font-bold text-sm text-gray-700 dark:text-gray-200 bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 hover:bg-gray-50 dark:hover:bg-white/10 transition-colors shadow-sm"
            >
              Back to Dashboard
            </button>
            <button
              onClick={() => setShowModal(true)}
              className="px-5 py-2.5 rounded-xl font-bold text-sm text-white bg-[#046241] hover:bg-[#034d33] transition-colors shadow-md"
            >
              + Create New User
            </button>
          </div>
        </div>

        {errorMsg && (
          <div className="w-full mb-6 text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl p-4">
            {errorMsg}
          </div>
        )}
        
        {successMsg && (
          <div className="w-full mb-6 text-sm text-[#046241] bg-[#046241]/10 border border-[#046241]/20 rounded-xl p-4">
            {successMsg}
          </div>
        )}

        {/* Users Table */}
        <div className="bg-white dark:bg-[#181512] rounded-3xl shadow-[0_10px_35px_rgba(0,0,0,0.03)] border border-gray-100 dark:border-white/5 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-gray-100 dark:border-white/5">
                  <th className="py-4 px-6 text-xs font-black text-gray-400 uppercase tracking-wider">Name</th>
                  <th className="py-4 px-6 text-xs font-black text-gray-400 uppercase tracking-wider">Role</th>
                  <th className="py-4 px-6 text-xs font-black text-gray-400 uppercase tracking-wider">Phone</th>
                  <th className="py-4 px-6 text-xs font-black text-gray-400 uppercase tracking-wider">Joined</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-white/5">
                {profiles.map((profile) => (
                  <tr key={profile.id} className="hover:bg-gray-50/50 dark:hover:bg-white/[0.02] transition-colors">
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-[#046241]/10 flex items-center justify-center text-[#046241] font-bold text-sm">
                          {(profile.first_name?.[0] || "") + (profile.last_name?.[0] || "")}
                        </div>
                        <span className="text-sm font-bold text-gray-900 dark:text-white">
                          {profile.first_name || "Unknown"} {profile.last_name || ""}
                        </span>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <span className={`inline-flex px-2.5 py-1 rounded-md text-[11px] font-bold tracking-wide uppercase ${
                        profile.role === 'admin' 
                          ? 'bg-purple-100 text-purple-700 dark:bg-purple-500/20 dark:text-purple-300' 
                          : 'bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-300'
                      }`}>
                        {profile.role}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-sm text-gray-500 dark:text-gray-400">
                      {profile.phone || "-"}
                    </td>
                    <td className="py-4 px-6 text-sm text-gray-500 dark:text-gray-400">
                      {new Date(profile.created_at).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
                {profiles.length === 0 && (
                  <tr>
                    <td colSpan={4} className="py-8 text-center text-gray-500 text-sm">
                      No users found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Create User Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-[#181512] rounded-3xl w-full max-w-lg shadow-2xl border border-gray-100 dark:border-white/10 overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-6 border-b border-gray-100 dark:border-white/10 flex items-center justify-between bg-gray-50/50 dark:bg-white/[0.02]">
              <div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">Create New User</h2>
                <p className="text-xs text-gray-500 mt-1">Add a new member to your workspace.</p>
              </div>
              <button 
                onClick={() => setShowModal(false)}
                className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-200 dark:bg-white/10 text-gray-600 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-white/20 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto">
              <form id="create-user-form" onSubmit={handleCreateUser} className="flex flex-col gap-5">
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">First Name</label>
                    <input 
                      type="text" required value={formData.firstName} onChange={e => setFormData({...formData, firstName: e.target.value})}
                      className="w-full px-4 py-2.5 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl text-sm focus:ring-2 focus:ring-[#046241]/20 focus:border-[#046241] outline-none transition-all dark:text-white"
                      placeholder="John"
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">Last Name</label>
                    <input 
                      type="text" required value={formData.lastName} onChange={e => setFormData({...formData, lastName: e.target.value})}
                      className="w-full px-4 py-2.5 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl text-sm focus:ring-2 focus:ring-[#046241]/20 focus:border-[#046241] outline-none transition-all dark:text-white"
                      placeholder="Doe"
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">Email Address</label>
                  <input 
                    type="email" required value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})}
                    className="w-full px-4 py-2.5 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl text-sm focus:ring-2 focus:ring-[#046241]/20 focus:border-[#046241] outline-none transition-all dark:text-white"
                    placeholder="john@example.com"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">Phone Number <span className="text-gray-400 font-normal capitalize">(Optional)</span></label>
                  <input 
                    type="tel" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})}
                    className="w-full px-4 py-2.5 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl text-sm focus:ring-2 focus:ring-[#046241]/20 focus:border-[#046241] outline-none transition-all dark:text-white"
                    placeholder="+1234567890"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">Temporary Password</label>
                  <input 
                    type="password" required value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})}
                    className="w-full px-4 py-2.5 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl text-sm focus:ring-2 focus:ring-[#046241]/20 focus:border-[#046241] outline-none transition-all dark:text-white"
                    placeholder="Min 6 characters"
                    minLength={6}
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">Role</label>
                  <select 
                    value={formData.role} onChange={e => setFormData({...formData, role: e.target.value})}
                    className="w-full px-4 py-2.5 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl text-sm focus:ring-2 focus:ring-[#046241]/20 focus:border-[#046241] outline-none transition-all dark:text-white appearance-none"
                  >
                    <option value="user" className="text-gray-900">Standard User</option>
                    <option value="admin" className="text-gray-900">Administrator</option>
                  </select>
                </div>
              </form>
            </div>
            
            <div className="p-5 border-t border-gray-100 dark:border-white/10 bg-gray-50/50 dark:bg-white/[0.02] flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="px-5 py-2.5 rounded-xl font-bold text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-white/10 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                form="create-user-form"
                disabled={isSubmitting}
                className="px-6 py-2.5 rounded-xl font-bold text-sm text-white bg-gradient-to-r from-[#046241] to-[#046241]/80 hover:from-[#034d33] hover:to-[#034d33] shadow-md transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                {isSubmitting ? "Creating..." : "Create User"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
