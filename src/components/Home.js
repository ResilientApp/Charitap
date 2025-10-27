import React from 'react';
import { useAuth } from '../auth/AuthContext';
import HeroGrid from './HeroGrid';
import RippleButton from './RippleButton';
import useScrollAnimation from '../hooks/useScrollAnimation';

const Home = () => {
  const { isAuthenticated, user } = useAuth();
  
  // Get display name from user data (firstName + lastName or displayName)
  const displayName = user ? (user.firstName && user.lastName ? `${user.firstName} ${user.lastName}` : user.displayName || 'User') : 'User';
  
  // Scroll animation refs
  const heroRef = useScrollAnimation(0.3);
  const featuresRef = useScrollAnimation(0.2);
  const howItWorksRef = useScrollAnimation(0.2);
  const ctaRef = useScrollAnimation(0.3);

  const handleLogin = () => {
    window.location.href = '/signin';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-yellow-50 via-orange-50 to-red-50">
      {/* Hero Section */}
      <section 
        ref={heroRef}
        className="scroll-animate relative overflow-hidden py-20 px-4 sm:px-6 lg:px-8"
      >
        {/* Parallax background */}
        <div className="pointer-events-none absolute inset-0 -z-10" aria-hidden="true" style={{ background: 'radial-gradient(1200px 600px at 50% -200px, rgba(253,230,138,0.35), transparent)', transform: 'translateZ(0)' }} />
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left side - Text content */}
            <div className="text-center lg:text-left">
              <h1 className="text-display text-gray-900 mb-6">
                Make a Difference
                <span className="block text-yellow-600">One Click at a Time</span>
              </h1>
              <p className="text-body text-gray-700 mb-8 max-w-2xl lg:max-w-none">
                Join thousands of people making micro-donations to causes that matter. 
                Every penny counts, every click makes a difference.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start items-center">
                <RippleButton
                  onClick={() => window.open('https://chrome.google.com', '_blank')}
                  className="bg-yellow-400 hover:bg-yellow-500 text-black px-8 py-4 rounded-xl font-semibold text-lg shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
                >
                  Add to Chrome
                </RippleButton>
              </div>
              {!isAuthenticated && (
                <p className="text-caption mt-4">
                  Already have an account? <button onClick={handleLogin} className="text-yellow-600 hover:text-yellow-700 font-medium">Log in</button>
                </p>
              )}
            </div>
            
            {/* Right side - HeroGrid */}
            <div className="flex justify-center lg:justify-end">
              <div className="w-full max-w-md h-96">
                <HeroGrid />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section 
        ref={featuresRef}
        className="scroll-animate py-20 px-4 sm:px-6 lg:px-8 bg-white"
      >
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-headline text-gray-900 mb-4">
              Why Choose Charitap?
            </h2>
            <p className="text-body text-gray-600 max-w-2xl mx-auto">
              We make giving effortless and impactful with our innovative micro-donation platform.
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: (
                  <svg className="w-12 h-12 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                  </svg>
                ),
                title: "Micro-Donations",
                description: "Give as little as $0.01 with every click. Small amounts add up to big impact."
              },
              {
                icon: (
                  <svg className="w-12 h-12 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                ),
                title: "Transparent Impact",
                description: "See exactly where your donations go and the real impact they make."
              },
              {
                icon: (
                  <svg className="w-12 h-12 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                ),
                title: "Secure & Trusted",
                description: "Donations protected through secure transactions and verified charities."
              }
            ].map((feature, index) => (
              <div 
                key={index}
                className="text-center p-8 rounded-2xl bg-gradient-to-br from-yellow-50 to-orange-50 hover:shadow-lg transition-all duration-500 transform hover:scale-105"
                style={{ animationDelay: `${index * 0.2}s` }}
              >
                <div className="inline-flex items-center justify-center w-16 h-16 bg-white rounded-full shadow-md mb-6 transition-all duration-300 hover:shadow-lg hover:scale-110">
                  {feature.icon}
                </div>
                <h3 className="text-title text-gray-900 mb-4 transition-colors duration-300 hover:text-yellow-600">{feature.title}</h3>
                <p className="text-body text-gray-600 transition-colors duration-300 hover:text-gray-700">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section 
        ref={howItWorksRef}
        className="scroll-animate py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-gray-50 to-blue-50"
      >
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-headline text-gray-900 mb-4">
              How It Works
            </h2>
            <p className="text-body text-gray-600 max-w-2xl mx-auto">
              Getting started with Charitap is simple and takes just a few minutes. 
              Start making a difference with every click.
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              { 
                step: "1", 
                title: "Install Extension", 
                description: "Add Charitap to your Chrome browser in just one click from the Chrome Web Store",
                icon: (
                  <svg className="w-8 h-8 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                  </svg>
                ),
                color: "from-yellow-400 to-orange-500"
              },
              { 
                step: "2", 
                title: "Choose Causes", 
                description: "Select from hundreds of verified charities that align with your values and interests",
                icon: (
                  <svg className="w-8 h-8 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                  </svg>
                ),
                color: "from-green-400 to-blue-500"
              },
              { 
                step: "3", 
                title: "Browse & Click", 
                description: "Donate automatically while you browse. Every click contributes to your chosen causes",
                icon: (
                  <svg className="w-8 h-8 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                ),
                color: "from-blue-400 to-purple-500"
              },
              { 
                step: "4", 
                title: "Track Impact", 
                description: "See real-time updates on your donations and the impact they're making in the world",
                icon: (
                  <svg className="w-8 h-8 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                ),
                color: "from-purple-400 to-pink-500"
              }
            ].map((item, index) => (
              <div key={index} className="relative group">
                {/* Connection line (except for last item) */}
                {index < 3 && (
                  <div className="hidden lg:block absolute top-8 left-full w-full h-0.5 bg-gradient-to-r from-gray-300 to-transparent z-0" />
                )}
                
                <div 
                  className="relative bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-all duration-500 transform hover:scale-105 border border-gray-100"
                  style={{ animationDelay: `${index * 0.2}s` }}
                >
                  {/* Step number with gradient background */}
                  <div className={`w-16 h-16 bg-gradient-to-r ${item.color} rounded-full flex items-center justify-center mx-auto mb-6 text-2xl font-bold text-white shadow-lg transition-all duration-300 hover:scale-110`}>
                    {item.step}
                  </div>
                  
                  {/* Icon */}
                  <div className="flex justify-center mb-4">
                    <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center transition-all duration-300 hover:bg-yellow-100 hover:scale-110">
                      {item.icon}
                    </div>
                  </div>
                  
                  <h3 className="text-title text-gray-900 mb-3 text-center font-semibold transition-colors duration-300 hover:text-yellow-600">{item.title}</h3>
                  <p className="text-body text-gray-600 text-center leading-relaxed transition-colors duration-300 hover:text-gray-700">{item.description}</p>
                  
                  {/* Hover effect overlay */}
                  <div className="absolute inset-0 bg-gradient-to-r from-yellow-400/5 to-orange-500/5 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section 
        ref={ctaRef}
        className="scroll-animate py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-r from-yellow-400 to-orange-500"
      >
        <div className="max-w-4xl mx-auto text-center">
              {isAuthenticated ? (
            <>
              <h2 className="text-headline text-white mb-6 transition-all duration-300 hover:scale-105">
                Welcome back, {displayName || 'User'}! 👋
              </h2>
              <p className="text-body text-yellow-100 mb-8 transition-colors duration-300 hover:text-white">
                Ready to continue making a difference? Check your dashboard to see your impact.
              </p>
              <RippleButton
                onClick={() => window.location.href = '/dashboard'}
                className="bg-white text-yellow-600 px-8 py-4 rounded-xl font-semibold text-lg shadow-lg hover:shadow-xl transition-all duration-500 transform hover:scale-110"
              >
                Go to Dashboard
              </RippleButton>
            </>
          ) : (
            <>
              <h2 className="text-headline text-white mb-6 transition-all duration-300 hover:scale-105">
                Ready to Start Making a Difference?
              </h2>
              <p className="text-body text-yellow-100 mb-8 transition-colors duration-300 hover:text-white">
                Join thousands of people who are already making micro-donations and creating real change.
              </p>
               <RippleButton
                  onClick={() => window.location.href = '/signup'}
                  className="bg-white text-yellow-600 px-8 py-4 rounded-xl font-semibold text-lg shadow-lg hover:shadow-xl transition-all duration-500 transform hover:scale-110"
                >
                  Join Now
                </RippleButton>
            </>
          )}
        </div>
      </section>
    </div>
  );
};

export default Home;
