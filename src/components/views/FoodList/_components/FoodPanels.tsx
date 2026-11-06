import ActionPanel from "@/components/elements/ActionPanel";
import type { FoodShelf } from "@/hooks/screens/useFoodShelf";
import { useSkin } from "@/providers/SkinProvider";
import { caseFor } from "@/skins";
import FoodFormModal from "./FoodFormModal";

const FoodPanels = ({ shelf }: { shelf: FoodShelf }) => {
  const skin = useSkin();
  const copy = skin.copy.list;
  const { editingFood } = shelf;

  return (
    <>
      <ActionPanel request={shelf.actionRequest} onClose={shelf.closeActionPanel} />

      <FoodFormModal
        visible={shelf.isAddVisible}
        formKey={`add-${shelf.addInitialName}`}
        title={copy.addTitle}
        initialName={shelf.addInitialName}
        onSubmit={shelf.createFood}
        onClose={shelf.closeAdd}
      />

      <FoodFormModal
        visible={editingFood !== null}
        formKey={editingFood?.id}
        title={copy.editTitle(editingFood ? caseFor(skin, editingFood.name) : "")}
        initialName={editingFood?.name}
        initialDescription={editingFood?.description}
        onSubmit={async (data) => {
          if (!editingFood) return false;
          return shelf.editFood(editingFood.id, data);
        }}
        onRemove={shelf.removeEditing}
        onClose={shelf.closeEdit}
      />
    </>
  );
};

export default FoodPanels;
