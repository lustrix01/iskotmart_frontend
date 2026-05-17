import { useEffect, useState } from "react";

export const productListings = [];

export const serviceListings = [];

export const normalizeText = (value) => String(value || "").toLowerCase();

export function matchesListing(listing, query, category) {
  const normalizedQuery = normalizeText(query).trim();
  const normalizedCategory = normalizeText(category).trim();
  const haystack = normalizeText(
    `${listing.name} ${listing.merchant} ${listing.category}`,
  );

  const categoryMatches =
    !normalizedCategory ||
    normalizeText(listing.category).includes(normalizedCategory);

  return categoryMatches && (!normalizedQuery || haystack.includes(normalizedQuery));
}

export const storefrontDataDecision =
  "Storefront placeholders were removed. Product and service listings now depend on merchant-created catalog records.";

export function useStorefrontListings() {
  const [listings, setListings] = useState([]);
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [onSaleProducts, setOnSaleProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let isMounted = true;

    const load = async () => {
      try {
        const response = await fetch("/api/storefront_offerings.php", {
          credentials: "include",
        });
        const payload = await response.json().catch(() => ({}));
        if (!response.ok) {
          throw new Error(payload.error || "Unable to load storefront items.");
        }

        if (isMounted) {
          setListings(Array.isArray(payload.offerings) ? payload.offerings : []);
          setFeaturedProducts(
            Array.isArray(payload.featuredProducts) ? payload.featuredProducts : [],
          );
          setOnSaleProducts(
            Array.isArray(payload.onSaleProducts) ? payload.onSaleProducts : [],
          );
        }
      } catch (err) {
        if (isMounted) {
          setError(err.message);
          setListings([]);
          setFeaturedProducts([]);
          setOnSaleProducts([]);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    load();
    return () => {
      isMounted = false;
    };
  }, []);

  const products = listings.filter((item) => item.type === "product");
  const services = listings.filter((item) => item.type === "service");

  return { products, services, featuredProducts, onSaleProducts, loading, error };
}
