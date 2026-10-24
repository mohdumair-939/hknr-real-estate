/**
 * Domain vocabulary shared by public pages, admin and validation.
 * Labels use the terms Indian property buyers expect.
 */

export const PROPERTY_TYPES = ["plot", "independent_house", "apartment", "villa", "commercial"] as const;
export type PropertyType = (typeof PROPERTY_TYPES)[number];
export const PROPERTY_TYPE_LABEL: Record<PropertyType, string> = {
  plot: "Residential plot",
  independent_house: "Independent house",
  apartment: "Apartment",
  villa: "Villa",
  commercial: "Commercial",
};
export const PROPERTY_TYPE_PLURAL: Record<PropertyType, string> = {
  plot: "Plots",
  independent_house: "Independent houses",
  apartment: "Apartments",
  villa: "Villas",
  commercial: "Commercial",
};

export const TRANSACTION_TYPES = ["sale", "rent"] as const;
export type TransactionType = (typeof TRANSACTION_TYPES)[number];
export const TRANSACTION_LABEL: Record<TransactionType, string> = { sale: "For sale", rent: "For rent" };

export const PUBLICATION_STATUSES = ["draft", "published", "archived"] as const;
export type PublicationStatus = (typeof PUBLICATION_STATUSES)[number];
export const PUBLICATION_LABEL: Record<PublicationStatus, string> = {
  draft: "Draft",
  published: "Published",
  archived: "Archived",
};

export const AVAILABILITIES = ["available", "under_offer", "sold", "rented", "unavailable"] as const;
export type Availability = (typeof AVAILABILITIES)[number];
export const AVAILABILITY_LABEL: Record<Availability, string> = {
  available: "Available",
  under_offer: "Under offer",
  sold: "Sold",
  rented: "Rented",
  unavailable: "Not available",
};

export const CONSTRUCTION_STATUSES = ["ready_to_move", "under_construction", "not_applicable"] as const;
export type ConstructionStatus = (typeof CONSTRUCTION_STATUSES)[number];
export const CONSTRUCTION_STATUS_LABEL: Record<ConstructionStatus, string> = {
  ready_to_move: "Ready to move",
  under_construction: "Under construction",
  not_applicable: "Not applicable",
};

export const FACINGS = ["east", "west", "north", "south", "north_east", "north_west", "south_east", "south_west"] as const;
export type Facing = (typeof FACINGS)[number];
export const FACING_LABEL: Record<Facing, string> = {
  east: "East",
  west: "West",
  north: "North",
  south: "South",
  north_east: "North-east",
  north_west: "North-west",
  south_east: "South-east",
  south_west: "South-west",
};

export const AREA_UNITS = ["sq_yd", "sq_ft", "acre"] as const;
export type AreaUnit = (typeof AREA_UNITS)[number];
export const AREA_UNIT_LABEL: Record<AreaUnit, string> = { sq_yd: "sq yd", sq_ft: "sq ft", acre: "acre" };
export const AREA_UNIT_LONG: Record<AreaUnit, string> = {
  sq_yd: "square yards",
  sq_ft: "square feet",
  acre: "acres",
};

export const PROJECT_TYPES = ["residential_house", "apartment_building", "commercial", "renovation", "other"] as const;
export type ProjectType = (typeof PROJECT_TYPES)[number];
export const PROJECT_TYPE_LABEL: Record<ProjectType, string> = {
  residential_house: "Residential house",
  apartment_building: "Apartment building",
  commercial: "Commercial building",
  renovation: "Renovation",
  other: "Other",
};

export const PROJECT_STAGES = ["ongoing", "completed"] as const;
export type ProjectStage = (typeof PROJECT_STAGES)[number];
export const PROJECT_STAGE_LABEL: Record<ProjectStage, string> = { ongoing: "Ongoing", completed: "Completed" };

export const ENQUIRY_CATEGORIES = ["buy", "sell", "construction", "general"] as const;
export type EnquiryCategory = (typeof ENQUIRY_CATEGORIES)[number];
export const ENQUIRY_CATEGORY_LABEL: Record<EnquiryCategory, string> = {
  buy: "Buying a property",
  sell: "Selling / listing a property",
  construction: "Construction",
  general: "General question",
};

export const ENQUIRY_STATUSES = ["new", "contacted", "follow_up", "qualified", "closed", "spam"] as const;
export type EnquiryStatus = (typeof ENQUIRY_STATUSES)[number];
export const ENQUIRY_STATUS_LABEL: Record<EnquiryStatus, string> = {
  new: "New",
  contacted: "Contacted",
  follow_up: "Follow-up",
  qualified: "Qualified",
  closed: "Closed",
  spam: "Spam",
};

export const CONTACT_METHODS = ["phone", "whatsapp", "email"] as const;
export type ContactMethod = (typeof CONTACT_METHODS)[number];
export const CONTACT_METHOD_LABEL: Record<ContactMethod, string> = {
  phone: "Phone call",
  whatsapp: "WhatsApp",
  email: "Email",
};

export const USER_ROLES = ["admin", "staff"] as const;
export type UserRole = (typeof USER_ROLES)[number];
export const USER_ROLE_LABEL: Record<UserRole, string> = { admin: "Administrator", staff: "Staff" };

/** Types for which bedroom/bathroom counts make sense. */
export const hasRooms = (type: PropertyType) => type === "independent_house" || type === "apartment" || type === "villa";
/** Types that sit on their own land and so have a plot area. */
export const hasPlotArea = (type: PropertyType) => type !== "apartment";
