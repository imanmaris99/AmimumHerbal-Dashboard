import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

const WELCOME_SEEN_KEY = 'amimum.dashboard.welcome.seen.v1';

export default function WelcomePage() {
  const navigate = useNavigate();

  useEffect(() => {
    const seen = localStorage.getItem(WELCOME_SEEN_KEY);
    if (seen === '1') navigate('/login', { replace: true });
  }, [navigate]);

  const handleContinue = () => {
    localStorage.setItem(WELCOME_SEEN_KEY, '1');
    navigate('/login');
  };

  const handleSkip = () => {
    localStorage.setItem(WELCOME_SEEN_KEY, '1');
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-[#eaf8f1] flex items-center justify-center p-4">
      <div className="w-full max-w-sm rounded-[28px] overflow-hidden shadow-2xl shadow-emerald-200/60 bg-white border border-emerald-100">
        <div className="relative h-[340px] bg-gradient-to-br from-emerald-400 via-emerald-500 to-teal-500">
          <div className="absolute inset-0 opacity-25" style={{
            backgroundImage:
              'radial-gradient(circle at 20% 30%, rgba(255,255,255,0.35) 0, rgba(255,255,255,0) 40%), radial-gradient(circle at 80% 70%, rgba(255,255,255,0.3) 0, rgba(255,255,255,0) 42%)'
          }} />

          <div className="absolute inset-0 opacity-[0.14]" style={{
            backgroundImage: 'url("https://res.cloudinary.com/disuo2s21/image/upload/v1777875211/logo_toko_cppj3d.svg")',
            backgroundRepeat: 'repeat',
            backgroundSize: '58px 58px',
            backgroundPosition: '12px 10px'
          }} />

          <div className="absolute -bottom-1 left-0 right-0 h-24 bg-white rounded-t-[50px]" />

          <div className="relative z-10 p-6 pt-8 text-white">
            <p className="text-xs font-semibold tracking-[0.2em] uppercase text-emerald-50/90">Dashboard Internal</p>
            <h1 className="mt-3 text-3xl font-extrabold leading-tight">Selamat Datang</h1>
            <p className="mt-3 text-sm leading-relaxed text-emerald-50/95 max-w-[260px]">
              Kelola operasional Toko Herbal Amimum dengan cepat, rapi, dan aman dalam satu dashboard.
            </p>
          </div>
        </div>

        <div className="px-6 pt-4 pb-6">
          <h2 className="text-[28px] leading-tight font-semibold text-gray-900">Siap Masuk?</h2>
          <p className="mt-2 text-sm text-gray-500 leading-relaxed">
            Gunakan akun internal owner atau admin untuk melanjutkan ke halaman login dashboard.
          </p>

          <div className="mt-6 flex items-center justify-between">
            <button onClick={handleSkip} className="text-sm font-medium text-gray-400 hover:text-gray-600 transition-colors">
              Lewati
            </button>

            <Button
              onClick={handleContinue}
              className="h-10 rounded-full bg-emerald-500 hover:bg-emerald-600 shadow-lg shadow-emerald-200 px-5"
            >
              Lanjutkan
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
