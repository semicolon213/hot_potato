import { useEffect } from "react";

import { ENV_CONFIG } from '../../config/environment';
import { tokenManager } from '../auth/tokenManager';

const GOOGLE_CLIENT_ID = ENV_CONFIG.GOOGLE_CLIENT_ID;

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
            // tokenManager를 통해 토큰 가져오기 (만료 체크 포함)
            const token = tokenManager.get();
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

export const updateLastModifiedInSheetByDocId = async (
  spreadsheetId: string,
  sheetName: string,
  docId: string,
  newLastModified: string
): Promise<void> => {
  await initializeGoogleAPIOnce();
  const gapi = (window as any).gapi;

  try {
    const data = await getSheetData(spreadsheetId, sheetName, 'A:D'); // Assuming id is in A, last_modified in D
    if (!data || data.length === 0) return;

    const header = data[0];
    const docIdColIndex = header.indexOf('document_id');
    const lastModifiedColIndex = header.indexOf('last_modified');

    if (docIdColIndex === -1 || lastModifiedColIndex === -1) {
      console.error('Required columns (document_id, last_modified) not found.');
      return;
    }

    const rowIndex = data.findIndex(row => row[docIdColIndex] === docId);

    if (rowIndex !== -1) {
      const range = `${sheetName}!${String.fromCharCode(65 + lastModifiedColIndex)}${rowIndex + 1}`;
      await gapi.client.sheets.spreadsheets.values.update({
        spreadsheetId: spreadsheetId,
        range: range,
        valueInputOption: 'USER_ENTERED',
        resource: {
          values: [[newLastModified]],
        },
      });
    }
  } catch (error) {
    console.error('Error updating last_modified in sheet:', error);
  }
};

/**
 * @brief 개인 문서 폴더 찾기
 * @details hot potato/문서/개인 문서 폴더를 찾습니다
 */
export const findPersonalDocumentFolder = async (): Promise<string | null> => {
  const gapi = window.gapi;
  if (!gapi?.client?.drive) {
    console.error('Google Drive API가 초기화되지 않았습니다.');
    return null;
  }

  try {
    // 1단계: 루트에서 "hot potato" 폴더 찾기
    const hotPotatoResponse = await gapi.client.drive.files.list({
      q: "'root' in parents and name='hot potato' and mimeType='application/vnd.google-apps.folder' and trashed=false",
      fields: 'files(id,name)',
      spaces: 'drive',
      orderBy: 'name'
    });

    if (!hotPotatoResponse.result.files || hotPotatoResponse.result.files.length === 0) {
      console.log('❌ hot potato 폴더를 찾을 수 없습니다');
      return null;
    }

    const hotPotatoFolder = hotPotatoResponse.result.files[0];

    // 2단계: "문서" 폴더 찾기
    const documentResponse = await gapi.client.drive.files.list({
      q: `'${hotPotatoFolder.id}' in parents and name='문서' and mimeType='application/vnd.google-apps.folder' and trashed=false`,
      fields: 'files(id,name)',
      spaces: 'drive',
      orderBy: 'name'
    });

    if (!documentResponse.result.files || documentResponse.result.files.length === 0) {
      console.log('❌ 문서 폴더를 찾을 수 없습니다');
      return null;
    }

    const documentFolder = documentResponse.result.files[0];

    // 3단계: "개인 문서" 폴더 찾기
    const personalDocResponse = await gapi.client.drive.files.list({
      q: `'${documentFolder.id}' in parents and name='개인 문서' and mimeType='application/vnd.google-apps.folder' and trashed=false`,
      fields: 'files(id,name)',
      spaces: 'drive',
      orderBy: 'name'
    });

    if (!personalDocResponse.result.files || personalDocResponse.result.files.length === 0) {
      console.log('❌ 개인 문서 폴더를 찾을 수 없습니다. 폴더를 생성합니다.');
      
      // 개인 문서 폴더 생성
      const DriveAPI = gapi.client.drive.files as unknown as {
        create: (params: {
          resource: { name: string; mimeType: string; parents: string[] };
          fields: string;
        }) => Promise<{ result: { id: string } }>;
      };
      
      const createResponse = await DriveAPI.create({
        resource: {
          name: '개인 문서',
          mimeType: 'application/vnd.google-apps.folder',
          parents: [documentFolder.id]
        },
        fields: 'id'
      });
      
      return createResponse.result.id;
    }

    return personalDocResponse.result.files[0].id as string;
  } catch (error) {
    console.error('❌ 개인 문서 폴더 찾기 오류:', error);
    return null;
  }
};

