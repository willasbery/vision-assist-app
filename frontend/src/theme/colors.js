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
      inactiveTab: '#1f2938',
    },
    error: '#ef4444', // Red
    success: '#10b981', // Green
    warning: '#f59e0b', // Amber
    info: '#3b82f6', // Blue
  },
  highContrast: {
    primary: '#ffffff', // White
    secondary: '#ffffff', // White
    background: '#000000', // Black
    text: {
      dark900: '#ffffff', // White
      dark500: '#ffffff', // White
      light: '#ffffff', // White
      inactiveTab: '#1f2938',
    },
    error: '#ff0000', // Pure red
    success: '#00ff00', // Bright green
    warning: '#ffff00', // Bright yellow
    info: '#00ffff', // Cyan
  },
};

// Helper function to get colors based on contrast mode
export const getColors = (highContrast = false) => {
  return highContrast ? colorSchemes.highContrast : colorSchemes.standard;
};
