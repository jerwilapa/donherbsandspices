import { provinces, municipalities, barangays } from "psgc";

const sortText = (a: string, b: string) => a.localeCompare(b, "en", { sensitivity: "base" });

export const getProvinceOptions = () => provinces.all().map((item) => item.name).sort(sortText);

export const getMunicipalityOptions = (province: string, query = "") => {
  const normalized = query.trim().toLowerCase();
  return municipalities
    .all()
    .filter((item) => item.province === province)
    .map((item) => item.name)
    .filter((name) => (!normalized ? true : name.toLowerCase().includes(normalized)))
    .sort(sortText);
};

export const getBarangayOptions = (municipality: string, query = "") => {
  const normalized = query.trim().toLowerCase();
  return barangays
    .all()
    .filter((item) => item.citymun === municipality)
    .map((item) => item.name)
    .filter((name) => (!normalized ? true : name.toLowerCase().includes(normalized)))
    .sort(sortText);
};
