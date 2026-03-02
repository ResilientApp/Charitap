import React, { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { useAuth } from '../auth/AuthContext';
import Breadcrumb from './Breadcrumb';
import { settingsAPI } from '../services/api';
import useRealTimeSync from '../hooks/useRealTimeSync';

export default function CharitiesPage() {
    const { isAuthenticated } = useAuth();
    const [charities, setCharities] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [selectedCharity, setSelectedCharity] = useState(null);

    useEffect(() => {
        if (selectedCharity) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [selectedCharity]);

    const fetchCharities = useCallback(async () => {
        try {
            setLoading(true);
            const data = await settingsAPI.getCharities();

            // Load local voted state so we don't allow infinite votes from one client without a backend restriction
            const voted = JSON.parse(localStorage.getItem('charityVotes') || '{}');

            const mapped = (data.charities || []).map(c => ({
                id: c._id,
                name: c.name,
                description: c.description || 'A great cause that helps those in need.',
                image: c.image || 'https://via.placeholder.com/300x200?text=Charity',
                category: c.type || 'General',
                likes: c.likes || 0,
                dislikes: c.dislikes || 0,
                userVote: voted[c._id] || null
            }));
            setCharities(mapped);
            setLoading(false);
        } catch (err) {
            console.error(err);
            setError('Failed to load charities');
            setLoading(false);
        }
    }, []);

    useRealTimeSync(fetchCharities, 60000, isAuthenticated);

    const handleRate = async (id, action) => {
        try {
            const targetCharity = charities.find(c => c.id === id);
            const previousAction = targetCharity?.userVote;

            const response = await settingsAPI.rateCharity(id, action, previousAction);
            if (response && response.charity) {
                // Optimistic update
                setCharities(prev => prev.map(c => {
                    if (c.id === id) {
                        // Save local vote so it persists
                        const newVoted = JSON.parse(localStorage.getItem('charityVotes') || '{}');
                        newVoted[id] = action;
                        localStorage.setItem('charityVotes', JSON.stringify(newVoted));

                        const updated = {
                            ...c,
                            likes: response.charity.likes,
                            dislikes: response.charity.dislikes,
                            userVote: action
                        };

                        if (selectedCharity && selectedCharity.id === id) {
                            setSelectedCharity(updated);
                        }

                        return updated;
                    }
                    return c;
                }));
            }
        } catch (err) {
            console.error('Error rating charity', err);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <Breadcrumb />

                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">Explore Charities</h1>
                    <p className="text-gray-600">Discover and rate charities that align with your values.</p>
                </div>

                {loading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {[1, 2, 3, 4, 5, 6].map(i => (
                            <div key={i} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden animate-pulse">
                                <div className="h-48 bg-gray-200 w-full" />
                                <div className="p-5 space-y-3">
                                    <div className="h-6 bg-gray-200 rounded w-2/3" />
                                    <div className="h-4 bg-gray-200 rounded w-full" />
                                    <div className="h-4 bg-gray-200 rounded w-4/5" />
                                    <div className="flex justify-between pt-4">
                                        <div className="h-8 bg-gray-200 rounded w-20" />
                                        <div className="h-8 bg-gray-200 rounded w-20" />
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : error ? (
                    <div className="text-center py-12 text-red-600">{error}</div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {charities.map(charity => (
                            <div
                                key={charity.id}
                                className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow duration-300 flex flex-col h-full cursor-pointer"
                                onClick={() => setSelectedCharity(charity)}
                            >
                                <div className="h-48 w-full relative overflow-hidden">
                                    <img
                                        src={charity.image}
                                        alt={charity.name}
                                        className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
                                    />
                                    <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm px-3 py-1.5 rounded-full text-xs font-semibold text-gray-800 shadow-sm border border-gray-200">
                                        {charity.category}
                                    </div>
                                </div>

                                <div className="p-5 flex flex-col flex-grow">
                                    <h3 className="text-xl font-bold text-gray-900 mb-2 line-clamp-1">{charity.name}</h3>
                                    <p className="text-gray-600 text-sm mb-4 line-clamp-3 flex-grow">
                                        {charity.description}
                                    </p>

                                    <div className="flex items-center justify-between pt-4 border-t border-gray-100 mt-auto">
                                        <button
                                            onClick={(e) => { e.stopPropagation(); handleRate(charity.id, 'like'); }}
                                            disabled={charity.userVote === 'like'}
                                            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg transition-colors ${charity.userVote === 'like'
                                                ? 'bg-green-100 text-green-700 font-semibold'
                                                : 'hover:bg-gray-100 text-gray-600'
                                                }`}
                                        >
                                            <svg className="w-5 h-5" fill={charity.userVote === 'like' ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5" />
                                            </svg>
                                            <span className="text-sm">{charity.likes}</span>
                                        </button>

                                        <button
                                            onClick={(e) => { e.stopPropagation(); handleRate(charity.id, 'dislike'); }}
                                            disabled={charity.userVote === 'dislike'}
                                            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg transition-colors ${charity.userVote === 'dislike'
                                                ? 'bg-red-100 text-red-700 font-semibold'
                                                : 'hover:bg-gray-100 text-gray-600'
                                                }`}
                                        >
                                            <svg className="w-5 h-5" fill={charity.userVote === 'dislike' ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 14H5.236a2 2 0 01-1.789-2.894l3.5-7A2 2 0 018.736 3h4.018a2 2 0 01.485.06l3.76.94m-7 10v5a2 2 0 002 2h.096c.5 0 .905-.405.905-.904 0-.715.211-1.413.608-2.008L17 13V4m-7 10h2m5-10h2a2 2 0 012 2v6a2 2 0 01-2 2h-2.5" />
                                            </svg>
                                            <span className="text-sm">{charity.dislikes}</span>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Modal Overlay */}
            {selectedCharity && createPortal(
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={() => setSelectedCharity(null)}>
                    <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl transform transition-all" onClick={e => e.stopPropagation()}>
                        <div className="relative h-64 sm:h-80 w-full overflow-hidden rounded-t-2xl">
                            <img
                                src={selectedCharity.image}
                                alt={selectedCharity.name}
                                className="w-full h-full object-cover"
                            />
                            <button
                                onClick={() => setSelectedCharity(null)}
                                className="absolute top-4 right-4 bg-black/50 hover:bg-black/70 text-white rounded-full p-2 transition-colors"
                                aria-label="Close modal"
                            >
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                            <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-sm px-3 py-1.5 rounded-full text-xs font-semibold text-gray-800 shadow-sm">
                                {selectedCharity.category}
                            </div>
                        </div>

                        <div className="p-6 sm:p-8">
                            <h2 className="text-3xl font-bold text-gray-900 mb-4">{selectedCharity.name}</h2>
                            <div className="prose max-w-none text-gray-700 leading-relaxed mb-8">
                                {selectedCharity.description.split('\n').map((para, idx) => <p key={idx} className="mb-4">{para}</p>)}
                            </div>

                            <div className="flex items-center space-x-4 pt-6 border-t border-gray-100">
                                <button
                                    onClick={() => handleRate(selectedCharity.id, 'like')}
                                    disabled={selectedCharity.userVote === 'like'}
                                    className={`flex items-center space-x-2 px-5 py-2.5 rounded-xl transition-all ${selectedCharity.userVote === 'like'
                                        ? 'bg-green-100 text-green-700 font-semibold shadow-inner'
                                        : 'bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 hover:border-green-300'
                                        }`}
                                >
                                    <svg className="w-6 h-6" fill={selectedCharity.userVote === 'like' ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5" />
                                    </svg>
                                    <span className="font-semibold text-lg">{selectedCharity.likes}</span>
                                </button>

                                <button
                                    onClick={() => handleRate(selectedCharity.id, 'dislike')}
                                    disabled={selectedCharity.userVote === 'dislike'}
                                    className={`flex items-center space-x-2 px-5 py-2.5 rounded-xl transition-all ${selectedCharity.userVote === 'dislike'
                                        ? 'bg-red-100 text-red-700 font-semibold shadow-inner'
                                        : 'bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 hover:border-red-300'
                                        }`}
                                >
                                    <svg className="w-6 h-6" fill={selectedCharity.userVote === 'dislike' ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 14H5.236a2 2 0 01-1.789-2.894l3.5-7A2 2 0 018.736 3h4.018a2 2 0 01.485.06l3.76.94m-7 10v5a2 2 0 002 2h.096c.5 0 .905-.405.905-.904 0-.715.211-1.413.608-2.008L17 13V4m-7 10h2m5-10h2a2 2 0 012 2v6a2 2 0 01-2 2h-2.5" />
                                    </svg>
                                    <span className="font-semibold text-lg">{selectedCharity.dislikes}</span>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>,
                document.body
            )}
        </div>
    );
}
