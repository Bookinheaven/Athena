import { useLocalStorage } from "./useLocalStorage";

export const useSessionSettings = () => {
  const [breakDuration, setBreakDuration] = useLocalStorage("breakDuration", 5 * 60);
  const [autoStartBreaks, setAutoStartBreaks] = useLocalStorage("autoStartBreaks", true);
  const [breaksNumber, setBreaksNumber] = useLocalStorage("breaksNumber", 4);
  const [isSoundEnabled, setIsSoundEnabled] = useLocalStorage("isSoundEnabled", true);
  const [skipBreaks, setSkipBreaks] = useLocalStorage("skipBreaks", false);
  const [confirmReset, setConfirmReset] = useLocalStorage("confirmReset", true);
  const [soundOnTransition, setSoundOnTransition] = useLocalStorage("soundOnTransition", true);

  const settings = {
    breakDuration,
    autoStartBreaks,
    breaksNumber,
    skipBreaks,
    confirmReset,
    soundOnTransition,
    isSoundEnabled,
  };

  return {
    settings,
    setBreakDuration,
    setAutoStartBreaks,
    setBreaksNumber,
    setSkipBreaks,
    setConfirmReset,
    setSoundOnTransition,
    setIsSoundEnabled,
  };
};
