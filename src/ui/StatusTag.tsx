// TaxiTub UI: StatusTag - soft semantic indicators
import React from "react";
import { Chip, ChipProps } from "@mui/material";

export type StatusTagProps = ChipProps & {
  status?: "success" | "error" | "warning" | "info" | "default";
  label: string;
};

export const StatusTag: React.FC<StatusTagProps> = ({ status = "default", label, color, ...rest }) => {
  const map: Record<NonNullable<StatusTagProps["status"]>, ChipProps["color"]> = {
    default: "default",
    success: "success",
    error: "error",
    warning: "warning",
    info: "info",
  };
  return <Chip color={(color ?? map[status]) as any} label={label} size="small" variant="filled" {...(rest as any)} />;
};

