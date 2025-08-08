/**
 * Delete all documents
 */

const API_BASE_URL = 'https://queryfy-backend.onrender.com/api';

export async function deleteAllDocuments(): Promise<ApiResponse<{}>> {
  try {
    const response = await fetch(`${API_BASE_URL}/upload`, {
      method: 'DELETE',
    });
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Delete all failed');
    }
    return {
      success: true,
      data: {}
    };
  } catch (error) {
    console.error('Delete all documents error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Delete all failed'
    };
  }
}
// API service for QueryFy backend integration

export interface BackendDocument {
  id: string;
  originalName: string;
  fileSize: number;
  mimeType: string;
  textLength: number;
  uploadedAt: string;
}

export interface QueryResponse {
  id: string;
  documentName: string;
  queryText: string;
  answer: string;
  canAnswer: boolean;
  confidence: number;
  reasoning: string;
  processingTime: number;
  tokensUsed: number;
  createdAt: string;
}

export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  error?: string;
  data?: T;
}

/**
 * Upload a document to the backend
 */
export async function uploadDocument(file: File): Promise<ApiResponse<{ document: BackendDocument }>> {
  try {
    const formData = new FormData();
    formData.append('document', file);

    const response = await fetch(`${API_BASE_URL}/upload`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Upload failed');
    }

    const data = await response.json();
    return {
      success: true,
      data: { document: data.document }
    };
  } catch (error) {
    console.error('Upload error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Upload failed'
    };
  }
}

/**
 * Query a document
 */
export async function queryDocument(documentId: string, query: string): Promise<ApiResponse<{ query: QueryResponse }>> {
  try {
    // Debug logging
    console.log('🔍 queryDocument called with:', { documentId, query });
    console.log('🔍 documentId type:', typeof documentId, 'length:', documentId?.length);
    console.log('🔍 query type:', typeof query, 'length:', query?.length);
    
    // Validate required parameters
    if (!documentId || !query) {
      console.error('❌ Validation failed:', { documentId: !!documentId, query: !!query });
      throw new Error('Both documentId and query are required');
    }

    const response = await fetch(`${API_BASE_URL}/query`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        documentId,
        query
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Query failed');
    }

    const data = await response.json();
    return {
      success: true,
      data: { query: data.query }
    };
  } catch (error) {
    console.error('Query error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Query failed'
    };
  }
}

/**
 * Get list of uploaded documents
 */
export async function getDocuments(): Promise<ApiResponse<{ documents: BackendDocument[] }>> {
  try {
    const response = await fetch(`${API_BASE_URL}/upload/documents`);

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to fetch documents');
    }

    const data = await response.json();
    return {
      success: true,
      data: { documents: data.documents }
    };
  } catch (error) {
    console.error('Fetch documents error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch documents'
    };
  }
}

/**
 * Get query history for a document
 */
export async function getQueryHistory(documentId: string): Promise<ApiResponse<{ queries: QueryResponse[] }>> {
  try {
    const response = await fetch(`${API_BASE_URL}/query/history/${documentId}`);

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to fetch query history');
    }

    const data = await response.json();
    return {
      success: true,
      data: { queries: data.queries }
    };
  } catch (error) {
    console.error('Fetch query history error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch query history'
    };
  }
}

/**
 * Delete a document
 */
export async function deleteDocument(documentId: string): Promise<ApiResponse<{}>> {
  try {
    const response = await fetch(`${API_BASE_URL}/upload/${documentId}`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Delete failed');
    }

    return {
      success: true,
      data: {}
    };
  } catch (error) {
    console.error('Delete error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Delete failed'
    };
  }
}

/**
 * Check backend health
 */
export async function checkBackendHealth(): Promise<{status: 'healthy' | 'error'}> {
  try {
    const response = await fetch(`${API_BASE_URL}/health`);
    if (response.ok) {
      return { status: 'healthy' };
    } else {
      return { status: 'error' };
    }
  } catch (error) {
    console.error('Backend health check failed:', error);
    return { status: 'error' };
  }
}
