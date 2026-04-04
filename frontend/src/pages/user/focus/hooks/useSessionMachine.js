import { useReducer } from "react";

const reducer = (state, action) => {
  switch (action.type) {
    case "INIT":
      return {
        ...state,
        totalSegments: action.payload,
      };
    case "START":
      if (state.status === "running") return state;
      return { ...state, status: "running" };
    case "PAUSE":
      if (state.status !== "running") return state;
      return { ...state, status: "paused" };
    case "NEXT_SEGMENT": {
      const next = state.segmentIndex + 1;
      const isLast = next >= state.totalSegments;
      if (isLast) {
        return { ...state, status: "finished", isDone: true };
      }
      return {
        ...state,
        segmentIndex: next,
        status: "ready",
      };
    }
    case "TIME_UP":
      return { ...state, status: "transition" };
    case "RESET":
      return {
        segmentIndex: 0,
        status: "idle",
        isDone: false,
        totalSegments: state.totalSegments,
      };
    case "LOAD":
      return action.payload;
    default:
      return state;
  }
};

export const useSessionMachine = (totalSegments) => {
  return useReducer(reducer, {
    segmentIndex: 0,
    status: "idle",
    isDone: false,
    totalSegments,
  });
};