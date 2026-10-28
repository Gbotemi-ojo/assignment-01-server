export interface InspectionRecord {
  id: number;
  rowNumber: number;
  timestamp: string;
  inspectionType: string;
  vehicleType: string;
  vehiclesCount: number | string;
  urgency: string;
  partnerName: string;
  partnerEmail: string;
  partnerPhone: string;
  location: string;
  partnershipStatus: 'New Partner' | 'Existing Partner' | 'Other' | string;
  preferredDate: string;
  plateNumber: string;
  businessServicing: string;
  comments: string;
  sharedBy: string;
  teamMemberName: string;
  teamRequest: string;
  status: 'Sent' | 'Manual Review — No Centre Match' | 'Pending' | string;
  scheduledDate?: string;
  scoreOrCenter?: string;
  documents: {
    vehicleLicense?: string;
    roadWorthiness?: string;
    hackneyPermit?: string;
    insurance?: string;
    speedLimit?: string;
  };
  hasAllDocuments: boolean;
  documentsCount: number;
  rawValues?: string[];
}

export interface InspectionStats {
  totalRecords: number;
  byInspectionType: Record<string, number>;
  byVehicleType: Record<string, number>;
  byStatus: Record<string, number>;
  byPartnershipStatus: Record<string, number>;
  byLocation: Record<string, number>;
  bySharedBy: Record<string, number>;
  totalVehiclesInspected: number;
  withDocumentsCount: number;
  pendingCount: number;
  sentCount: number;
  manualReviewCount: number;
}

export interface SheetApiResponse {
  success: boolean;
  message?: string;
  sheetInfo: {
    title: string;
    sheetName: string;
    totalRows: number;
    lastFetchedAt: string;
  };
  stats: InspectionStats;
  data: InspectionRecord[];
  pagination?: {
    page: number;
    limit: number;
    totalPages: number;
    totalItems: number;
  };
}
