import { useContext } from "react";
import { SpectodaConnection } from "./SpectodaConnectionContext";

export const useSpectodaConnection = () => {
  const context = useContext(SpectodaConnection);
  if (context === undefined) {
    throw new Error(
      "useSpectodaConnection must be used within a SpectodaConnectionProvider",
    );
  }
  return context;
};
