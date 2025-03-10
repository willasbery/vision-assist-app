// Define color schemes for standard and high contrast modes
export const colorSchemes = {
  standard: {
    primary: '#3b82f6', // Blue
    secondary: '#e5e7eb', // Light gray
    background: '#ffffff', // White
    text: {
      dark900: '#1f2937', // Very dark gray
      dark500: '#6b7280', // Medium gray
      light: '#ffffff', // White
    },
    error: '#ef4444', // Red
    success: '#10b981', // Green
    warning: '#f59e0b', // Amber
    info: '#3b82f6', // Blue
  },
  highContrast: {
    primary: '#0000ff', // Pure blue
    secondary: '#000000', // Black
    background: '#ffffff', // White
    text: {
      dark900: '#000000', // Black
      dark500: '#000000', // Black
      light: '#ffffff', // White
    },
    error: '#ff0000', // Pure red
    success: '#008000', // Pure green
    warning: '#ff8000', // Pure orange
    info: '#0000ff', // Pure blue
  },
};

// Helper function to get colors based on contrast mode
export const getColors = (highContrast = false) => {
  return highContrast ? colorSchemes.highContrast : colorSchemes.standard;
};
