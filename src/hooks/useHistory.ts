import { useEffect, useMemo, useState } from "react";
import { AsyncStorage } from "react-native";
import { Meal } from "./useMeals";
import {
  EMPTY_NUTRIONAL_VALUES_NUMBERS,
  OptionKey,
  OPTIONS,
} from "./useNutrionalValuePreferences";

export interface HistoryEntry extends Meal {
  dateReadable: string;
  dateIso: string;
}

export function uniqifyEntry(entry: HistoryEntry) {
  return JSON.stringify(entry);
}

export function getLastSundayDate(from = new Date()) {
  const lastSunday = new Date(
    from.getTime() - from.getDay() * 1000 * 60 * 60 * 24
  );
  lastSunday.setHours(0);
  lastSunday.setMinutes(0);
  lastSunday.setSeconds(0);
  lastSunday.setMilliseconds(0);
  return lastSunday;
}

export function getNextSundayDate(from = new Date()) {
  const nextSunday = new Date(
    from.getTime() + (6 - from.getDay()) * 1000 * 60 * 60 * 24
  );
  nextSunday.setHours(0);
  nextSunday.setMinutes(0);
  nextSunday.setSeconds(0);
  nextSunday.setMilliseconds(0);
  return nextSunday;
}

export function useHistory() {
  const [entries, setEntries] = useState<HistoryEntry[]>([]);

  useEffect(() => {
    loadEntries();
  }, []);

  async function loadEntries() {
    try {
      const historyString = await AsyncStorage.getItem("history");
      if (!historyString) return;

      const newHistory = JSON.parse(historyString) as HistoryEntry[];

      if (entries.length === newHistory.length) return;

      setEntries(
        newHistory.sort((e1, e2) =>
          new Date(e1.dateIso).getTime() < new Date(e2.dateIso).getTime()
            ? 1
            : -1
        )
      );
    } catch (e) {
      console.log(e);
    }
  }

  const today = useMemo(() => {
    const dateReadable = new Date().toLocaleDateString();
    const historyToday = entries.filter(
      (entry) => entry.dateReadable === dateReadable
    );

    const sum = historyToday.reduce(
      (sum, entry) => {
        const updatedSum = sum;

        for (const _key in OPTIONS) {
          const key = _key as OptionKey;
          updatedSum[key] += entry[key] || 0;
        }

        return updatedSum;
      },
      { ...EMPTY_NUTRIONAL_VALUES_NUMBERS }
    );

    return {
      entries: historyToday,
      sum,
    };
  }, [entries.length]);

  const weeks = useMemo(() => {
    const [currentWeek, lastWeek] = [
      getLastSundayDate(),
      getNextSundayDate(
        new Date(new Date().getTime() - 1000 * 60 * 60 * 24 * 7)
      ),
    ].map((startDate) => {
      const endDate = getNextSundayDate(startDate);
      const entriesWithinTimeFrame = entries.filter((entry) => {
        const entryDate = new Date(entry.dateIso);

        return (
          entryDate.getTime() >= startDate.getTime() &&
          entryDate.getTime() < endDate.getTime()
        );
      });

      const sum = entriesWithinTimeFrame.reduce(
        (sum, entry) => {
          const updatedSum = sum;

          for (const _key in OPTIONS) {
            const key = _key as OptionKey;
            updatedSum[key] += entry[key] || 0;
          }

          return updatedSum;
        },
        { ...EMPTY_NUTRIONAL_VALUES_NUMBERS }
      );

      const uniqueDaysCount = [
        ...new Set(entriesWithinTimeFrame.map((entry) => entry.dateReadable)),
      ].length;

      const avg = Object.entries(sum).reduce(
        (avg, [key, value]) => {
          return {
            ...avg,
            [key]: value / Math.max(uniqueDaysCount, 1),
          };
        },
        { ...EMPTY_NUTRIONAL_VALUES_NUMBERS }
      );

      return {
        sum,
        avg,
      };
    });

    return {
      current: currentWeek,
      last: lastWeek,
    };
  }, [entries.length]);

  async function add(entry: HistoryEntry) {
    try {
      await AsyncStorage.setItem(
        "history",
        JSON.stringify([...entries, entry])
      );
    } catch {}
    await loadEntries();
  }

  async function addMany(
    newEntries: HistoryEntry[],
    { shouldSort }: { shouldSort?: boolean } = {}
  ) {
    try {
      let insert = [...entries, ...newEntries];

      if (shouldSort) {
        insert = insert.sort((e1, e2) => (e1.dateIso < e2.dateIso ? -1 : 1));
      }

      await AsyncStorage.setItem("history", JSON.stringify(insert));
    } catch {}
    await loadEntries();
  }

  async function remove(dateIso: string) {
    const newEntries: HistoryEntry[] = [];

    for (const entry of entries) {
      if (entry.dateIso === dateIso) continue;
      newEntries.push(entry);
    }

    await AsyncStorage.setItem("history", JSON.stringify(newEntries));
    await loadEntries();
  }

  return {
    entries,
    today,
    weeks,
    reload: loadEntries,
    add,
    addMany,
    remove,
  };
}