import common from "@/i18n/common";
import type { ScannedProduct } from "@/offline/domain";
import useHousehold from "@/providers/HouseholdProvider";
import { problemOf, type Problem } from "@/utils/problem";
import axios from "@/services/axios";
import type { FoodType } from "@/types/model";

export type ScanResult = { name: string; product: ScannedProduct; conflicts: string[] };

const useProductScan = () => {
  const { household } = useHousehold();
  return async (scanned: string): Promise<ScanResult | Problem> => {
    const barcode = scanned.replace(/\D/g, "");
    const { data: known } = await axios
      .get<FoodType | null>("foods/find", { params: { barcode } })
      .catch(() => ({ data: null }));
    if (known?.name) return { name: known.name, product: { barcode }, conflicts: [] };

    try {
      const { data } = await axios.get<{ name: string; icon?: string; tags?: string[]; quantity?: string; aisle?: string }>(
        `products/${barcode}`,
      );
      if (!data?.name) throw new Error("no product");
      const avoided = household?.eaterProfiles ?? [];
      return {
        name: data.name,
        product: { barcode, icon: data.icon, quantity: data.quantity, aisle: data.aisle },
        conflicts: (data.tags ?? []).filter((tag) => avoided.includes(tag)),
      };
    } catch (error) {
      return problemOf(error, common.feedback.notFound);
    }
  };
};

export default useProductScan;
