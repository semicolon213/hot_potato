import { useEffect } from "react";

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;

let isGoogleAPIInitialized = false;
let googleAPIInitPromise: Promise<void> | null = null;

export const initializeGoogleAPIOnce = async (): Promise<void> => {
  if (isGoogleAPIInitialized) return;
  if (googleAPIInitPromise) return googleAPIInitPromise;

  googleAPIInitPromise = (async () => {
    try {
      const waitForGapi = (): Promise<void> => {
        return new Promise((resolve, reject) => {
          let attempts = 0;
          const maxAttempts = 30;
          const checkGapi = () => {
            attempts++;
            if (typeof window !== 'undefined' && (window as any).gapi) {
              resolve();
            } else if (attempts >= maxAttempts) {
              reject(new Error("gapi 스크립트 로드 타임아웃"));
            } else {
              setTimeout(checkGapi, 100);
            }
          };
          checkGapi();
        });
      };
      await waitForGapi();
      const gapi = (window as any).gapi;

      await new Promise<void>((resolve, reject) => {
        gapi.load('client', async () => {
          try {
            await gapi.client.init({
              clientId: GOOGLE_CLIENT_ID,
              discoveryDocs: [
                'https://sheets.googleapis.com/$discovery/rest?version=v4',
                'https://www.googleapis.com/discovery/v1/apis/drive/v3/rest'
              ],
            });
            const token = localStorage.getItem('googleAccessToken');
            if (token) {
              gapi.client.setToken({ access_token: token });
            }
            isGoogleAPIInitialized = true;
            resolve();
          } catch (error) {
            reject(error);
          }
        });
      });
    } catch (error) {
      isGoogleAPIInitialized = false;
      googleAPIInitPromise = null;
      throw error;
    }
  })();
  return googleAPIInitPromise;
};

export const getSheetIdByName = async (name: string): Promise<string | null> => {
  try {
    const response = await (window as any).gapi.client.drive.files.list({
      q: `name='${name}' and mimeType='application/vnd.google-apps.spreadsheet'`,
      fields: 'files(id, name)',
    });
    const files = response.result.files;
    if (files && files.length > 0) {
      return files[0].id;
    } else {
      alert(`Spreadsheet with name "${name}" not found.`);
      return null;
    }
  } catch (error) {
    console.log('Error searching for spreadsheet. Check console for details.');
    return null;
  }
};

// This function is not used in this file, but it was in App.tsx
// Keeping it here for now, but it might be removed later if not needed.
export const resetGoogleAPIState = () => {
  isGoogleAPIInitialized = false;
  googleAPIInitPromise = null;
};

// This useEffect is not used in this file, but it was in App.tsx
// Keeping it here for now, but it might be removed later if not needed.
export const useResetGoogleAPIStateOnUnload = () => {
  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.addEventListener('beforeunload', resetGoogleAPIState);
    }
    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('beforeunload', resetGoogleAPIState);
      }
    };
  }, []);
};

export const deleteSheetRow = async (spreadsheetId: string, sheetName: string, rowIndex: number): Promise<void> => {
  await initializeGoogleAPIOnce();
  const gapi = (window as any).gapi;

  const sheetIdResponse = await gapi.client.sheets.spreadsheets.get({
    spreadsheetId: spreadsheetId,
  });

  const sheet = sheetIdResponse.result.sheets.find(
    (s: any) => s.properties.title === sheetName
  );

  if (!sheet) {
    throw new Error(`Sheet "${sheetName}" not found in spreadsheet.`);
  }
  const sheetId = sheet.properties.sheetId;

  await gapi.client.sheets.spreadsheets.batchUpdate({
    spreadsheetId: spreadsheetId,
    resource: {
      requests: [
        {
          deleteDimension: {
            range: {
              sheetId: sheetId,
              dimension: 'ROWS',
              startIndex: rowIndex,
              endIndex: rowIndex + 1,
            },
          },
        },
      ],
    },
  });
};

export const copyGoogleDocument = async (fileId: string, newTitle: string): Promise<{ id: string, webViewLink: string } | null> => {
  await initializeGoogleAPIOnce();
  const gapi = (window as any).gapi;

  try {
    const response = await gapi.client.drive.files.copy({
      fileId: fileId,
      resource: {
        name: newTitle,
      },
      fields: 'id, webViewLink',
    });
    return response.result;
  } catch (error) {
    console.error('Error copying Google Document:', error);
    alert('Google 문서를 복사하는 중 오류가 발생했습니다. 콘솔을 확인해주세요.');
    return null;
  }
};