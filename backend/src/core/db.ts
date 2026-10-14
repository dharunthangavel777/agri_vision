import fs from 'fs';
import path from 'path';

export const getRuntimeDataFile = (fileName: string, defaultValue: unknown): string => {
  if (!process.env.VERCEL) {
    const dataDir = path.join(process.cwd(), 'data');
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }

    const runtimeFile = path.join(dataDir, fileName);
    const legacyFile = path.join(process.cwd(), fileName);

    // If file doesn't exist in dataDir but exists in legacy root, copy it over
    if (!fs.existsSync(runtimeFile) && fs.existsSync(legacyFile)) {
      try {
        fs.copyFileSync(legacyFile, runtimeFile);
      } catch {
        // Fallback to default
      }
    }

    return runtimeFile;
  }

  const dataDir = path.join('/tmp', 'smart-agriculture-ai');
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }

  const runtimeFile = path.join(dataDir, fileName);
  const bundledFile = path.join(process.cwd(), fileName);

  if (!fs.existsSync(runtimeFile)) {
    if (fs.existsSync(bundledFile)) {
      fs.copyFileSync(bundledFile, runtimeFile);
    } else {
      fs.writeFileSync(runtimeFile, JSON.stringify(defaultValue, null, 2));
    }
  }

  return runtimeFile;
};

// Initialize file paths
const usersFile = getRuntimeDataFile('users.json', {});
const historyFile = getRuntimeDataFile('history.json', []);
const productsFile = getRuntimeDataFile('products.json', []);
const fertilizerHistoryFile = getRuntimeDataFile('fertilizer_history.json', []);

// Ensure files exist
if (!fs.existsSync(usersFile)) {
  fs.writeFileSync(usersFile, JSON.stringify({}));
}
if (!fs.existsSync(historyFile)) {
  fs.writeFileSync(historyFile, JSON.stringify([]));
}
if (!fs.existsSync(productsFile)) {
  fs.writeFileSync(productsFile, JSON.stringify([]));
}
if (!fs.existsSync(fertilizerHistoryFile)) {
  fs.writeFileSync(fertilizerHistoryFile, JSON.stringify([]));
}

// User Storage Helpers
export const getUsers = (): Record<string, any> => {
  try {
    const data = fs.readFileSync(usersFile, 'utf-8');
    if (!data || data.trim() === '') return {};
    return JSON.parse(data);
  } catch (error) {
    console.error('[ERROR] Failed to parse users.json:', error);
    return {};
  }
};

export const saveUsers = (users: Record<string, any>): void => {
  const content = JSON.stringify(users, null, 2);
  try {
    if (fs.existsSync(usersFile) && fs.readFileSync(usersFile, 'utf-8') === content) {
      return;
    }
  } catch {}
  fs.writeFileSync(usersFile, content);
};

// History Storage Helpers
export const getHistory = (): any[] => {
  try {
    const data = fs.readFileSync(historyFile, 'utf-8');
    if (!data || data.trim() === '') return [];
    return JSON.parse(data);
  } catch (error) {
    console.error('[ERROR] Failed to parse history.json:', error);
    return [];
  }
};

export const saveHistory = (history: any[]): void => {
  const content = JSON.stringify(history, null, 2);
  try {
    if (fs.existsSync(historyFile) && fs.readFileSync(historyFile, 'utf-8') === content) {
      return;
    }
  } catch {}
  fs.writeFileSync(historyFile, content);
};

// Products Storage Helpers
export const getProducts = (): any[] => {
  try {
    const data = fs.readFileSync(productsFile, 'utf-8');
    if (!data || data.trim() === '') return [];
    return JSON.parse(data);
  } catch (error) {
    console.error('[ERROR] Failed to parse products.json:', error);
    return [];
  }
};

export const saveProducts = (products: any[]): void => {
  const content = JSON.stringify(products, null, 2);
  try {
    if (fs.existsSync(productsFile) && fs.readFileSync(productsFile, 'utf-8') === content) {
      return;
    }
  } catch {}
  fs.writeFileSync(productsFile, content);
};

// Fertilizer History Helpers
export const getFertilizerHistory = (): any[] => {
  try {
    const data = fs.readFileSync(fertilizerHistoryFile, 'utf-8');
    if (!data || data.trim() === '') return [];
    return JSON.parse(data);
  } catch (error) {
    console.error('[ERROR] Failed to parse fertilizer_history.json:', error);
    return [];
  }
};

export const saveFertilizerHistory = (history: any[]): void => {
  const content = JSON.stringify(history, null, 2);
  try {
    if (fs.existsSync(fertilizerHistoryFile) && fs.readFileSync(fertilizerHistoryFile, 'utf-8') === content) {
      return;
    }
  } catch {}
  fs.writeFileSync(fertilizerHistoryFile, content);
};
