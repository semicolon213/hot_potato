// Google Identity Services (GIS) 및 Google API Client Library 타입 정의
import type { GoogleClient, PapyrusAuth, GoogleToken } from './google';
import type {
  GoogleSheetsValuesGetParams,
  GoogleSheetsValuesGetResponse,
  GoogleSheetsValuesUpdateParams,
  GoogleSheetsValuesUpdateResponse,
  GoogleSheetsValuesAppendParams,
  GoogleSheetsValuesAppendResponse,
  GoogleSheetsBatchUpdateParams,
  GoogleSheetsBatchUpdateResponse,
  GoogleSheetsGetParams,
  GoogleSheetsGetResponse
} from './google';
import type {
  GoogleDriveFilesCopyParams,
  GoogleDriveFilesCopyResponse,
  GoogleDriveFilesGetParams,
  GoogleDriveFilesGetResponse
} from './google';
import type { GoogleCredentialResponse, GoogleCredential, GoogleCredentialCallback } from './google/gapi';

declare global {
  interface Window {
    google: {
      accounts: {
        id: {
          initialize: (config: {
            client_id: string;
            callback: GoogleCredentialCallback;
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
      client: {
        init: (config: {
          clientId: string;
          discoveryDocs: string[];
          scope: string;
        }) => Promise<void>;
        load: (api: string, version: string) => Promise<void>;
        setApiKey: (apiKey: string) => void;
        getToken: () => GoogleToken | null;
        request: (args: {
          path: string;
          method?: string;
          params?: Record<string, unknown>;
          headers?: Record<string, string>;
          body?: Record<string, unknown>;
        }) => Promise<{ result: Record<string, unknown> }>;
        drive: {
          files: {
            list: (params: gapi.client.drive.files.list.Params) => Promise<gapi.client.drive.files.list.Response>;
            copy: (params: GoogleDriveFilesCopyParams) => Promise<GoogleDriveFilesCopyResponse>;
            create: (params: gapi.client.drive.files.create.Params) => Promise<gapi.client.drive.files.create.Response>;
            update: (params: gapi.client.drive.files.update.Params) => Promise<gapi.client.drive.files.update.Response>;
            get: (params: GoogleDriveFilesGetParams) => Promise<GoogleDriveFilesGetResponse>;
          };
        };
        sheets: {
          spreadsheets: {
            get: (params: GoogleSheetsGetParams) => Promise<GoogleSheetsGetResponse>;
            values: {
              get: (params: GoogleSheetsValuesGetParams) => Promise<GoogleSheetsValuesGetResponse>;
              update: (params: GoogleSheetsValuesUpdateParams) => Promise<GoogleSheetsValuesUpdateResponse>;
              append: (params: GoogleSheetsValuesAppendParams) => Promise<GoogleSheetsValuesAppendResponse>;
            };
            batchUpdate: (params: GoogleSheetsBatchUpdateParams) => Promise<GoogleSheetsBatchUpdateResponse>;
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
