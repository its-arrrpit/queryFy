// API Configuration
export const API_CONFIG = {
  // Default to 5001 (where queriFy-backend runs) if env is not provided
  BASE_URL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001/api',
  ENDPOINTS: {
    UPLOAD: '/upload',
    QUERY: '/query',
    DOCUMENTS: '/upload/documents',
    HEALTH: '/health',
    DELETE_DOCUMENT: (id: string) => `/upload/${id}`,
    RECOMMENDED_QUESTIONS: (id: string) => `/upload/${id}/recommended-questions`,
    QUERY_HISTORY: (id: string) => `/query/history/${id}`,
  }
};

// Helper function to build full API URLs
export const buildApiUrl = (endpoint: string): string => {
  return `${API_CONFIG.BASE_URL}${endpoint}`;
};
