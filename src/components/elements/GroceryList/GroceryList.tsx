"use client";

import useSWR from "swr";

const GroceryList = () => {
  const { data } = useSWR({ url: "health" });
  console.log(data);
  return "GroceryList";
};
export default GroceryList;
