export const visitorTypes = ["Guest", "Contractor", "Vendor", "Interviewee"] as const;

export type VisitorForm = {
  firstName: string;
  lastName: string;
  /** Country code the number was typed with, e.g. "+234" */
  phoneCode: string;
  phone: string;
  company: string;
  visitorType: (typeof visitorTypes)[number];
  residentCompany: string;
  host: string;
  purpose: string;
  notes: string;
};

export const emptyVisitor: VisitorForm = {
  firstName: "",
  lastName: "",
  phoneCode: "+234",
  phone: "",
  company: "",
  visitorType: "Guest",
  residentCompany: "",
  host: "",
  purpose: "",
  notes: "",
};