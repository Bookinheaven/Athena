import { useEffect } from "react";
import userService from "../../../../../services/userService";
import { loadSessionData } from "../utils/loadSessionData";

export const useFocusSessionInit = ({
    newSession,
    initialSession,
    setSessionData,
    setIsLoading,
    dispatch,
    setSessionTitle,
    setSessionPlannedDuration,

    // settings setters
    setAutoStartBreaks,
    setBreakDuration,
    setBreaksNumber,
    setSkipBreaks,
    setConfirmReset,
    setSoundOnTransition,
    setIsSoundEnabled,

    // reset handlers
    resetSession,
    setTodos,
    setNotes,
    setNewSession,
}) => {
    // Load settings
    useEffect(() => {
        const fetchSettings = async () => {
        try {
            let res = await userService.getSettings("session");
            if (res?.settings) {
            const s = res.settings;
            setAutoStartBreaks(s.autoStartBreaks ?? true);
            setBreakDuration(s.breakDuration ?? 5 * 60);
            setBreaksNumber(s.breaksNumber ?? 4);
            setSkipBreaks(s.skipBreaks ?? false);
            setConfirmReset(s.confirmReset ?? true);
            setSoundOnTransition(s.soundOnTransition ?? true);
            setIsSoundEnabled(s.isSoundEnabled ?? true);
            }
        } catch (err) {
            console.error("Settings load failed:", err);
        }
        };

        fetchSettings();
    }, []);
    // Load session 
    useEffect(() => {
        if (newSession) return;
        loadSessionData({
            initialSession,
            setSessionData,
            setIsLoading,
            dispatch,
            setSessionTitle,
            setSessionPlannedDuration,
        });
    }, []);

    useEffect(() => {
        if (!newSession) return;
        resetSession();
        setSessionTitle("Untitled Work");
        setTodos([]);
        setNotes([
            {
                id: 1,
                text: "Welcome to your notes!",
                taskId: "",
                createdAt: new Date().toISOString(),
            },
            {
                id: 2,
                text: "Try editing this note.",
                taskId: "",
                createdAt: new Date().toISOString(),
            },
        ]);
        setNewSession(false);
    }, [newSession]);
}