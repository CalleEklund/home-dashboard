import { useState, useEffect, useCallback } from "react";
import type { IcaList } from "../types";
import * as api from "../api";
import { AuthError } from "../api";

const LIST_STORAGE_KEY = "fridge_ica_list_id";
const POLL_INTERVAL = 60_000;

export function useIcaLists(
  authenticated: boolean | null,
  onAuthExpired: () => void,
  onError: (msg: string) => void,
) {
  const [lists, setLists] = useState<IcaList[]>([]);
  const [lastFetched, setLastFetched] = useState<Date | null>(null);
  const [selectedListId, setSelectedListId] = useState<string | null>(() => {
    try {
      return localStorage.getItem(LIST_STORAGE_KEY);
    } catch {
      return null;
    }
  });
  const [showListPicker, setShowListPicker] = useState(false);

  useEffect(() => {
    if (selectedListId) localStorage.setItem(LIST_STORAGE_KEY, selectedListId);
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
      localStorage.removeItem(LIST_STORAGE_KEY);
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
    localStorage.removeItem(LIST_STORAGE_KEY);
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
