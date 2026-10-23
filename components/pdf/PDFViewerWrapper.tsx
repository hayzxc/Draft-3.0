"use client";

import React, { useEffect, useState } from "react";
import dynamic from "next/dynamic";

const DynamicViewer = dynamic(() => import("./ClientViewer"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full w-full min-h-[600px] items-center justify-center bg-slate-100 dark:bg-slate-900 text-slate-500">
      <div className="flex flex-col items-center gap-2">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary-600 border-t-transparent" />
        <span className="text-sm font-medium">Generating live PDF preview...</span>
      </div>
    </div>
  ),
});

interface PDFViewerWrapperProps {
  children: React.ReactElement<any>;
  className?: string;
}

export const PDFViewerWrapper: React.FC<PDFViewerWrapperProps> = ({
  children,
  className = "w-full h-full min-h-[600px] rounded-lg shadow-lg border border-slate-200 dark:border-slate-800",
}) => {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="flex h-full w-full min-h-[600px] items-center justify-center bg-slate-100 dark:bg-slate-900 rounded-lg text-slate-400">
        <span className="text-sm font-medium">Initializing viewer...</span>
      </div>
    );
  }

  return <DynamicViewer className={className}>{children}</DynamicViewer>;
};

export default PDFViewerWrapper;
