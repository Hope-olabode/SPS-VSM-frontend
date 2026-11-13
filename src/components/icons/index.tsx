import { createIcon } from "./create-icon";

export type { IconProps } from "./create-icon";

export const ActivityIcon = createIcon("ActivityIcon", (
  <>
    <path d="M3 3v18h18" />
    <path d="m7 16 4-5 3 3 5-7" />
  </>
));

export const ArchiveIcon = createIcon("ArchiveIcon", (
  <>
    <rect x="3" y="4" width="18" height="4" rx="1" />
    <path d="M5 8v10a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8M10 12h4" />
  </>
));

export const ArrowRightIcon = createIcon("ArrowRightIcon", (
  <>
    <path d="M5 12h14" />
    <path d="m13 6 6 6-6 6" />
  </>
));

export const BellIcon = createIcon("BellIcon", (
  <>
    <path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9" />
    <path d="M10 21h4" />
  </>
));

export const BuildingIcon = createIcon("BuildingIcon", (
  <>
    <path d="M4 21V7l8-4 8 4v14" />
    <path d="M9 21v-4h6v4M8 9h1M12 9h1M16 9h1M8 13h1M12 13h1M16 13h1" />
  </>
));

export const CalendarIcon = createIcon("CalendarIcon", (
  <>
    <rect x="3" y="5" width="18" height="16" rx="2" />
    <path d="M16 3v4M8 3v4M3 10h18" />
  </>
));

export const ChevronDownIcon = createIcon("ChevronDownIcon", <path d="m7 9 5 5 5-5" />);

export const ClipboardIcon = createIcon("ClipboardIcon", (
  <>
    <rect x="4" y="4" width="16" height="18" rx="2" />
    <path d="M9 2h6v4H9zM8 11h8M8 16h8" />
  </>
));

export const ClockIcon = createIcon("ClockIcon", (
  <>
    <circle cx="12" cy="12" r="9" />
    <path d="M12 7v5l3 2" />
  </>
));

export const CloseIcon = createIcon("CloseIcon", <path d="m6 6 12 12M18 6 6 18" />);

export const ContactIcon = createIcon("ContactIcon", (
  <>
    <rect x="3" y="4" width="18" height="17" rx="2" />
    <circle cx="12" cy="11" r="3" />
    <path d="M8 21v-1a4 4 0 0 1 8 0M8 2v4M16 2v4" />
  </>
));

export const CreditCardIcon = createIcon("CreditCardIcon", (
  <>
    <rect x="2" y="5" width="20" height="14" rx="2" />
    <path d="M2 10h20" />
  </>
));

export const DashboardIcon = createIcon("DashboardIcon", (
  <>
    <rect x="3" y="3" width="7" height="8" rx="1" />
    <rect x="14" y="3" width="7" height="5" rx="1" />
    <rect x="3" y="15" width="7" height="6" rx="1" />
    <rect x="14" y="12" width="7" height="9" rx="1" />
  </>
));

export const DocumentIcon = createIcon("DocumentIcon", (
  <>
    <path d="M6 2h8l4 4v16H6z" />
    <path d="M14 2v5h5M9 12h6M9 16h6" />
  </>
));

export const FeedbackIcon = createIcon("FeedbackIcon", (
  <>
    <path d="M4 4h16v13H8l-4 4z" />
    <path d="M12 8v5M9.5 10.5h5" />
  </>
));

export const HelpIcon = createIcon("HelpIcon", (
  <>
    <circle cx="12" cy="12" r="9" />
    <path d="M9.8 9a2.4 2.4 0 1 1 3.1 2.3c-.7.3-.9.8-.9 1.7M12 17h.01" />
  </>
));

export const InfoIcon = createIcon("InfoIcon", (
  <>
    <circle cx="12" cy="12" r="9" />
    <path d="M12 11v6M12 7h.01" />
  </>
));

export const LogoutIcon = createIcon("LogoutIcon", <path d="M10 17l5-5-5-5M15 12H3M15 4h5v16h-5" />);

export const MenuIcon = createIcon("MenuIcon", <path d="M4 6h16M4 12h16M4 18h16" />);

export const MoonIcon = createIcon("MoonIcon", <path d="M20 15.5A8.5 8.5 0 0 1 8.5 4 8.5 8.5 0 1 0 20 15.5Z" />);

export const PanelIcon = createIcon("PanelIcon", (
  <>
    <rect x="3" y="3" width="18" height="18" rx="2" />
    <path d="M9 3v18" />
  </>
));

export const PinIcon = createIcon("PinIcon", (
  <>
    <path d="M20 10c0 5-8 12-8 12S4 15 4 10a8 8 0 1 1 16 0" />
    <circle cx="12" cy="10" r="2.5" />
  </>
));

