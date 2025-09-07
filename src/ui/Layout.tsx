// TaxiTub UI: Base Layout Wrapper
// Provides consistent background, container width, and spacing

import React from "react";
import { Container, Box } from "@mui/material";

export type BaseLayoutProps = React.PropsWithChildren<{
  id?: string;
}>;

export const BaseLayout: React.FC<BaseLayoutProps> = ({ id, children }) => {
  return (
    <Box sx={{ 
      bgcolor: (t) => t.palette.background.default, 
      flex: 1
    }}>
      <Container
        component="main"
        id={id}
        sx={{
          py: { xs: 2, sm: 3 },
          px: { xs: 2, sm: 3 },
          maxWidth: { xs: "100%", sm: "lg" }
        }}
      >
        {children}
      </Container>
    </Box>
  );
};

