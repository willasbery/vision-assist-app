import React from 'react';
import { Button, ButtonText } from '@/src/components/ui/button';
import { useAccessibility } from '@/src/hooks/useAccessibility';
import { getColors } from '@/src/theme/colors';

const AccessibleButton = ({ children, style, textStyle, ...props }) => {
  const { highContrast, fontSize } = useAccessibility();
  const colors = getColors(highContrast);

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

  const getButtonStyle = () => {
    const baseStyle = {
      ...getScaledPadding(),
      backgroundColor: colors.primary,
      borderWidth: highContrast ? 2 : 0,
      borderColor: colors.text.light,
    };

    return {
      ...baseStyle,
      ...(style || {}),
    };
  };

  const getTextStyle = () => {
    const baseTextStyle = {
      fontFamily: 'Geist-Regular',
      fontSize: fontSize * 20,
      color: colors.background,
    };

    return {
      ...baseTextStyle,
      ...(textStyle || {}),
    };
  };

  // If children is a string, wrap it in ButtonText
  if (typeof children === 'string') {
    return (
      <Button {...props} style={getButtonStyle()}>
        <ButtonText style={getTextStyle()}>{children}</ButtonText>
      </Button>
    );
  }

  // Otherwise, pass children as is
  return (
    <Button {...props} style={getButtonStyle()}>
      {React.Children.map(children, (child) => {
        if (React.isValidElement(child) && child.type === ButtonText) {
          return React.cloneElement(child, {
            style: {
              ...(child.props.style || {}),
              ...getTextStyle(),
            },
          });
        }
        return child;
      })}
    </Button>
  );
};

export default AccessibleButton;
