/**
 * @file personalConfigManager.ts
 * @brief 개인 설정 파일 관리 유틸리티
 * @details 개인 드라이브의 hp_potato_DB 파일을 관리하는 유틸리티 모듈입니다.
 * @author Hot Potato Team
 * @date 2024
 */

import { getSheetData, append, update } from 'papyrus-db';
import { deleteRow } from 'papyrus-db/dist/sheets/delete';

// Google API 클라이언트 타입 정의
interface GoogleSheetsClient {
  spreadsheets: {
    create: (params: any) => Promise<any>;
    get: (params: any) => Promise<any>;
    values: {
      update: (params: any) => Promise<any>;
    };
    batchUpdate: (params: any) => Promise<any>;
  };
}

interface GoogleDriveClient {
  files: {
    list: (params: any) => Promise<any>;
    update: (params: any) => Promise<any>;
  };
}

interface GoogleClient {
  sheets: GoogleSheetsClient;
  drive: GoogleDriveClient;
}

// papyrus-db에 Google API 인증 설정
const setupPapyrusAuth = () => {
  if ((window as any).gapi && (window as any).gapi.client) {
    (window as any).papyrusAuth = {
      client: (window as any).gapi.client
    };
  }
};

// 개인 설정 파일 ID 저장
let personalConfigSpreadsheetId: string | null = null;

/**
 * @brief 개인 설정 파일 찾기
 * @details 개인 드라이브에서 hp_potato_DB 파일을 찾습니다.
 * @returns {Promise<string | null>} 스프레드시트 ID 또는 null
 */
export const findPersonalConfigFile = async (): Promise<string | null> => {
  try {
    setupPapyrusAuth();
    
    console.log('🔍 개인 설정 파일 찾기 시작');
    
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
    console.log('✅ hot potato 폴더 찾음:', hotPotatoFolder.id);

    // 2단계: hot potato 폴더에서 "hp_potato_DB" 파일 찾기
    const configFileResponse = await gapi.client.drive.files.list({
      q: `'${hotPotatoFolder.id}' in parents and name='hp_potato_DB' and mimeType='application/vnd.google-apps.spreadsheet' and trashed=false`,
      fields: 'files(id,name)',
      spaces: 'drive',
      orderBy: 'name'
    });

    if (!configFileResponse.result.files || configFileResponse.result.files.length === 0) {
      console.log('❌ hp_potato_DB 파일을 찾을 수 없습니다');
      return null;
    }

    const configFile = configFileResponse.result.files[0];
    console.log('✅ hp_potato_DB 파일 찾음:', configFile.id);
    
    personalConfigSpreadsheetId = configFile.id;
    return configFile.id;
  } catch (error) {
    console.error('❌ 개인 설정 파일 찾기 오류:', error);
    return null;
  }
};

/**
 * @brief 개인 설정 파일 생성
 * @details hot potato 폴더에 hp_potato_DB 파일을 생성합니다.
 * @returns {Promise<string | null>} 생성된 스프레드시트 ID 또는 null
 */
export const createPersonalConfigFile = async (): Promise<string | null> => {
  try {
    setupPapyrusAuth();
    
    console.log('📄 개인 설정 파일 생성 시작');
    
    // 1단계: hot potato 폴더 찾기
    const hotPotatoResponse = await gapi.client.drive.files.list({
      q: "'root' in parents and name='hot potato' and mimeType='application/vnd.google-apps.folder' and trashed=false",
      fields: 'files(id,name)',
      spaces: 'drive',
      orderBy: 'name'
    });

    if (!hotPotatoResponse.result.files || hotPotatoResponse.result.files.length === 0) {
      console.log('❌ hot potato 폴더를 찾을 수 없습니다. 폴더를 먼저 생성해주세요.');
      return null;
    }

    const hotPotatoFolder = hotPotatoResponse.result.files[0];
    console.log('✅ hot potato 폴더 찾음:', hotPotatoFolder.id);

    // 2단계: hp_potato_DB 스프레드시트 생성
    const sheetsClient = (gapi.client as unknown as GoogleClient).sheets;
    const spreadsheet = await sheetsClient.spreadsheets.create({
      resource: {
        properties: {
          title: 'hp_potato_DB'
        },
        sheets: [
          {
            properties: {
              title: 'favorite',
              gridProperties: {
                rowCount: 1000,
                columnCount: 2
              }
            }
          },
          {
            properties: {
              title: 'tag',
              gridProperties: {
                rowCount: 1000,
                columnCount: 1
              }
            }
          },
          {
            properties: {
              title: 'user_custom',
              gridProperties: {
                rowCount: 1000,
                columnCount: 10
              }
            }
          }
        ]
      }
    });

    const spreadsheetId = spreadsheet.result.spreadsheetId;
    console.log('✅ hp_potato_DB 파일 생성 완료:', spreadsheetId);

    // 3단계: hot potato 폴더로 이동
    const driveClient = (gapi.client as unknown as GoogleClient).drive;
    await driveClient.files.update({
      fileId: spreadsheetId,
      addParents: hotPotatoFolder.id,
      removeParents: 'root'
    });

    // 4단계: 헤더 설정
    await setupPersonalConfigHeaders(spreadsheetId);

    personalConfigSpreadsheetId = spreadsheetId;
    return spreadsheetId;
  } catch (error) {
    console.error('❌ 개인 설정 파일 생성 오류:', error);
    return null;
  }
};

