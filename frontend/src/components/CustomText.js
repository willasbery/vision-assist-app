import React from 'react';
import { Text } from '@/src/components/ui/text';
import { styled, StyledProvider } from '@gluestack-style/react';
import { config } from '@gluestack-ui/config';
import { useAccessibility } from '@/src/hooks/useAccessibility';
import { getColors } from '@/src/theme/colors';

export const StyledText = styled(Text, {
  defaultProps: {
    fontFamily: 'Geist',
  },
  variants: {
    heading: {
      true: {
        fontFamily: 'Geist-Bold',
      },
    },
    semibold: {
      true: {
        fontFamily: 'Geist-SemiBold',
      },
    },
    medium: {
      true: {
        fontFamily: 'Geist-Medium',
      },
    },
    regular: {
      true: {
        fontFamily: 'Geist-Regular',
      },
    },
  },
});

export const CustomText = (props) => {
  const { fontSize, highContrast } = useAccessibility();
  const colors = getColors(highContrast);

  const sizeMap = {
    xs: 12,
    sm: 14,
    md: 16,
    lg: 18,
    xl: 20,
    '2xl': 24,
    '3xl': 30,
    '4xl': 36,
    '5xl': 48,
    '6xl': 60,
  };

  // Calculate scaled font size based on the accessibility setting
  const getScaledSize = () => {
    if (!props.size) return undefined;

    // If size is a string (like 'sm', 'md', etc.), convert to numeric
    if (typeof props.size === 'string' && sizeMap[props.size]) {
      return sizeMap[props.size] * fontSize;
    }

    // If size is already numeric, just scale it
    if (typeof props.size === 'number') {
      return props.size * fontSize;
    }

    return undefined;
  };

  const getScaledPadding = () => {
    if (!props.size) return undefined;

    if (typeof props.size === 'string' && sizeMap[props.size]) {
      return sizeMap[props.size] * fontSize * 0.4;
    }

    if (typeof props.size === 'number') {
      return props.size * fontSize * 0.35;
    }

    return undefined;
  };

  // Apply high contrast colors if needed
  const getTextColor = () => {
    if (!props.color) return undefined;

    // Map color props to high contrast colors
    if (highContrast) {
      if (props.color === '$textDark900' || props.color === '$textDark500') {
        return colors.text.dark900;
      }

      if (props.color === '$textLight') {
        return colors.text.light;
      }

      if (props.color === '$error700') {
        return colors.error;
      }
    }

    return props.color;
  };

  // Create new props with scaled font size and high contrast colors
  const accessibleProps = {
    ...props,
    fontSize: getScaledSize(),
    color: getTextColor(),
    paddingBottom: getScaledPadding(),
    paddingTop: getScaledPadding(),
  };

  return (
    <StyledProvider config={config}>
      <StyledText {...accessibleProps} />
    </StyledProvider>
  );
};