export const ReportIcon = createIcon("ReportIcon", <path d="M4 20V10M10 20V4M16 20v-7M22 20H2" />);

export const SettingsIcon = createIcon("SettingsIcon", (
  <>
    <circle cx="12" cy="12" r="3" />
    <path d="M19 12a7 7 0 0 0-.1-1l2-1.6-2-3.4-2.5 1a7 7 0 0 0-1.7-1L14.3 3h-4.6L9.3 6a7 7 0 0 0-1.7 1L5 6 3 9.4 5.1 11a7 7 0 0 0 0 2L3 14.6 5 18l2.6-1a7 7 0 0 0 1.7 1l.4 3h4.6l.4-3a7 7 0 0 0 1.7-1l2.6 1 2-3.4-2.1-1.6a7 7 0 0 0 .1-1Z" />
  </>
));

export const ShieldIcon = createIcon("ShieldIcon", (
  <>
    <path d="M12 22s8-3 8-10V5l-8-3-8 3v7c0 7 8 10 8 10" />
    <path d="m9 12 2 2 4-4" />
  </>
));

export const SparkleIcon = createIcon(
  "SparkleIcon",
  <path d="m12 3 1.3 4.2a5 5 0 0 0 3.5 3.5L21 12l-4.2 1.3a5 5 0 0 0-3.5 3.5L12 21l-1.3-4.2a5 5 0 0 0-3.5-3.5L3 12l4.2-1.3a5 5 0 0 0 3.5-3.5Z" />,
);

export const SunIcon = createIcon("SunIcon", (
  <>
    <circle cx="12" cy="12" r="4" />
    <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
  </>
));

export const UserCheckIcon = createIcon("UserCheckIcon", (
  <>
    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
    <circle cx="9" cy="7" r="4" />
    <path d="m16 11 2 2 4-4" />
  </>
));

export const UserPlusIcon = createIcon("UserPlusIcon", (
  <>
    <path d="M15 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
    <circle cx="8.5" cy="7" r="4" />
    <path d="M19 8v6M16 11h6" />
  </>
));

export const UserXIcon = createIcon("UserXIcon", (
  <>
    <path d="M15 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
    <circle cx="8.5" cy="7" r="4" />
    <path d="m17 8 5 5M22 8l-5 5" />
  </>
));

export const UsersIcon = createIcon("UsersIcon", (
  <>
    <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
    <circle cx="8.5" cy="7" r="4" />
    <path d="M17 11a4 4 0 0 0 0-8M23 21v-2a4 4 0 0 0-3-3.9" />
  </>
));

export const WarningIcon = createIcon("WarningIcon", (
  <>
    <path d="M12 3 2 21h20L12 3Z" />
    <path d="M12 9v5M12 18h.01" />
  </>
));

// Paste these at the bottom of components/icons/index.tsx
// (createIcon is already imported at the top of that file).

export const ArrowLeftIcon = createIcon("ArrowLeftIcon", (
  <>
    <path d="M19 12H5" />
    <path d="m12 19-7-7 7-7" />
  </>
));

export const CameraIcon = createIcon("CameraIcon", (
  <>
    <path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z" />
    <circle cx="12" cy="13" r="3" />
  </>
));

export const CheckIcon = createIcon("CheckIcon", <path d="M20 6 9 17l-5-5" />);

export const QrCodeIcon = createIcon("QrCodeIcon", (
  <>
    <rect width="5" height="5" x="3" y="3" rx="1" />
    <rect width="5" height="5" x="16" y="3" rx="1" />
    <rect width="5" height="5" x="3" y="16" rx="1" />
    <path d="M21 16h-3a2 2 0 0 0-2 2v3M21 21v.01M12 7v3a2 2 0 0 1-2 2H7M3 12h.01M12 3h.01M12 16v.01M16 12h1M21 12v.01M12 21v-1" />
  </>
));


// Paste these at the bottom of components/icons/index.tsx
// (createIcon is already imported at the top of that file).

export const AlertCircleIcon = createIcon("AlertCircleIcon", (
  <>
    <circle cx="12" cy="12" r="9" />
    <path d="M12 8v4M12 16h.01" />
  </>
));

export const CopyIcon = createIcon("CopyIcon", (
  <>
    <rect width="14" height="14" x="8" y="8" rx="2" ry="2" />
    <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" />
  </>
));

export const MonitorIcon = createIcon("MonitorIcon", (
  <>
    <rect width="20" height="14" x="2" y="3" rx="2" />
    <path d="M8 21h8M12 17v4" />
  </>
));

export const SearchIcon = createIcon("SearchIcon", (
  <>
    <circle cx="11" cy="11" r="7" />
    <path d="m20 20-4-4" />
  </>
));

