interface RecentDocument {
  id: string;
  title: string;
  url: string;
  lastAccessed: number; // Store as timestamp for easy sorting
}

const RECENTS_KEY = 'hot_potato_recent_documents';
const MAX_RECENTS = 3; // Let's go with 3 for the card

export const getRecentDocuments = (): RecentDocument[] => {
  try {
    const storedValue = localStorage.getItem(RECENTS_KEY);
    if (!storedValue) return [];
    const parsed = JSON.parse(storedValue) as RecentDocument[];
    // Sort by lastAccessed descending (newest first)
    return parsed.sort((a, b) => b.lastAccessed - a.lastAccessed);
  } catch (error) {
    console.error("Error reading recent documents from localStorage", error);
    return [];
  }
};

export const addRecentDocument = (doc: { id: string; title: string; url: string }): void => {
  try {
    // We read the unsorted list first to avoid re-sorting
    const storedValue = localStorage.getItem(RECENTS_KEY);
    const recents = storedValue ? (JSON.parse(storedValue) as RecentDocument[]) : [];
    
    // Remove the document if it already exists to move it to the top
    const filteredRecents = recents.filter(r => r.id !== doc.id);
    
    // Add the new/updated document to the top of the list
    const newRecent: RecentDocument = { ...doc, lastAccessed: Date.now() };
    const updatedRecents = [newRecent, ...filteredRecents];

    // Ensure the list doesn't exceed the max size
    const trimmedRecents = updatedRecents.slice(0, MAX_RECENTS);

    localStorage.setItem(RECENTS_KEY, JSON.stringify(trimmedRecents));
  } catch (error) {
    console.error("Error saving recent document to localStorage", error);
  }
};
