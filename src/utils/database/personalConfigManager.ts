/**
 * @file personalConfigManager.ts
 * @brief 개인 설정 파일 관리 유틸리티
 * @details 개인 드라이브의 hp_potato_DB 파일을 관리하는 유틸리티 모듈입니다.
 * @author Hot Potato Team
 * @date 2024
 */

import { getSheetData, append, update } from 'papyrus-db';
import { deleteRow } from 'papyrus-db/dist/sheets/delete';
import { ENV_CONFIG } from '../../config/environment';
import { tokenManager } from '../auth/tokenManager';
import type { GoogleClient, GoogleSheetsCreateParams, GoogleSheetsCreateResponse, GoogleSheetsGetParams, GoogleSheetsGetResponse, GoogleSheetsValuesUpdateParams, GoogleSheetsBatchUpdateParams, GoogleDriveFilesListParams, GoogleDriveFilesUpdateParams, PapyrusAuth } from '../../types/google';

// papyrus-db에 Google API 인증 설정
const setupPapyrusAuth = (): void => {
  if (window.gapi && window.gapi.client) {
    // tokenManager를 사용하여 올바른 토큰 가져오기 (만료 체크 포함)
    const token = tokenManager.get();
    
    if (token) {
      try {
        window.gapi.client.setToken({ access_token: token });
        console.log('✅ 토큰이 gapi client에 설정되었습니다.');
      } catch (tokenError) {
        console.warn('토큰 설정 실패:', tokenError);
      }
    } else {
      console.warn('⚠️ Google API 인증 토큰이 없거나 만료되었습니다.');
    }
    
    // papyrus-db가 gapi.client를 사용하도록 설정
    window.papyrusAuth = {
      client: window.gapi.client
    };
  } else {
    console.warn('⚠️ Google API가 초기화되지 않았습니다.');
  }
};

// 개인 설정 파일 ID 저장
let personalConfigSpreadsheetId: string | null = null;

/**
 * @brief 개인 설정 파일 ID 초기화
 * @details 로그아웃 또는 계정 전환 시 개인 설정 파일 ID를 초기화합니다.
 */
export const clearPersonalConfigSpreadsheetId = (): void => {
    personalConfigSpreadsheetId = null;
    console.log('🧹 개인 설정 파일 ID 초기화 완료');
};

/**
 * @brief 개인 설정 파일 찾기
 * @details 개인 드라이브에서 hp_potato_DB 파일을 찾습니다.
 * @returns {Promise<string | null>} 스프레드시트 ID 또는 null
 */
export const findPersonalConfigFile = async (): Promise<string | null> => {
  try {
    setupPapyrusAuth();
    
    console.log('🔍 개인 설정 파일 찾기 시작');
    
    const rootFolderName = ENV_CONFIG.ROOT_FOLDER_NAME;
    const configFileName = ENV_CONFIG.PERSONAL_CONFIG_FILE_NAME;

    // 1단계: 루트에서 루트 폴더 찾기
    const hotPotatoResponse = await window.gapi.client.drive.files.list({
      q: `'root' in parents and name='${rootFolderName}' and mimeType='application/vnd.google-apps.folder' and trashed=false`,
      fields: 'files(id,name)',
      spaces: 'drive',
      orderBy: 'name'
    });

    if (!hotPotatoResponse.result.files || hotPotatoResponse.result.files.length === 0) {
      console.log(`❌ ${rootFolderName} 폴더를 찾을 수 없습니다`);
      return null;
    }

    const hotPotatoFolder = hotPotatoResponse.result.files[0];
    console.log(`✅ ${rootFolderName} 폴더 찾음:`, hotPotatoFolder.id);

    // 2단계: 루트 폴더에서 개인 설정 파일 찾기
    const configFileResponse = await window.gapi.client.drive.files.list({
      q: `'${hotPotatoFolder.id}' in parents and name='${configFileName}' and mimeType='application/vnd.google-apps.spreadsheet' and trashed=false`,
      fields: 'files(id,name)',
      spaces: 'drive',
      orderBy: 'name'
    });

    if (!configFileResponse.result.files || configFileResponse.result.files.length === 0) {
      console.log(`❌ ${ENV_CONFIG.PERSONAL_CONFIG_FILE_NAME} 파일을 찾을 수 없습니다`);
      return null;
    }

    const configFile = configFileResponse.result.files[0];
    console.log(`✅ ${ENV_CONFIG.PERSONAL_CONFIG_FILE_NAME} 파일 찾음:`, configFile.id);
    
    personalConfigSpreadsheetId = configFile.id;
    return configFile.id;
  } catch (error) {
    console.error('❌ 개인 설정 파일 찾기 오류:', error);
    return null;
  }
};

