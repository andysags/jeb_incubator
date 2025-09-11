import React, { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { 
  Building2, 
  Mail, 
  Phone, 
  MapPin, 
  Calendar, 
  Globe, 
  Users, 
  DollarSign, 
  FileText, 
  Target,
  CheckCircle,
  ArrowRight
} from "lucide-react";

interface FormData {
  [key: string]: string | number;
}

interface FormField {
  key: string;
  label: string;
  type: string;
  required: boolean;
  icon: React.ComponentType<any>;
  placeholder?: string;
  maxLength?: number;
  options?: string[];
  rows?: number;
}

interface FormStep {
  step: number;
  title: string;
  fields: FormField[];
}

const ProfileCompletionPage = () => {
  const router = useRouter();
  const { type } = router.query;
  const [formData, setFormData] = useState<FormData>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentStep, setCurrentStep] = useState(1);

  // Définition des champs selon le type de profil
  const getFormFields = (profileType: string): FormStep[] => {
    switch (profileType) {
      case 'startup':
        return [
          {
            step: 1,
            title: "General Information",
            fields: [
              { key: 'nom', label: 'Startup Name', type: 'text', required: true, icon: Building2 },
              { key: 'slug', label: 'Unique Identifier (slug)', type: 'text', required: true, icon: Target, placeholder: 'my-startup-slug' },
              { key: 'description_courte', label: 'Short Description', type: 'textarea', required: false, icon: FileText, maxLength: 255 },
              { key: 'secteur', label: 'Industry Sector', type: 'select', required: false, icon: Target, options: ['Technology', 'Health', 'Finance', 'E-commerce', 'Education', 'Other'] }
            ]
          },
          {
            step: 2,
            title: "Contact and Location",
            fields: [
              { key: 'contact_tel', label: 'Phone Number', type: 'tel', required: false, icon: Phone },
              { key: 'localisation', label: 'Location', type: 'text', required: false, icon: MapPin },
              { key: 'site_web', label: 'Website', type: 'url', required: false, icon: Globe, placeholder: 'https://my-website.com' }
            ],
          },
          {
            step: 3,
            title: "Company Details",
            fields: [
              { key: 'date_creation', label: 'Creation Date', type: 'date', required: false, icon: Calendar },
              { key: 'stade', label: 'Development Stage', type: 'select', required: false, icon: Target, options: ['idee','seed','croissance'] },
              { key: 'nb_pers', label: 'Number of Employees', type: 'number', required: false, icon: Users },
              { key: 'chiffre_aff', label: 'Revenue (€)', type: 'number', required: false, icon: DollarSign }
            ]
          },
          {
            step: 4,
            title: "Detailed Description",
            fields: [
              { key: 'description_longue', label: 'Detailed Description', type: 'textarea', required: false, icon: FileText, rows: 4 }
            ]
          }
        ];

  case 'investor':
        return [
          {
            step: 1,
            title: "Personal Information",
            fields: [
              { key: 'name', label: 'Full Name', type: 'text', required: true, icon: Building2 },
              { key: 'phone', label: 'Phone Number', type: 'tel', required: false, icon: Phone }
            ]
          },
          {
            step: 2,
            title: "Professional Information",
            fields: [
              { key: 'legal_status', label: 'Legal Status', type: 'select', required: false, icon: FileText, options: ['Individual', 'LLC', 'Corporation', 'Investment Fund', 'Other'] },
              { key: 'investor_type', label: 'Investor Type', type: 'select', required: false, icon: Target, options: ['Business Angel', 'Venture Capital', 'Private Equity', 'Family Office', 'Institutional', 'Other'] },
              { key: 'investment_focus', label: 'Investment Focus', type: 'text', required: false, icon: Target, placeholder: 'Ex: Tech, Healthcare, Fintech...' }
            ]
          },
          {
            step: 3,
            title: "Location and Description",
            fields: [
              { key: 'address', label: 'Address', type: 'textarea', required: false, icon: MapPin },
              { key: 'description', label: 'Description', type: 'textarea', required: false, icon: FileText, rows: 4 }
            ]
          }
        ];

      
      default:
        return [];
    }
  };

  const formSteps = getFormFields(type as string);
  const totalSteps = formSteps.length;

  const handleInputChange = (key: string, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const handleNext = () => {
    if (currentStep < totalSteps) {
      setCurrentStep(prev => prev + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const handleSubmit = async () => {
    setLoading(true);
    setError(null);
    
    try {
        const base = process.env.NEXT_PUBLIC_API_BASE || "http://127.0.0.1:8000";
        const endpoint = type === 'startup' ? 'startups' : 'investors';

      // Si des credentials temporaires existent, enregistrer l'utilisateur d'abord
      try {
        const pending = localStorage.getItem('pending_signup')
        if (pending) {
          const p = JSON.parse(pending)
          // envoyer à notre API interne pour créer l'utilisateur avec le nom collecté
          const nameForUser = (formData['nom'] || formData['name'] || '')
          if (nameForUser) {
            const regRes = await fetch('/api/auth/register', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ nom: nameForUser, email: p.email, password: p.password, role: p.role })
            })
            if (!regRes.ok) {
              const dd = await regRes.json().catch(() => ({}))
              // si email exists, on considère que l'utilisateur existe déjà et on continue
              if (dd?.error && dd?.error !== 'email_exists') throw new Error(dd?.detail || dd?.error)
              if (dd?.error === 'email_exists') {
                try { localStorage.setItem('current_user_email', p.email) } catch (e) {}
              }
            } else {
              // registration succeeded
              try { localStorage.setItem('current_user_email', p.email) } catch (e) {}
            }
            // clear pending
            localStorage.removeItem('pending_signup')
          }
        }
      } catch (e) {
        console.warn('registration from pending failed', e)
      }

      // ensure we include the user's email stored at signup into the profile payload if backend expects it
      const payload = { ...formData } as any;
      try {
        const currentEmail = localStorage.getItem('current_user_email');
        if (currentEmail) {
          if (type === 'startup') payload.contact_email = currentEmail;
          else if (type === 'investor') payload.email = currentEmail;
        }
      } catch (e) { /* ignore */ }

      const res = await fetch(`${base}/api/${endpoint}/`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        const fieldMsg = data && typeof data === 'object' ? (Object.values(data) as any[]).flat().join(' | ') : '';
        throw new Error((data?.detail as string) || fieldMsg || "Profile creation failed");
      }

      // Redirection en fonction du rôle: si admin -> AdminDashboard/dashboard, sinon HomePage
      try {
        const token = typeof window !== 'undefined' ? (localStorage.getItem('auth_token') || localStorage.getItem('token')) : null;
        if (token) {
          const base = process.env.NEXT_PUBLIC_API_BASE || "http://127.0.0.1:8000";
          const meRes = await fetch(`${base}/api/auth/me/`, { headers: { 'Authorization': `Bearer ${token}` } });
          if (meRes.ok) {
            const meJson = await meRes.json().catch(() => null);
            const role = meJson?.role || meJson?.data?.role || '';
            if (role === 'admin') {
              router.push('/AdminDashboard');
            } else {
              router.push('/HomePage');
            }
          } else {
            router.push('/HomePage');
          }
        } else {
          router.push('/HomePage');
        }
      } catch (e) {
        router.push('/HomePage');
      }
    } catch (err: any) {
      setError(err?.message || "Unknown error");
    } finally {
      setLoading(false);
    }
  };

  const currentStepData = formSteps[currentStep - 1];
  const isLastStep = currentStep === totalSteps;

  if (!type || !['startup', 'investor'].includes(type as string)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#F8CACF] via-white to-[#C174F2]">
        <div className="bg-white p-6 rounded-2xl shadow-xl max-w-sm w-full mx-4">
          <h1 className="text-lg font-bold text-[#6C2BD7] text-center mb-3">Invalid Profile Type</h1>
          <p className="text-gray-600 text-center mb-4 text-sm">The specified profile type is not valid.</p>
          <button 
            onClick={() => router.push('/SignupPage')}
            className="w-full bg-[#6C2BD7] text-white py-2 rounded-lg font-medium hover:bg-[#A259F7] transition-colors text-sm"
          >
            Back to Registration
          </button>
        </div>
      </div>
    );
  }

  return (
    <div 
      className="min-h-screen bg-gradient-to-br from-[#F8CACF] via-white to-[#C174F2] py-8 px-4"
      style={{
        animation: 'slideInFromBottom 0.6s ease-out'
      }}
    >
      <style jsx>{`
        @keyframes slideInFromBottom {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        @keyframes slideInFromRight {
          from {
            opacity: 0;
            transform: translateX(30px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
        
        .completion-card {
          backdrop-filter: blur(10px);
          background: rgba(255, 255, 255, 0.95);
        }
        
        .form-step {
          animation: slideInFromRight 0.4s ease-out;
        }
        
        .progress-bar {
          animation: progressBar 0.8s ease-out;
        }
        
        @keyframes progressBar {
          from { width: 0%; }
        }
        
        .field-icon {
          transition: all 0.2s ease;
        }
        
        .form-field:focus-within .field-icon {
          color: #A259F7;
          transform: scale(1.1);
        }
        
        .btn-primary {
          transition: all 0.3s ease;
        }
        
        .btn-primary:hover {
          transform: scale(1.02);
        }
      `}</style>
      {/* Header avec logo et progression */}
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-6">
          <img 
            src="/logo.jpeg" 
            alt="JEB" 
            className="w-12 h-12 rounded-full shadow-lg bg-white/80 mx-auto mb-3" 
          />
          <h1 className="text-xl font-bold text-[#6C2BD7] mb-1">
            Complete your {type === 'startup' ? 'Startup' : 'Investor'} profile
          </h1>
          <p className="text-sm text-[#6C2BD7] opacity-80">
            Step {currentStep} of {totalSteps}
          </p>
          
          {/* Barre de progression */}
          <div className="max-w-xs mx-auto mt-3">
            <div className="bg-white/30 rounded-full h-1.5">
              <div 
                className="bg-[#6C2BD7] h-1.5 rounded-full transition-all duration-300"
                style={{ width: `${(currentStep / totalSteps) * 100}%` }}
              ></div>
            </div>
          </div>
        </div>

        {/* Formulaire */}
        <div className="bg-white rounded-2xl shadow-xl p-6 max-w-xl mx-auto completion-card">
          {currentStepData && (
            <div className="form-step">
              <h2 className="text-lg font-bold text-[#6C2BD7] mb-4 text-center">
                {currentStepData.title}
              </h2>
              
              <div className="space-y-4">
                {currentStepData.fields.map((field) => {
                  const IconComponent = field.icon;
                  return (
                    <div key={field.key} className="space-y-1">
                      <label className="block text-[#A259F7] text-xs font-semibold">
                        {field.label}
                        {field.required && <span className="text-red-500 ml-1">*</span>}
                      </label>
                      
                      <div className="relative form-field">
                        <div className="absolute left-2 top-1/2 transform -translate-y-1/2 z-10 field-icon">
                          <IconComponent className="text-[#A259F7] h-4 w-4" />
                        </div>
                        
                        {field.type === 'select' && field.options ? (
                          <select
                            className="w-full pl-8 pr-3 py-2 border border-[#F18585] rounded-lg focus:outline-none focus:border-[#A259F7] transition-colors bg-white text-[#151717] text-sm"
                            value={formData[field.key] || ''}
                            onChange={(e) => handleInputChange(field.key, e.target.value)}
                            required={field.required}
                          >
                            <option value="">Select...</option>
                            {field.options?.map((option: string) => (
                              <option key={option} value={option}>{option}</option>
                            ))}
                          </select>
                        ) : field.type === 'textarea' ? (
                          <textarea
                            className="w-full pl-8 pr-3 py-2 border border-[#F18585] rounded-lg focus:outline-none focus:border-[#A259F7] transition-colors bg-white text-[#151717] resize-none text-sm"
                            placeholder={field.placeholder || `Enter ${field.label.toLowerCase()}`}
                            value={formData[field.key] || ''}
                            onChange={(e) => handleInputChange(field.key, e.target.value)}
                            required={field.required}
                            rows={field.rows || 2}
                            maxLength={field.maxLength}
                          />
                        ) : (
                          <input
                            type={field.type}
                            className="w-full pl-8 pr-3 py-2 border border-[#F18585] rounded-lg focus:outline-none focus:border-[#A259F7] transition-colors bg-white text-[#151717] text-sm"
                            placeholder={field.placeholder || `Enter ${field.label.toLowerCase()}`}
                            value={formData[field.key] || ''}
                            onChange={(e) => handleInputChange(field.key, field.type === 'number' ? Number(e.target.value) : e.target.value)}
                            required={field.required}
                            maxLength={field.maxLength}
                          />
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
              
              {error && (
                <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-red-600 text-xs">{error}</p>
                </div>
              )}
              
              {/* Boutons de navigation */}
              <div className="flex justify-between mt-6">
                <button
                  onClick={handlePrevious}
                  disabled={currentStep === 1}
                  className="px-4 py-2 border border-[#A259F7] text-[#A259F7] rounded-lg font-medium hover:bg-[#A259F7] hover:text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                >
                  Previous
                </button>
                
                {isLastStep ? (
                  <button
                    onClick={handleSubmit}
                    disabled={loading}
                    className="px-6 py-2 bg-[#6C2BD7] text-white rounded-lg font-medium hover:bg-[#A259F7] transition-colors flex items-center disabled:opacity-60 btn-primary text-sm"
                  >
                    {loading ? 'Creating...' : 'Create my profile'}
                    <CheckCircle className="ml-2 h-4 w-4" />
                  </button>
                ) : (
                  <button
                    onClick={handleNext}
                    className="px-6 py-2 bg-[#6C2BD7] text-white rounded-lg font-medium hover:bg-[#A259F7] transition-colors flex items-center btn-primary text-sm"
                  >
                    Next
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
        
  {/* Footer moved to _app.tsx */}
        <div className="text-center mt-6">
          <button 
            onClick={() => router.push('/')}
            className="text-[#6C2BD7] text-xs font-medium hover:underline"
          >
            ← Back to home
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProfileCompletionPage;
