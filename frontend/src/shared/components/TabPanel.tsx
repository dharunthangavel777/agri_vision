import React from 'react';

export function TabPanel({
  active,
  children,
}: {
  active: boolean;
  children: React.ReactNode;
}) {
  if (!active) {
    return null;
  }

  return <div className="h-full flex-1 flex flex-col">{children}</div>;
}
