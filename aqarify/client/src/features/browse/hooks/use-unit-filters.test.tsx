import { describe, expect, it } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { useUnitFilters } from "./use-unit-filters";

function wrapper(initialEntries: string[]) {
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return <MemoryRouter initialEntries={initialEntries}>{children}</MemoryRouter>;
  };
}

describe("useUnitFilters", () => {
  it("does not leak tenant/t/as params into filters", () => {
    const { result } = renderHook(() => useUnitFilters(), {
      wrapper: wrapper(["/browse?tenant=kdevelopments&type=Apartment"]),
    });
    expect(result.current.filters).toEqual({ type: "Apartment" });
    expect(result.current.hasActiveFilters).toBe(true);
  });

  it("does not count only tenant context as an active filter", () => {
    const { result } = renderHook(() => useUnitFilters(), {
      wrapper: wrapper(["/browse?tenant=kdevelopments"]),
    });
    expect(result.current.hasActiveFilters).toBe(false);
  });

  it("ignores attempts to set reserved keys via setFilter", () => {
    const { result } = renderHook(() => useUnitFilters(), {
      wrapper: wrapper(["/browse?tenant=k"]),
    });
    act(() => result.current.setFilter("tenant", "other"));
    expect(result.current.filters).toEqual({});
  });

  it("clears filters but preserves tenant context", () => {
    const { result } = renderHook(() => useUnitFilters(), {
      wrapper: wrapper(["/browse?tenant=k&type=Apartment&bedrooms=3"]),
    });
    act(() => result.current.clearFilters());
    expect(result.current.filters).toEqual({});
    expect(result.current.hasActiveFilters).toBe(false);
  });
});
