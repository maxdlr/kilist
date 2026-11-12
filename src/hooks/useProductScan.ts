import common from "@/i18n/common";
import type { ScannedProduct } from "@/offline/domain";
import useHousehold from "@/providers/HouseholdProvider";
import useToast from "@/providers/ToastProvider";
import axios from "@/services/axios";
import type { FoodType } from "@/types/model";

export type ScanResult = { name: string; product: ScannedProduct; conflicts: string[] };

const useProductScan = () => {
  const { household } = useHousehold();
  const { showToast } = useToast();

  return async (scanned: string): Promise<ScanResult | null> => {
    const barcode = scanned.replace(/\D/g, "");
    const { data: known } = await axios
      .get<FoodType | null>("foods/find", { params: { barcode } })
      .catch(() => ({ data: null }));
    if (known?.name) return { name: known.name, product: { barcode }, conflicts: [] };

    try {
      const { data } = await axios.get<{ name: string; icon?: string; tags?: string[]; quantity?: string }>(
        `products/${barcode}`,
      );
      if (!data?.name) throw new Error("no product");
      const avoided = household?.eaterProfiles ?? [];
      return {
        name: data.name,
        product: { barcode, icon: data.icon, quantity: data.quantity },
        conflicts: (data.tags ?? []).filter((tag) => avoided.includes(tag)),
      };
    } catch (error: any) {
      showToast(error?.response?.data?.message || common.shop.scanFailed);
      return null;
    }
  };
};

export default useProductScan;
