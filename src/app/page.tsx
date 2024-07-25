import React from 'react';
import { Button } from "@/components/ui/button";

const Page: React.FC = () => {
  return (
    <div className="mt-8 mx-auto max-w-6xl">
      <h1 className="text-2xl text-center font-bold">D3 React Showcase</h1>
      <p className="text-center mt-4">This site is under construction. Please visit the following links:</p>
      <div className="flex justify-center mt-4 space-x-4">
        <Button asChild>
          <a href="/animated-choropleth">Animated Choropleth</a>
        </Button>
        <Button asChild>
          <a href="/scatterplot-matrix">Scatterplot Matrix</a>
        </Button>
      </div>
    </div>
  );
};

export default Page;
