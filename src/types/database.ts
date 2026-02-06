export type ReportStatus = 'pending' | 'approved' | 'rejected';

export interface EventReport {
  id: string;
  shop_name: string;
  source_url: string;
  status: ReportStatus;
  created_at: string;
}

export interface ClosingReport {
  id: string;
  shop_name: string;
  source_url: string;
  status: ReportStatus;
  created_at: string;
}

export interface RamenEvent {
  id: string;
  shop_id: string;
  report_id?: string;
  menu_name?: string;
  price?: string;
  proof_image_url: string;
  starts_at: string;
  ends_at: string;
  is_closed: boolean;
  description?: string;
  created_at: string;
}
