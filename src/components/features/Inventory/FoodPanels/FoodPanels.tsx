import ActionPanel from "@/components/elements/ActionPanel";
import type { InventoryShelf } from "@/hooks/screens/useInventoryShelf";
import { useSkin } from "@/providers/SkinProvider";
import { caseFor } from "@/skins";
import FoodFormModal from "../FoodFormModal";

const FoodPanels = ({ shelf }: { shelf: InventoryShelf }) => {
  const skin = useSkin();
  const copy = skin.copy.inventory;
  const { editingFood } = shelf;

  return (
    <>
      <ActionPanel request={shelf.actionRequest} onClose={shelf.closeActionPanel} />

      <FoodFormModal
        visible={shelf.isAddVisible}
        formKey={`add-${shelf.addKey}`}
        scannable
        title={copy.addTitle}
        initialName={shelf.addInitialName}
        onSubmit={shelf.createFood}
        onClose={shelf.closeAdd}
      />

      <FoodFormModal
        visible={editingFood !== null}
        formKey={editingFood?.id}
        title={copy.editTitle(editingFood ? caseFor(skin, editingFood.name) : "")}
        food={editingFood}
        onSubmit={async (data) => {
          if (!editingFood) return false;
          return shelf.editFood(editingFood.id, data);
        }}
        onQuietSave={(changes) => {
          if (editingFood) shelf.saveDetails(editingFood.id, changes);
        }}
        onRemove={shelf.removeEditing}
        onClose={shelf.closeEdit}
      />
    </>
  );
};

export default FoodPanels;
