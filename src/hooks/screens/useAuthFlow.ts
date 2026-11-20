import common from "@/i18n/common";
import { hasRules, rules } from "@/offline/rules";
import useAuth from "@/providers/AuthProvider";
import { useFormFeedback } from "@/components/elements/Feedback";
import { isProblem, problemOf, type Problem } from "@/utils/problem";
import axios from "@/services/axios";
import { checkPassword } from "@/utils/passwordRules";
import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";

export const SIGNUP_STEPS = ["name", "email", "password", "household"] as const;

export type SignupStepId = (typeof SIGNUP_STEPS)[number];
export type AuthMode = "login" | "signup";
export type HouseholdChoice = "join" | "create";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const AUTH_FIELDS = ["username", "email", "password", "joinCode", "code"] as const;

export type AuthField = (typeof AUTH_FIELDS)[number];

const STEP_FIELDS: Record<SignupStepId, AuthField[]> = {
  name: ["username"],
  email: ["email"],
  password: ["password"],
  household: ["joinCode"],
};

const RESEND_WAIT_S = 30;

const useAuthFlow = () => {
  const { login, signup, loginWithGoogle, completeJoin, isGuest, mergePending, resolveMerge, guestName } =
    useAuth();
  const form = useFormFeedback(AUTH_FIELDS);
  const params = useLocalSearchParams<{ mode?: string }>();
  const startsOnSignup = params.mode === "signup";

  const [mode, setMode] = useState<AuthMode>(startsOnSignup ? "signup" : "login");
  const [step, setStep] = useState(0);
  const [username, setUsernameValue] = useState(startsOnSignup ? guestName : "");
  const [email, setEmailValue] = useState("");
  const [password, setPasswordValue] = useState("");
  const [confirmPassword, setConfirmPasswordValue] = useState("");
  const [householdChoice, setHouseholdChoice] = useState<HouseholdChoice>("create");
  const [householdName, setHouseholdName] = useState("");
  const [joinCode, setJoinCodeValue] = useState("");
  const [creating, setCreating] = useState(false);
  const [mergeOpen, setMergeOpen] = useState(false);
  const [joinStep, setJoinStep] = useState(false);
  const [emailCode, setEmailCodeValue] = useState("");
  const typed =
    <T,>(set: (value: T) => void, ...fields: AuthField[]) =>
    (value: T) => {
      set(value);
      if (fields.length === 0) form.touch();
      fields.forEach((field) => form.touch(field));
    };
  const setUsername = typed(setUsernameValue, "username", ...(mode === "login" ? (["password"] as const) : []));
  const setEmail = typed(setEmailValue, "email");
  const setPassword = typed(setPasswordValue, "password", ...(mode === "login" ? (["username"] as const) : []));
  const setConfirmPassword = typed(setConfirmPasswordValue, "password");
  const setJoinCode = typed(setJoinCodeValue, "joinCode");
  const setEmailCode = typed(setEmailCodeValue, "code");
  const fail = (failed: Problem, title: string) => form.settle(failed, title);
  const [codeSent, setCodeSent] = useState(false);
  const [resendWait, setResendWait] = useState(0);

  useEffect(() => {
    if (resendWait <= 0) return;
    const timer = setTimeout(() => setResendWait((left) => left - 1), 1000);
    return () => clearTimeout(timer);
  }, [resendWait]);

  const isSignup = mode === "signup";
  const stepId: SignupStepId = SIGNUP_STEPS[step]!;
  const isLastStep = step === SIGNUP_STEPS.length - 1;
  const accounts = hasRules() ? rules().accounts : undefined;
  const passwordRules = checkPassword(accounts?.password, password);
  const passwordsMatch = confirmPassword.length > 0 && password === confirmPassword;
  const nameLength = username.trim().length;

  const stepReady: Record<SignupStepId, boolean> = {
    name: nameLength >= (accounts?.usernameMin ?? 1) && nameLength <= (accounts?.usernameMax ?? Infinity),
    email: email.trim().length > 0,
    password: password.length > 0 && passwordRules.every((rule) => rule.met) && passwordsMatch,
    household: householdChoice === "create" || joinCode.trim().length > 0,
  };
  const canSubmit = isSignup ? stepReady[stepId] : username.trim().length > 0 && password.length > 0;

  const switchMode = (next: AuthMode) => {
    form.touch();
    setMode(next);
    setStep(0);
  };

  const enter = (result: boolean | "merge" | Problem, title: string) => {
    if (isProblem(result)) {
      fail(result, title);
      return;
    }
    if (!result) return;
    if (result === "merge") {
      setMergeOpen(true);
      return;
    }
    router.replace("/");
  };

  const createAccount = async () => {
    if (householdChoice === "join" && !joinCode) {
      form.fail("joinCode", common.householdCodeMissing);
      return;
    }
    setCreating(true);
    const result = await signup({
      username,
      email,
      password,
      ...(householdChoice === "join"
        ? { householdChoice: "join", joinCode }
        : { householdChoice: "create", householdName: householdName || undefined }),
    });
    if (result !== true) setCreating(false);
    if (result === "join") setJoinStep(true);
    if (isProblem(result)) {
      const back = SIGNUP_STEPS.findIndex((id) => STEP_FIELDS[id].some((field) => result.fields.includes(field)));
      if (back >= 0) setStep(back);
      fail(result, common.feedback.signupFailed);
    }
  };

  const submit = async () => {
    if (!canSubmit) return;
    if (!isSignup) {
      enter(await login(username, password), common.feedback.loginFailed);
      return;
    }
    if (stepId === "email" && !EMAIL_REGEX.test(email.trim())) {
      form.fail("email", common.emailInvalid);
      return;
    }
    form.touch();
    if (!isLastStep) {
      setStep((current) => current + 1);
      return;
    }
    await createAccount();
  };

  const continueWithGoogle = async () => {
    form.touch();
    const result = await loginWithGoogle();
    if (isProblem(result) && result.code === "google") {
      form.setProblem({ tone: "error", title: result.message, body: common.feedback.googleLine });
      return;
    }
    enter(result, common.google.failed);
  };

  const chooseMerge = async (keep: boolean) => {
    const failed = await resolveMerge(keep);
    if (!failed) {
      router.replace("/");
      return;
    }
    fail(failed, common.feedback.saveFailed);
    setMergeOpen(true);
  };

  const sendCode = async () => {
    try {
      await axios.post("/me/email/code", {}, { network: true } as object);
      form.touch("code");
      if (codeSent) setResendWait(RESEND_WAIT_S);
      setCodeSent(true);
    } catch (error) {
      fail(problemOf(error), common.feedback.saveFailed);
    }
  };

  const finishJoin = async (withCode: boolean) => {
    const failed = await completeJoin(withCode ? { joinCode, code: emailCode } : null);
    if (!failed) setJoinStep(false);
    else fail(failed, common.feedback.joinFailed);
  };

  const passwordChanged = () =>
    form.setProblem({
      tone: "success",
      title: common.feedback.passwordChanged,
      body: common.feedback.passwordChangedLine,
    });

  return {
    mode,
    isSignup,
    switchMode,
    step,
    stepId,
    stepCount: SIGNUP_STEPS.length,
    isLastStep,
    back: () => setStep((current) => Math.max(0, current - 1)),
    canSubmit,
    submit,
    continueWithGoogle,
    creating,
    canLeave: isGuest && !mergePending && router.canGoBack(),
    username,
    setUsername,
    nameLimits: accounts ? { min: accounts.usernameMin, max: accounts.usernameMax } : undefined,
    email,
    setEmail,
    password,
    setPassword,
    confirmPassword,
    setConfirmPassword,
    passwordRules,
    passwordsMatch,
    householdChoice,
    setHouseholdChoice,
    householdName,
    setHouseholdName,
    joinCode,
    setJoinCode,
    mergeOpen,
    closeMerge: () => setMergeOpen(false),
    chooseMerge,
    joinStep,
    emailCode,
    setEmailCode,
    codeSent,
    resendWait,
    sendCode,
    finishJoin,
    fieldError: form.of,
    problem: form.problem,
    passwordChanged,
  };
};

export type AuthFlow = ReturnType<typeof useAuthFlow>;

export default useAuthFlow;
