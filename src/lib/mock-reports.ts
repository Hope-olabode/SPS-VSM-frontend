// Mock data for the Reports page. Replace with real API/database calls later.

export type ReportId = "overstay" | "occupancy" | "lobby" | "category" | "watchlist" | "ledger";

export type OverstayRow = {
  id: string;
  visitor: string;
  company: string;
  host: string;
  checkIn: string;
  duration: string;
  residentCompany: string;
  suite: string;
};

export type OccupancyRow = {
  company: string;
  suite: string;
  email: string;
  visitors: number;
  avgDuration: string;
  share: string;
};

export type VolumeLevel = "Quiet" | "Normal" | "Moderate";

export type LobbyRow = { slot: string; checkIns: number; share: string; level: VolumeLevel };

export type CategoryRow = { category: string; visits: number; avgStay: string; share: string };

/** The mock "today", fixed so server and browser render the same thing. */
export const REPORT_TODAY = "2026-11-10";

export const overstayRows: OverstayRow[] = [
  { id: "os-1", visitor: "Taiwo Lateef", company: "07100 Inverters", host: "Joseph", checkIn: "Nov 10, 10:40 AM", duration: "0h 26m", residentCompany: "Beiersdorf (NIVEA)", suite: "4th Floor" },
  { id: "os-2", visitor: "Patricia Ihunwo", company: "The Clarify House", host: "Dr Mosun", checkIn: "Nov 10, 10:37 AM", duration: "0h 29m", residentCompany: "Tope Adebayo LP", suite: "3rd Floor" },
  { id: "os-3", visitor: "Paul Obiora", company: "N/A", host: "Mr Dayo", checkIn: "Nov 10, 10:36 AM", duration: "0h 31m", residentCompany: "Troloppe Property Services", suite: "Ground Floor" },
  { id: "os-4", visitor: "Chuma Atuah", company: "N/A", host: "Mr Dayo", checkIn: "Nov 10, 10:35 AM", duration: "0h 32m", residentCompany: "Troloppe Property Services", suite: "Ground Floor" },
  { id: "os-5", visitor: "Mattins Amos", company: "N/A", host: "Mr Dayo", checkIn: "Nov 10, 10:34 AM", duration: "0h 32m", residentCompany: "Troloppe Property Services", suite: "Ground Floor" },
  { id: "os-6", visitor: "Roland Avrukpere", company: "N/A", host: "Mr Dayo", checkIn: "Nov 10, 10:33 AM", duration: "0h 33m", residentCompany: "Troloppe Property Services", suite: "Ground Floor" },
  { id: "os-7", visitor: "Ohis Odiawe", company: "N/A", host: "MrDayo", checkIn: "Nov 10, 10:32 AM", duration: "0h 34m", residentCompany: "Troloppe Property Services", suite: "Ground Floor" },
  { id: "os-8", visitor: "Emmanuel Okeleji", company: "Seamless", host: "Mr Tope", checkIn: "Nov 10, 09:57 AM", duration: "1h 9m", residentCompany: "Tope Adebayo LP", suite: "3rd Floor" },
  { id: "os-9", visitor: "Lateefat Ogundoye", company: "Ernst & Young", host: "Oladayo", checkIn: "Nov 10, 09:31 AM", duration: "1h 36m", residentCompany: "Tetra Pak West Africa", suite: "3rd Floor" },
  { id: "os-10", visitor: "Christy Oseghele", company: "Self", host: "Sps", checkIn: "Nov 10, 08:27 AM", duration: "2h 40m", residentCompany: "SPS Facilities Management", suite: "All Floors" },
  { id: "os-11", visitor: "Joshua Awusa", company: "Ltt coadtal and marines services", host: "Sps", checkIn: "Nov 10, 08:24 AM", duration: "2h 42m", residentCompany: "SPS Facilities Management", suite: "All Floors" },
  { id: "os-12", visitor: "Emmanuel Akpa", company: "LTT", host: "Mr Sam", checkIn: "Nov 10, 08:21 AM", duration: "2h 46m", residentCompany: "The Square Serviced Offices", suite: "Ground Floor" },
  { id: "os-13", visitor: "Emmanuella Nwaokono", company: "N/A", host: "Oladayo", checkIn: "Nov 10, 08:09 AM", duration: "2h 58m", residentCompany: "Tetra Pak West Africa", suite: "3rd Floor" },
  { id: "os-14", visitor: "Juliana Meduju", company: "N/A", host: "Mr Sam", checkIn: "Nov 10, 07:28 AM", duration: "3h 39m", residentCompany: "The Square Serviced Offices", suite: "Ground Floor" },
  { id: "os-15", visitor: "Nengi Jaja", company: "N/A", host: "Excellent", checkIn: "Nov 10, 07:21 AM", duration: "3h 46m", residentCompany: "Tope Adebayo LP", suite: "3rd Floor" },
];

