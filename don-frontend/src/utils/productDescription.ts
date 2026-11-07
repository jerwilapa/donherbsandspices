const descriptions: Record<string, string> = {};

const addDescriptions = (names: string[], description: string) => {
    for (const name of names) {
        descriptions[name.replace(/[^a-z0-9]/gi, "").toLowerCase()] = description;
    }
};

addDescriptions(
    ["7 SPICE", "BIRYANI SPICES", "FIVE SPICE PREMIUM POWDER", "GARAM MASALA", "KABSA", "CURRY POWDER", "SHAWARMA SEASONING", "ZAATAR", "CAJUN SEASONING", "GREEK SEASONING", "ITALIAN SEASONING HERBS", "OLD BAY SEASONING", "TACO SEASONING", "AGLIO OLIO SEASONING", "ALL PURPOSE SEASONING", "GINISA MIX POWDER", "CHILI SEASONING"],
    "Best for adding a ready-made, balanced seasoning to rice, marinades, soups, roasted vegetables, and everyday savory dishes. Start with a small amount and adjust to taste.",
);
addDescriptions(
    ["GARLIC FLAKES", "GARLIC FRIED", "GARLIC GRANULATED", "GARLIC MINCED", "GARLIC POWDER", "GARLIC PARMESAN", "FRIED ONION SHALLOT", "ONION MINCED", "ONION POWDER (RED ONION)", "ONION POWDER (WHITE ONION)"],
    "Best for bringing savory allium flavor to stir-fries, soups, sauces, marinades, noodles, and roasted vegetables. Add early for a mellow flavor or near the end for a brighter finish.",
);
addDescriptions(
    ["BLACK CRACKED PEPPER PREMIUM", "BLACK GROUND PEPPER PREMIUM", "BLACK PEPPERMILL GRIND", "BLACK WHOLE PEPPER PREMIUM", "WHITE PEPPER GROUND", "WHITE PEPPER WHOLE", "SZHECHUAN PEPPER POWDER", "SZHECHUAN PEPPER WHOLE"],
    "Best for seasoning meats, soups, sauces, noodles, and vegetables. Add ground pepper near the end for a fresh aroma; use whole pepper in broths and remove before serving if desired.",
);
addDescriptions(
    ["CAROLINA REAPER PEPPER POWDER", "CAYENNE POWDER", "CHILI FLAKES", "CHILI POWDER", "DRIED RED CHILI", "KASMIRI CHILI POWDER", "KOREAN CHILI FLAKES", "KOREAN CHILI POWDER"],
    "Best for adding heat and chili flavor to sauces, marinades, stews, noodles, and stir-fries. These vary in intensity, so begin with a pinch and add gradually.",
);
addDescriptions(
    ["BASIL LEAVES", "BASIL POWDER", "CURRY LEAVES", "DRY MINT", "MARJORAM LEAVES", "MARJORAM POWDER", "OREGANO LEAVES", "OREGANO POWDER", "PARSLEY LEAVES", "PARSLEY POWDER", "ROSEMARY LEAVES", "ROSEMARY POWDER", "SAGE RUBBED", "SAGE WHOLE", "TARRAGON LEAVES WHOLE", "THYME LEAVES", "THYME POWDER", "MALUNGGAY FLAKES", "MALUNGGAY POWDER"],
    "Best for adding herbal aroma to soups, sauces, marinades, vegetables, and meat dishes. Stir into moist dishes while cooking, or sprinkle a little over the finished dish as a garnish.",
);
addDescriptions(
    ["ANNATO SEEDS", "CARAWAY SEEDS", "CARDAMOM WHOLE (BROWN SEEDS)", "CARDAMOM WHOLE (GREEN SEEDS)", "CELERY SEEDS", "CORIANDER SEEDS", "CUMIN SEEDS", "FENNEL SEEDS", "FENUGREEK SEEDS", "MUSTARD SEEDS - BLACK", "MUSTARD SEEDS - YELLOW", "SESAME SEEDS BLACK", "SESAME SEEDS WHITE"],
    "Best for adding texture and aromatic flavor to curries, rice, pickles, breads, and vegetable dishes. Toast whole seeds briefly in a dry pan to release their aroma before adding.",
);
addDescriptions(
    ["ALLSPICE POWDER", "ANNATO POWDER", "CARDAMOM POWDER GREEN", "CELERY POWDER", "CINNAMON BARK", "CINNAMON POWDER", "CINNAMON STICKS", "CINNAMON STICKS - BROKEN", "CLOVES POWDER", "CLOVES WHOLE", "CORIANDER POWDER", "CUMIN POWDER", "FENNEL POWDER", "GINGER POWDER", "MACE POWDER", "MUSTARD POWDER", "NUTMEG POWDER", "NUTMEG WHOLE", "STAR ANISE POWDER", "STAR ANISE WHOLE", "TURMERIC POWDER"],
    "Best for bringing warm, aromatic spice to curries, braises, soups, baked goods, and drinks. Use a light hand at first; add whole pieces to simmering dishes and remove before serving.",
);
addDescriptions(
    ["CINNAMON SUGAR"],
    "Best for topping toast, oatmeal, pancakes, fruit, and baked goods. Sprinkle over the dish just before serving or use as a sweet finishing touch.",
);
addDescriptions(
    ["CORN STARCH", "CASSAVA STARCH", "POTATO STARCH"],
    "Best for thickening soups, sauces, gravies, and fillings, or for coating ingredients before frying. Mix with a little cold water first to make a smooth slurry, then stir into hot liquid.",
);
addDescriptions(
    ["DRIED BANANA BLOSSOM", "DRIED HIBISCUS", "DRIED KAMIAS", "DRIED LEMON", "DRIED MUSHROOM SHITAKE", "TENGA NG DAGA/BLACK FUNGUS"],
    "Best for adding distinctive flavor and texture to soups, stews, and braised dishes. Rehydrate in water before cooking when needed; reserve the soaking liquid for extra flavor if suitable.",
);
addDescriptions(
    ["HIMALAYAN PINK SALT COARSE", "HIMALAYAN PINK SALT FINE", "LEMON SALT", "PINK CURING SALT", "UMAMI SALT", "MSG (PREMIUM)"],
    "Best for seasoning savory dishes to taste. Add gradually while cooking and taste before adding more, especially when the recipe already contains salty ingredients.",
);
addDescriptions(
    ["BEEF POWDER", "BBQ POWDER", "CHICKEN POWDER", "PORK POWDER", "SHRIMP POWDER", "GRAVY MIX"],
    "Best for adding savory depth to soups, sauces, gravies, marinades, rice, and stir-fries. Follow your recipe's liquid and salt levels, then adjust seasoning to taste.",
);
addDescriptions(
    ["CHEESE FLAVOR", "SALTED EGG FLAVORING", "SOUR CREAM AND ONION POWDER"],
    "Best for adding a bold snack-style flavor to fries, popcorn, chips, roasted vegetables, and savory coatings. Sprinkle over warm food so the seasoning clings evenly.",
);
addDescriptions(
    ["LEMON PEPPER SEASONING", "SMOKED PAPRIKA", "SPANISH PAPRIKA POWDER", "TOMATO POWDER", "TAMARIND POWDER", "KASUBHA"],
    "Best for adding a distinctive savory, tangy, or smoky note to marinades, sauces, soups, rice, and roasted vegetables. Add a little at a time and balance to your taste.",
);
addDescriptions(
    ["DRIED LEMON", "LAUREL/BAY LEAVES", "LEMONGRASS POWDER"],
    "Best for flavoring broths, soups, curries, and slow-cooked dishes. Add during simmering to infuse the dish, then remove whole pieces before serving.",
);
addDescriptions(
    ["BLACK CHIA SEEDS"],
    "Best for adding texture to oatmeal, yogurt, smoothies, salads, and baked goods. Soak in liquid to soften and thicken, or sprinkle over a dish just before serving.",
);
addDescriptions(
    ["ANNATO SEEDS"],
    "Best for adding a warm golden-orange color and mild earthy note to rice, stews, marinades, and sauces. Infuse the seeds in warm oil or water, then use the colored liquid in your recipe.",
);
addDescriptions(
    ["ANNATO POWDER"],
    "Best for adding a warm golden-orange color and mild earthy note to rice, stews, marinades, and sauces. Mix a small amount directly into the dish or marinade.",
);
addDescriptions(
    ["PINK CURING SALT"],
    "For curing meat only, using the exact amount and method specified by a trusted curing recipe or the product label. This is not regular table salt; never substitute it one-for-one for ordinary salt.",
);
addDescriptions(
    ["MSG (PREMIUM)"],
    "Best for adding savory depth to soups, stir-fries, sauces, and marinades. Use a small pinch alongside your usual seasonings and adjust to taste.",
);

export const getProductDescription = (name: string): string => {
    const key = name.replace(/[^a-z0-9]/gi, "").toLowerCase();
    return descriptions[key] ??
        "Best for seasoning soups, sauces, marinades, and everyday home cooking. Add a small amount while cooking, taste, and adjust to suit your recipe.";
};
