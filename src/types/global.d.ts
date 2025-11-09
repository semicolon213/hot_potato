// Google Identity Services (GIS) 및 Google API Client Library 타입 정의
import type { GoogleClient, PapyrusAuth, GoogleToken, GoogleCredentialResponse, GoogleCredential } from './google';
import type { 
  GoogleSheetsValuesGetParams, 
  GoogleSheetsValuesGetResponse,
  GoogleSheetsValuesUpdateParams,
  GoogleSheetsValuesUpdateResponse,
  GoogleSheetsValuesAppendParams,
  GoogleSheetsValuesAppendResponse,
  GoogleSheetsBatchUpdateParams,
  GoogleSheetsBatchUpdateResponse,
  GoogleDriveFilesCopyParams,
  GoogleDriveFilesCopyResponse,
  GoogleDriveFilesGetParams,
  GoogleDriveFilesGetResponse
} from './google';

declare global {
  interface Window {
    google: {
      accounts: {
        id: {
          initialize: (config: {
            client_id: string;
            callback: (response: GoogleCredentialResponse) => void;
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
          storeCredential: (credential: GoogleCredential) => void;
          cancel: () => void;
          revoke: (hint: string, callback: () => void) => void;
        };
      };
    };
    gapi: {
      load: (api: string, callback: () => void) => void;
      client: GoogleClient;
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
    papyrusAuth?: PapyrusAuth;
    gapiLoaded?: boolean;
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
        spaces?: string;
        orderBy?: string;
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

  namespace gapi.client.sheets {
    interface Spreadsheet {
      properties: {
        title: string;
      };
      sheets: Sheet[];
    }

    interface Sheet {
      properties: {
        sheetId: number;
        title: string;
        index: number;
        sheetType: string;
        gridProperties: {
          rowCount: number;
          columnCount: number;
        };
      };
    }

    namespace spreadsheets {
      namespace get {
        interface Params {
          spreadsheetId: string;
          fields?: string;
        }
        interface Response {
          result: Spreadsheet;
        }
      }
    }
  }
}

export {};
