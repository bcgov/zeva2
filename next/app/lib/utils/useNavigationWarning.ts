"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

/**
 * Custom hook to handle navigation warnings when form has unsaved changes
 */
export function useNavigationWarning(
  hasUnsavedChanges: boolean,
  onNavigationAttempt: () => void
) {
  const pathname = usePathname();

  useEffect(() => {
    if (!hasUnsavedChanges) {
      return;
    }
    
    const handlePopState = (e: PopStateEvent) => {
      e.preventDefault();
      window.history.pushState(null, "", window.location.href);
      onNavigationAttempt();
    };

    window.history.pushState(null, "", window.location.href);
    window.addEventListener('popstate', handlePopState);

    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, [hasUnsavedChanges, onNavigationAttempt]);

  useEffect(() => {
    if (!hasUnsavedChanges) {
      return;
    }
    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      
      const link = target.closest('a[href]') as HTMLAnchorElement;
      
      if (link) {        
          const linkHref = link.href.startsWith('/') 
            ? `${window.location.origin}${link.href}`
            : link.href;
          const targetUrl = new URL(linkHref);
          const currentUrl = new URL(window.location.href);
          
          if (
            targetUrl.origin === currentUrl.origin &&
            targetUrl.pathname !== currentUrl.pathname
          ) {
            e.preventDefault();
            e.stopPropagation();
            e.stopImmediatePropagation();
            sessionStorage.setItem('pendingNavigation', targetUrl.pathname);
            onNavigationAttempt();
          }
      }
    };

    document.addEventListener('click', handleClick, true);
    return () => {
      document.removeEventListener('click', handleClick, true);
    };
  }, [hasUnsavedChanges, onNavigationAttempt]);
}
