import { getRecentDocuments, addRecentDocument } from '../helpers/localStorageUtils';

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
  length: 0,
  key: jest.fn(),
};

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
  writable: true,
});

describe('localStorage Utils', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorageMock.getItem.mockReturnValue(null);
  });

  describe('getRecentDocuments', () => {
    it('should return empty array when no data exists', () => {
      const result = getRecentDocuments();
      expect(result).toEqual([]);
    });

    it('should return and sort documents by lastAccessed descending', () => {
      const mockData = [
        { id: '1', title: 'Doc 1', url: '/doc1', lastAccessed: 1000 },
        { id: '2', title: 'Doc 2', url: '/doc2', lastAccessed: 2000 },
        { id: '3', title: 'Doc 3', url: '/doc3', lastAccessed: 1500 },
      ];
      
      localStorageMock.getItem.mockReturnValue(JSON.stringify(mockData));
      
      const result = getRecentDocuments();
      expect(result).toEqual([
        { id: '2', title: 'Doc 2', url: '/doc2', lastAccessed: 2000 },
        { id: '3', title: 'Doc 3', url: '/doc3', lastAccessed: 1500 },
        { id: '1', title: 'Doc 1', url: '/doc1', lastAccessed: 1000 },
      ]);
    });

    it('should handle JSON parse errors gracefully', () => {
      localStorageMock.getItem.mockReturnValue('invalid json');
      
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      const result = getRecentDocuments();
      
      expect(result).toEqual([]);
      expect(consoleSpy).toHaveBeenCalledWith(
        'Error reading recent documents from localStorage',
        expect.any(Error)
      );
      
      consoleSpy.mockRestore();
    });
  });

  describe('addRecentDocument', () => {
    beforeEach(() => {
      jest.spyOn(Date, 'now').mockReturnValue(3000);
    });

    afterEach(() => {
      jest.restoreAllMocks();
    });

    it('should add new document to empty list', () => {
      addRecentDocument({ id: '1', title: 'New Doc', url: '/new-doc' });
      
      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'hot_potato_recent_documents',
        JSON.stringify([{ id: '1', title: 'New Doc', url: '/new-doc', lastAccessed: 3000 }])
      );
    });

    it('should move existing document to top and update timestamp', () => {
      const existingData = [
        { id: '1', title: 'Doc 1', url: '/doc1', lastAccessed: 1000 },
        { id: '2', title: 'Doc 2', url: '/doc2', lastAccessed: 2000 },
      ];
      
      localStorageMock.getItem.mockReturnValue(JSON.stringify(existingData));
      
      addRecentDocument({ id: '1', title: 'Updated Doc 1', url: '/doc1' });
      
      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'hot_potato_recent_documents',
        JSON.stringify([
          { id: '1', title: 'Updated Doc 1', url: '/doc1', lastAccessed: 3000 },
          { id: '2', title: 'Doc 2', url: '/doc2', lastAccessed: 2000 },
        ])
      );
    });

    it('should limit to maximum 3 documents', () => {
      const existingData = [
        { id: '1', title: 'Doc 1', url: '/doc1', lastAccessed: 1000 },
        { id: '2', title: 'Doc 2', url: '/doc2', lastAccessed: 2000 },
        { id: '3', title: 'Doc 3', url: '/doc3', lastAccessed: 1500 },
      ];
      
      localStorageMock.getItem.mockReturnValue(JSON.stringify(existingData));
      
      addRecentDocument({ id: '4', title: 'New Doc 4', url: '/doc4' });
      
      const setItemCall = localStorageMock.setItem.mock.calls[0];
      const savedData = JSON.parse(setItemCall[1]);
      expect(savedData).toHaveLength(3);
      expect(savedData[0].id).toBe('4');
    });

    it('should handle localStorage errors gracefully', () => {
      localStorageMock.setItem.mockImplementation(() => {
        throw new Error('localStorage error');
      });
      
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      
      addRecentDocument({ id: '1', title: 'Doc', url: '/doc' });
      
      expect(consoleSpy).toHaveBeenCalledWith(
        'Error saving recent document to localStorage',
        expect.any(Error)
      );
      
      consoleSpy.mockRestore();
    });
  });
});