export const occupancyRows: OccupancyRow[] = [
  { company: "Beiersdorf (NIVEA)", suite: "4th Floor", email: "Joy.Olukaiyeja.external@Beiersdorf.com", visitors: 133, avgDuration: "5h 7m", share: "20%" },
  { company: "SPS Facilities Management", suite: "All Floors", email: "adebayo@spsfm.com.ng", visitors: 126, avgDuration: "9h 16m", share: "19%" },
  { company: "Tope Adebayo LP", suite: "3rd Floor", email: "info@topeadebayolp.com", visitors: 109, avgDuration: "4h 42m", share: "17%" },
  { company: "Tetra Pak West Africa", suite: "3rd Floor", email: "nkeonye.ugbomah@cbreuxcellerate.com", visitors: 78, avgDuration: "5h 46m", share: "12%" },
  { company: "Ultimum Limited", suite: "2nd Floor", email: "nancy.ocholi@ultimum-ng.com", visitors: 73, avgDuration: "5h 9m", share: "11%" },
  { company: "Lufthansa", suite: "2nd Floor", email: "N/A", visitors: 45, avgDuration: "3h 48m", share: "7%" },
  { company: "Troloppe Property Services", suite: "Ground Floor", email: "info@troloppe.com", visitors: 36, avgDuration: "2h 43m", share: "5%" },
  { company: "The Square Serviced Offices", suite: "Ground Floor", email: "tunde.awarun@thesquareoffices.com", visitors: 22, avgDuration: "10h 58m", share: "3%" },
  { company: "Sidel", suite: "2nd Floor", email: "adeola.ogunsola@cbreuxcellerate.com, nkeonye.ugbomah@cbreuxcellerate.com", visitors: 20, avgDuration: "1h 48m", share: "3%" },
  { company: "Merck", suite: "4th Floor", email: "david.umoh@external.merckgroup.com", visitors: 18, avgDuration: "7h 14m", share: "3%" },
];

export const lobbyRows: LobbyRow[] = [
  { slot: "6:00 AM - 7:00 AM", checkIns: 3, share: "0%", level: "Normal" },
  { slot: "7:00 AM - 8:00 AM", checkIns: 66, share: "9%", level: "Normal" },
  { slot: "8:00 AM - 9:00 AM", checkIns: 83, share: "11%", level: "Moderate" },
  { slot: "9:00 AM - 10:00 AM", checkIns: 119, share: "16%", level: "Moderate" },
  { slot: "10:00 AM - 11:00 AM", checkIns: 95, share: "13%", level: "Moderate" },
  { slot: "11:00 AM - 12:00 PM", checkIns: 104, share: "14%", level: "Moderate" },
  { slot: "12:00 PM - 1:00 PM", checkIns: 79, share: "11%", level: "Moderate" },
  { slot: "1:00 PM - 2:00 PM", checkIns: 81, share: "11%", level: "Moderate" },
  { slot: "2:00 PM - 3:00 PM", checkIns: 60, share: "8%", level: "Normal" },
  { slot: "3:00 PM - 4:00 PM", checkIns: 23, share: "3%", level: "Normal" },
  { slot: "4:00 PM - 5:00 PM", checkIns: 12, share: "2%", level: "Normal" },
  { slot: "5:00 PM - 6:00 PM", checkIns: 1, share: "0%", level: "Normal" },
  { slot: "6:00 PM - 7:00 PM", checkIns: 1, share: "0%", level: "Normal" },
  { slot: "7:00 PM - 8:00 PM", checkIns: 0, share: "0%", level: "Quiet" },
];

export const categoryRows: CategoryRow[] = [
  { category: "Guest", visits: 468, avgStay: "6h 8m", share: "66%" },
  { category: "Contractor", visits: 91, avgStay: "7h 44m", share: "13%" },
  { category: "Delivery", visits: 58, avgStay: "55m", share: "8%" },
  { category: "Client", visits: 50, avgStay: "3h 50m", share: "7%" },
  { category: "Event Attendee", visits: 37, avgStay: "1h 49m", share: "5%" },
  { category: "Candidate", visits: 5, avgStay: "9h 30m", share: "1%" },
  { category: "VIP", visits: 2, avgStay: "8h 27m", share: "0%" },
];
