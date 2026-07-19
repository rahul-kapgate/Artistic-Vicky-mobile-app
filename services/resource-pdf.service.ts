import { Directory, File, Paths } from "expo-file-system";

import { api } from "@/lib/api";

const RESOURCE_PDF_DIRECTORY = new Directory(Paths.cache, "resource-pdfs");

function validateResourceId(resourceId: string | number): string {
  const normalizedId = String(resourceId).trim();

  if (!normalizedId || !/^\d+$/.test(normalizedId)) {
    throw new Error("A valid resource ID is required.");
  }

  return normalizedId;
}

function getApiBaseUrl(): string {
  const configuredBaseUrl =
    api.defaults.baseURL ?? process.env.EXPO_PUBLIC_API_URL;

  const normalizedBaseUrl = configuredBaseUrl?.replace(/\/+$/, "");

  if (!normalizedBaseUrl) {
    throw new Error("EXPO_PUBLIC_API_URL is not configured.");
  }

  return normalizedBaseUrl;
}

function ensureResourcePdfDirectory(): void {
  RESOURCE_PDF_DIRECTORY.create({
    idempotent: true,
    intermediates: true,
  });
}

function createTemporaryPdfFile(resourceId: string): File {
  const uniqueName = [
    "resource",
    resourceId,
    Date.now(),
    Math.random().toString(36).slice(2, 9),
  ].join("-");

  return new File(RESOURCE_PDF_DIRECTORY, `${uniqueName}.pdf`);
}

/**
 * Assumes the backend route is:
 *
 * GET /api/resource/:id/download
 *
 * Change only this function if your actual route is different.
 */
export function getResourceDownloadUrl(resourceId: string | number): string {
  const normalizedId = validateResourceId(resourceId);

  return `${getApiBaseUrl()}/resource/${normalizedId}/download`;
}

export async function downloadResourcePdf(
  resourceId: string | number,
  headers: Record<string, string> = {},
): Promise<string> {
  const normalizedId = validateResourceId(resourceId);

  ensureResourcePdfDirectory();

  const destinationFile = createTemporaryPdfFile(normalizedId);

  try {
    const downloadedFile = await File.downloadFileAsync(
      getResourceDownloadUrl(normalizedId),
      destinationFile,
      {
        idempotent: true,
        headers: {
          Accept: "application/pdf",
          ...headers,
        },
      },
    );

    if (!downloadedFile.exists || downloadedFile.size <= 0) {
      throw new Error("The downloaded PDF is empty.");
    }

    return downloadedFile.uri;
  } catch (error) {
    /*
     * Android may leave a partially downloaded file when a
     * network download fails, so remove it here.
     */
    try {
      if (destinationFile.exists) {
        destinationFile.delete();
      }
    } catch (cleanupError) {
      console.warn("Could not remove partial PDF:", cleanupError);
    }

    if (error instanceof Error) {
      throw error;
    }

    throw new Error("Unable to download this resource.");
  }
}

export async function deleteTemporaryResourcePdf(
  fileUri?: string | null,
): Promise<void> {
  if (!fileUri) {
    return;
  }

  try {
    const file = new File(fileUri);

    if (file.exists) {
      file.delete();
    }
  } catch (error) {
    console.warn("Could not delete temporary resource PDF:", error);
  }
}

/**
 * Removes files left behind after an app crash or force-stop.
 */
export async function clearTemporaryResourcePdfs(): Promise<void> {
  try {
    if (RESOURCE_PDF_DIRECTORY.exists) {
      RESOURCE_PDF_DIRECTORY.delete();
    }

    RESOURCE_PDF_DIRECTORY.create({
      idempotent: true,
      intermediates: true,
    });
  } catch (error) {
    console.warn("Could not clear temporary resource PDFs:", error);
  }
}
