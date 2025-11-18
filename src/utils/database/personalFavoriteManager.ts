/**
 * @file personalFavoriteManager.ts
 * @brief 개인 즐겨찾기 관리 유틸리티
 * @details 개인 설정 파일의 favorite 시트를 관리하는 유틸리티 모듈입니다.
 * @author Hot Potato Team
 * @date 2024
 */

import { getSheetData, append, update } from 'papyrus-db';
import { deleteRow } from 'papyrus-db/dist/sheets/delete';
import { getCacheManager } from '../cache/cacheManager';
import { generateCacheKey } from '../cache/cacheUtils';
import { tokenManager } from '../auth/tokenManager';
import { 
  getPersonalConfigSpreadsheetId,
  initializePersonalConfigFile,
  setPersonalConfigSpreadsheetId
} from './personalConfigManager';

/**
 * @brief 시트 ID 가져오기
 * @param {string} spreadsheetId - 스프레드시트 ID
 * @param {string} sheetName - 시트 이름
 * @returns {Promise<number | null>} 시트 ID 또는 null
 */
const getSheetId = async (spreadsheetId: string, sheetName: string): Promise<number | null> => {
  try {
    const response = await gapi.client.sheets.spreadsheets.get({
      spreadsheetId: spreadsheetId,
      fields: 'sheets.properties'
    });
    
    const sheet = response.result.sheets?.find(s => s.properties?.title === sheetName);
    return sheet?.properties?.sheetId || null;
  } catch (error) {
    console.error('❌ 시트 ID 가져오기 오류:', error);
    return null;
  }
};

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

/**
 * @brief 즐겨찾기 데이터 타입 정의
 */
export interface FavoriteData {
  type: '기본' | '개인';
  favorite: string;
}

/**
 * @brief 즐겨찾기 목록 가져오기
 * @returns {Promise<FavoriteData[]>} 즐겨찾기 목록
 */
export const fetchFavorites = async (): Promise<FavoriteData[]> => {
  const cacheManager = getCacheManager();
  const action = 'fetchPersonalFavorites';
  const category = 'personalFavorites';
  const cacheKey = generateCacheKey(category, action, {});
  
  // 캐시에서 먼저 확인
  const cachedData = await cacheManager.get<FavoriteData[]>(cacheKey);
  if (cachedData) {
    console.log('⭐ 캐시에서 즐겨찾기 로드:', cachedData.length, '개');
    return cachedData;
  }

  try {
    setupPapyrusAuth();
    
    let spreadsheetId = getPersonalConfigSpreadsheetId();
    if (!spreadsheetId) {
      console.warn('개인 설정 파일 ID를 찾을 수 없습니다. 초기화를 시도합니다.');
      const newId = await initializePersonalConfigFile();
      if (!newId) {
        console.error('개인 설정 파일 초기화 실패');
        return [];
      }
      // 초기화된 ID를 사용
      spreadsheetId = newId;
      setPersonalConfigSpreadsheetId(newId);
    }

    console.log('⭐ 즐겨찾기 로드 시작 (캐시 미스)...');
    const data = await getSheetData(spreadsheetId, 'favorite');
    
    if (!data || !data.values || data.values.length <= 1) {
      console.log('즐겨찾기 데이터가 없습니다.');
      return [];
    }

    const favorites = data.values.slice(1).map((row: string[]) => ({
      type: row[0] as '기본' | '개인',
      favorite: row[1] || ''
    }));

    console.log(`⭐ 즐겨찾기 로드 완료: ${favorites.length}개`);
    
    // 캐시에 저장 (개인 데이터는 30분)
    const ttl = 30 * 60 * 1000;
    await cacheManager.set(cacheKey, favorites, ttl);
    console.log('⭐ 즐겨찾기 캐시 저장 완료 (TTL: 30분)');
    
    return favorites;
  } catch (error) {
    console.error('❌ 즐겨찾기 가져오기 오류:', error);
    return [];
  }
};

/**
 * @brief 즐겨찾기 추가
 * @param {FavoriteData} favoriteData - 즐겨찾기 데이터
 * @returns {Promise<boolean>} 성공 여부
 */
export const addFavorite = async (favoriteData: FavoriteData): Promise<boolean> => {
  const cacheManager = getCacheManager();
  const category = 'personalFavorites';
  
  try {
    setupPapyrusAuth();
    
    let spreadsheetId = getPersonalConfigSpreadsheetId();
    if (!spreadsheetId) {
      console.warn('개인 설정 파일 ID를 찾을 수 없습니다. 초기화를 시도합니다.');
      const newId = await initializePersonalConfigFile();
      if (!newId) {
        console.error('개인 설정 파일 초기화 실패');
        return false;
      }
      // 초기화된 ID를 사용
      spreadsheetId = newId;
      setPersonalConfigSpreadsheetId(newId);
    }

    // 중복 확인
    const existingFavorites = await fetchFavorites();
    const isDuplicate = existingFavorites.some(
      fav => fav.type === favoriteData.type && fav.favorite === favoriteData.favorite
    );

    if (isDuplicate) {
      console.log('이미 즐겨찾기에 추가된 항목입니다.');
      return true;
    }

    await append(spreadsheetId, 'favorite', [[favoriteData.type, favoriteData.favorite]]);
    console.log('✅ 즐겨찾기 추가 완료:', favoriteData);
    
    // 캐시 무효화
    await cacheManager.invalidate(`${category}:*`);
    console.log('✅ 즐겨찾기 캐시 무효화 완료');
    
    return true;
  } catch (error) {
    console.error('❌ 즐겨찾기 추가 오류:', error);
    return false;
  }
};

