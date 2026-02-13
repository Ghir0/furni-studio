
export class FileSystemService {
  static async selectDirectory(): Promise<FileSystemDirectoryHandle | null> {
    try {
      // Check if the API exists
      if (!('showDirectoryPicker' in window)) {
        throw new Error("Your browser does not support the File System Access API.");
      }

      // @ts-ignore
      const handle = await window.showDirectoryPicker({
        mode: 'readwrite'
      });
      return handle;
    } catch (e: any) {
      if (e.name === 'SecurityError') {
        alert("Local Workspace Error: This environment blocks direct folder access for security reasons (Cross-Origin Frame restriction). You can still use the app and download renders individually.");
      } else if (e.name === 'AbortError') {
        // User cancelled, no need for alert
        console.log("Directory selection cancelled");
      } else {
        console.error("Directory selection failed:", e);
        alert(`Workspace Error: ${e.message || "Failed to access folder"}`);
      }
      return null;
    }
  }

  static async saveFile(
    directoryHandle: FileSystemDirectoryHandle, 
    subFolder: string, 
    fileName: string, 
    blob: Blob
  ): Promise<boolean> {
    try {
      const subDir = await directoryHandle.getDirectoryHandle(subFolder, { create: true });
      const fileHandle = await subDir.getFileHandle(fileName, { create: true });
      const writable = await fileHandle.createWritable();
      await writable.write(blob);
      await writable.close();
      return true;
    } catch (e) {
      console.error("Failed to save file", e);
      return false;
    }
  }

  static async getFileUrl(fileHandle: FileSystemFileHandle): Promise<string> {
    const file = await fileHandle.getFile();
    return URL.createObjectURL(file);
  }
}
