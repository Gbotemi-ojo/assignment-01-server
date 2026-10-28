import { getSheetsClient, SPREADSHEET_ID, SHEET_NAME } from '../config/google';
import { InspectionRecord, InspectionStats, SheetApiResponse } from '../types/inspection';

interface CacheEntry {
  data: SheetApiResponse;
  timestamp: number;
}

let memoryCache: CacheEntry | null = null;
const CACHE_TTL_MS = 60 * 1000; // 1 minute cache TTL

/**
 * Normalizes vehicle type string
 */
function normalizeVehicleType(col5?: string, col1?: string): string {
  const val = (col5 && col5.trim()) || (col1 && col1.trim()) || 'Unspecified';
  return val;
}

/**
 * Normalizes inspection status
 */
function determineStatus(col27?: string, col26?: string): string {
  const primary = col27 && col27.trim();
  const secondary = col26 && col26.trim();

  if (primary) {
    return primary;
  }
  if (secondary) {
    return secondary;
  }
  return 'Pending';
}

/**
 * Formats raw Google Sheets row array into strongly typed InspectionRecord
 */
function formatRow(row: string[], index: number): InspectionRecord {
  const rowNumber = index + 2; // Row 1 is header
  const timestamp = (row[0] || '').trim();
  const vehicleColB = (row[1] || '').trim();
  const urgency = (row[2] || '').trim();
  const inspectionType = (row[3] || 'Pre-Onboarding Inspection').trim();
  const vehiclesCountRaw = (row[4] || '1').trim();
  const vehicleColF = (row[5] || '').trim();
  const vehicleType = normalizeVehicleType(vehicleColF, vehicleColB);
  const businessServicing = (row[6] || '').trim();
  const comments = (row[7] || '').trim();
  const partnerName = (row[8] || 'Unnamed Partner').trim();
  const location = (row[9] || 'Unspecified').trim();
  const partnerEmail = (row[10] || row[13] || '').trim();
  const partnerPhone = (row[11] || row[23] || '').trim();
  const vehicleLicense = (row[12] || '').trim();
  const emailAddress = (row[13] || '').trim();
  const partnershipStatus = (row[14] || 'Other').trim();
  const preferredDate = (row[15] || '').trim();
  const plateNumber = (row[16] || '').trim();
  const roadWorthiness = (row[17] || '').trim();
  const hackneyPermit = (row[18] || '').trim();
  const insurance = (row[19] || '').trim();
  const speedLimit = (row[20] || '').trim();
  const sharedBy = (row[21] || 'Direct / Partner').trim();
  const teamMemberName = (row[22] || '').trim();
  const teamRequest = (row[25] || '').trim();
  const status = determineStatus(row[27], row[26]);
  const scheduledDate = (row[28] || '').trim();
  const scoreOrCenter = (row[29] || '').trim();

  const documents = {
    vehicleLicense: vehicleLicense || undefined,
    roadWorthiness: roadWorthiness || undefined,
    hackneyPermit: hackneyPermit || undefined,
    insurance: insurance || undefined,
    speedLimit: speedLimit || undefined,
  };

  const docKeys = Object.values(documents).filter(Boolean);
  const documentsCount = docKeys.length;
  const hasAllDocuments = documentsCount >= 4; // Most require at least 4 certificates

  // Parse count as integer if possible
  const parsedCount = parseInt(vehiclesCountRaw, 10);
  const vehiclesCount = isNaN(parsedCount) ? vehiclesCountRaw : parsedCount;

  return {
    id: index + 1,
    rowNumber,
    timestamp,
    inspectionType,
    vehicleType,
    vehiclesCount,
    urgency,
    partnerName,
    partnerEmail: partnerEmail || emailAddress,
    partnerPhone,
    location,
    partnershipStatus,
    preferredDate,
    plateNumber,
    businessServicing,
    comments,
    sharedBy,
    teamMemberName,
    teamRequest,
    status,
    scheduledDate: scheduledDate || undefined,
    scoreOrCenter: scoreOrCenter || undefined,
    documents,
    hasAllDocuments,
    documentsCount,
  };
}

/**
 * Computes aggregate dashboard statistics from formatted records
 */
