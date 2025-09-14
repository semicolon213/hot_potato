// Google Identity Services (GIS) 및 Google API Client Library 타입 정의
declare global {
  interface Window {
    google: {
      accounts: {
        id: {
          initialize: (config: {
            client_id: string;
            callback: (response: any) => void;
            auto_select?: boolean;
            cancel_on_tap_outside?: boolean;
          }) => void;
          renderButton: (element: HTMLElement, options: {
            type?: string;
            theme?: string;
            size?: string;
            text?: string;
            shape?: string;
            logo_alignment?: string;
          }) => void;
          prompt: () => void;
          disableAutoSelect: () => void;
          storeCredential: (credential: any) => void;
          cancel: () => void;
          revoke: (hint: string, callback: () => void) => void;
        };
      };
    };
    gapi: {
      load: (api: string, callback: () => void) => void;
      client: {
        init: (config: {
          clientId: string;
          discoveryDocs: string[];
          scope: string;
        }) => Promise<void>;
        load: (api: string, version: string) => Promise<void>;
        setApiKey: (apiKey: string) => void;
        getToken: () => any;
        sheets: {
          spreadsheets: {
            get: (params: any) => Promise<any>;
            values: {
              get: (params: any) => Promise<any>;
              update: (params: any) => Promise<any>;
              append: (params: any) => Promise<any>;
            };
            batchUpdate: (params: any) => Promise<any>;
          };
        };
      };
      auth2: {
        getAuthInstance: () => {
          isSignedIn: {
            get: () => boolean;
          };
          currentUser: {
            get: () => {
              getBasicProfile: () => {
                getName: () => string;
                getEmail: () => string;
              };
            };
          };
        };
      };
    };
  }
}

export {};
