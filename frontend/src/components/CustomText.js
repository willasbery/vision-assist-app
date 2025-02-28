import React from 'react';
import { Text } from '@/src/components/ui/text';
import { styled, StyledProvider } from '@gluestack-style/react';
import { config } from '@gluestack-ui/config';

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
  return (
    <StyledProvider config={config}>
      <StyledText {...props} />
    </StyledProvider>
  );
};
