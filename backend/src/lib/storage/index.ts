/**
 * Storage abstraction layer.
 *
 * ⚠️ PORTABILITY RULE: Guardar SOLO paths relativos en la BD (nunca URLs completas).
 * La URL pública se resuelve en runtime. Así si cambian de Supabase Storage
 * a Google Cloud Storage o S3, las URLs en la BD siguen siendo válidas.
 */

export interface StorageProvider {
  upload(bucket: string, path: string, data: Buffer, contentType?: string): Promise<string>;
  download(bucket: string, path: string): Promise<Buffer>;
  getPublicUrl(bucket: string, path: string): string;
  delete(bucket: string, path: string): Promise<void>;
}

/**
 * Placeholder implementation.
 * TODO: reemplazar por Supabase Storage o Google Cloud Storage.
 */
class NoopStorageProvider implements StorageProvider {
  async upload(_bucket: string, path: string, _data: Buffer): Promise<string> {
    return path;
  }

  async download(_bucket: string, _path: string): Promise<Buffer> {
    throw new Error('Storage provider not configured');
  }

  getPublicUrl(bucket: string, path: string): string {
    return `/storage/${bucket}/${path}`;
  }

  async delete(_bucket: string, _path: string): Promise<void> {
    // no-op
  }
}

export const storage: StorageProvider = new NoopStorageProvider();
