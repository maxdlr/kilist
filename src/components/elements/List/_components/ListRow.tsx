import { ThemedText } from "@/components/themed-text";
import { ListType } from "@/types/model";
import { Link } from "expo-router";
import { Pressable } from "react-native";
import useGroceryListStyles from "../style";

const ListRow = ({ row }: { row: ListType }) => {
  const { id, title, description } = row;
  const style = useGroceryListStyles();

  return (
    <Link href={`/${id}`} asChild style={style.row}>
      <Pressable>
        <ThemedText style={style.rowTitle} type="default" numberOfLines={1}>
          {title}
        </ThemedText>

        <ThemedText type="small" numberOfLines={1}>
          {description}
        </ThemedText>
      </Pressable>
    </Link>
  );
};

export default ListRow;
