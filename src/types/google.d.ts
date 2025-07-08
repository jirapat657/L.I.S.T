// src/types/google.d.ts
interface GoogleOAuth {
  accounts: {
    id: {
      initialize: (params: {
        client_id: string;
        callback: (response: { credential?: string; error?: string }) => void;
      }) => void;
      renderButton: (element: HTMLElement, options: { theme: string; size: string }) => void;
      prompt: () => void;
    };
    oauth2: {
      initTokenClient: (config: {
        client_id: string;
        scope: string;
        callback: (response: { access_token: string; error?: string }) => void;
      }) => {
        requestAccessToken: (options?: { prompt?: string }) => void;
      };
    };
  };
}

declare global {
  interface Window {
    google?: GoogleOAuth;
  }
}