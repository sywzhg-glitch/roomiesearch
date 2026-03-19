import axios from "axios";
import * as cheerio from "cheerio";
import type { ScrapedListing } from "@/types";
import { parseBedsText, parseBathsText, parseSqft, parsePrice } from "./utils";

/**
 * Scraping service — extracts listing data from apartment URLs.
 * Supports: Zillow, Apartments.com, Craigslist, Realtor.com, generic fallback.
 * Falls back gracefully on failure so user can enter manually.
 */

interface SiteExtractor {
  matches: (url: string) => boolean;
  extract: ($: cheerio.CheerioAPI, url: string, html: string) => Partial<ScrapedListing>;
}

const extractors: SiteExtractor[] = [
  // --- Zillow ---
  {
    matches: (url) => url.includes("zillow.com"),
    extract: ($, url) => {
      const price = parsePrice(
        $('[data-testid="price"]').text() ||
          $(".sc-kImNAt").text() ||
          $('span:contains("$")').first().text()
      );
      const address =
        $('[data-testid="bdp-building-address"]').text().trim() ||
        $("h1").first().text().trim();
      const bedsText = $('[data-testid="bed-bath-item"]').first().text();
      const bathText = $('[data-testid="bed-bath-item"]').eq(1).text();
      const sqftText = $('[data-testid="bed-bath-item"]').eq(2).text();
      const description = $('[data-testid="description-text"]').text().trim();

      const images: string[] = [];
      $("img[src*='zillowstatic']").each((_, el) => {
        const src = $(el).attr("src");
        if (src && !images.includes(src)) images.push(src);
      });

      return {
        price,
        address,
        beds: parseBedsText(bedsText),
        baths: parseBathsText(bathText),
        sqft: parseSqft(sqftText),
        description: description.slice(0, 2000),
        images: images.slice(0, 8),
      };
    },
  },

  // --- Apartments.com ---
  {
    matches: (url) => url.includes("apartments.com"),
    extract: ($, url) => {
      const price = parsePrice($(".rentLabel, .js-rentalPrice, [data-selenium='price']").text());
      const address = $("[data-selenium='address']").text().trim() || $("h1").first().text().trim();
      const beds = parseBedsText($("[data-selenium='bedsRange']").text() || $(".bedsRange").text());
      const baths = parseBathsText($("[data-selenium='bathsRange']").text() || $(".bathsRange").text());
      const sqft = parseSqft($("[data-selenium='sqftRange']").text());
      const description = $(".descriptionSection p, .js-description").text().trim();

      const images: string[] = [];
      $(".mainImage, .singlePhotoContainer img").each((_, el) => {
        const src = $(el).attr("src") || $(el).attr("data-src");
        if (src && !images.includes(src)) images.push(src);
      });

      return { price, address, beds, baths, sqft, description: description.slice(0, 2000), images: images.slice(0, 8) };
    },
  },

  // --- Craigslist ---
  {
    matches: (url) => url.includes("craigslist.org"),
    extract: ($, url) => {
      const price = parsePrice($(".price").text());
      const address = $(".mapaddress, #map [data-latitude]").attr("data-address") || $("h2.postingtitletext span.postingtitle").text().trim();
      const attrsText = $(".attrgroup").text();
      const beds = parseBedsText(attrsText);
      const baths = parseBathsText(attrsText);
      const sqft = parseSqft(attrsText);
      const description = $("#postingbody").text().replace("QR Code Link to This Post", "").trim();

      const images: string[] = [];
      $("img[src*='craigslist']").each((_, el) => {
        const src = $(el).attr("src");
        if (src && src.includes("600x450") && !images.includes(src)) images.push(src);
      });

      return { price, address, beds, baths, sqft, description: description.slice(0, 2000), images: images.slice(0, 8) };
    },
  },
];

