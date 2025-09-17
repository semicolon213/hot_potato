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
  const cachedId = localStorage.getItem(`spreadsheet_id_${name}`);
  if (cachedId) {
    console.log(`Found cached spreadsheet ID for "${name}"`);
    return cachedId;
  }

  try {
    const response = await (window as any).gapi.client.drive.files.list({
      q: `name='${name}' and mimeType='application/vnd.google-apps.spreadsheet'`,
      fields: 'files(id, name)',
    });
    const files = response.result.files;
    if (files && files.length > 0) {
      const fileId = files[0].id;
      localStorage.setItem(`spreadsheet_id_${name}`, fileId);
      return fileId;
    } else {
      alert(`Spreadsheet with name "${name}" not found.`);
      return null;
    }
  } catch (error) {
    console.log('Error searching for spreadsheet. Check console for details.');
    return null;
  }
};

export const updateSheetCell = async (spreadsheetId: string, sheetName: string, rowIndex: number, columnIndex: number, value: string): Promise<void> => {
    await initializeGoogleAPIOnce();
    const gapi = (window as any).gapi;

    const range = `${sheetName}!${String.fromCharCode(65 + columnIndex)}${rowIndex}`;

    await gapi.client.sheets.spreadsheets.values.update({
        spreadsheetId: spreadsheetId,
        range: range,
        valueInputOption: 'USER_ENTERED',
        resource: {
            values: [[value]]
        }
    });
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

export const checkSheetExists = async (spreadsheetId: string, sheetName: string): Promise<boolean> => {
  await initializeGoogleAPIOnce();
  const gapi = (window as any).gapi;

  try {
    const response = await gapi.client.sheets.spreadsheets.get({
      spreadsheetId: spreadsheetId,
    });

    const sheet = response.result.sheets.find(
      (s: any) => s.properties.title === sheetName
    );

    return !!sheet;
  } catch (error) {
    console.error('Error checking for sheet:', error);
    return false;
  }
};

export const createNewSheet = async (spreadsheetId: string, sheetName: string): Promise<void> => {
  await initializeGoogleAPIOnce();
  const gapi = (window as any).gapi;

  try {
    await gapi.client.sheets.spreadsheets.batchUpdate({
      spreadsheetId: spreadsheetId,
      resource: {
        requests: [
          {
            addSheet: {
              properties: {
                title: sheetName,
              },
            },
          },
        ],
      },
    });
  } catch (error) {
    console.error('Error creating new sheet:', error);
  }
};

export const appendSheetData = async (spreadsheetId: string, sheetName: string, values: any[][]): Promise<void> => {
  await initializeGoogleAPIOnce();
  const gapi = (window as any).gapi;

  try {
    await gapi.client.sheets.spreadsheets.values.append({
      spreadsheetId: spreadsheetId,
      range: `${sheetName}!A1`,
      valueInputOption: 'USER_ENTERED',
      insertDataOption: 'INSERT_ROWS',
      resource: {
        values: values,
      },
    });
  } catch (error) {
    console.error('Error appending sheet data:', error);
  }
};

export const getSheetData = async (spreadsheetId: string, sheetName: string, range: string): Promise<any[][] | null> => {
  await initializeGoogleAPIOnce();
  const gapi = (window as any).gapi;

  try {
    const response = await gapi.client.sheets.spreadsheets.values.get({
      spreadsheetId: spreadsheetId,
      range: `${sheetName}!${range}`,
    });
    return response.result.values;
  } catch (error) {
    console.error('Error getting sheet data:', error);
    return null;
  }
};

export const updateTitleInSheetByDocId = async (
  spreadsheetId: string,
  sheetName: string,
  docId: string,
  newTitle: string
): Promise<void> => {
  await initializeGoogleAPIOnce();
  const gapi = (window as any).gapi;

  try {
    const data = await getSheetData(spreadsheetId, sheetName, 'A:C'); // Assuming id is in A, title in C
    if (!data || data.length === 0) return;

    const header = data[0];
    const docIdColIndex = header.indexOf('document_id');
    const titleColIndex = header.indexOf('title');

    if (docIdColIndex === -1 || titleColIndex === -1) {
      console.error('Required columns (document_id, title) not found.');
      return;
    }

    const rowIndex = data.findIndex(row => row[docIdColIndex] === docId);

    if (rowIndex !== -1) {
      const range = `${sheetName}!${String.fromCharCode(65 + titleColIndex)}${rowIndex + 1}`;
      await gapi.client.sheets.spreadsheets.values.update({
        spreadsheetId: spreadsheetId,
        range: range,
        valueInputOption: 'USER_ENTERED',
        resource: {
          values: [[newTitle]],
        },
      });
    }
  } catch (error) {
    console.error('Error updating title in sheet:', error);
  }
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