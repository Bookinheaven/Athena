import { useState, useRef, useEffect } from 'react';
import { Pencil, Target } from 'lucide-react';
import toast from 'react-hot-toast';

export const EditableTitle = ({ title, setTitle, className = "" , onUpdateBackend}) => {
  const [isEditing, setIsEditing] = useState(false);
  const inputRef = useRef(null);
  const [originalTitle, setOriginalTitle] = useState(title);

  useEffect(() => {
    if (!isEditing) {
      setOriginalTitle(title);
    }
  }, [title, isEditing]);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
      adjustInputWidth();
    }
  }, [isEditing]);

  const adjustInputWidth = () => {
    if (inputRef.current) {
      inputRef.current.style.width = 'auto'; 
      inputRef.current.style.width = `${inputRef.current.scrollWidth + 4}px`; 
    }
  };

  useEffect(() => {
    if (isEditing) {
      adjustInputWidth();
    }
  }, [title, isEditing]);


  const saveTitle = () => {
    setIsEditing(false);
    const trimmedTitle = title ? title.trim() : "";

    if (trimmedTitle && trimmedTitle !== originalTitle) {
      setTitle(trimmedTitle);
      toast.success("Title updated!");
      setOriginalTitle(trimmedTitle);
      onUpdateBackend()
    } else if (!trimmedTitle) {
      setTitle(originalTitle);
      toast.error("Title cannot be empty.");
    }
    if (inputRef.current) inputRef.current.style.width = 'auto';
  };

  const handleEscape = () => {
      setTitle(originalTitle);
      setIsEditing(false);
      if (inputRef.current) inputRef.current.style.width = 'auto'; 
  };

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (document.activeElement === inputRef.current) {
        if (event.code === "Space" || event.key.toLowerCase() === "r") {
            event.stopPropagation();
        }
      }
    };
    if (isEditing) {
        document.addEventListener('keydown', handleKeyDown, true);
    }
    return () => {
        document.removeEventListener('keydown', handleKeyDown, true);
    };
  }, [isEditing]);

  const textStyles = "text-4xl lg:text-2xl md:text-3xl font-semibold text-text-primary transition-colors duration-200";

  return (
    <div className={`flex items-center justify-center gap-2 group relative min-h-[2.5rem] ${className}`}>
      <Target
        className={`w-4 h-4 sm:w-5 sm:h-5 shrink-0 text-text-accent`}
        aria-hidden="true"
      />

      {isEditing ? (
          <input
            ref={inputRef}
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onBlur={saveTitle}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {e.target.blur(); }
              else if (e.key === 'Escape') { handleEscape(); }
            }}
            className={`${textStyles} px-1 py-0 bg-transparent focus:outline-none focus:bg-white/5 rounded-sm max-w-[250px]`}
            maxLength={40}
            aria-label="Edit session title"
            style={{ width: 'auto' }}
          />
      ) : (
        <>
          <h1
            onClick={() => { setIsEditing(true); }}
            className={`${textStyles} truncate cursor-pointer hover:text-text-accent`}
            title={"Click to edit title"}
          >
            {title || "Focus Session"}
          </h1>
          {(
             <Pencil
               onClick={() => setIsEditing(true)}
               className="w-3.5 h-3.5 text-text-muted opacity-0 group-hover:opacity-70 transition-opacity duration-200 cursor-pointer shrink-0"
               aria-hidden="true"
            />
          )}
        </>
      )}
    </div>
  );
};