// Generic fallback using Open Graph and JSON-LD
function genericExtract($: cheerio.CheerioAPI, url: string): Partial<ScrapedListing> {
  // Try JSON-LD structured data
  let jsonLd: Record<string, unknown> = {};
  $('script[type="application/ld+json"]').each((_, el) => {
    try {
      const parsed = JSON.parse($(el).html() || "{}");
      if (parsed["@type"]?.includes("Apartment") || parsed["@type"]?.includes("Place")) {
        jsonLd = parsed;
      }
    } catch {
      // ignore
    }
  });

  // Try OG tags
  const ogTitle = $('meta[property="og:title"]').attr("content") || "";
  const ogDescription = $('meta[property="og:description"]').attr("content") || "";
  const ogImage = $('meta[property="og:image"]').attr("content");

  // Try to parse price from title / description
  const priceMatch = (ogTitle + " " + ogDescription).match(/\$[\d,]+/);
  const price = priceMatch ? parsePrice(priceMatch[0]) : undefined;

  const address =
    (jsonLd.address as { streetAddress?: string })?.streetAddress ||
    $('meta[name="geo.placename"]').attr("content") ||
    "";

  const images: string[] = ogImage ? [ogImage] : [];
  $("img").each((_, el) => {
    const src = $(el).attr("src");
    if (src && src.startsWith("http") && !images.includes(src) && images.length < 8) {
      images.push(src);
    }
  });

  const bedsMatch = (ogTitle + ogDescription).match(/(\d+)\s*(?:bed|br)/i);
  const bathsMatch = (ogTitle + ogDescription).match(/(\d+(?:\.\d+)?)\s*(?:bath|ba)/i);
  const sqftMatch = (ogTitle + ogDescription).match(/(\d[\d,]*)\s*(?:sq\.?\s*ft|sqft)/i);

  return {
    price,
    address: address || undefined,
    beds: bedsMatch ? parseInt(bedsMatch[1]) : undefined,
    baths: bathsMatch ? parseFloat(bathsMatch[1]) : undefined,
    sqft: sqftMatch ? parseInt(sqftMatch[1].replace(/,/g, "")) : undefined,
    description: (ogDescription || $("meta[name='description']").attr("content") || "").slice(0, 2000),
    images: images.slice(0, 8),
  };
}

function parseAddress(raw: string): { address?: string; city?: string; state?: string; zip?: string } {
  if (!raw) return {};
  // Try to split "123 Main St, San Francisco, CA 94102"
  const parts = raw.split(",").map((s) => s.trim());
  const address = parts[0];
  const cityPart = parts[1];
  const stateZip = parts[2]?.trim();
  const stateZipMatch = stateZip?.match(/^([A-Z]{2})\s+(\d{5}(?:-\d{4})?)$/);

  return {
    address,
    city: cityPart,
    state: stateZipMatch?.[1],
    zip: stateZipMatch?.[2],
  };
}

export async function scrapeListing(url: string): Promise<ScrapedListing> {
  try {
    const response = await axios.get(url, {
      timeout: 10000,
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.5",
        "Accept-Encoding": "gzip, deflate",
      },
    });

    const html = response.data as string;
    const $ = cheerio.load(html);

    // Find matching extractor
    const extractor = extractors.find((e) => e.matches(url));
    const extracted = extractor ? extractor.extract($, url, html) : genericExtract($, url);

    // Parse address into components if it's a full string
    const addrParts = extracted.address && !extracted.city
      ? parseAddress(extracted.address)
      : {};

    return {
      url,
      scrapingSuccess: true,
      price: extracted.price,
      address: addrParts.address ?? extracted.address,
      city: extracted.city ?? addrParts.city,
      state: extracted.state ?? addrParts.state,
      zip: extracted.zip ?? addrParts.zip,
      beds: extracted.beds,
      baths: extracted.baths,
      sqft: extracted.sqft,
      description: extracted.description,
      images: extracted.images ?? [],
      landlordName: extracted.landlordName,
      landlordEmail: extracted.landlordEmail,
      landlordPhone: extracted.landlordPhone,
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Scraping failed";
    return {
      url,
      scrapingSuccess: false,
      error: `Could not extract listing data: ${message}. Please fill in the details manually.`,
      images: [],
    };
  }
}
