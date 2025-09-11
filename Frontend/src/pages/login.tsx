
import { useRouter } from "next/router";
import React, { useEffect, useState } from 'react';
const LoginPage = () => {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Purger tout token existant en arrivant sur la page
  useEffect(() => {
    try { localStorage.removeItem('auth_token'); } catch {}
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const base = process.env.NEXT_PUBLIC_API_BASE || "http://127.0.0.1:8000";
      const payload = { email: (email || '').trim(), password: (password || '').trim() };
      if (!payload.email || !payload.password) {
        throw new Error("Email et mot de passe requis");
      }
      const res = await fetch(`${base}/api/auth/login/`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        // Lire le corps brut pour debug serveur (peut être JSON ou texte)
        const text = await res.text().catch(() => '');
        let parsed = {} as any;
        try { parsed = JSON.parse(text); } catch(_) {}
        const serverMsg = parsed?.detail || parsed?.error || text || `HTTP ${res.status}`;
        // Log complet côté console pour debug local
        console.error('Login failed:', res.status, text);
        throw new Error(serverMsg || "Échec de la connexion");
      }
      const data = await res.json();
      if (!data?.token) throw new Error("Token manquant dans la réponse");

      // Valider le token et rediriger selon le rôle
      const meRes = await fetch(`${base}/api/auth/me/`, {
        headers: { Authorization: `Bearer ${data.token}`, Accept: "application/json" },
      });
      if (!meRes.ok) {
        const d = await meRes.json().catch(() => ({}));
        throw new Error(d?.detail || "Token invalide");
      }
      const meJson = await meRes.json().catch(() => null);
  // Stocker le token et le type d'utilisateur correctement
  localStorage.setItem('auth_token', data.token);
  // also store legacy key 'token' for compatibility
  localStorage.setItem('token', data.token);
  // notify other parts of the app that auth changed (Header listens to this)
  try { window.dispatchEvent(new Event('jeb_auth_changed')); } catch {}
  const role = meJson?.role || meJson?.data?.role || '';
      
      // Mapper le rôle vers le type d'utilisateur attendu par usePersonalizedNavigation
      let userType = 'public';
      if (role === 'admin') {
        userType = 'admin';
      } else if (role === 'startup') {
        userType = 'startup';
      } else if (role === 'investor') {
        userType = 'investor';
      } else if (role === 'partner') {
        userType = 'partner';
      }
      
      localStorage.setItem('userType', userType);
      
      // Rediriger vers la page d'accueil pour toutes les connexions réussies
      router.push('/');
    } catch (err: any) {
      setError(err?.message || "Erreur inconnue");
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
          <p className="text-sm text-[#6C2BD7] mt-1 text-center break-words max-w-xs">Connect to the JEB platform</p>
        </div>
      {/* Floating login card with AdminDashboard colors */}
  <form onSubmit={handleSubmit} className="flex flex-col gap-1 bg-white p-6 w-[370px] h-auto min-h-[300px] max-h-[400px] overflow-y-auto rounded-3xl font-sans shadow-xl z-20 relative">
  <h2 className="text-center text-[#6C2BD7] text-xl font-bold mb-2 drop-shadow">Login</h2>
    <div className="flex flex-col mb-0.5">
      <label className="text-[#A259F7] text-sm font-semibold">Email</label>
    </div>
  <div className="flex items-center border border-[#F18585] rounded-xl h-10 pl-2 transition-colors focus-within:border-[#A259F7] mb-1 bg-white">
      <svg xmlns="http://www.w3.org/2000/svg" width={18} viewBox="0 0 32 32" height={18}><g data-name="Layer 3" id="Layer_3"><path d="m30.853 13.87a15 15 0 0 0 -29.729 4.082 15.1 15.1 0 0 0 12.876 12.918 15.6 15.6 0 0 0 2.016.13 14.85 14.85 0 0 0 7.715-2.145 1 1 0 1 0 -1.031-1.711 13.007 13.007 0 1 1 5.458-6.529 2.149 2.149 0 0 1 -4.158-.759v-10.856a1 1 0 0 0 -2 0v1.726a8 8 0 1 0 .2 10.325 4.135 4.135 0 0 0 7.83.274 15.2 15.2 0 0 0 .823-7.455zm-14.853 8.13a6 6 0 1 1 6-6 6.006 6.006 0 0 1 -6 6z" /></g></svg>
  <input placeholder="Email" className="ml-2 rounded-xl border-none w-full h-full focus:outline-none font-sans placeholder:font-sans bg-transparent text-[#151717] text-sm" type="email" value={email} onChange={(e)=>setEmail(e.target.value)} required />
    </div>
    <div className="flex flex-col mb-0.5">
      <label className="text-[#A259F7] text-sm font-semibold">Password</label>
    </div>
  <div className="flex items-center border border-[#F18585] rounded-xl h-10 pl-2 transition-colors focus-within:border-[#A259F7] mb-1 bg-white">
      <svg xmlns="http://www.w3.org/2000/svg" width={18} viewBox="-64 0 512 512" height={18}><path d="m336 512h-288c-26.453125 0-48-21.523438-48-48v-224c0-26.476562 21.546875-48 48-48h288c26.453125 0 48 21.523438 48 48v224c0 26.476562-21.546875 48-48 48zm-288-288c-8.8125 0-16 7.167969-16 16v224c0 8.832031 7.1875 16 16 16h288c8.8125 0 16-7.167969 16-16v-224c0-8.832031-7.1875-16-16-16zm0 0" /><path d="m304 224c-8.832031 0-16-7.167969-16-16v-80c0-52.929688-43.070312-96-96-96s-96 43.070312-96 96v80c0 8.832031-7.167969 16-16 16s-16-7.167969-16-16v-80c0-70.59375 57.40625-128 128-128s128 57.40625 128 128v80c0 8.832031-7.167969 16-16 16zm0 0" /></svg>
  <input placeholder="Password" className="ml-2 rounded-xl border-none w-full h-full focus:outline-none font-sans placeholder:font-sans bg-transparent text-[#151717] text-sm" type="password" value={password} onChange={(e)=>setPassword(e.target.value)} required />
    </div>
    {error && <div className="text-red-600 text-xs mt-1">{error}</div>}
    <div className="flex flex-row items-center gap-2 justify-between mb-1">
      <div className="flex items-center">
        <input type="checkbox" className="mr-1 accent-[#A259F7]" />
        <label className="text-xs text-[#A259F7] font-normal">Remember me</label>
      </div>
      <span className="text-xs ml-1 text-[#6C2BD7] font-medium cursor-pointer">Forgot password?</span>
    </div>
  <button type="submit" disabled={loading} className="my-2 bg-[#6C2BD7] border border-[#A259F7] text-white text-[14px] font-medium rounded-xl h-9 w-full cursor-pointer shadow-md hover:bg-[#A259F7] transition-colors disabled:opacity-60">{loading ? 'Connexion…' : 'Sign In'}</button>
  <p className="text-center text-[#A259F7] text-xs my-0.5">Don&apos;t have an account? <span className="text-[#F18585] font-medium cursor-pointer ml-1" onClick={() => router.push('/SignupPage')}>Sign Up</span></p>
  <p className="text-center text-[#A259F7] text-xs my-0.5">Or With</p>
    <div className="flex flex-row gap-2">
  <button className="mt-1 w-full h-9 rounded-xl flex justify-center items-center font-medium gap-2 border border-[#A259F7] bg-white cursor-pointer text-xs">
        <svg xmlSpace="preserve" viewBox="0 0 512 512" y="0px" x="0px" xmlnsXlink="http://www.w3.org/1999/xlink" xmlns="http://www.w3.org/2000/svg" id="Layer_1" width={16} version="1.1">
          <path d="M113.47,309.408L95.648,375.94l-65.139,1.378C11.042,341.211,0,299.9,0,256
       c0-42.451,10.324-82.483,28.624-117.732h0.014l57.992,10.632l25.404,57.644c-5.317,15.501-8.215,32.141-8.215,49.456
       C103.821,274.792,107.225,292.797,113.47,309.408z" style={{fill: '#FBBB00'}} />
          <path d="M507.527,208.176C510.467,223.662,512,239.655,512,256c0,18.328-1.927,36.206-5.598,53.451
       c-12.462,58.683-45.025,109.925-90.134,146.187l-0.014-0.014l-73.044-3.727l-10.338-64.535
       c29.932-17.554,53.324-45.025,65.646-77.911h-136.89V208.176h138.887L507.527,208.176L507.527,208.176z" style={{fill: '#518EF8'}} />
          <path d="M416.253,455.624l0.014,0.014C372.396,490.901,316.666,512,256,512
       c-97.491,0-182.252-54.491-225.491-134.681l82.961-67.91c21.619,57.698,77.278,98.771,142.53,98.771
       c28.047,0,54.323-7.582,76.87-20.818L416.253,455.624z" style={{fill: '#28B446'}} />
          <path d="M419.404,58.936l-82.933,67.896c-23.335-14.586-50.919-23.012-80.471-23.012
       c-66.729,0-123.429,42.957-143.965,102.724l-83.397-68.276h-0.014C71.23,56.123,157.06,0,256,0
       C318.115,0,375.068,22.126,419.404,58.936z" style={{fill: '#F14336'}} />
        </svg>
        Google
      </button>
  <button className="mt-1 w-full h-9 rounded-xl flex justify-center items-center font-medium gap-2 border border-[#A259F7] bg-white cursor-pointer text-xs">
        <svg xmlSpace="preserve" viewBox="0 0 22.773 22.773" y="0px" x="0px" xmlnsXlink="http://www.w3.org/1999/xlink" xmlns="http://www.w3.org/2000/svg" id="Capa_1" width={16} height={16} version="1.1"> <g> <g> <path d="M15.769,0c0.053,0,0.106,0,0.162,0c0.13,1.606-0.483,2.806-1.228,3.675c-0.731,0.863-1.732,1.7-3.351,1.573 c-0.108-1.583,0.506-2.694,1.25-3.561C13.292,0.879,14.557,0.16,15.769,0z" /> <path d="M20.67,16.716c0,0.016,0,0.03,0,0.045c-0.455,1.378-1.104,2.559-1.896,3.655c-0.723,0.995-1.609,2.334-3.191,2.334 c-1.367,0-2.275-0.879-3.676-0.903c-1.482-0.024-2.297,0.735-3.652,0.926c-0.155,0-0.31,0-0.462,0 c-0.995-0.144-1.798-0.932-2.383-1.642c-1.725-2.098-3.058-4.808-3.306-8.276c0-0.34,0-0.679,0-1.019 c0.105-2.482,1.311-4.5,2.914-5.478c0.846-0.52,2.009-0.963,3.304-0.765c0.555,0.086,1.122,0.276,1.619,0.464 c0.471,0.181,1.06,0.502,1.618,0.485c0.378-0.011,0.754-0.208,1.135-0.347c1.116-0.403,2.21-0.865,3.652-0.648 c1.733,0.262,2.963,1.032,3.723,2.22c-1.466,0.933-2.625,2.339-2.427,4.74C17.818,14.688,19.086,15.964,20.67,16.716z" /> </g></g></svg>
        Apple
      </button>
    </div>
  </form>
    </div>
  );
};

export default LoginPage;