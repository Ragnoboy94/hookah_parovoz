import { BookingsAdmin } from "@/components/admin/BookingsAdmin";

export const metadata = {
  title: "Бронирования — админ",
  robots: "noindex, nofollow",
};

export default function AdminBookingsPage() {
  return <BookingsAdmin />;
}
