import React, {
  createContext,
  useCallback,
  useContext,
  useState,
  ReactNode,
} from "react";
import PopupBar from "../components/PopupBar/PopupBar";
import "../components/PopupBar/PopupBar.css";

export type PopupVariant = "INFO" | "SUCCESS" | "ERROR" | "WARNING";

type PopupType = {
  id: number;
  message: string;
  type: PopupVariant;
  leaving?: boolean; // for slide-out animation
};

type PopupContextType = {
  showPopup: (msg: string, type: PopupVariant) => void;
};

const PopupContext = createContext<PopupContextType | undefined>(undefined);

export const PopupProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [popups, setPopups] = useState<PopupType[]>([]);

  const showPopup = useCallback((msg: string, type: PopupVariant) => {
    const id = Date.now() + Math.random(); // unique id
    const newPopup: PopupType = { id, message: msg, type };

    setPopups((prev) => [...prev, newPopup]);

    // Start slide-out after 5s
    setTimeout(() => {
      setPopups((prev) =>
        prev.map((p) => (p.id === id ? { ...p, leaving: true } : p))
      );

      // Remove from DOM after animation duration (0.4s)
      setTimeout(() => {
        setPopups((prev) => prev.filter((p) => p.id !== id));
      }, 400);
    }, 7000);
  }, []);

  return (
    <PopupContext.Provider value={{ showPopup }}>
      {children}
      <div className="popup-container">
        {popups.map((popup) => (
          <PopupBar
            key={popup.id}
            msg={popup.message}
            type={popup.type}
            leaving={popup.leaving}
          />
        ))}
      </div>
    </PopupContext.Provider>
  );
};

export const usePopup = () => {
  const context = useContext(PopupContext);
  if (!context) {
    throw new Error("usePopup must be used within PopupProvider");
  }
  return context;
};
