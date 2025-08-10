import React, { useState, useEffect } from 'react';
import HeroGrid from './HeroGrid';
import Footer from './Footer';
import Skeleton from 'react-loading-skeleton';
import 'react-loading-skeleton/dist/skeleton.css';

export default function HomePublic() {
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    const t = setTimeout(() => setLoading(false), 1500);
    return () => clearTimeout(t);
  }, []);

  return (
    <div className="bg-[#FCF8F1] min-h-screen flex flex-col">
      {/* HERO SECTION */}
      <section className="py-10 sm:py-16 lg:py-24 animate-fade-in-up bg-gradient-to-br from-yellow-50 via-white to-blue-50 relative overflow-hidden">
        {/* Background decorative elements */}
        <div className="absolute inset-0 bg-gradient-to-r from-yellow-100/20 to-blue-100/20"></div>
        <div className="absolute top-20 left-20 w-64 h-64 bg-yellow-200 rounded-full opacity-10 animate-pulse"></div>
        <div className="absolute bottom-20 right-20 w-48 h-48 bg-blue-200 rounded-full opacity-10 animate-pulse" style={{ animationDelay: '1s' }}></div>
        <div className="absolute top-1/2 left-10 w-32 h-32 bg-green-200 rounded-full opacity-10 animate-pulse" style={{ animationDelay: '2s' }}></div>
        
        {/* Subtle pattern overlay */}
        <div className="absolute inset-0 opacity-5" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23000000' fill-opacity='0.1'%3E%3Ccircle cx='30' cy='30' r='2'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
        }}></div>
        
        <div className="px-4 mx-auto max-w-7xl sm:px-6 lg:px-8 relative z-10">
          <div className="grid items-center grid-cols-1 gap-12 lg:grid-cols-2">
            {/* Left Side */}
            <div className="space-y-6">
              <p className="text-base font-semibold tracking-wider text-blue-600 uppercase animate-fade-in">A platform for change</p>
              <h1 className="mt-2 text-4xl font-extrabold text-black lg:mt-4 sm:text-6xl xl:text-7xl animate-fade-in-up">
                Connect & help change lives
              </h1>
              <p className="text-lg text-black animate-fade-in-up delay-100">
                Your small act can make a big difference.
              </p>
              <div className="mt-8 animate-fade-in-up delay-200">
                <a
                  href="https://chrome.google.com/webstore/category/extensions"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center px-6 py-4 font-semibold text-black transition-all duration-200 bg-yellow-300 rounded-full hover:bg-yellow-400 focus:bg-yellow-400 shadow-lg hover:shadow-xl hover:scale-105 active:scale-95 transform"
                >
                  Add to Chrome
                  <svg className="w-6 h-6 ml-8 -mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 9l3 3m0 0l-3 3m3-3H8m13 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </a>
                <div className="mt-4 text-xs text-gray-600">
                  Already have an account?{' '}
                  <a href="/signin" className="text-blue-700 underline hover:text-blue-900">Log in</a>
                </div>
              </div>
            </div>
            {/* Right Side: HeroGrid */}
            <div className="animate-fade-in-up delay-200">
              <HeroGrid />
            </div>
          </div>
        </div>
      </section>
      {/* Platform Description Section */}
      <section className="py-6 animate-fade-in-up delay-300">
        <div className="px-4 mx-auto max-w-3xl text-center">
          <span className="block text-gray-800 font-semibold text-lg bg-yellow-100 rounded-xl p-4">
            Round up your purchases and donate the spare change to a charity you choose.
          </span>
        </div>
      </section>
      {/* HOW IT WORKS SECTION */}
      <section className="py-16 bg-yellow-50 animate-fade-in-up">
        <div className="px-4 mx-auto max-w-7xl sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-center text-black mb-12 animate-fade-in">How It Works</h2>
          <div className="flex flex-col md:flex-row items-center justify-center gap-8 relative">
            {/* Connecting line */}
            <div className="hidden md:block absolute left-1/2 top-1/2 w-3/4 h-1 bg-gradient-to-r from-yellow-200 via-blue-200 to-green-200 z-0" style={{transform: 'translate(-50%, -50%)'}} />
            {loading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="flex-1 rounded-2xl p-8 flex flex-col items-center shadow-xl relative z-10 animate-fade-in-up">
                  <Skeleton circle width={64} height={64} className="mb-4" />
                  <Skeleton width={60} height={20} className="mb-2" />
                  <Skeleton width={120} height={28} className="mb-2" />
                  <Skeleton width={180} height={16} />
                </div>
              ))
            ) : (
              <>
                {/* Step 1 */}
                <div className="flex-1 bg-yellow-100 rounded-2xl p-8 flex flex-col items-center shadow-xl relative z-10 animate-fade-in-up transition-shadow duration-200 hover:shadow-2xl hover:-translate-y-2 cursor-pointer min-h-[280px]">
                  <div className="flex items-center justify-center w-16 h-16 rounded-full bg-yellow-300 mb-4 group-hover:scale-110 transition-transform duration-300">
                    <svg className="w-8 h-8 text-yellow-600" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0h6" />
                    </svg>
                  </div>
                  <div className="text-yellow-600 font-bold text-lg mb-2">Step 1</div>
                  <h3 className="text-xl font-semibold text-black mb-2">Shop Normally</h3>
                  <p className="text-gray-700 text-center">Make your everyday purchases as usual.</p>
                </div>
                {/* Step 2 */}
                <div className="flex-1 bg-blue-100 rounded-2xl p-8 flex flex-col items-center shadow-xl relative z-10 animate-fade-in-up transition-shadow duration-200 hover:shadow-2xl hover:-translate-y-2 cursor-pointer min-h-[280px]">
                  <div className="flex items-center justify-center w-16 h-16 rounded-full bg-blue-300 mb-4 relative overflow-visible group-hover:scale-110 transition-transform duration-300">
                    <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <circle cx="12" cy="12" r="9" />
                      <path d="M12 8v4l3 3" />
                    </svg>
                  </div>
                  <div className="text-blue-600 font-bold text-lg mb-2">Step 2</div>
                  <h3 className="text-xl font-semibold text-black mb-2">Automatic Round-Up</h3>
                  <p className="text-gray-700 text-center">We round up your purchases to the nearest dollar.</p>
                </div>
                {/* Step 3 */}
                <div className="flex-1 bg-green-100 rounded-2xl p-8 flex flex-col items-center shadow-xl relative z-10 animate-fade-in-up transition-shadow duration-200 hover:shadow-2xl hover:-translate-y-2 cursor-pointer min-h-[280px]">
                  <div className="flex items-center justify-center w-16 h-16 rounded-full bg-green-300 mb-4 group-hover:scale-110 transition-transform duration-300">
                    <svg className="w-8 h-8 text-green-700" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path d="M12 21C12 21 4 13.5 4 8.5C4 5.42 6.42 3 9.5 3C11.24 3 12 4.5 12 4.5C12 4.5 12.76 3 14.5 3C17.58 3 20 5.42 20 8.5C20 13.5 12 21 12 21Z" />
                    </svg>
                  </div>
                  <div className="text-green-600 font-bold text-lg mb-2">Step 3</div>
                  <h3 className="text-xl font-semibold text-black mb-2">Donate to Charity</h3>
                  <p className="text-gray-700 text-center">Your spare change is donated to help others.</p>
                </div>
              </>
            )}
          </div>
        </div>
      </section>
      <Footer />
    </div>
  );
}
