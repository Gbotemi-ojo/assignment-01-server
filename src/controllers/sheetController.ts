import { Request, Response } from 'express';
import { getFormattedSheetData } from '../services/googleSheetsService';
import { InspectionRecord } from '../types/inspection';

export async function getInspections(req: Request, res: Response) {
  try {
    const forceRefresh = req.query.forceRefresh === 'true';
    const sheetData = await getFormattedSheetData(forceRefresh);

    let filtered = [...sheetData.data];

    // Search query filter
    const search = typeof req.query.search === 'string' ? req.query.search.toLowerCase().trim() : '';
    if (search) {
      filtered = filtered.filter((r) => {
        return (
          r.partnerName.toLowerCase().includes(search) ||
          r.partnerEmail.toLowerCase().includes(search) ||
          r.partnerPhone.toLowerCase().includes(search) ||
          r.plateNumber.toLowerCase().includes(search) ||
          r.location.toLowerCase().includes(search) ||
          r.comments.toLowerCase().includes(search) ||
          r.vehicleType.toLowerCase().includes(search) ||
          r.sharedBy.toLowerCase().includes(search)
        );
      });
    }

    // Inspection type filter
    const inspectionType = typeof req.query.inspectionType === 'string' ? req.query.inspectionType : '';
    if (inspectionType) {
      filtered = filtered.filter((r) => r.inspectionType === inspectionType);
    }

    // Vehicle type filter
    const vehicleType = typeof req.query.vehicleType === 'string' ? req.query.vehicleType : '';
    if (vehicleType) {
      filtered = filtered.filter((r) => r.vehicleType.toLowerCase().includes(vehicleType.toLowerCase()));
    }

    // Status filter
    const status = typeof req.query.status === 'string' ? req.query.status : '';
    if (status) {
      filtered = filtered.filter((r) => r.status.toLowerCase() === status.toLowerCase());
    }

    // Partnership status filter
    const partnershipStatus = typeof req.query.partnershipStatus === 'string' ? req.query.partnershipStatus : '';
    if (partnershipStatus) {
      filtered = filtered.filter((r) => r.partnershipStatus === partnershipStatus);
    }

    // Optional server-side pagination (if page and limit are provided)
    const page = parseInt(req.query.page as string, 10);
    const limit = parseInt(req.query.limit as string, 10);

    if (!isNaN(page) && !isNaN(limit) && page > 0 && limit > 0) {
      const startIndex = (page - 1) * limit;
      const paginatedRecords = filtered.slice(startIndex, startIndex + limit);
      return res.json({
        success: true,
        sheetInfo: sheetData.sheetInfo,
        stats: sheetData.stats,
        data: paginatedRecords,
        pagination: {
          page,
          limit,
          totalPages: Math.ceil(filtered.length / limit),
          totalItems: filtered.length,
        },
      });
    }

    // Return all records with metadata and stats
    return res.json({
      success: true,
      sheetInfo: sheetData.sheetInfo,
      stats: sheetData.stats,
      data: filtered,
      totalCount: filtered.length,
    });
  } catch (error: any) {
    console.error('Error fetching sheet data:', error);
    return res.status(500).json({
      success: false,
      message: error?.message || 'Failed to fetch Google Sheets data',
      error: process.env.NODE_ENV === 'development' ? error?.stack : undefined,
    });
  }
}

export async function getStats(req: Request, res: Response) {
  try {
    const sheetData = await getFormattedSheetData();
    return res.json({
      success: true,
      sheetInfo: sheetData.sheetInfo,
      stats: sheetData.stats,
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: error?.message || 'Failed to compute stats',
    });
  }
}

export async function getHealthCheck(_req: Request, res: Response) {
  return res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'Vehicle Inspection API',
    uptime: process.uptime(),
  });
}
