import React from 'react';
import { VStack } from '@/src/components/ui/vstack';
import {
  Select,
  SelectBackdrop,
  SelectItem,
  SelectPortal,
  SelectContent,
  SelectTrigger,
  SelectInput,
  SelectIcon,
} from '@/src/components/ui/select';
import { ChevronDownIcon } from '@/src/components/ui/icon';
import { CustomText } from '@/src/components/CustomText';
import { useAccessibility } from '@/src/hooks/useAccessibility';

const FontSizeSlider = () => {
  const { fontSizeKey, setFontSize, fontSize } = useAccessibility();

  const handleValueChange = (value) => {
    switch (value) {
      case 'Small':
        setFontSize('SMALL');
        break;
      case 'Medium':
        setFontSize('MEDIUM');
        break;
      case 'Large':
        setFontSize('LARGE');
        break;
      case 'Extra Large':
        setFontSize('EXTRA_LARGE');
        break;
    }
  };

  return (
    <VStack>
      <CustomText heading size="lg" color="$textDark900">
        Text Size
      </CustomText>
      <CustomText medium size="sm" color="$textDark500">
        Adjust the size of text and buttons
      </CustomText>

      <Select
        selectedValue={fontSizeKey}
        onValueChange={handleValueChange}
        accessibilityLabel="Choose text size"
      >
        <SelectTrigger>
          <SelectInput
            placeholder="Select text size"
            className="flex-1"
            style={{ fontSize: 16 * fontSize }}
          />
          <SelectIcon className="mr-2" as={ChevronDownIcon} />
        </SelectTrigger>
        <SelectPortal>
          <SelectBackdrop />
          <SelectContent>
            <SelectItem
              style={{ fontSize: 12 * fontSize }}
              label="Small"
              value="Small"
            />
            <SelectItem
              style={{ fontSize: 16 * fontSize }}
              label="Medium"
              value="Medium"
            />
            <SelectItem
              style={{ fontSize: 20 * fontSize }}
              label="Large"
              value="Large"
            />
            <SelectItem
              style={{ fontSize: 24 * fontSize }}
              label="Extra Large"
              value="Extra Large"
            />
          </SelectContent>
        </SelectPortal>
      </Select>
    </VStack>
  );
};

export default FontSizeSlider;
