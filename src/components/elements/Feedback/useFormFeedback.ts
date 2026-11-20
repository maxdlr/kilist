import { CloudXmarkIcon } from "@/components/icons";
import common from "@/i18n/common";
import type { Problem } from "@/utils/problem";
import { useCallback, useState } from "react";
import type { Feedback } from "./FeedbackCard";
import useFormErrors from "./useFormErrors";

const bodyOf = (failed: Problem) =>
  failed.message === common.unexpected ? common.feedback.nothingLost : failed.message;

const useFormFeedback = <K extends string>(fields: readonly K[] = []) => {
  const errors = useFormErrors<K>();
  const [problem, setProblem] = useState<Feedback | null>(null);
  const { clear } = errors;

  const settle = (failed: Problem | null, title: string) => {
    if (!failed) {
      setProblem(null);
      return true;
    }
    if (failed.message === common.needsConnection) {
      setProblem({ tone: "note", title: common.needsConnection, icon: CloudXmarkIcon });
      return false;
    }
    const hit = fields.filter((field) => failed.fields.includes(field));
    if (hit.length === 0) {
      setProblem({ tone: "error", title, body: bodyOf(failed) });
      return false;
    }
    hit.forEach((field, index) => errors.fail(field, index === hit.length - 1 ? failed.message : ""));
    return false;
  };

  const touch = useCallback(
    (field?: K) => {
      clear(field);
      setProblem(null);
    },
    [clear],
  );

  return { ...errors, problem, setProblem, settle, touch };
};

export type FormFeedback<K extends string> = ReturnType<typeof useFormFeedback<K>>;

export default useFormFeedback;
