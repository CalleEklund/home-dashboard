import { useState, useEffect, useCallback } from "react";
import type { IcaList } from "../types";
import * as api from "../api";
import { AuthError } from "../api";
import * as settingsApi from "../../../kernel/api/settings";

const POLL_INTERVAL = 60_000;

export function useIcaLists(
  authenticated: boolean | null,
  onAuthExpired: () => void,
  onError: (msg: string) => void,
) {
  const [lists, setLists] = useState<IcaList[]>([]);
  const [lastFetched, setLastFetched] = useState<Date | null>(null);
  const [selectedListId, setSelectedListId] = useState<string | null>(null);
  const [showListPicker, setShowListPicker] = useState(false);

  // Load selected list ID from server
  useEffect(() => {
    settingsApi.getSettings().then((s) => {
      if (s.icaListId) setSelectedListId(s.icaListId);
    }).catch(() => {});
  }, []);

  useEffect(() => {
    if (selectedListId) {
      settingsApi.updateSettings({ icaListId: selectedListId }).catch(() => {});
    }
  }, [selectedListId]);

  const fetchLists = useCallback(async () => {
    try {
      const data = await api.fetchLists();
      setLists(data);
      setLastFetched(new Date());
    } catch (err) {
      if (err instanceof AuthError) {
        onAuthExpired();
        onError(err.message);
      } else {
        onError("Failed to connect to server");
      }
    }
  }, [onAuthExpired, onError]);

  useEffect(() => {
    if (!authenticated) return;
    let cancelled = false;
    const poll = () => {
      api.fetchLists()
        .then((data) => {
          if (cancelled) return;
          setLists(data);
          setLastFetched(new Date());
        })
        .catch((err) => {
          if (cancelled) return;
          if (err instanceof AuthError) { onAuthExpired(); onError(err.message); }
          else onError("Failed to connect to server");
        });
    };
    poll();
    const id = setInterval(poll, POLL_INTERVAL);
    return () => { cancelled = true; clearInterval(id); };
  }, [authenticated, onAuthExpired, onError]);

  // Show picker if no valid selection exists
  const hasValidSelection = selectedListId != null && lists.some((l) => l.id === selectedListId);
  const effectiveShowPicker = showListPicker || (authenticated === true && lists.length > 0 && !hasValidSelection);

  const selectList = (id: string) => {
    setSelectedListId(id);
    setShowListPicker(false);
  };

  const createList = async (name: string) => {
    const created = await api.createList(name);
    setLists((prev) => [...prev, created]);
    selectList(created.id);
  };

  const deleteList = async (listId: string) => {
    await api.deleteList(listId);
    setLists((prev) => prev.filter((l) => l.id !== listId));
    if (selectedListId === listId) {
      setSelectedListId(null);
      settingsApi.updateSettings({ icaListId: null }).catch(() => {});
      setShowListPicker(true);
    }
  };

  const addItem = async (text: string) => {
    if (!selectedListId) return;
    await api.addItem(selectedListId, text);
    await fetchLists();
  };

  const removeItem = async (rowId: string) => {
    await api.removeItem(rowId);
    setLists((prev) =>
      prev.map((l) => ({ ...l, rows: l.rows.filter((r) => r.id !== rowId) })),
    );
  };

  const clearOnLogout = () => {
    setLists([]);
    setSelectedListId(null);
    settingsApi.updateSettings({ icaListId: null }).catch(() => {});
  };

  const activeList = lists.find((l) => l.id === selectedListId) ?? null;

  return {
    lists,
    activeList,
    lastFetched,
    selectedListId,
    showListPicker: effectiveShowPicker,
    setShowListPicker,
    selectList,
    createList,
    deleteList,
    addItem,
    removeItem,
    clearOnLogout,
    fetchLists,
  };
}
