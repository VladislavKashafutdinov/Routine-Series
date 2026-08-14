import type { ApiImportStats } from './types';
import { apiFetch } from './fetch';

/** Uploads an export JSON file to POST /api/v1/import (multipart form, field "file"). */
export async function importData(file: File): Promise<ApiImportStats> {
  const formData = new FormData();
  formData.append('file', file);
  return apiFetch<ApiImportStats>('/api/v1/import', {
    method: 'POST',
    body: formData,
  });
}
