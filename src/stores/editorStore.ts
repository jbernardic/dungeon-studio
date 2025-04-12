import { create } from "zustand";

type Command = "UNDO" | "REDO" | "EXPORT" | null;

interface EditorState {
  command: Command;
  sendCommand: (cmd: Command) => void;
  clearCommand: () => void;
}

export const useEditorStore = create<EditorState>((set) => ({
  command: null,
  sendCommand: (cmd) => set({ command: cmd }),
  clearCommand: () => set({ command: null }),
}));