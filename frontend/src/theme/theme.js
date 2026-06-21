import { createTheme } from "@mui/material/styles";

const theme = createTheme({
  palette: {
    mode: "light",
    primary: {
      main: "#1D4E9E",
      light: "#3A6FBF",
      dark: "#143A75",
      contrastText: "#ffffff",
    },
    secondary: {
      main: "#E53935",
      light: "#FF6F60",
      dark: "#AB000D",
      contrastText: "#ffffff",
    },
    background: {
      default: "#F4F6FA",
      paper: "#ffffff",
    },
    text: {
      primary: "#111111",
      secondary: "#5A6478",
    },
    success: {
      main: "#2E7D32",
      light: "#4CAF50",
      dark: "#1B5E20",
    },
    error: {
      main: "#E53935",
      light: "#EF5350",
      dark: "#C62828",
    },
    warning: {
      main: "#F57C00",
      light: "#FFB74D",
    },
    info: {
      main: "#1D4E9E",
      light: "#64B5F6",
    },
    grey: {
      50: "#F8F9FC",
      100: "#F0F2F7",
      200: "#E2E6EF",
      300: "#CBD1DE",
      400: "#9BA5B7",
      500: "#6B7A90",
      600: "#4A5568",
      700: "#374151",
      800: "#1F2937",
      900: "#111827",
    },
    divider: "rgba(29, 78, 158, 0.08)",
  },
  typography: {
    fontFamily: "'Inter', 'Roboto', 'Helvetica Neue', Arial, sans-serif",
    h1: {
      fontWeight: 800,
      letterSpacing: "-0.03em",
      fontSize: "2.5rem",
    },
    h2: {
      fontWeight: 700,
      letterSpacing: "-0.02em",
      fontSize: "2rem",
    },
    h3: {
      fontWeight: 700,
      letterSpacing: "-0.02em",
      fontSize: "1.5rem",
    },
    h4: {
      fontWeight: 700,
      letterSpacing: "-0.02em",
      fontSize: "1.25rem",
    },
    h5: {
      fontWeight: 600,
      fontSize: "1.1rem",
    },
    h6: {
      fontWeight: 600,
      fontSize: "1rem",
    },
    subtitle1: {
      fontWeight: 500,
      color: "#5A6478",
      fontSize: "0.95rem",
    },
    subtitle2: {
      fontWeight: 500,
      color: "#5A6478",
      fontSize: "0.85rem",
    },
    body1: {
      fontSize: "0.95rem",
      lineHeight: 1.6,
    },
    body2: {
      fontSize: "0.875rem",
      lineHeight: 1.5,
    },
    button: {
      textTransform: "none",
      fontWeight: 600,
    },
    overline: {
      fontWeight: 700,
      letterSpacing: "0.1em",
      fontSize: "0.7rem",
    },
  },
  shape: {
    borderRadius: 16,
  },
  shadows: [
    "none",
    "0 1px 3px rgba(29, 78, 158, 0.04)",
    "0 2px 8px rgba(29, 78, 158, 0.06)",
    "0 4px 16px rgba(29, 78, 158, 0.08)",
    "0 6px 24px rgba(29, 78, 158, 0.10)",
    "0 8px 32px rgba(29, 78, 158, 0.12)",
    "0 12px 40px rgba(29, 78, 158, 0.14)",
    "0 16px 48px rgba(29, 78, 158, 0.16)",
    ...Array(17).fill("0 16px 48px rgba(29, 78, 158, 0.16)"),
  ],
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          scrollbarWidth: "thin",
          scrollbarColor: "#CBD1DE transparent",
          "&::-webkit-scrollbar": {
            width: "6px",
            height: "6px",
          },
          "&::-webkit-scrollbar-track": {
            background: "transparent",
          },
          "&::-webkit-scrollbar-thumb": {
            background: "#CBD1DE",
            borderRadius: "3px",
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 16,
          boxShadow: "0 2px 16px rgba(29, 78, 158, 0.06)",
          border: "1px solid rgba(29, 78, 158, 0.06)",
          transition: "box-shadow 0.3s ease, transform 0.2s ease",
          "&:hover": {
            boxShadow: "0 8px 32px rgba(29, 78, 158, 0.12)",
          },
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          borderRadius: 16,
          backgroundImage: "none",
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          padding: "8px 20px",
          fontWeight: 600,
          boxShadow: "none",
          "&:hover": {
            boxShadow: "0 4px 12px rgba(29, 78, 158, 0.2)",
          },
        },
        contained: {
          background: "linear-gradient(135deg, #1D4E9E 0%, #2563EB 100%)",
          "&:hover": {
            background: "linear-gradient(135deg, #143A75 0%, #1D4E9E 100%)",
          },
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          fontWeight: 600,
        },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        head: {
          fontWeight: 700,
          color: "#374151",
          backgroundColor: "#F8F9FC",
          borderBottom: "2px solid rgba(29, 78, 158, 0.1)",
          fontSize: "0.8rem",
          textTransform: "uppercase",
          letterSpacing: "0.05em",
        },
        body: {
          fontSize: "0.875rem",
          borderBottom: "1px solid rgba(29, 78, 158, 0.06)",
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          "& .MuiOutlinedInput-root": {
            borderRadius: 12,
            "&:hover .MuiOutlinedInput-notchedOutline": {
              borderColor: "#1D4E9E",
            },
          },
        },
      },
    },
    MuiDialog: {
      styleOverrides: {
        paper: {
          borderRadius: 20,
          boxShadow: "0 24px 64px rgba(0, 0, 0, 0.15)",
        },
      },
    },
    MuiTab: {
      styleOverrides: {
        root: {
          textTransform: "none",
          fontWeight: 600,
          fontSize: "0.95rem",
          minHeight: 48,
        },
      },
    },
    MuiTabs: {
      styleOverrides: {
        indicator: {
          height: 3,
          borderRadius: "3px 3px 0 0",
        },
      },
    },
    MuiTooltip: {
      styleOverrides: {
        tooltip: {
          borderRadius: 8,
          fontSize: "0.8rem",
          fontWeight: 500,
          backgroundColor: "#1F2937",
        },
      },
    },
  },
});

export default theme;