/**
 * @brief 즐겨찾기 삭제
 * @param {FavoriteData} favoriteData - 삭제할 즐겨찾기 데이터
 * @returns {Promise<boolean>} 성공 여부
 */
export const removeFavorite = async (favoriteData: FavoriteData): Promise<boolean> => {
  const cacheManager = getCacheManager();
  const category = 'personalFavorites';
  
  try {
    setupPapyrusAuth();
    
    const spreadsheetId = getPersonalConfigSpreadsheetId();
    if (!spreadsheetId) {
      console.error('개인 설정 파일 ID를 찾을 수 없습니다.');
      return false;
    }

    const data = await getSheetData(spreadsheetId, 'favorite');
    
    if (!data || !data.values || data.values.length <= 1) {
      console.log('삭제할 즐겨찾기가 없습니다.');
      return true;
    }

    // 해당 즐겨찾기 찾기
    // findIndex는 헤더를 포함한 전체 배열에서 찾으므로, rowIndex는 헤더 포함 인덱스
    const rowIndex = data.values.findIndex(
      (row: string[], index: number) => 
        index > 0 && row[0] === favoriteData.type && row[1] === favoriteData.favorite
    );

    if (rowIndex === -1) {
      console.log('삭제할 즐겨찾기를 찾을 수 없습니다.');
      return true;
    }

    // 실제 시트 ID 가져오기
    const sheetId = await getSheetId(spreadsheetId, 'favorite');
    if (!sheetId) {
      console.error('favorite 시트 ID를 찾을 수 없습니다.');
      return false;
    }

    // deleteRow는 0-based 인덱스를 사용합니다
    // data.values[0] = 헤더 (시트 1행, API 인덱스 0)
    // data.values[rowIndex] = 찾은 행 (시트 rowIndex + 1행, API 인덱스 rowIndex)
    // findIndex는 헤더를 포함한 전체 배열에서 찾으므로, rowIndex는 이미 헤더 포함 인덱스입니다
    // 따라서 rowIndex를 그대로 사용하면 됩니다 (personalTagManager.ts와 동일한 패턴)
    await deleteRow(spreadsheetId, sheetId, rowIndex);
    console.log('✅ 즐겨찾기 삭제 완료:', favoriteData);
    
    // 캐시 무효화
    await cacheManager.invalidate(`${category}:*`);
    console.log('✅ 즐겨찾기 캐시 무효화 완료');
    
    return true;
  } catch (error) {
    console.error('❌ 즐겨찾기 삭제 오류:', error);
    return false;
  }
};

/**
 * @brief 즐겨찾기 토글
 * @param {FavoriteData} favoriteData - 즐겨찾기 데이터
 * @returns {Promise<boolean>} 즐겨찾기 상태 (true: 추가됨, false: 삭제됨)
 */
export const toggleFavorite = async (favoriteData: FavoriteData): Promise<boolean> => {
  try {
    const existingFavorites = await fetchFavorites();
    const isFavorite = existingFavorites.some(
      fav => fav.type === favoriteData.type && fav.favorite === favoriteData.favorite
    );

    if (isFavorite) {
      // 즐겨찾기 해제
      const success = await removeFavorite(favoriteData);
      return !success; // 삭제 성공 시 false 반환
    } else {
      // 즐겨찾기 추가
      const success = await addFavorite(favoriteData);
      return success; // 추가 성공 시 true 반환
    }
  } catch (error) {
    console.error('❌ 즐겨찾기 토글 오류:', error);
    return false;
  }
};

/**
 * @brief 특정 타입의 즐겨찾기 목록 가져오기
 * @param {'기본' | '개인'} type - 타입
 * @returns {Promise<string[]>} 즐겨찾기 목록
 */
export const getFavoritesByType = async (type: '기본' | '개인'): Promise<string[]> => {
  try {
    const favorites = await fetchFavorites();
    return favorites
      .filter(fav => fav.type === type)
      .map(fav => fav.favorite);
  } catch (error) {
    console.error('❌ 타입별 즐겨찾기 가져오기 오류:', error);
    return [];
  }
};

/**
 * @brief 즐겨찾기 여부 확인
 * @param {FavoriteData} favoriteData - 확인할 즐겨찾기 데이터
 * @returns {Promise<boolean>} 즐겨찾기 여부
 */
export const isFavorite = async (favoriteData: FavoriteData): Promise<boolean> => {
  try {
    const favorites = await fetchFavorites();
    return favorites.some(
      fav => fav.type === favoriteData.type && fav.favorite === favoriteData.favorite
    );
  } catch (error) {
    console.error('❌ 즐겨찾기 여부 확인 오류:', error);
    return false;
  }
};