function computeStats(records: InspectionRecord[]): InspectionStats {
  const byInspectionType: Record<string, number> = {};
  const byVehicleType: Record<string, number> = {};
  const byStatus: Record<string, number> = {};
  const byPartnershipStatus: Record<string, number> = {};
  const byLocation: Record<string, number> = {};
  const bySharedBy: Record<string, number> = {};
  let totalVehicles = 0;
  let withDocumentsCount = 0;
  let pendingCount = 0;
  let sentCount = 0;
  let manualReviewCount = 0;

  for (const r of records) {
    // Inspection type breakdown
    const it = r.inspectionType || 'Other';
    byInspectionType[it] = (byInspectionType[it] || 0) + 1;

    // Vehicle type breakdown
    const vt = r.vehicleType || 'Unspecified';
    byVehicleType[vt] = (byVehicleType[vt] || 0) + 1;

    // Status breakdown
    const st = r.status || 'Pending';
    byStatus[st] = (byStatus[st] || 0) + 1;
    if (st.toLowerCase().includes('manual')) {
      manualReviewCount++;
    } else if (st.toLowerCase() === 'sent') {
      sentCount++;
    } else {
      pendingCount++;
    }

    // Partnership status
    const ps = r.partnershipStatus || 'Other';
    byPartnershipStatus[ps] = (byPartnershipStatus[ps] || 0) + 1;

    // Location
    if (r.location && r.location !== 'Unspecified') {
      // Normalize common locations (e.g. Lekki, Lagos -> Lagos)
      let locKey = r.location.trim();
      if (locKey.toLowerCase().includes('lagos') || locKey.toLowerCase().includes('lekki') || locKey.toLowerCase().includes('ikeja') || locKey.toLowerCase().includes('ketu') || locKey.toLowerCase().includes('ikorodu') || locKey.toLowerCase().includes('festac')) {
        locKey = 'Lagos Region';
      } else if (locKey.toLowerCase().includes('abuja')) {
        locKey = 'Abuja (FCT)';
      }
      byLocation[locKey] = (byLocation[locKey] || 0) + 1;
    }

    // Shared by
    if (r.sharedBy) {
      bySharedBy[r.sharedBy] = (bySharedBy[r.sharedBy] || 0) + 1;
    }

    // Vehicles total
    const num = typeof r.vehiclesCount === 'number' ? r.vehiclesCount : parseInt(String(r.vehiclesCount), 10);
    if (!isNaN(num)) {
      totalVehicles += num;
    } else {
      totalVehicles += 1;
    }

    // Documents
    if (r.documentsCount > 0) {
      withDocumentsCount++;
    }
  }

  return {
    totalRecords: records.length,
    byInspectionType,
    byVehicleType,
    byStatus,
    byPartnershipStatus,
    byLocation,
    bySharedBy,
    totalVehiclesInspected: totalVehicles,
    withDocumentsCount,
    pendingCount,
    sentCount,
    manualReviewCount,
  };
}

/**
 * Service function to retrieve formatted sheet data with caching
 */
export async function getFormattedSheetData(forceRefresh = false): Promise<SheetApiResponse> {
  const now = Date.now();
  if (!forceRefresh && memoryCache && now - memoryCache.timestamp < CACHE_TTL_MS) {
    return memoryCache.data;
  }

  const sheets = await getSheetsClient();

  // Fetch spreadsheet title and details
  const spreadsheetMeta = await sheets.spreadsheets.get({
    spreadsheetId: SPREADSHEET_ID,
    fields: 'properties.title',
  });
  const sheetTitle = spreadsheetMeta.data.properties?.title || 'Vehicle Inspection Records';

  // Read range A1:AE from sheet
  const range = `'${SHEET_NAME}'!A1:AE`;
  const response = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range,
  });

  const rawRows = response.data.values || [];
  if (rawRows.length <= 1) {
    return {
      success: true,
      message: 'Sheet is empty or only has headers',
      sheetInfo: {
        title: sheetTitle,
        sheetName: SHEET_NAME,
        totalRows: 0,
        lastFetchedAt: new Date().toISOString(),
      },
      stats: {
        totalRecords: 0,
        byInspectionType: {},
        byVehicleType: {},
        byStatus: {},
        byPartnershipStatus: {},
        byLocation: {},
        bySharedBy: {},
        totalVehiclesInspected: 0,
        withDocumentsCount: 0,
        pendingCount: 0,
        sentCount: 0,
        manualReviewCount: 0,
      },
      data: [],
    };
  }

  // Row 0 is header, rows 1..N are data records
  const dataRows = rawRows.slice(1);
  const formattedRecords = dataRows.map((row, index) => formatRow(row, index));

  const stats = computeStats(formattedRecords);

  const result: SheetApiResponse = {
    success: true,
    sheetInfo: {
      title: sheetTitle,
      sheetName: SHEET_NAME,
      totalRows: formattedRecords.length,
      lastFetchedAt: new Date().toISOString(),
    },
    stats,
    data: formattedRecords,
  };

  memoryCache = {
    data: result,
    timestamp: now,
  };

  return result;
}