export const copyGoogleDocument = async (fileId: string, newTitle: string, tag?: string): Promise<{ id: string, webViewLink: string } | null> => {
  await initializeGoogleAPIOnce();
  const gapi = window.gapi;
  if (!gapi?.client?.drive) {
    console.error('Google Drive API가 초기화되지 않았습니다.');
    return null;
  }

  try {
    // 개인 문서 폴더 찾기
    const personalDocFolderId = await findPersonalDocumentFolder();
    
    if (!personalDocFolderId) {
      console.error('❌ 개인 문서 폴더를 찾을 수 없습니다.');
      alert('개인 문서 폴더를 찾을 수 없습니다.');
      return null;
    }

    console.log('✅ 개인 문서 폴더 찾음:', personalDocFolderId);

    // 개인 문서 폴더에 문서 복사
    const DriveAPI = gapi.client.drive.files as unknown as {
      copy: (params: {
        fileId: string;
        resource: { name: string; parents: string[] };
        fields: string;
      }) => Promise<{ result: { id: string; webViewLink: string } }>;
    };
    
    const response = await DriveAPI.copy({
      fileId: fileId,
      resource: {
        name: newTitle,
        parents: [personalDocFolderId] // 개인 문서 폴더에 저장
      },
      fields: 'id, webViewLink',
    });
    
    console.log('✅ 문서가 개인 문서 폴더에 복사되었습니다:', response.result.id);
    
    // 문서명은 원래 제목 그대로 유지 (사용자가 변경 가능)
    
    return response.result;
  } catch (error) {
    console.error('❌ Google 문서 복사 오류:', error);
    alert('Google 문서를 복사하는 중 오류가 발생했습니다. 콘솔을 확인해주세요.');
    return null;
  }
};

export const deleteRowsByDocIds = async (
  spreadsheetId: string,
  sheetName: string,
  docIds: string[]
): Promise<void> => {
  await initializeGoogleAPIOnce();
  const gapi = (window as any).gapi;

  try {
    // 1. Find the sheetId (numeric) for the given sheetName
    const sheetIdResponse = await gapi.client.sheets.spreadsheets.get({
      spreadsheetId: spreadsheetId,
    });
    const sheet = sheetIdResponse.result.sheets.find(
      (s: any) => s.properties.title === sheetName
    );
    if (!sheet) {
      throw new Error(`Sheet "${sheetName}" not found.`);
    }
    const numericSheetId = sheet.properties.sheetId;

    // 2. Get all data to find the header and document_id column
    const data = await getSheetData(spreadsheetId, sheetName, 'A:Z'); // Get enough columns
    if (!data || data.length === 0) return;

    const header = data[0];
    const docIdColIndex = header.indexOf('document_id');

    if (docIdColIndex === -1) {
      console.error('Required column "document_id" not found.');
      return;
    }

    const rowsToDelete: number[] = [];
    data.forEach((row, index) => {
      if (index > 0 && docIds.includes(row[docIdColIndex])) { // index > 0 to skip header
        rowsToDelete.push(index);
      }
    });

    if (rowsToDelete.length === 0) {
      return; // No rows to delete
    }

    // 3. Sort row indices in descending order
    rowsToDelete.sort((a, b) => b - a);

    // 4. Create batch update requests
    const requests = rowsToDelete.map(rowIndex => ({
      deleteDimension: {
        range: {
          sheetId: numericSheetId,
          dimension: 'ROWS',
          startIndex: rowIndex,
          endIndex: rowIndex + 1,
        },
      },
    }));

    // 5. Execute the batch update
    await gapi.client.sheets.spreadsheets.batchUpdate({
      spreadsheetId: spreadsheetId,
      resource: {
        requests: requests,
      },
    });
  } catch (error) {
    console.error('Error deleting rows from sheet:', error);
    throw error; // Re-throw the error to be caught by the caller
  }
};