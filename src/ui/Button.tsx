// TaxiTub UI: Button (warm minimalist)
import React from "react";
import { Button as MUIButton, ButtonProps as MUIButtonProps } from "@mui/material";

export type ButtonProps = MUIButtonProps & {};

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = "contained", color = "primary", size = "medium", children, ...rest },
  ref
) {
  return (
    <MUIButton ref={ref} variant={variant} color={color} size={size} {...rest}>
      {children}
    </MUIButton>
  );
});