/**
 * @brief 개인 템플릿 폴더 ID 찾기
 * @details hot potato/문서/개인 양식 폴더의 ID를 반환합니다.
 * @returns {Promise<string | null>} 개인 템플릿 폴더 ID 또는 null
 */
export const findPersonalTemplateFolder = async (): Promise<string | null> => {
  try {
    console.log('🔍 개인 템플릿 폴더 찾기 시작');
    
    const rootFolderName = ENV_CONFIG.ROOT_FOLDER_NAME;
    const documentFolderName = ENV_CONFIG.DOCUMENT_FOLDER_NAME;
    const personalTemplateFolderName = ENV_CONFIG.PERSONAL_TEMPLATE_FOLDER_NAME;

    // 1단계: 루트에서 루트 폴더 찾기
    const hotPotatoResponse = await window.gapi.client.drive.files.list({
      q: `'root' in parents and name='${rootFolderName}' and mimeType='application/vnd.google-apps.folder' and trashed=false`,
      fields: 'files(id,name)',
      spaces: 'drive',
      orderBy: 'name'
    });

    if (!hotPotatoResponse.result.files || hotPotatoResponse.result.files.length === 0) {
      console.log(`❌ ${rootFolderName} 폴더를 찾을 수 없습니다`);
      return null;
    }

    const hotPotatoFolder = hotPotatoResponse.result.files[0];
    console.log(`✅ ${rootFolderName} 폴더 찾음:`, hotPotatoFolder.id);

    // 2단계: 루트 폴더에서 문서 폴더 찾기
    const documentResponse = await window.gapi.client.drive.files.list({
      q: `'${hotPotatoFolder.id}' in parents and name='${documentFolderName}' and mimeType='application/vnd.google-apps.folder' and trashed=false`,
      fields: 'files(id,name)',
      spaces: 'drive',
      orderBy: 'name'
    });

    if (!documentResponse.result.files || documentResponse.result.files.length === 0) {
      console.log(`❌ ${documentFolderName} 폴더를 찾을 수 없습니다`);
      return null;
    }

    const documentFolder = documentResponse.result.files[0];
    console.log(`✅ ${documentFolderName} 폴더 찾음:`, documentFolder.id);

    // 3단계: 문서 폴더에서 개인 양식 폴더 찾기
    const personalTemplateResponse = await window.gapi.client.drive.files.list({
      q: `'${documentFolder.id}' in parents and name='${personalTemplateFolderName}' and mimeType='application/vnd.google-apps.folder' and trashed=false`,
      fields: 'files(id,name)',
      spaces: 'drive',
      orderBy: 'name'
    });

    if (!personalTemplateResponse.result.files || personalTemplateResponse.result.files.length === 0) {
      console.log(`❌ ${personalTemplateFolderName} 폴더를 찾을 수 없습니다`);
      return null;
    }

    const personalTemplateFolder = personalTemplateResponse.result.files[0];
    console.log(`✅ ${personalTemplateFolderName} 폴더 찾음:`, personalTemplateFolder.id);

    return personalTemplateFolder.id;
  } catch (error) {
    console.error('❌ 개인 템플릿 폴더 찾기 오류:', error);
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
    const hotPotatoResponse = await window.gapi.client.drive.files.list({
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
    const sheetsClient = window.gapi.client.sheets;
    const spreadsheet = await sheetsClient.spreadsheets.create({
      resource: {
        properties: {
          title: ENV_CONFIG.PERSONAL_CONFIG_FILE_NAME
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
    const driveClient = window.gapi.client.drive;
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
    
    const sheetsClient = window.gapi.client.sheets;
    
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
        const sheetsClient = window.gapi.client.sheets;
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

