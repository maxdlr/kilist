import common from "@/i18n/common";
import { hasRules, rules } from "@/offline/rules";
import useAuth from "@/providers/AuthProvider";
import useToast from "@/providers/ToastProvider";
import axios from "@/services/axios";
import { checkPassword } from "@/utils/passwordRules";
import { router, useLocalSearchParams } from "expo-router";
import { useState } from "react";

export const SIGNUP_STEPS = ["name", "email", "password", "household"] as const;

export type SignupStepId = (typeof SIGNUP_STEPS)[number];
export type AuthMode = "login" | "signup";
export type HouseholdChoice = "join" | "create";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const useAuthFlow = () => {
  const { login, signup, loginWithGoogle, completeJoin, isGuest, mergePending, resolveMerge, guestName } =
    useAuth();
  const { showToast } = useToast();
  const params = useLocalSearchParams<{ mode?: string }>();
  const startsOnSignup = params.mode === "signup";

  const [mode, setMode] = useState<AuthMode>(startsOnSignup ? "signup" : "login");
  const [step, setStep] = useState(0);
  const [username, setUsername] = useState(startsOnSignup ? guestName : "");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [householdChoice, setHouseholdChoice] = useState<HouseholdChoice>("create");
  const [householdName, setHouseholdName] = useState("");
  const [joinCode, setJoinCode] = useState("");
  const [creating, setCreating] = useState(false);
  const [mergeOpen, setMergeOpen] = useState(false);
  const [joinStep, setJoinStep] = useState(false);
  const [emailCode, setEmailCode] = useState("");
  const [codeSent, setCodeSent] = useState(false);

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
    setMode(next);
    setStep(0);
  };

  const enter = (result: boolean | "merge") => {
    if (!result) return;
    if (result === "merge") {
      setMergeOpen(true);
      return;
    }
    router.replace("/");
  };

  const createAccount = async () => {
    if (householdChoice === "join" && !joinCode) {
      showToast(common.householdCodeMissing);
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
  };

  const submit = async () => {
    if (!canSubmit) return;
    if (!isSignup) {
      enter(await login(username, password));
      return;
    }
    if (stepId === "email" && !EMAIL_REGEX.test(email.trim())) {
      showToast(common.emailInvalid);
      return;
    }
    if (!isLastStep) {
      setStep((current) => current + 1);
      return;
    }
    await createAccount();
  };

  const continueWithGoogle = async () => enter(await loginWithGoogle());

  const chooseMerge = async (keep: boolean) => {
    const done = await resolveMerge(keep);
    if (done) router.replace("/");
    else setMergeOpen(true);
  };

  const sendCode = async () => {
    try {
      await axios.post("/me/email/code", {}, { network: true } as object);
      if (codeSent) showToast(common.emailCode.sent, "info");
      setCodeSent(true);
    } catch (error: any) {
      showToast(error?.response?.data?.message || common.needsConnection);
    }
  };

  const finishJoin = async (withCode: boolean) => {
    const done = await completeJoin(withCode ? { joinCode, code: emailCode } : null);
    if (done) setJoinStep(false);
  };

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
    sendCode,
    finishJoin,
  };
};

export type AuthFlow = ReturnType<typeof useAuthFlow>;

export default useAuthFlow;
