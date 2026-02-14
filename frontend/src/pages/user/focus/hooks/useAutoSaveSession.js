import { useEffect, useRef, useState, useCallback } from "react"

export const useAutoSaveSession = ({
    buildPayload,
    saveFunction,
    enabled = true,
    intervalMs = 60000,
}) => {
    const [isDirty, setIsDirty] = useState(false);
    const [saveStatus, setSaveStatus] = useState("saved");
    
    // 1. Create a Ref to track dirty state synchronously
    const isDirtyRef = useRef(false);
    const savingRef = useRef(false);

    const markDirty = useCallback(() => {
        if(!enabled) return;
        setIsDirty(true);
        isDirtyRef.current = true; // Sync ref
    }, [enabled]);

    const performSave = useCallback(async () => {
        // Check Ref, not state, to prevent stale closure issues
        if(!enabled || savingRef.current) return;
        
        // Optional: If you only want to save if dirty
        // if (!isDirtyRef.current) return; 

        console.log("performSave");
        const payload = buildPayload();
        
        if(!payload) return;

        savingRef.current = true;
        setSaveStatus("saving");

        try{
            await saveFunction(payload);
            setSaveStatus("saved");
            
            // Reset both state and ref
            setIsDirty(false);
            isDirtyRef.current = false; 
        } catch(err) {
            console.error("Auto save failed: ", err);
            setSaveStatus("error");
        } finally {
            savingRef.current = false;
        }
    }, [enabled, buildPayload, saveFunction]);

    // Effect 1: Debounce (Saves 2s after stopping typing)
    useEffect(() => {
        if(!isDirty) return; // Rely on state for the debounce trigger
        
        const timeout = setTimeout(()=> {
            performSave();
        }, 2000);

        return () => clearTimeout(timeout);
    }, [isDirty, performSave]);
    
    // Effect 2: Interval (Saves every 60s if dirty)
    useEffect(() => {
        if(!enabled) return;
        
        const interval = setInterval(()=> {
            // 2. Check the REF, not the state
            console.log("Checking interval save...", isDirtyRef.current);
            
            if(isDirtyRef.current) {
                console.log("Interval triggering save");
                performSave();
            }
        }, intervalMs);

        return () => clearInterval(interval);
        // 3. REMOVE isDirty from dependencies so the timer doesn't reset
    }, [enabled, intervalMs, performSave]); 

    return { markDirty, saveStatus, forceSave: performSave };
}