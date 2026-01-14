export interface BusinessHours {
  open: string;
  close: string;
  break_start: string;
  break_end: string;
}

export interface Shop {
  id: number;
  name: string;
  category: string;
  address: string;
  image_url: string;
  logo_url?: string;
  phone_number?: string;
  business_hours: Record<string, BusinessHours>; // 요일별 데이터
  score: number;
  external_link?: string;
  is_open: boolean;
}
