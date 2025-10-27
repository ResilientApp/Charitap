// API service for backend communication
const API_BASE_URL = process.env.REACT_APP_SERVER_URL || 'http://localhost:3001';

// Helper function to get auth token
const getAuthToken = () => {
  const auth = localStorage.getItem('charitap_auth');
  if (auth) {
    try {
      const data = JSON.parse(auth);
      return data.token;
    } catch (e) {
      return null;
    }
  }
  return null;
};

// Helper function for API calls
const apiCall = async (endpoint, options = {}) => {
  const token = getAuthToken();
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const config = {
    ...options,
    headers,
  };

  const response = await fetch(`${API_BASE_URL}${endpoint}`, config);
  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || 'API request failed');
  }

  return data;
};

// Authentication APIs
export const authAPI = {
  // Signup with email and password
  signup: async (email, password) => {
    return apiCall('/api/auth/signup', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  },

  // Login with email and password
  login: async (email, password) => {
    return apiCall('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  },

  // Google OAuth
  googleAuth: async (googleId, email, displayName, profilePicture, firstName, lastName) => {
    console.log('API: Calling Google auth with:', { googleId, email, displayName, profilePicture, firstName, lastName });
    const result = await apiCall('/api/auth/google', {
      method: 'POST',
      body: JSON.stringify({ googleId, email, displayName, profilePicture, firstName, lastName }),
    });
    console.log('API: Google auth response:', result);
    return result;
  },

  // Get current user profile
  getProfile: async () => {
    return apiCall('/api/auth/me');
  },

  // Update profile
  updateProfile: async (profileData) => {
    return apiCall('/api/auth/me', {
      method: 'PATCH',
      body: JSON.stringify(profileData),
    });
  },

  // Change password
  changePassword: async (currentPassword, newPassword) => {
    return apiCall('/api/auth/change-password', {
      method: 'POST',
      body: JSON.stringify({ currentPassword, newPassword }),
    });
  },

  // Delete account
  deleteAccount: async () => {
    return apiCall('/api/auth/delete', {
      method: 'DELETE',
    });
  },
};

// Dashboard APIs
export const dashboardAPI = {
  // Get total donated
  getTotalDonated: async () => {
    return apiCall('/api/roundup/total-donated');
  },

  // Get collected this month
  getCollectedThisMonth: async () => {
    return apiCall('/api/roundup/collected-this-month');
  },

  // Get unique charities count
  getUniqueCharities: async () => {
    return apiCall('/api/roundup/dashboard/unique-charities');
  },

  // Get monthly donations for last 12 months
  getMonthlyDonations: async () => {
    return apiCall('/api/roundup/dashboard/monthly-donations');
  },

  // Get charity breakdown (for donut chart)
  getCharityBreakdown: async () => {
    return apiCall('/api/roundup/dashboard/charity-breakdown');
  },
};

// Activity APIs
export const activityAPI = {
  // Get collected round-ups
  getCollected: async () => {
    return apiCall('/api/roundup/activity/collected');
  },

  // Get donations
  getDonations: async () => {
    return apiCall('/api/roundup/activity/donated');
  },
};

// Settings APIs
export const settingsAPI = {
  // Get all charities
  getCharities: async () => {
    return apiCall('/api/charities');
  },

  // Toggle charity selection
  toggleCharity: async (charityId) => {
    return apiCall('/api/auth/settings/charities/toggle', {
      method: 'POST',
      body: JSON.stringify({ charityId }),
    });
  },

  // Update all selected charities at once
  updateCharities: async (charityIds) => {
    return apiCall('/api/auth/settings/charities', {
      method: 'PATCH',
      body: JSON.stringify({ charityIds }),
    });
  },

  // Update payment preference
  updatePaymentPreference: async (paymentPreference) => {
    return apiCall('/api/auth/settings/payment-preference', {
      method: 'PATCH',
      body: JSON.stringify({ paymentPreference }),
    });
  },
};

// Stripe APIs
export const stripeAPI = {
  // Create Stripe customer
  createCustomer: async (email, name) => {
    return apiCall('/api/stripe/create-customer', {
      method: 'POST',
      body: JSON.stringify({ email, name }),
    });
  },

  // Create setup intent (Note: Check backend if this endpoint exists)
  createSetupIntent: async (email, name) => {
    return apiCall('/api/stripe/create-setup-intent', {
      method: 'POST',
      body: JSON.stringify({ email, name }),
    });
  },

  // List payment methods (Note: Check backend if this endpoint exists)
  listPaymentMethods: async (email) => {
    return apiCall('/api/stripe/list-payment-methods', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  },

  // Set default payment method (Note: Check backend if this endpoint exists)
  setDefaultPaymentMethod: async (email, paymentMethodId) => {
    return apiCall('/api/stripe/set-default-payment-method', {
      method: 'POST',
      body: JSON.stringify({ email, paymentMethodId }),
    });
  },

  // Detach payment method (Note: Check backend if this endpoint exists)
  detachPaymentMethod: async (paymentMethodId) => {
    return apiCall('/api/stripe/detach-payment-method', {
      method: 'POST',
      body: JSON.stringify({ paymentMethodId }),
    });
  },
};

const apiServices = {
  authAPI,
  dashboardAPI,
  activityAPI,
  settingsAPI,
  stripeAPI,
};

export default apiServices;

