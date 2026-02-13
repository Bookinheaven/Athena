import { useEffect, useRef, useState } from "react"

export const useAutoSaveSession = ({
    buildPayload,
    saveFunction,
    enabled = true,
    intervalMs = 60000,
}) => {
    const [isDirty, setIsDirty] = useState(false);
    const [saveStatus, setSaveStatus] = useState("saved");
    const savingRef = useRef(false);

    const markDirty = () => {
        if(!enabled) return;
        setIsDirty(true);
    }

    const performSave = async () => {
        if(!enabled || savingRef.current) return;
        console.log(enabled)
        const payload = buildPayload();
        if(!payload) return;

        savingRef.current = true;
        setSaveStatus("saving");

        try{
            await saveFunction(payload);
            setSaveStatus("saved");
            setIsDirty(false);
        } catch(err) {
            console.error("Auto save failed: ", err);
            setSaveStatus("error");
        } finally {
            savingRef.current = false;
        }
    }
    useEffect(() => {
        if(!isDirty) return;
        const timeout = setTimeout(()=> {
            performSave();
        }, 2000);

        return () => clearTimeout(timeout);
    }, [isDirty])
    
    useEffect(() => {
        if(!enabled) return;
        
        const interval = setInterval(()=> {
            if(isDirty) performSave();
            console.log("saved")
        }, intervalMs);

        return () => clearInterval(interval);
    }, [enabled, isDirty])
    return {markDirty, saveStatus, forceSave: performSave}
}