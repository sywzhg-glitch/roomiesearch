/**
 * AI Service — stub implementations with realistic mock data.
 * These stubs simulate LLM-based extraction and recommendation features.
 * Swap with real OpenAI/Anthropic calls when API keys are available.
 */

import type { AISuggestedListing } from "@/types";
import type { Group } from "@prisma/client";

// --- Listing Extraction via "AI" ---
// In production: call GPT-4 with the scraped HTML to extract structured data.
// Here: return an enhanced stub based on URL patterns.

export async function aiExtractListing(url: string, html: string): Promise<Record<string, unknown>> {
  // If OpenAI key is available, use the real API
  // OpenAI integration placeholder - using fallback stub data

  // Mock extraction — returns plausible stub data based on URL
  await new Promise((r) => setTimeout(r, 500)); // Simulate async call
  return {};
}

// --- AI Listing Suggestions ---
// In production: use group preferences to query embedding search over real listings.
// Here: return realistic mock listings based on group preferences.

const MOCK_CITY_LISTINGS: Record<string, AISuggestedListing[]> = {
  "San Francisco": [
    {
      price: 3600,
      address: "88 Dolores St",
      city: "San Francisco",
      state: "CA",
      beds: 3,
      baths: 2,
      sqft: 1250,
      description: "Charming 3BR/2BA Victorian flat in Dolores Heights. Panoramic city views, original hardwood floors, chef's kitchen. Steps to Dolores Park.",
      images: ["https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800&q=80"],
      landlordEmail: "dolores@sfrentals.com",
      reasoning: "Matches your 3+ bed requirement and $3,500-$4,500 budget. Prime location near Dolores Park.",
    },
    {
      price: 4100,
      address: "1425 Market St #302",
      city: "San Francisco",
      state: "CA",
      beds: 3,
      baths: 2,
      sqft: 1400,
      description: "Modern condo in Hayes Valley. Open floor plan, in-unit laundry, rooftop deck. Walking distance to BART, bike parking included.",
      images: ["https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800&q=80"],
      landlordEmail: "market.st@sfmodern.com",
      reasoning: "3 beds within budget, excellent transit access, highly walkable neighborhood.",
    },
    {
      price: 4400,
      address: "2200 Fillmore St",
      city: "San Francisco",
      state: "CA",
      beds: 4,
      baths: 2,
      sqft: 1700,
      description: "Spacious 4BR/2BA in Pacific Heights. Classic architecture, updated kitchen, shared garden. Quiet block near Fillmore shops.",
      images: ["https://images.unsplash.com/photo-1513584684374-8bab748fbf90?w=800&q=80"],
      landlordEmail: "fillmore.rentals@gmail.com",
      reasoning: "4 beds matches your maximum preference. Pacific Heights is safe and well-maintained.",
    },
  ],
  "Brooklyn": [
    {
      price: 3500,
      address: "42 Wythe Ave",
      city: "Brooklyn",
      state: "NY",
      beds: 3,
      baths: 1,
      sqft: 1100,
      description: "Trendy 3BR loft in Williamsburg. Exposed brick, 12ft ceilings, huge windows. L train steps away, rooftop access.",
      images: ["https://images.unsplash.com/photo-1598928506311-c55ded91a20c?w=800&q=80"],
      landlordEmail: "wythe@bkrentals.com",
      reasoning: "Great Williamsburg location, matches your 2-3 bed budget range.",
    },
    {
      price: 4200,
      address: "156 5th Ave",
      city: "Brooklyn",
      state: "NY",
      beds: 3,
      baths: 2,
      sqft: 1300,
      description: "Renovated Park Slope brownstone floor. Modern kitchen, washer/dryer, private backyard patio. Close to Prospect Park.",
      images: ["https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=800&q=80"],
      landlordEmail: "parkslope@nyrentals.net",
      reasoning: "Park Slope brownstone within budget, great neighborhood for young professionals.",
    },
  ],
};

const GENERIC_LISTINGS: AISuggestedListing[] = [
  {
    price: 2800,
    address: "500 Central Ave",
    city: "Austin",
    state: "TX",
    beds: 3,
    baths: 2,
    sqft: 1300,
    description: "Modern 3BR/2BA in East Austin. Open layout, stainless appliances, large backyard. Pet friendly, parking included.",
    images: ["https://images.unsplash.com/photo-1484154218962-a197022b5858?w=800&q=80"],
    landlordEmail: "central@austinrentals.com",
    reasoning: "Affordable option matching your bed/bath requirements.",
  },
  {
    price: 3200,
    address: "1801 Congress Ave",
    city: "Austin",
    state: "TX",
    beds: 4,
    baths: 2,
    sqft: 1600,
    description: "Spacious 4BR house in South Congress. Updated throughout, private yard, garage. Walk to restaurants and music venues.",
    images: ["https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&q=80"],
    landlordEmail: "soco.house@gmail.com",
    reasoning: "4 beds with plenty of space, great entertainment district access.",
  },
];

export async function getAISuggestions(group: Group): Promise<AISuggestedListing[]> {
  // Simulate API delay
  await new Promise((r) => setTimeout(r, 800));

  if (process.env.OPENAI_API_KEY) {
    // In production: Use LLM to generate suggestions based on preferences
    // For now, fall through to mock data even when key is set
  }

  // Find city-specific listings
  const location = group.location ?? "";
  const cityKey = Object.keys(MOCK_CITY_LISTINGS).find((k) =>
    location.toLowerCase().includes(k.toLowerCase())
  );

  const candidates = cityKey
    ? MOCK_CITY_LISTINGS[cityKey]
    : GENERIC_LISTINGS;

  // Filter by budget if set
  const filtered = candidates.filter((l) => {
    if (group.budgetMax && l.price > group.budgetMax) return false;
    if (group.budgetMin && l.price < group.budgetMin * 0.8) return false;
    if (group.bedsMin && l.beds < group.bedsMin) return false;
    if (group.bedsMax && l.beds > group.bedsMax) return false;
    return true;
  });

  return filtered.length > 0 ? filtered : candidates.slice(0, 2);
}
