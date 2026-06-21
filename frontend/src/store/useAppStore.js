import { create } from "zustand";

const useAppStore = create((set) => ({
  // Sidebar
  sidebarOpen: true,
  toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),

  // Active model for detection
  activeModelId: null,
  activeModelName: "Roof Model",
  setActiveModel: (id, name) => set({ activeModelId: id, activeModelName: name }),

  // Camera status
  cameraConnected: false,
  setCameraConnected: (val) => set({ cameraConnected: val }),

  // Detection state
  detectionResult: {
    class_name: null,
    confidence: 0.0,
    detected_parts: [],
    configured_parts: [],
    part_statuses: {},
    overall_result: "WAITING",
    cycle_time: 0.0,
    fps: 0.0,
    model_name: "person",
  },
  setDetectionResult: (result) => set({ detectionResult: result }),

  // Backend connectivity
  backendConnected: false,
  setBackendConnected: (val) => set({ backendConnected: val }),
}));

export default useAppStore;
