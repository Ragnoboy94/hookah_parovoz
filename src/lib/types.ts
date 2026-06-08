export interface MenuItem {
  id: string;
  name: string;
  description?: string;
  price: number;
}

export interface MenuCategory {
  id: string;
  name: string;
  items: MenuItem[];
}

export interface DaySchedule {
  open: number;
  close: number;
}

export interface SiteContent {
  title: string;
  subtitle: string;
  address: string;
  phone: string;
  timezone: string;
  theme: {
    primaryColor: string;
    mode: "dark" | "light";
  };
  schedule: {
    midnightHour: number;
    days: DaySchedule[];
  };
  social: {
    vk: string;
    telegram: string;
    instagram: string;
    facebook: string;
  };
  reviews: {
    enabled: boolean;
    google: string;
    yandex: string;
    gis2: string;
  };
  menu: {
    enabled: boolean;
    categories: MenuCategory[];
  };
  booking: {
    enabled: boolean;
    intervalMinutes: number;
    durationMinutes: number;
    maxAdvanceDays: number;
    onlyTodayOnline: boolean;
    hookahHourPrice: number;
    maxHookahHours: number;
  };
  legal: {
    ageRestriction: string;
  };
  yandexMetrikaId?: string;
  seo?: {
    siteUrl: string;
    metaTitle: string;
    metaDescription: string;
    keywords: string;
    ogImage: string;
  };
  telegram?: {
    enabled: boolean;
    chatId: string;
    notifyOnOnlineBooking: boolean;
    notifyOnAdminBooking: boolean;
    notifyOnBlock: boolean;
  };
}

export interface OpenStatus {
  isOpen: boolean;
  label: string;
  nextChange?: string;
}

export interface Table {
  id: string;
  name: string;
  seats: number;
  enabled: boolean;
  image?: string;
}

export type BookingStatus = "pending" | "confirmed" | "cancelled";
export type BookingKind = "guest" | "block";
export type BookingSource = "online" | "admin";

export interface Booking {
  id: string;
  tableId: string;
  date: string;
  time: string;
  durationMinutes: number;
  guestName: string;
  guestPhone: string;
  guests: number;
  status: BookingStatus;
  kind: BookingKind;
  source: BookingSource;
  note?: string;
  createdAt: string;
}

export interface SlotAvailability {
  time: string;
  availableTableIds: string[];
}

export interface BookingAvailability {
  date: string;
  slots: SlotAvailability[];
  closed: boolean;
  closedReason?: string;
}
