'use client';

import React from 'react';
import GreekGodsGraph from '@/components/d3/GreekGodsGraph'

const Page: React.FC = () => {
  return (
    <div className="mx-auto">
      <h1 className="text-2xl text-center mt-12 font-semibold">WIP: Force Directed Network Graph</h1>
      <GreekGodsGraph />
    </div>
  );
};

export default Page;
