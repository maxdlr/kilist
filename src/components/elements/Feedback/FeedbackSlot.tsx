import { useFeedback, type FeedbackPlace } from "@/providers/FeedbackStore";
import FeedbackCard from "./FeedbackCard";

const FeedbackSlot = ({ place, collapse }: { place: FeedbackPlace; collapse?: number }) => (
  <FeedbackCard feedback={useFeedback(place)} collapse={collapse} />
);

export default FeedbackSlot;
