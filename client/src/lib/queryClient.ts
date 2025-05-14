import { QueryClient } from '@tanstack/react-query';

// Create a client
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60, // 1 minute
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

// API request method
type Method = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

export const apiRequest = async (
  method: Method,
  endpoint: string,
  data?: any,
  headers?: Record<string, string>
): Promise<Response> => {
  const url = endpoint.startsWith('http') ? endpoint : endpoint;
  
  const options: RequestInit = {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...headers,
    },
    ...(data && method !== 'GET' ? { body: JSON.stringify(data) } : {}),
    credentials: 'same-origin',
  };

  const response = await fetch(url, options);
  
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    const error = new Error(
      errorData.error || errorData.message || 'API request failed'
    );
    throw Object.assign(error, { response, data: errorData });
  }
  
  return response;
};

// Make apiRequest the default fetcher for react-query
export const defaultQueryFn = async ({ queryKey }: any) => {
  const endpoint = queryKey[0] as string;
  const response = await apiRequest('GET', endpoint);
  return response.json();
};

// Apply default query function to the client
queryClient.setDefaultOptions({
  queries: {
    // @ts-ignore - TypeScript has an issue with the function signature but it works in practice
    queryFn: defaultQueryFn,
  },
});