// Paste these at the bottom of components/icons/index.tsx
// (createIcon is already imported at the top of that file).

export const ChevronLeftIcon = createIcon("ChevronLeftIcon", <path d="m15 18-6-6 6-6" />);

export const ChevronRightIcon = createIcon("ChevronRightIcon", <path d="m9 18 6-6-6-6" />);

export const DownloadIcon = createIcon("DownloadIcon", <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3" />);

export const EyeIcon = createIcon("EyeIcon", (
  <>
    <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z" />
    <circle cx="12" cy="12" r="3" />
  </>
));

export const LockIcon = createIcon("LockIcon", (
  <>
    <rect width="18" height="11" x="3" y="11" rx="2" />
    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
  </>
));

export const ShareIcon = createIcon("ShareIcon", (
  <>
    <circle cx="18" cy="5" r="3" />
    <circle cx="6" cy="12" r="3" />
    <circle cx="18" cy="19" r="3" />
    <path d="m8.6 13.5 6.8 4M15.4 6.5l-6.8 4" />
  </>
));

export const MailIcon = createIcon("MailIcon", (
  <>
    <rect x="3" y="5" width="18" height="14" rx="2" />
    <path d="m3 7 9 6 9-6" />
  </>
));

export const TrashIcon = createIcon("TrashIcon", (
  <path d="M3 6h18M8 6V4a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v2M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6M10 11v6M14 11v6" />
));


export const TrendingUpIcon = createIcon("TrendingUpIcon", (
  <>
    <path d="M16 7h6v6" />
    <path d="m22 7-8.5 8.5-5-5L2 17" />
  </>
));

export const RotateCcwIcon = createIcon("RotateCcwIcon", (
  <>
    <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
    <path d="M3 3v5h5" />
  </>
));

export const ShieldCheckIcon = createIcon("ShieldCheckIcon", (
  <>
    <path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z" />
    <path d="m9 12 2 2 4-4" />
  </>
));

export const TargetIcon = createIcon("TargetIcon", (
  <>
    <circle cx="12" cy="12" r="10" />
    <circle cx="12" cy="12" r="6" />
    <circle cx="12" cy="12" r="2" />
  </>
));

export const FilterIcon = createIcon("FilterIcon", <path d="M3 4h18l-7 8.5V19l-4 2v-8.5L3 4Z" />);


export const ZapIcon = createIcon("ZapIcon", <path d="M13 2 3 14h7l-1 8 10-12h-7l1-8Z" />);

export const UserIcon = createIcon("UserIcon", (
  <>
    <circle cx="12" cy="8" r="4" />
    <path d="M4 21a8 8 0 0 1 16 0" />
  </>
));

export const ShieldAlertIcon = createIcon("ShieldAlertIcon", (
  <>
    <path d="M12 22s8-3 8-10V5l-8-3-8 3v7c0 7 8 10 8 10" />
    <path d="M12 8v4M12 16h.01" />
  </>
));

export const PrinterIcon = createIcon("PrinterIcon", (
  <>
    <path d="M6 9V3h12v6" />
    <rect x="3" y="9" width="18" height="9" rx="2" />
    <path d="M7 14h10v7H7z" />
  </>
));

export const PencilIcon = createIcon("PencilIcon", (
  <>
    <path d="M12 20h9" />
    <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z" />
  </>
));

export const KeyIcon = createIcon("KeyIcon", (
  <>
    <circle cx="7.5" cy="15.5" r="4.5" />
    <path d="m10.7 12.3 9.8-9.8M16 7l3 3M14 9l2 2" />
  </>
));

export const UploadIcon = createIcon("UploadIcon", <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12" />);

export const EyeOffIcon = createIcon("EyeOffIcon", (
  <>
    <path d="M10.7 5.1A9.6 9.6 0 0 1 12 5c6 0 9.5 7 9.5 7a15.8 15.8 0 0 1-2.6 3.4M6.6 6.6A15.6 15.6 0 0 0 2.5 12s3.5 7 9.5 7a9.4 9.4 0 0 0 4.4-1.1" />
    <path d="M9.9 9.9a3 3 0 0 0 4.2 4.2M3 3l18 18" />
  </>
));

export const PlusIcon = createIcon("PlusIcon", <path d="M12 5v14M5 12h14" />);

export const MegaphoneIcon = createIcon("MegaphoneIcon", (
  <>
    <path d="m3 11 18-5v12L3 14v-3Z" />
    <path d="M11.6 16.8a3 3 0 1 1-5.8-1.6" />
  </>
));

export const SendIcon = createIcon("SendIcon", (
  <>
    <path d="m22 2-7 20-4-9-9-4Z" />
    <path d="M22 2 11 13" />
  </>
));

export const MessageIcon = createIcon("MessageIcon", <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2Z" />);
