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
    updateTodos,
    createNote,
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
        const handleNewSession = async () => {
        if (!newSession) return;
        
        resetSession();
        setSessionTitle("Untitled Work");
        updateTodos([]);
        
        const note = await createNote({
            title: "",
            content: "<p></p>",
            task: null,
        });

        if (!note) {
            console.warn("Initial note creation failed");
        }
        
        setNewSession(false);
        };
        handleNewSession();
    }, [newSession]);
}