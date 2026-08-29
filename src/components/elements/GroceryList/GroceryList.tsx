"use client";

import { useEffect } from "react";

const GroceryList = () => {
  useEffect(() => {
    const fetchLists = async () => {
      return await fetch("https://jsonplaceholder.typicode.com/todos");
    };

    console.log(fetchLists());
  }, []);
  return "GroceryList";
};
export default GroceryList;
