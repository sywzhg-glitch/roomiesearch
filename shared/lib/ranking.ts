import type { GroupListingWithDetails, RankedListing } from "../types";

export function computeScore(listing: GroupListingWithDetails, memberCount: number): number {
  const ratingCount = listing.ratings.length;
  if (ratingCount === 0) return 0;

  const avgRating = listing.avgRating;
  const interestedCount = listing.ratings.filter((r) => r.interested).length;
  const applyingCount = listing.ratings.filter((r) => r.applying).length;

  const ratingScore = (avgRating / 5) * 20;
  const interestedScore = memberCount > 0 ? (interestedCount / memberCount) * 30 : 0;
  const applyingScore = memberCount > 0 ? (applyingCount / memberCount) * 50 : 0;

  return Math.round((ratingScore + interestedScore + applyingScore) * 10) / 10;
}

export function computeAvgRating(listing: GroupListingWithDetails): number {
  const ratings = listing.ratings.filter((r) => r.rating > 0);
  if (ratings.length === 0) return 0;
  const sum = ratings.reduce((acc, r) => acc + r.rating, 0);
  return Math.round((sum / ratings.length) * 10) / 10;
}

export function rankListings(
  listings: GroupListingWithDetails[],
  memberCount: number
): RankedListing[] {
  const withScores = listings.map((l) => ({
    ...l,
    avgRating: computeAvgRating(l),
    score: 0 as number,
  }));

  const scored = withScores.map((l) => ({
    ...l,
    score: computeScore(l, memberCount),
  }));

  scored.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    if (b.avgRating !== a.avgRating) return b.avgRating - a.avgRating;
    return new Date(b.updatedAt as string).getTime() - new Date(a.updatedAt as string).getTime();
  });

  return scored.map((l, i) => ({ ...l, rank: i + 1 }));
}

export function getScoreLabel(score: number): string {
  if (score >= 80) return "Top Pick";
  if (score >= 60) return "Strong";
  if (score >= 40) return "Maybe";
  if (score >= 20) return "Weak";
  return "Unrated";
}

export function getScoreColor(score: number): string {
  if (score >= 80) return "text-green-600";
  if (score >= 60) return "text-blue-600";
  if (score >= 40) return "text-yellow-600";
  if (score >= 20) return "text-orange-600";
  return "text-gray-400";
}
