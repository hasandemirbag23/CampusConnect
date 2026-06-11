import { createContext, useCallback, useContext, useEffect, useMemo, useReducer, useRef, useState } from 'react';

import { EVENT_ACTIONS } from '../reducers/constants/actionTypes';
import { eventReducer, initialEventState } from '../reducers/eventReducer';
import { trackEvent } from '../services/analyticsService';
import {
  createEvent,
  fetchEventsPage,
  fetchJoinedEvents,
  fetchMyEvents,
  joinEvent,
  leaveEvent,
  saveEvent,
  subscribeToEvents,
  subscribeToSavedEvents,
  unsaveEvent,
} from '../services/eventService';
import { toggleEventLike } from '../services/likeService';
import { FLAT_LIST } from '../constants';
import { useAuth } from './AuthContext';

const EventContext = createContext(null);

export function EventProvider({ children }) {
  const [state, dispatch] = useReducer(eventReducer, initialEventState);
  const { user } = useAuth();
  const extraPagesRef = useRef([]);
  const lastDocRef = useRef(null);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    let active = true;
    extraPagesRef.current = [];
    lastDocRef.current = null;
    dispatch({ type: EVENT_ACTIONS.SET_LOADING, payload: true });

    const unsubscribe = subscribeToEvents(
      ({ events, lastDoc, hasMore }) => {
        if (!active) return;
        lastDocRef.current = lastDoc;
        const merged = [...events, ...extraPagesRef.current];
        const seen = new Set();
        const deduped = merged.filter((e) => {
          if (seen.has(e.id)) return false;
          seen.add(e.id);
          return true;
        });
        dispatch({ type: EVENT_ACTIONS.SET_EVENTS, payload: deduped });
        dispatch({ type: EVENT_ACTIONS.SET_HAS_MORE, payload: hasMore || extraPagesRef.current.length > 0 });
      },
      state.filters,
      FLAT_LIST.PAGE_SIZE,
    );

    return () => {
      active = false;
      unsubscribe();
    };
  }, [state.filters.category, state.filters.dateRange, state.filters.search, refreshKey]);

  useEffect(() => {
    if (!user) {
      dispatch({ type: EVENT_ACTIONS.SET_MY_EVENTS, payload: [] });
      dispatch({ type: EVENT_ACTIONS.SET_JOINED_EVENTS, payload: [] });
      dispatch({ type: EVENT_ACTIONS.SET_SAVED_EVENTS, payload: [] });
      return undefined;
    }

    let active = true;
    fetchMyEvents(user.uid).then((mine) => {
      if (active) dispatch({ type: EVENT_ACTIONS.SET_MY_EVENTS, payload: mine });
    });
    fetchJoinedEvents(user.uid).then((joined) => {
      if (active) dispatch({ type: EVENT_ACTIONS.SET_JOINED_EVENTS, payload: joined });
    });

    const unsubSaved = subscribeToSavedEvents(user.uid, (saved) => {
      if (active) dispatch({ type: EVENT_ACTIONS.SET_SAVED_EVENTS, payload: saved });
    });

    return () => {
      active = false;
      unsubSaved();
    };
  }, [user]);

  const refreshEvents = useCallback(() => {
    extraPagesRef.current = [];
    lastDocRef.current = null;
    setRefreshKey((k) => k + 1);
  }, []);

  const loadMore = useCallback(async () => {
    if (!state.hasMore || state.isLoading || !lastDocRef.current) return;

    dispatch({ type: EVENT_ACTIONS.SET_LOADING, payload: true });
    try {
      const result = await fetchEventsPage(lastDocRef.current, state.filters);
      extraPagesRef.current = [...extraPagesRef.current, ...result.events];
      lastDocRef.current = result.lastDoc;
      dispatch({
        type: EVENT_ACTIONS.SET_EVENTS,
        payload: [...state.events, ...result.events.filter((e) => !state.events.some((x) => x.id === e.id))],
      });
      dispatch({ type: EVENT_ACTIONS.SET_HAS_MORE, payload: result.hasMore });
    } finally {
      dispatch({ type: EVENT_ACTIONS.SET_LOADING, payload: false });
    }
  }, [state.hasMore, state.isLoading, state.filters, state.events]);

  const setFilters = useCallback((filters) => {
    extraPagesRef.current = [];
    lastDocRef.current = null;
    dispatch({ type: EVENT_ACTIONS.SET_FILTERS, payload: filters });
  }, []);

  const handleCreateEvent = useCallback(
    async (data) => {
      if (!user) throw new Error('Giris gerekli');
      return createEvent(data, user);
    },
    [user],
  );

  const handleJoinEvent = useCallback(
    async (eventId, status = 'confirmed') => {
      if (!user) throw new Error('Giris gerekli');
      await joinEvent(eventId, user.uid, status);
      trackEvent('event_joined', { event_id: eventId });
    },
    [user],
  );

  const handleLeaveEvent = useCallback(
    async (eventId) => {
      if (!user) throw new Error('Giris gerekli');
      await leaveEvent(eventId, user.uid);
    },
    [user],
  );

  const handleSaveEvent = useCallback(
    async (eventId, saved) => {
      if (!user) throw new Error('Giris gerekli');
      if (saved) await saveEvent(user.uid, eventId);
      else await unsaveEvent(user.uid, eventId);
    },
    [user],
  );

  const handleLikeEvent = useCallback(async (eventId, liked) => {
    await toggleEventLike(eventId, liked);
    trackEvent('event_liked', { event_id: eventId });
  }, []);

  const reset = useCallback(() => {
    extraPagesRef.current = [];
    lastDocRef.current = null;
    dispatch({ type: EVENT_ACTIONS.RESET });
  }, []);

  const value = useMemo(
    () => ({
      ...state,
      loadMore,
      refreshEvents,
      setFilters,
      createEvent: handleCreateEvent,
      joinEvent: handleJoinEvent,
      leaveEvent: handleLeaveEvent,
      saveEvent: handleSaveEvent,
      likeEvent: handleLikeEvent,
      reset,
    }),
    [
      state,
      loadMore,
      refreshEvents,
      setFilters,
      handleCreateEvent,
      handleJoinEvent,
      handleLeaveEvent,
      handleSaveEvent,
      handleLikeEvent,
      reset,
    ],
  );

  return <EventContext.Provider value={value}>{children}</EventContext.Provider>;
}

export function useEvents() {
  const context = useContext(EventContext);
  if (!context) {
    throw new Error('useEvents EventProvider icinde kullanilmali');
  }
  return context;
}
