import React from 'react';
import { Text } from "@/src/components/ui/text";
import { styled, StyledProvider } from "@gluestack-style/react";
import { config } from "@gluestack-ui/config";

const StyledText = styled(Text, {
  defaultProps: {
    fontFamily: 'Geist'
  },
  variants: {
    heading: {
      true: {
        fontFamily: 'Geist-Bold'
      }
    },
    semibold: {
      true: {
        fontFamily: 'Geist-SemiBold'
      }
    },
    medium: {
      true: {
        fontFamily: 'Geist-Medium'
      }
    }
  }
});

export const CustomText = (props) => {
  return (
    <StyledProvider config={config}>
      <StyledText {...props} />
    </StyledProvider>
  );
}; 