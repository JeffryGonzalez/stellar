import { Injectable } from '@angular/core';
import { StoreEntry } from './models';

export interface SnapshotFile {
  savedAt: string;
  stores: StoreEntry[];
}

@Injectable({ providedIn: 'root' })
export class SnapshotWriterService {
  private dirHandle: FileSystemDirectoryHandle | null = null;

  get isSupported(): boolean {
    return 'showDirectoryPicker' in window;
  }

  async save(stores: StoreEntry[]): Promise<void> {
    if (!this.isSupported) {
      throw new Error('File System Access API not supported in this browser.');
    }

    if (!this.dirHandle || !(await this.hasPermission(this.dirHandle))) {
      this.dirHandle = await (window as any).showDirectoryPicker({
        id: 'stellar-project-root',
        mode: 'readwrite',
        startIn: 'documents',
      });
    }

    const stellarDir = await this.dirHandle!.getDirectoryHandle('.stellar', { create: true });
    const fileHandle = await stellarDir.getFileHandle('snapshot.json', { create: true });
    const writable = await fileHandle.createWritable();

    const payload: SnapshotFile = {
      savedAt: new Date().toISOString(),
      stores,
    };

    await writable.write(JSON.stringify(payload, null, 2));
    await writable.close();
  }

  private async hasPermission(handle: FileSystemDirectoryHandle): Promise<boolean> {
    const h = handle as any;
    if (typeof h.queryPermission !== 'function') return true; // assume granted if API unavailable
    const status = await h.queryPermission({ mode: 'readwrite' });
    if (status === 'granted') return true;
    if (status === 'prompt') return (await h.requestPermission({ mode: 'readwrite' })) === 'granted';
    return false;
  }
}