/**
 * @brief 개인 설정 파일 헤더 설정
 * @details 각 시트에 헤더를 설정합니다.
 * @param {string} spreadsheetId - 스프레드시트 ID
 */
export const setupPersonalConfigHeaders = async (spreadsheetId: string): Promise<void> => {
  try {
    setupPapyrusAuth();
    
    const sheetsClient = (gapi.client as unknown as GoogleClient).sheets;
    
    // favorite 시트 헤더 설정
    await sheetsClient.spreadsheets.values.update({
      spreadsheetId: spreadsheetId,
      range: 'favorite!A1:B1',
      valueInputOption: 'RAW',
      resource: {
        values: [['type', 'favorite']]
      }
    });

    // tag 시트 헤더 설정
    await sheetsClient.spreadsheets.values.update({
      spreadsheetId: spreadsheetId,
      range: 'tag!A1',
      valueInputOption: 'RAW',
      resource: {
        values: [['tag']]
      }
    });

    // user_custom 시트 헤더 설정
    await sheetsClient.spreadsheets.values.update({
      spreadsheetId: spreadsheetId,
      range: 'user_custom!A1:B1',
      valueInputOption: 'RAW',
      resource: {
        values: [['dashboard', 'menu']]
      }
    });

    console.log('✅ 개인 설정 파일 헤더 설정 완료');
  } catch (error) {
    console.error('❌ 헤더 설정 오류:', error);
    throw error;
  }
};

/**
 * @brief 개인 설정 파일 초기화
 * @details 개인 설정 파일을 찾거나 생성합니다.
 * @returns {Promise<string | null>} 스프레드시트 ID 또는 null
 */
export const initializePersonalConfigFile = async (): Promise<string | null> => {
  try {
    // 먼저 기존 파일 찾기
    let spreadsheetId = await findPersonalConfigFile();
    
    if (spreadsheetId) {
      console.log('✅ 기존 개인 설정 파일 사용:', spreadsheetId);
      personalConfigSpreadsheetId = spreadsheetId;
      
      // 기존 파일의 시트 확인 및 누락된 시트 생성
      try {
        const sheetsClient = (gapi.client as unknown as GoogleClient).sheets;
        const spreadsheet = await sheetsClient.spreadsheets.get({
          spreadsheetId: spreadsheetId,
          fields: 'sheets.properties'
        });
        
        const existingSheets = spreadsheet.result.sheets?.map(sheet => sheet.properties?.title) || [];
        console.log('📄 기존 시트 목록:', existingSheets);
        
        const requiredSheets = ['favorite', 'tag', 'user_custom'];
        const missingSheets = requiredSheets.filter(sheetName => !existingSheets.includes(sheetName));
        
        if (missingSheets.length > 0) {
          console.log('📄 누락된 시트 생성:', missingSheets);
          
          for (const sheetName of missingSheets) {
            await sheetsClient.spreadsheets.batchUpdate({
              spreadsheetId: spreadsheetId,
              resource: {
                requests: [{
                  addSheet: {
                    properties: {
                      title: sheetName,
                      gridProperties: {
                        rowCount: 1000,
                        columnCount: sheetName === 'user_custom' ? 10 : (sheetName === 'favorite' ? 2 : 1)
                      }
                    }
                  }
                }]
              }
            });
            console.log(`✅ ${sheetName} 시트 생성 완료`);
          }
          
          // 헤더 설정
          await setupPersonalConfigHeaders(spreadsheetId);
        }
      } catch (error) {
        console.warn('⚠️ 시트 확인 중 오류 발생, 계속 진행:', error);
      }
      
      return spreadsheetId;
    }

    // 파일이 없으면 생성
    console.log('📄 개인 설정 파일이 없어서 새로 생성합니다.');
    spreadsheetId = await createPersonalConfigFile();
    
    if (spreadsheetId) {
      console.log('✅ 개인 설정 파일 생성 완료:', spreadsheetId);
      return spreadsheetId;
    }

    console.error('❌ 개인 설정 파일 초기화 실패');
    return null;
  } catch (error) {
    console.error('❌ 개인 설정 파일 초기화 오류:', error);
    return null;
  }
};

/**
 * @brief 개인 설정 파일 ID 가져오기
 * @returns {string | null} 개인 설정 파일 ID
 */
export const getPersonalConfigSpreadsheetId = (): string | null => {
  return personalConfigSpreadsheetId;
};

/**
 * @brief 개인 설정 파일 ID 설정
 * @param {string} id - 스프레드시트 ID
 */
export const setPersonalConfigSpreadsheetId = (id: string): void => {
  personalConfigSpreadsheetId = id;
};

