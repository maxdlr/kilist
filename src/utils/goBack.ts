import { router } from "expo-router";

const goBack = () => (router.canGoBack() ? router.back() : router.navigate("/"));

export default goBack;
