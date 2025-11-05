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
        request: (args: {
          path: string;
          method?: string;
          params?: object;
          headers?: object;
          body?: object;
        }) => Promise<{ result: object }>;
        drive: {
          files: {
            list: (params: gapi.client.drive.files.list.Params) => Promise<gapi.client.drive.files.list.Response>;
            copy: (params: any) => Promise<any>;
            create: (params: gapi.client.drive.files.create.Params) => Promise<gapi.client.drive.files.create.Response>;
            update: (params: gapi.client.drive.files.update.Params) => Promise<gapi.client.drive.files.update.Response>;
            get: (params: any) => Promise<any>;
          };
        };
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
        docs: {
          documents: {
            create: (params: { title: string; }) => Promise<{ result: { documentId: string } }>;
          }
        }
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

  namespace gapi.client.drive.files {
    interface File {
      id: string;
      name: string;
      mimeType: string;
      parents: string[];
      webViewLink: string;
    }

    namespace list {
      interface Params {
        q: string;
        fields: string;
      }
      interface Response {
        result: {
          files: File[];
        };
      }
    }

    namespace create {
      interface Params {
        resource: Partial<File>;
        media?: {
          mimeType: string;
          body: Blob | File;
        };
        fields: string;
      }
      interface Response {
        result: File;
      }
    }
    
    namespace update {
        interface Params {
            fileId: string;
            addParents?: string;
            removeParents?: string;
            resource?: Partial<File>;
            fields: string;
        }
        interface Response {
            result: File;
        }
    }
  }
}

export {};
