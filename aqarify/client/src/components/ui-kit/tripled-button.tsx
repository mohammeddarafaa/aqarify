import * as React from "react";
import { NativeButton, type NativeButtonProps } from "@/components/uitripled/native-button-shadcnui";

export type TripledButtonProps = NativeButtonProps;

export function TripledButton({ children, ...props }: TripledButtonProps) {
  return <NativeButton {...props}>{children}</NativeButton>;
}
