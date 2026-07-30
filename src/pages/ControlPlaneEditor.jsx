import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import UnifiedGraphEditor from '@/pages/UnifiedGraphEditor';

export default function ControlPlaneEditor() {
  const location = useLocation();
  if (new URLSearchParams(location.search).get('type') !== 'query') {
    return <Navigate to="/ControlPlaneEditor?type=query" replace />;
  }
  return <UnifiedGraphEditor />;
}