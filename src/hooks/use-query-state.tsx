import type { Dispatch, SetStateAction } from "react";
import { useCallback, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

export const useQueryState = <
  TValue extends string | undefined,
  TInitial extends TValue = TValue,
>(
  key: string,
  initialState?: undefined | TInitial | (() => TInitial | undefined),
  options: { replace?: boolean } = {},
) => {
  const { replace } = options;
  const [firstRun, setFirstRun] = useState(true);
  const searchParameters = useSearchParams();
  const router = useRouter();

  const state = (searchParameters.get(key) as TValue | null) ?? undefined;
  const [initialStateStored] = useState(() => {
    return initialState instanceof Function ? initialState() : initialState;
  });

  const setState: Dispatch<SetStateAction<TValue>> = useCallback(
    (dispatch) => {
      const previousState = new URLSearchParams(window.location.search).get(
        key,
      ) as TValue | null;

      const newValue =
        dispatch instanceof Function
          ? dispatch((previousState ?? undefined) as TValue)
          : dispatch;

      const newParameters = new URLSearchParams(window.location.search);
      if (newValue === undefined || newValue === "") newParameters.delete(key);
      else if (typeof newValue === "string") newParameters.set(key, newValue);
      else throw new Error("Value must be a string");

      const stringified = "?" + newParameters.toString();
      const newSearch = stringified === "?" ? "" : stringified;
      if (window.location.search !== newSearch) {
        const href = window.location.pathname + newSearch;
        if (replace)
          router.replace(href, {
            scroll: false,
          });
        else
          router.push(href, {
            scroll: false,
          });
      }
    },
    [key, replace, router],
  );

  useEffect(() => {
    setFirstRun(false);
    if (!initialStateStored) return;
    // Only set the initial state if there is none in the URL
    if (state !== undefined) return;
    setState(initialStateStored);
  }, [firstRun, initialStateStored, setState, state]);

  // We don't want to return undefined in the first render
  // because we would have to wait for the useEffect to set the initial state
  return [
    firstRun && state === undefined ? initialStateStored : state,
    setState,
  ] as [TValue, Dispatch<SetStateAction<TValue>>];
};
