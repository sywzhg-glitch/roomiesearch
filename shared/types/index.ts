// Plain TypeScript types — no @prisma/client dependency.
// These mirror the Prisma-generated models so web + mobile can share them.

export type GroupRole = "OWNER" | "ADMIN" | "MEMBER";
export type ListingStatus = "CONSIDERING" | "APPLYING" | "APPLIED" | "REJECTED" | "SIGNED";
export type MarketplaceType = "OPEN_ROOM" | "LOOKING_FOR_GROUP" | "LOOKING_TO_JOIN";
export type RequestStatus = "PENDING" | "ACCEPTED" | "DECLINED";

export interface User {
  id: string;
  email: string;
  name: string;
  passwordHash?: string | null;
  avatar?: string | null;
  phone?: string | null;
  createdAt: Date | string;
  updatedAt: Date | string;
}

export interface Group {
  id: string;
  name: string;
  inviteCode: string;
  location?: string | null;
  budgetMin?: number | null;
  budgetMax?: number | null;
  moveInDate?: Date | string | null;
  bedsMin?: number | null;
  bedsMax?: number | null;
  baths?: number | null;
  notes?: string | null;
  createdAt: Date | string;
  updatedAt: Date | string;
}

export interface GroupMember {
  id: string;
  userId: string;
  groupId: string;
  role: GroupRole;
  joinedAt: Date | string;
}

export interface Listing {
  id: string;
  url?: string | null;
  price?: number | null;
  address?: string | null;
  city?: string | null;
  state?: string | null;
  zip?: string | null;
  beds?: number | null;
  baths?: number | null;
  sqft?: number | null;
  description?: string | null;
  images: string[];
  landlordName?: string | null;
  landlordEmail?: string | null;
  landlordPhone?: string | null;
  aiSuggested?: boolean | null;
  createdAt: Date | string;
  updatedAt: Date | string;
}

export interface GroupListing {
  id: string;
  groupId: string;
  listingId: string;
  status: ListingStatus;
  addedById?: string | null;
  createdAt: Date | string;
  updatedAt: Date | string;
}

export interface ListingRating {
  id: string;
  groupListingId: string;
  userId: string;
  rating: number;
  interested: boolean;
  applying: boolean;
  createdAt: Date | string;
  updatedAt: Date | string;
  user?: Pick<User, "id" | "name" | "avatar"> | null;
}

export interface ListingComment {
  id: string;
  groupListingId: string;
  userId: string;
  content: string;
  parentId?: string | null;
  createdAt: Date | string;
  updatedAt: Date | string;
  user?: Pick<User, "id" | "name" | "avatar"> | null;
  replies?: (ListingComment & { user?: Pick<User, "id" | "name" | "avatar"> | null })[];
}

export interface ApplicationData {
  id: string;
  userId: string;
  firstName?: string | null;
  lastName?: string | null;
  email?: string | null;
  phone?: string | null;
  currentAddress?: string | null;
  income?: number | null;
  employer?: string | null;
  jobTitle?: string | null;
  employmentYears?: number | null;
  creditScore?: number | null;
  hasGuarantor: boolean;
  guarantorName?: string | null;
  guarantorEmail?: string | null;
  guarantorPhone?: string | null;
  guarantorIncome?: number | null;
  documents: string[];
  createdAt: Date | string;
  updatedAt: Date | string;
}

export interface MarketplaceProfile {
  id: string;
  userId?: string | null;
  groupId?: string | null;
  type: MarketplaceType;
  title: string;
  description?: string | null;
  location?: string | null;
  budgetMin?: number | null;
  budgetMax?: number | null;
  moveInDate?: Date | string | null;
  openRooms?: number | null;
  isActive: boolean;
  createdAt: Date | string;
  updatedAt: Date | string;
}

export interface MarketplaceRequest {
  id: string;
  fromUserId: string;
  toProfileId: string;
  message?: string | null;
  status: RequestStatus;
  createdAt: Date | string;
  updatedAt: Date | string;
}

// Extended types with relations
export type GroupWithMembers = Group & {
  members: (GroupMember & { user: Pick<User, "id" | "name" | "email" | "avatar"> })[];
  _count?: { listings: number };
};

export type GroupListingWithDetails = GroupListing & {
  listing: Listing;
  ratings: ListingRating[];
  comments: (ListingComment & { user: Pick<User, "id" | "name" | "avatar"> | null; replies: (ListingComment & { user: Pick<User, "id" | "name" | "avatar"> | null })[] })[];
  avgRating: number;
  interestedCount: number;
  applyingCount: number;
};

export type MarketplaceProfileWithDetails = MarketplaceProfile & {
  user?: Pick<User, "id" | "name" | "email" | "avatar"> | null;
  group?: (Group & { members: (GroupMember & { user: Pick<User, "id" | "name" | "avatar"> })[] }) | null;
};

// Form types
export interface CreateGroupFormData {
  name: string;
  location?: string;
  budgetMin?: number;
  budgetMax?: number;
  moveInDate?: string;
  bedsMin?: number;
  bedsMax?: number;
  baths?: number;
  notes?: string;
}

export interface AddListingFormData {
  url?: string;
  price?: number;
  address?: string;
  city?: string;
  state?: string;
  zip?: string;
  beds?: number;
  baths?: number;
  sqft?: number;
  description?: string;
  images?: string[];
  landlordName?: string;
  landlordEmail?: string;
  landlordPhone?: string;
}

export interface ScrapedListing {
  url: string;
  price?: number;
  address?: string;
  city?: string;
  state?: string;
  zip?: string;
  beds?: number;
  baths?: number;
  sqft?: number;
  description?: string;
  images?: string[];
  landlordName?: string;
  landlordEmail?: string;
  landlordPhone?: string;
  scrapingSuccess: boolean;
  error?: string;
}

export interface RankedListing extends GroupListingWithDetails {
  rank: number;
  score: number;
}

export interface ApplicationPacket {
  groupId: string;
  listingId: string;
  applicants: ApplicationData[];
  groupName: string;
  listingAddress: string;
  generatedAt: Date;
}

export interface ApiResponse<T> {
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
}

export interface AISuggestedListing {
  url?: string;
  price: number;
  address: string;
  city: string;
  state: string;
  beds: number;
  baths: number;
  sqft?: number;
  description: string;
  images: string[];
  landlordEmail?: string;
  reasoning: string;
}

export interface MarketplaceFilters {
  location?: string;
  budgetMin?: number;
  budgetMax?: number;
  moveInDate?: string;
  type?: MarketplaceType;
}

export interface MobileUser {
  id: string;
  name: string;
  email: string;
  avatar?: string | null;
}
