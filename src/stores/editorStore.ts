import { create } from "zustand";

type Command = "UNDO" | "REDO" | "TOPDOWN_TRUE" | "TOPDOWN_FALSE" | "RESET_CAMERA" | "EXPORT_PNG" | "EXPORT_OBJ" | null;

interface EditorState {
  command: Command;
  isTopDown: boolean;
  sendCommand: (cmd: Command) => void;
  clearCommand: () => void;
  setTopDown: (value: boolean) => void;
}

export const useEditorStore = create<EditorState>((set) => ({
  command: null,
  isTopDown: false,
  sendCommand: (cmd) => set({ command: cmd }),
  clearCommand: () => set({ command: null }),
  setTopDown: (value: boolean) => set({isTopDown: value})
}));