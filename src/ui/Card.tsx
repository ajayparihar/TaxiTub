// TaxiTub UI: Card (soft flat)
import React from "react";
import { Paper, PaperProps } from "@mui/material";

export type CardProps = PaperProps & {
  padding?: number | string;
};

export const Card: React.FC<CardProps> = ({ children, padding = 2, sx, ...rest }) => {
  return (
    <Paper sx={{ p: padding, borderRadius: (t) => t.shape.borderRadius, ...sx }} {...rest}>
      {children}
    </Paper>
  );
};

