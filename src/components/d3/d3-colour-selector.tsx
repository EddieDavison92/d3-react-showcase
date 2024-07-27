import React, { useState } from 'react';
import * as d3 from 'd3';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuItem
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';

const colorSchemes = {
  sequential: [
    'interpolateBlues', 'interpolateGreens', 'interpolateGreys', 'interpolateOranges',
    'interpolatePurples', 'interpolateReds', 'interpolateTurbo', 'interpolateViridis',
    'interpolateInferno', 'interpolateMagma', 'interpolatePlasma', 'interpolateCividis',
    'interpolateWarm', 'interpolateCool', 'interpolateCubehelixDefault', 'interpolateBuGn',
    'interpolateBuPu', 'interpolateGnBu', 'interpolateOrRd', 'interpolatePuBuGn',
    'interpolatePuBu', 'interpolatePuRd', 'interpolateRdPu', 'interpolateYlGnBu',
    'interpolateYlGn', 'interpolateYlOrBr', 'interpolateYlOrRd'
  ],
  diverging: [
    'interpolateBrBG', 'interpolatePRGn', 'interpolatePiYG', 'interpolatePuOr',
    'interpolateRdBu', 'interpolateRdGy', 'interpolateRdYlBu', 'interpolateRdYlGn',
    'interpolateSpectral'
  ],
  cyclical: [
    'interpolateRainbow', 'interpolateSinebow'
  ]
};

const D3ColourSelector = ({ onSelect }: { onSelect: (scheme: string) => void }) => {
  const [selectedScheme, setSelectedScheme] = useState<string>('interpolateBlues');

  const handleSelect = (scheme: string) => {
    setSelectedScheme(scheme);
    onSelect(scheme);
  };

  const renderColorSchemes = (schemes: string[]) => {
    return schemes.map(scheme => (
      <DropdownMenuItem key={scheme} onClick={() => handleSelect(scheme)}>
        {scheme}
      </DropdownMenuItem>
    ));
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline">{selectedScheme}</Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        <ScrollArea className="max-h-96 w-64 overflow-y-auto">
          <DropdownMenuLabel>Sequential Colours</DropdownMenuLabel>
          {renderColorSchemes(colorSchemes.sequential)}
          <DropdownMenuSeparator />
          <DropdownMenuLabel>Diverging Colours</DropdownMenuLabel>
          {renderColorSchemes(colorSchemes.diverging)}
          <DropdownMenuSeparator />
          <DropdownMenuLabel>Cyclical Colours</DropdownMenuLabel>
          {renderColorSchemes(colorSchemes.cyclical)}
        </ScrollArea>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default D3ColourSelector;
