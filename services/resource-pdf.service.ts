import { Directory, File, Paths } from "expo-file-system";
import * as SecureStore from "expo-secure-store";

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
 * When EXPO_PUBLIC_API_URL is:
 * http://10.0.2.2:3000/api
 *
 * The generated URL becomes:
 * http://10.0.2.2:3000/api/resource/56/download
 */
export function getResourceDownloadUrl(resourceId: string | number): string {
  const normalizedId = validateResourceId(resourceId);

  return `${getApiBaseUrl()}/resource/${normalizedId}/download`;
}

export async function downloadResourcePdf(
  resourceId: string | number,
): Promise<string> {
  const normalizedId = validateResourceId(resourceId);

  ensureResourcePdfDirectory();

  const destinationFile = createTemporaryPdfFile(normalizedId);
  const accessToken = await SecureStore.getItemAsync("accessToken");

  if (!accessToken) {
    throw new Error("Your session has expired. Please log in again.");
  }

  const downloadUrl = getResourceDownloadUrl(normalizedId);

  console.log("[Resource PDF] Download URL:", downloadUrl);
  console.log("[Resource PDF] Access token available:", Boolean(accessToken));

  try {
    const downloadedFile = await File.downloadFileAsync(
      downloadUrl,
      destinationFile,
      {
        idempotent: true,
        headers: {
          Accept: "application/pdf",
          Authorization: `Bearer ${accessToken}`,
        },
      },
    );

    console.log("[Resource PDF] Download completed:", {
      uri: downloadedFile.uri,
      exists: downloadedFile.exists,
      size: downloadedFile.size,
    });

    if (!downloadedFile.exists || downloadedFile.size <= 0) {
      throw new Error("The downloaded PDF is empty.");
    }

    return downloadedFile.uri;
  } catch (error) {
    console.error("[Resource PDF] Download failed:", error);

    try {
      if (destinationFile.exists) {
        destinationFile.delete();
      }
    } catch (cleanupError) {
      console.warn(
        "[Resource PDF] Could not remove partial PDF:",
        cleanupError,
      );
    }

    if (error instanceof Error) {
      throw new Error(`Unable to download PDF: ${error.message}`);
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
