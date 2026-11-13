import { useRef, useEffect } from "react";
import {
  ForesightManager,
  type ForesightRegisterOptionsWithoutElement,
  type ForesightRegisterResult,
} from "js.foresight";

export default function useForesight<T extends HTMLElement = HTMLElement>(
  options: ForesightRegisterOptionsWithoutElement
) {
  const elementRef = useRef<T>(null);
  const registerResults = useRef<ForesightRegisterResult | null>(null);

  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    registerResults.current?.unregister();

    registerResults.current = ForesightManager.instance.register({
      element,
      ...options,
    });

    return () => {
      registerResults.current?.unregister();
      registerResults.current = null;
    };
  }, [options]);

  return { elementRef, registerResults };
}