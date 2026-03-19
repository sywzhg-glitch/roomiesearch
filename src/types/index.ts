import type {
  User,
  Group,
  GroupMember,
  Listing,
  GroupListing,
  ListingRating,
  ListingComment,
  ApplicationData,
  MarketplaceProfile,
  MarketplaceRequest,
  GroupRole,
  ListingStatus,
  MarketplaceType,
  RequestStatus,
} from "@prisma/client";

export type {
  User,
  Group,
  GroupMember,
  Listing,
  GroupListing,
  ListingRating,
  ListingComment,
  ApplicationData,
  MarketplaceProfile,
  MarketplaceRequest,
  GroupRole,
  ListingStatus,
  MarketplaceType,
  RequestStatus,
};

// Extended types with relations
export type GroupWithMembers = Group & {
  members: (GroupMember & { user: User })[];
};

export type GroupListingWithDetails = GroupListing & {
  listing: Listing;
  ratings: ListingRating[];
  comments: (ListingComment & { user: User; replies: (ListingComment & { user: User })[] })[];
  avgRating: number;
  interestedCount: number;
  applyingCount: number;
};

export type MarketplaceProfileWithDetails = MarketplaceProfile & {
  user?: User | null;
  group?: (Group & { members: (GroupMember & { user: User })[] }) | null;
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

// API response types
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

// AI types
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
