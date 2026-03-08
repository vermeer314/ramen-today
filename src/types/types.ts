export interface Shop {
  id: string;
  name: string;
  profile_img_url: string | null;
  map_url?: string;
}

export interface RamenEvent {
  id: string;
  shop_id: string;
  menu_name: string | null;
  proof_image_url: string;
  source_url: string | null;
  starts_at: string;
  ends_at: string;
  status_type: 'normal' | 'closed_lunch' | 'closed_dinner' | 'closed_all';
  description: string | null;
  like_count?: number;
  shops: Shop;
}
