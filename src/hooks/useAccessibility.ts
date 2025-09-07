// TaxiTub Module: Accessibility Hook
// Version: v0.1.0 
// Last Updated: 2025-09-07
// Author: AI Agent
// Changelog: Custom hook for managing accessibility features like inert attribute

import { useEffect, RefObject } from 'react';

/**
 * Hook to manage accessibility features for modal/dialog content
 * Implements inert attribute as suggested by ARIA guidelines
 */
export const useAccessibilityModal = (
  isOpen: boolean,
  modalRef?: RefObject<HTMLElement>
) => {
  useEffect(() => {
    if (!isOpen) return;

    // Store original inert states
    const elementsToMakeInert: HTMLElement[] = [];
    const originalInertStates = new Map<HTMLElement, boolean>();

    // Find all focusable elements outside the modal
    const allElements = document.querySelectorAll('*');
    const modalElement = modalRef?.current;

    allElements.forEach((element) => {
      if (element instanceof HTMLElement) {
        // Skip if element is inside the modal
        if (modalElement && modalElement.contains(element)) {
          return;
        }

        // Check if element is focusable
        if (
          element.tabIndex >= 0 ||
          element.matches('a[href], button, input, textarea, select, details, [contenteditable="true"]')
        ) {
          // Store original inert state and set inert
          originalInertStates.set(element, element.inert || false);
          element.inert = true;
          elementsToMakeInert.push(element);
        }
      }
    });

    // Cleanup function
    return () => {
      elementsToMakeInert.forEach((element) => {
        const originalInert = originalInertStates.get(element);
        if (originalInert !== undefined) {
          element.inert = originalInert;
        }
      });
    };
  }, [isOpen, modalRef]);
};

/**
 * Hook to add proper ARIA attributes to prevent accessibility issues
 */
export const useARIAHiddenFix = (isModalOpen: boolean) => {
  useEffect(() => {
    const rootElement = document.getElementById('root');
    if (!rootElement) return;

    if (isModalOpen) {
      // Instead of aria-hidden, use inert attribute
      if ('inert' in rootElement) {
        rootElement.inert = true;
      }
      
      // Add aria-hidden as fallback for older browsers
      rootElement.setAttribute('aria-hidden', 'true');
      
      // Ensure no focusable elements are accessible
      const focusableElements = rootElement.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      
      focusableElements.forEach((element) => {
        if (element instanceof HTMLElement) {
          element.setAttribute('tabindex', '-1');
          element.setAttribute('data-original-tabindex', element.tabIndex.toString());
        }
      });
      
    } else {
      // Remove inert
      if ('inert' in rootElement) {
        rootElement.inert = false;
      }
      
      // Remove aria-hidden
      rootElement.removeAttribute('aria-hidden');
      
      // Restore original tabindex values
      const elementsWithTabIndex = rootElement.querySelectorAll('[data-original-tabindex]');
      elementsWithTabIndex.forEach((element) => {
        if (element instanceof HTMLElement) {
          const originalTabIndex = element.getAttribute('data-original-tabindex');
          if (originalTabIndex && originalTabIndex !== '-1') {
            element.setAttribute('tabindex', originalTabIndex);
          } else {
            element.removeAttribute('tabindex');
          }
          element.removeAttribute('data-original-tabindex');
        }
      });
    }

    return () => {
      if (rootElement) {
        if ('inert' in rootElement) {
          rootElement.inert = false;
        }
        rootElement.removeAttribute('aria-hidden');
      }
    };
  }, [isModalOpen]);
};
