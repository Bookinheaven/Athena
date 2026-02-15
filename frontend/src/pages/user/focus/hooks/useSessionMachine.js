import { useReducer } from "react";

const sessionReducer = (state, action) => {
  switch (action.type) {
    case "START":
      return { ...state, status: "running" };

    case "PAUSE":
      return { ...state, status: "paused" };

    case "RESUME":
      return { ...state, status: "running" };

    case "TIME_UP":
      const total = state.segments?.length || 0;
      const isLast = state.segmentIndex + 1 >= total;

      if (isLast) {
        return {
          ...state,
          status: "finished",
          isDone: true,
        };
      }
      return { ...state, status: "segment_transition" };

    case "NEXT_SEGMENT": {
      const nextIndex = state.segmentIndex + 1;
      const isLast = nextIndex >= (state.segments?.length || 0);

      if (isLast) {
        return {
          ...state,
          status: "finished",
          isDone: true,
        };
      }

      return {
        ...state,
        segmentIndex: nextIndex,
        status: "idle",
      };
    }

    case "OPEN_REVIEW":
      return { ...state, status: "reviewing" };

    case "RESET_SEGMENT":
      return { ...state, status: "idle" };

    case "RESET_SESSION":
    case "RESET":
      return {
        ...state,
        status: "idle",
        segmentIndex: 0,
        isDone: false,
      };

    case "LOAD":
      return action.payload;

    default:
      return state;
  }
};

export const useSessionMachine = (initialState) => {
  return useReducer(sessionReducer, {
    ...initialState,
    status: "idle",
  });
};
