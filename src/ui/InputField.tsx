// TaxiTub UI: InputField (light, rounded, soft border)
import React from "react";
import { TextField, TextFieldProps } from "@mui/material";

export type InputFieldProps = TextFieldProps & {};

export const InputField = React.forwardRef<HTMLInputElement, InputFieldProps>(function InputField(
  { variant = "outlined", fullWidth = true, size = "medium", ...rest },
  ref
) {
  return <TextField ref={ref} variant={variant} fullWidth={fullWidth} size={size} {...rest} />;
});

