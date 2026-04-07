const CATEGORIES = [
  "Luxury",
  "Beach",
  "City",
  "Pool",
  "Romantic",
  "Skyline",
];

function inferCategory({ title = "", location = "", country = "" }) {
  const haystack = `${title} ${location} ${country}`.toLowerCase();

  if (haystack.includes("goa") || haystack.includes("beach") || haystack.includes("atlantis")) {
    return "Beach";
  }

  if (haystack.includes("marina") || haystack.includes("shard") || haystack.includes("ritz")) {
    return "Skyline";
  }

  if (haystack.includes("dubai") || haystack.includes("burj") || haystack.includes("pool")) {
    return "Pool";
  }

  if (haystack.includes("udaipur") || haystack.includes("palace")) {
    return "Romantic";
  }

  if (haystack.includes("london") || haystack.includes("delhi") || haystack.includes("mumbai") || haystack.includes("kolkata")) {
    return "City";
  }

  return "Luxury";
}

function inferGuestCount({ title = "", category = "" }) {
  const haystack = `${title} ${category}`.toLowerCase();

  if (haystack.includes("palace") || haystack.includes("marina") || haystack.includes("atlantis")) {
    return 5;
  }

  if (haystack.includes("luxury") || haystack.includes("city")) {
    return 4;
  }

  return 3;
}

module.exports = {
  CATEGORIES,
  inferCategory,
  inferGuestCount,
};
