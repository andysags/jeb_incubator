import React, { useState } from "react";
import { useRouter } from "next/router";
import { Mail, Lock, ArrowRight, Building2 } from "lucide-react";

function SignupPage() {
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [role, setRole] = useState("startup");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    setLoading(true);
    try {
      // Instead of writing to DB immediately, store credentials locally and redirect to profile completion
      const roleAliases: Record<string, string> = {
        admin: 'admin',
        startup: 'startup',
        investor: 'investor',
      };
      const normalizedRole = roleAliases[(role || '').toLowerCase()] || 'startup';
      const pending = { nom: name || '', email, password, role: normalizedRole };
      try {
        localStorage.setItem('pending_signup', JSON.stringify(pending));
      } catch (e) {
        console.warn('localStorage unavailable', e);
      }
      router.push(`/profile-completion?type=${role}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-start justify-center pt-40 bg-gradient-to-br from-[#F8CACF] via-white to-[#C174F2] relative">
      {/* Floating logo and welcome message */}
      <div className="brand absolute top-2 left-1/2 -translate-x-1/2 flex flex-col items-center z-10 w-full px-2">
        <img src={new URL('../../public/logo.jpeg', import.meta.url).href} alt="JEB" className="w-16 h-16 rounded-full shadow-lg bg-white/80 mb-1" />
        <h1 className="text-2xl font-bold text-[#6C2BD7] drop-shadow-sm">Welcome</h1>
        <p className="text-sm text-[#6C2BD7] mt-1 text-center break-words max-w-xs">Sign up to the JEB platform</p>
      </div>
      {/* Floating signup card with the same design as login */}
      <form onSubmit={handleSubmit} className="flex flex-col gap-1 bg-white p-6 w-[370px] h-auto min-h-[300px] max-h-[500px] overflow-y-auto rounded-3xl font-sans shadow-xl z-20 relative">
        <h2 className="text-center text-[#6C2BD7] text-xl font-bold mb-2 drop-shadow">Sign Up</h2>
  {/* Email */}
        <div className="flex flex-col mb-0.5">
          <label className="text-[#A259F7] text-sm font-semibold">Email</label>
        </div>
        <div className="flex items-center border border-[#F18585] rounded-xl h-10 pl-2 transition-colors focus-within:border-[#A259F7] mb-1 bg-white">
          <Mail className="text-[#A259F7] mr-2 h-4 w-4" />
          <input
            type="email"
            className="ml-2 rounded-xl border-none w-full h-full focus:outline-none font-sans placeholder:font-sans bg-transparent text-[#151717] text-sm"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        {/* Name */}
        <div className="flex flex-col mb-0.5 mt-1">
          <label className="text-[#A259F7] text-sm font-semibold">Name</label>
        </div>
        <div className="flex items-center border border-[#F18585] rounded-xl h-10 pl-2 transition-colors focus-within:border-[#A259F7] mb-1 bg-white">
          <Building2 className="text-[#A259F7] mr-2 h-4 w-4" />
          <input
            type="text"
            className="ml-2 rounded-xl border-none w-full h-full focus:outline-none font-sans placeholder:font-sans bg-transparent text-[#151717] text-sm"
            placeholder="Your full name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        </div>
        {/* Password */}
        <div className="flex flex-col mb-0.5">
          <label className="text-[#A259F7] text-sm font-semibold">Password</label>
        </div>
        <div className="flex items-center border border-[#F18585] rounded-xl h-10 pl-2 transition-colors focus-within:border-[#A259F7] mb-1 bg-white">
          <Lock className="text-[#A259F7] mr-2 h-4 w-4" />
          <input
            type="password"
            className="ml-2 rounded-xl border-none w-full h-full focus:outline-none font-sans placeholder:font-sans bg-transparent text-[#151717] text-sm"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
        {/* Confirm password */}
        <div className="flex flex-col mb-0.5">
          <label className="text-[#A259F7] text-sm font-semibold">Confirm password</label>
        </div>
        <div className="flex items-center border border-[#F18585] rounded-xl h-10 pl-2 transition-colors focus-within:border-[#A259F7] mb-1 bg-white">
          <Lock className="text-[#A259F7] mr-2 h-4 w-4" />
          <input
            type="password"
            className="ml-2 rounded-xl border-none w-full h-full focus:outline-none font-sans placeholder:font-sans bg-transparent text-[#151717] text-sm"
            placeholder="••••••••"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
          />
        </div>
        {/* Role selection */}
        <div className="flex flex-col mb-0.5">
          <label className="text-[#A259F7] text-sm font-semibold">Role</label>
        </div>
        <div className="flex items-center border border-[#F18585] rounded-xl h-10 pl-2 pr-2 transition-colors focus-within:border-[#A259F7] mb-1 bg-white">
          <select
            className="ml-2 rounded-xl border-none w-full h-full focus:outline-none font-sans bg-transparent text-[#151717] text-sm"
            value={role}
            onChange={(e) => setRole(e.target.value)}
            required
          >
            <option value="startup">Startup</option>
            <option value="investor">Investor</option>
          </select>
        </div>
        {error && <div className="text-red-600 text-xs mt-1">{error}</div>}
        <button type="submit" disabled={loading} className="my-2 bg-[#6C2BD7] border border-[#A259F7] text-white text-[14px] font-medium rounded-xl h-9 w-full cursor-pointer shadow-md hover:bg-[#A259F7] transition-colors flex items-center justify-center disabled:opacity-60">
          {loading ? 'Signing up…' : 'Sign Up'}
          <ArrowRight className="ml-2 h-4 w-4" />
        </button>
        <p className="text-center text-[#A259F7] text-xs my-0.5">Already have an account? <span className="text-[#F18585] font-medium cursor-pointer ml-1 underline" onClick={() => router.push('/login')}>Sign in</span></p>
        <div className="text-center mt-2">
          <button type="button" className="text-[#A259F7] text-xs font-medium underline" onClick={() => router.push('/')}>← Back to home</button>
        </div>
      </form>
    </div>
  );
}

export default SignupPage;

