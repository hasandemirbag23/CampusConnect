import { EVENT_ACTIONS } from './constants/actionTypes';

export const initialEventState = {
  events: [],
  myEvents: [],
  joinedEvents: [],
  savedEvents: [],
  hasMore: true,
  isLoading: false,
  filters: { category: null, dateRange: null, search: '' },
  lastDoc: null,
};

export function eventReducer(state, action) {
  switch (action.type) {
    case EVENT_ACTIONS.SET_EVENTS:
      return { ...state, events: action.payload, isLoading: false };
    case EVENT_ACTIONS.APPEND_EVENTS:
      return {
        ...state,
        events: [...state.events, ...action.payload.events],
        lastDoc: action.payload.lastDoc,
        hasMore: action.payload.hasMore,
        isLoading: false,
      };
    case EVENT_ACTIONS.SET_MY_EVENTS:
      return { ...state, myEvents: action.payload };
    case EVENT_ACTIONS.SET_JOINED_EVENTS:
      return { ...state, joinedEvents: action.payload };
    case EVENT_ACTIONS.SET_SAVED_EVENTS:
      return { ...state, savedEvents: action.payload };
    case EVENT_ACTIONS.SET_LOADING:
      return { ...state, isLoading: action.payload };
    case EVENT_ACTIONS.SET_HAS_MORE:
      return { ...state, hasMore: action.payload };
    case EVENT_ACTIONS.SET_FILTERS:
      return { ...state, filters: { ...state.filters, ...action.payload }, lastDoc: null };
    case EVENT_ACTIONS.UPDATE_EVENT:
      return {
        ...state,
        events: state.events.map((event) =>
          event.id === action.payload.id ? { ...event, ...action.payload } : event,
        ),
      };
    case EVENT_ACTIONS.RESET:
      return initialEventState;
    default:
      return state;
  }
}
