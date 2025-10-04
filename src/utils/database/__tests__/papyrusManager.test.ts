import { 
  fetchPosts, 
  addPost, 
  fetchAnnouncements,
  fetchTemplates, 
  addTemplate, 
  fetchCalendarEvents, 
  fetchStudents, 
  fetchStaff, 
  findSpreadsheetById
} from '../papyrusManager';

// Mock papyrus-db functions
const mockGetSheetData = jest.fn();
const mockAppend = jest.fn();
const mockUpdate = jest.fn();

// Mock the papyrus-db module
jest.mock('papyrus-db', () => ({
  getSheetData: mockGetSheetData,
  append: mockAppend,
  update: mockUpdate,
}));

// Mock Google API
const mockGapi = {
  client: {
    drive: {
      files: {
        list: jest.fn(),
      },
    },
    docs: {
      documents: {
        create: jest.fn(),
      },
    },
    sheets: {
      spreadsheets: {
        batchUpdate: jest.fn(),
        values: {
          update: jest.fn(),
        },
      },
    },
  },
};

// Mock window.gapi
Object.defineProperty(window, 'gapi', {
  value: mockGapi,
  writable: true,
});

describe('PapyrusDB Manager', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetSheetData.mockClear();
    mockAppend.mockClear();
    mockUpdate.mockClear();
  });

  // --- Spreadsheet ID related tests ---
  describe('findSpreadsheetById', () => {
    it('should find spreadsheet by name', async () => {
      mockGapi.client.drive.files.list.mockResolvedValueOnce({
        result: {
          files: [{ id: 'test-id', name: 'test_board' }]
        }
      });

      const result = await findSpreadsheetById('test_board');
      expect(result).toBe('test-id');
      expect(mockGapi.client.drive.files.list).toHaveBeenCalledWith({
        q: "name='test_board' and mimeType='application/vnd.google-apps.spreadsheet'",
        fields: 'files(id, name)'
      });
    });

    it('should return null if spreadsheet not found', async () => {
      mockGapi.client.drive.files.list.mockResolvedValueOnce({
        result: { files: [] }
      });

      const result = await findSpreadsheetById('nonexistent');
      expect(result).toBeNull();
    });
  });

  // --- Post related tests ---
  describe('Posts', () => {
    it('should fetch posts successfully', async () => {
      mockGetSheetData.mockResolvedValueOnce({
        values: [
          ['ID', 'Author', 'Title', 'Content'],
          ['fb-1', 'test', 'title1', 'content1']
        ]
      });

      const posts = await fetchPosts();
      expect(posts).toEqual([
        { id: 'fb-1', author: 'test', title: 'title1', contentPreview: 'content1', date: expect.any(String), views: 0, likes: 0 }
      ]);
    });

    it('should add a post successfully', async () => {
      mockGetSheetData.mockResolvedValueOnce({
        values: [
          ['ID', 'Author', 'Title', 'Content'],
          ['fb-1', 'test', 'title1', 'content1']
        ]
      });
      mockAppend.mockResolvedValueOnce({});

      const postData = { author: 'new author', title: 'new title', contentPreview: 'new content' };
      await addPost(postData);
      
      expect(mockAppend).toHaveBeenCalledWith(undefined, '시트1', [
        ['fb-2', 'new author', 'new title', 'new content', '']
      ]);
    });
  });

  // --- Announcement related tests ---
  describe('Announcements', () => {
    it('should fetch announcements successfully', async () => {
      mockGetSheetData.mockResolvedValueOnce({
        values: [
          ['ID', 'Author', 'Title', 'Content'],
          ['an-1', 'admin', 'announcement1', 'announcement content']
        ]
      });

      const announcements = await fetchAnnouncements();
      expect(announcements).toEqual([
        { id: 'an-1', author: 'admin', title: 'announcement1', contentPreview: 'announcement content', date: expect.any(String), views: 0, likes: 0 }
      ]);
    });
  });

  // --- Template related tests ---
  describe('Templates', () => {
    it('should fetch templates successfully', async () => {
      mockGetSheetData.mockResolvedValueOnce({
        values: [
          ['Title', 'Description', 'Tag', 'Empty', 'DocumentId', 'Favorites'],
          ['template1', 'desc1', 'tag1', '', 'doc1', 'Y']
        ]
      });

      const templates = await fetchTemplates();
      expect(templates).toEqual([
        { rowIndex: 2, title: 'template1', description: 'desc1', partTitle: 'desc1', tag: 'tag1', type: 'template1', documentId: 'doc1', favoritesTag: 'Y' }
      ]);
    });

    it('should add a template successfully', async () => {
      mockGapi.client.docs.documents.create.mockResolvedValueOnce({
        result: { documentId: 'new-doc-id' }
      });
      mockAppend.mockResolvedValueOnce({});

      const templateData = { title: 'new template', description: 'new desc', tag: 'new tag' };
      await addTemplate(templateData);
      
      expect(mockGapi.client.docs.documents.create).toHaveBeenCalledWith({
        title: 'new template'
      });
      expect(mockAppend).toHaveBeenCalledWith(undefined, 'document_template', [
        ['', 'new template', 'new desc', 'new tag', '', 'new-doc-id']
      ]);
    });
  });

  // --- Calendar related tests ---
  describe('Calendar Events', () => {
    it('should fetch calendar events successfully', async () => {
      mockGetSheetData.mockResolvedValueOnce({
        values: [
          ['ID', 'Title', 'StartDate', 'EndDate', 'Description', 'ColorId', 'StartDateTime', 'EndDateTime', 'Type', 'RRule', 'Attendees'],
          ['cal-1', 'event1', '2024-01-01', '2024-01-01', 'desc', '1', '2024-01-01T09:00:00', '2024-01-01T17:00:00', 'type1', '', '']
        ]
      });

      const events = await fetchCalendarEvents();
      expect(events).toEqual([
        { id: 'undefined-cal-1', title: 'event1', startDate: '2024-01-01', endDate: '2024-01-01', description: 'desc', colorId: '1', startDateTime: '2024-01-01T09:00:00', endDateTime: '2024-01-01T17:00:00', type: 'type1', rrule: '', attendees: '' }
      ]);
    });
  });

  // --- Student related tests ---
  describe('Students', () => {
    it('should fetch students successfully', async () => {
      mockGetSheetData.mockResolvedValueOnce({
        values: [
          ['No', 'Name', 'Address', 'Phone', 'Grade', 'State', 'Council'],
          ['1', 'student1', 'address1', 'phone1', 'A', 'active', 'council1']
        ]
      });

      const students = await fetchStudents();
      expect(students).toEqual([
        { no: '1', name: 'student1', address: 'address1', phone_num: 'phone1', grade: 'A', state: 'active', council: 'council1' }
      ]);
    });
  });

  // --- Staff related tests ---
  describe('Staff', () => {
    it('should fetch staff successfully', async () => {
      mockGetSheetData.mockResolvedValueOnce({
        values: [
          ['No', 'Position', 'Name', 'Tel', 'Phone', 'Email', 'Date', 'Note'],
          ['1', 'prof', 'staff1', 'tel1', 'phone1', 'email1', '2024-01-01', 'note1']
        ]
      });

      const staff = await fetchStaff();
      expect(staff).toEqual([
        { no: '1', pos: 'prof', name: 'staff1', tel: 'tel1', phone: 'phone1', email: 'email1', date: '2024-01-01', note: 'note1' }
      ]);
    });
  });
});