import {
  ScanLine,
  FileSpreadsheet,
  Braces,
  Layers,
  SlidersHorizontal,
  Workflow,
  Database,
} from "lucide-react";

export const services = [
  {
    icon: ScanLine,
    title: "AI Bill Processing",
    body: "Upload bills and receipts and let Zettafry automatically read and understand every line of information.",
  },
  {
    icon: FileSpreadsheet,
    title: "Bill → Excel Conversion",
    body: "Convert bills and receipts into clean, structured Excel files in minutes — not hours.",
  },
  {
    icon: Braces,
    title: "Intelligent Data Extraction",
    body: "Invoice numbers, dates, vendor names, addresses, GST details, items, quantities, prices, taxes and totals.",
  },
  {
    icon: Layers,
    title: "Bulk Processing",
    body: "Upload many bills at once and let Zettafry process the whole batch together.",
  },
  {
    icon: SlidersHorizontal,
    title: "Custom Data Extraction",
    body: "Tell Zettafry exactly which fields you need and it generates the matching columns for you.",
  },
  {
    icon: Workflow,
    title: "Document Automation",
    body: "Automate repetitive manual data-entry and cut hours of work down to minutes.",
  },
  {
    icon: Database,
    title: "Business Data Organization",
    body: "Turn unstructured bills and receipts into organized, searchable, usable business data.",
  },
];

export const processSteps = [
  { step: "01", title: "Upload", body: "Drop in a single bill or a whole folder of receipts — PDF or image." },
  { step: "02", title: "Extract", body: "Zettafry's AI reads vendors, dates, GST, line items, taxes and totals." },
  { step: "03", title: "Review", body: "Choose custom fields and check the structured result before export." },
  { step: "04", title: "Export", body: "Download a clean Excel file, ready for accounting or analysis." },
];

export type Plan = {
  name: string;
  price: string;
  note: string;
  features: string[];
  featured: boolean;
};

export const plans: Plan[] = [
  {
    name: "Free",
    price: "$0",
    note: "per month",
    features: [
      "3 bill uploads",
      "Basic bill-to-Excel conversion",
      "Standard AI extraction",
      "Excel download",
    ],
    featured: false,
  },
  {
    name: "Pro",
    price: "$3.15",
    note: "per month",
    features: [
      "More bill uploads",
      "Multiple bill processing",
      "Advanced AI extraction",
      "Custom fields",
      "Item-wise data extraction",
      "Full Excel export",
      "Processing history",
      "Priority processing",
    ],
    featured: true,
  },
  {
    name: "3-Month Pro",
    price: "$5.24",
    note: "one-time, 3 months",
    features: ["All Pro features", "Valid for 3 months", "Best value for regular users"],
    featured: false,
  },
];

export const CONTACT_EMAIL = "contact@mespark.in";
