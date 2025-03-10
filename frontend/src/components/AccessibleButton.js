import React from 'react';
import { Button, ButtonText } from '@/src/components/ui/button';
import { useAccessibility } from '@/src/hooks/useAccessibility';

const AccessibleButton = ({ children, style, textStyle, ...props }) => {
  const { fontSize } = useAccessibility();

  // Scale padding based on font size
  const getScaledPadding = () => {
    const basePadding = {
      xs: { x: 8, y: 4 },
      sm: { x: 12, y: 6 },
      md: { x: 16, y: 8 },
      lg: { x: 20, y: 10 },
      xl: { x: 24, y: 12 },
    };

    // Get base padding for the button size
    const base = basePadding[props.size || 'md'] || basePadding.md;

    // Scale padding based on font size
    return {
      height: 'fit',
      width: 'fit',
      paddingHorizontal: base.x * fontSize * 0.2,
      paddingVertical: base.y * fontSize * 0.8,
    };
  };

  const scaledStyle = {
    ...getScaledPadding(),
    ...(style || {}),
  };

  const scaledTextStyle = {
    fontSize: fontSize,
    ...(textStyle || {}),
  };

  // If children is a string, wrap it in ButtonText
  if (typeof children === 'string') {
    return (
      <Button {...props} style={scaledStyle}>
        <ButtonText style={scaledTextStyle}>{children}</ButtonText>
      </Button>
    );
  }

  // Otherwise, pass children as is
  return (
    <Button {...props} style={scaledStyle}>
      {children}
    </Button>
  );
};

export default AccessibleButton;
