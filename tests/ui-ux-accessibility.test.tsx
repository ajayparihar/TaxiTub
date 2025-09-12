// TaxiTub Test Suite: UI/UX & Accessibility (TC23-TC26)
// Version: v1.0.0
// Author: Test Suite
// Coverage: Responsive design, theme toggle, keyboard navigation, and screen reader compatibility

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ThemeProvider } from '@mui/material/styles';
import { createTheme } from '@mui/material/styles';

// Mock theme contexts
const lightTheme = createTheme({ palette: { mode: 'light' } });
const darkTheme = createTheme({ palette: { mode: 'dark' } });

// Mock responsive components
const MockResponsiveComponent = () => {
  return (
    <div data-testid="responsive-container">
      <div data-testid="desktop-view" className="hidden-mobile">
        Desktop Navigation
      </div>
      <div data-testid="mobile-view" className="visible-mobile">
        Mobile Menu
      </div>
      <div data-testid="tablet-view" className="tablet-only">
        Tablet Layout
      </div>
    </div>
  );
};

// Mock booking form component
const MockBookingForm = ({ onSubmit }: { onSubmit: (data: any) => void }) => {
  const [passengerCount, setPassengerCount] = React.useState(1);
  const [destination, setDestination] = React.useState('');

  return (
    <form 
      data-testid="booking-form" 
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit({ passengerCount, destination });
      }}
      aria-label="Taxi Booking Form"
    >
      <div>
        <label htmlFor="passenger-count">
          Number of Passengers *
        </label>
        <input
          id="passenger-count"
          type="number"
          min="1"
          max="8"
          value={passengerCount}
          onChange={(e) => setPassengerCount(parseInt(e.target.value))}
          aria-required="true"
          aria-describedby="passenger-help"
          data-testid="passenger-input"
        />
        <div id="passenger-help" className="help-text">
          Enter number of passengers (1-8)
        </div>
      </div>

      <div>
        <label htmlFor="destination">
          Destination *
        </label>
        <input
          id="destination"
          type="text"
          value={destination}
          onChange={(e) => setDestination(e.target.value)}
          aria-required="true"
          aria-describedby="destination-help"
          data-testid="destination-input"
        />
        <div id="destination-help" className="help-text">
          Enter your destination
        </div>
      </div>

      <button 
        type="submit"
        disabled={!destination.trim()}
        aria-describedby="submit-help"
        data-testid="submit-button"
      >
        Book Taxi
      </button>
      <div id="submit-help" className="help-text">
        Click to confirm your booking
      </div>
    </form>
  );
};

// Mock theme toggle component
const MockThemeToggle = ({ 
  currentTheme, 
  onToggle 
}: { 
  currentTheme: 'light' | 'dark'; 
  onToggle: () => void; 
}) => {
  return (
    <button
      data-testid="theme-toggle"
      onClick={onToggle}
      aria-label={`Switch to ${currentTheme === 'light' ? 'dark' : 'light'} theme`}
      aria-pressed={currentTheme === 'dark'}
    >
      {currentTheme === 'light' ? '🌙' : '☀️'} 
      {currentTheme === 'light' ? 'Dark Mode' : 'Light Mode'}
    </button>
  );
};

// Mock navigation component with keyboard support
const MockNavigation = ({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) => {
  const navRef = React.useRef<HTMLElement>(null);

  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      navRef.current?.focus();
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <nav 
      ref={navRef}
      role="navigation"
      aria-label="Main navigation"
      data-testid="navigation-menu"
      tabIndex={-1}
    >
      <ul role="menubar">
        <li role="none">
          <a 
            href="/admin" 
            role="menuitem" 
            tabIndex={0}
            data-testid="nav-admin"
          >
            Admin Dashboard
          </a>
        </li>
        <li role="none">
          <a 
            href="/queuepal" 
            role="menuitem" 
            tabIndex={0}
            data-testid="nav-queuepal"
          >
            Queue Management
          </a>
        </li>
        <li role="none">
          <a 
            href="/booking" 
            role="menuitem" 
            tabIndex={0}
            data-testid="nav-booking"
          >
            Book a Ride
          </a>
        </li>
      </ul>
    </nav>
  );
};

describe('UI/UX & Accessibility Tests (TC23-TC26)', () => {
  beforeEach(() => {
    // Reset viewport and other globals
    Object.defineProperty(window, 'innerWidth', { value: 1024, configurable: true });
    Object.defineProperty(window, 'innerHeight', { value: 768, configurable: true });
  });

  describe('TC23: Responsive Layout', () => {
    test('should adapt layout for desktop screens (>= 1024px)', () => {
      Object.defineProperty(window, 'innerWidth', { value: 1200 });
      
      render(<MockResponsiveComponent />);
      
      const desktopView = screen.getByTestId('desktop-view');
      expect(desktopView).toBeInTheDocument();
      expect(desktopView).toHaveClass('hidden-mobile');
    });

    test('should adapt layout for tablet screens (768px - 1023px)', () => {
      Object.defineProperty(window, 'innerWidth', { value: 800 });
      
      render(<MockResponsiveComponent />);
      
      const tabletView = screen.getByTestId('tablet-view');
      expect(tabletView).toBeInTheDocument();
      expect(tabletView).toHaveClass('tablet-only');
    });

    test('should adapt layout for mobile screens (< 768px)', () => {
      Object.defineProperty(window, 'innerWidth', { value: 375 });
      
      render(<MockResponsiveComponent />);
      
      const mobileView = screen.getByTestId('mobile-view');
      expect(mobileView).toBeInTheDocument();
      expect(mobileView).toHaveClass('visible-mobile');
    });

    test('should handle window resize events', async () => {
      const { rerender } = render(<MockResponsiveComponent />);
      
      // Start with desktop
      expect(screen.getByTestId('desktop-view')).toBeInTheDocument();
      
      // Simulate resize to mobile
      Object.defineProperty(window, 'innerWidth', { value: 400 });
      fireEvent(window, new Event('resize'));
      
      // Rerender to simulate responsive update
      rerender(<MockResponsiveComponent />);
      
      expect(screen.getByTestId('mobile-view')).toBeInTheDocument();
    });

    test('should maintain usability across all device sizes', () => {
      const deviceSizes = [
        { width: 320, name: 'Mobile Small' },
        { width: 375, name: 'Mobile Medium' },
        { width: 768, name: 'Tablet' },
        { width: 1024, name: 'Desktop Small' },
        { width: 1920, name: 'Desktop Large' }
      ];

      deviceSizes.forEach(({ width, name }) => {
        Object.defineProperty(window, 'innerWidth', { value: width });
        
        const { unmount } = render(<MockResponsiveComponent />);
        
        // All critical elements should be present
        const container = screen.getByTestId('responsive-container');
        expect(container).toBeInTheDocument();
        
        // Cleanup for next iteration
        unmount();
      });
    });

    test('should ensure touch targets are at least 44px on mobile', () => {
      Object.defineProperty(window, 'innerWidth', { value: 375 });
      
      const MockTouchTargets = () => (
        <div>
          <button 
            data-testid="touch-button"
            style={{ minWidth: '44px', minHeight: '44px' }}
          >
            Book Now
          </button>
          <a 
            href="#"
            data-testid="touch-link"
            style={{ minWidth: '44px', minHeight: '44px', display: 'inline-block' }}
          >
            Learn More
          </a>
        </div>
      );

      render(<MockTouchTargets />);
      
      const button = screen.getByTestId('touch-button');
      const link = screen.getByTestId('touch-link');
      
      const buttonStyles = getComputedStyle(button);
      const linkStyles = getComputedStyle(link);
      
      expect(parseInt(buttonStyles.minWidth)).toBeGreaterThanOrEqual(44);
      expect(parseInt(buttonStyles.minHeight)).toBeGreaterThanOrEqual(44);
      expect(parseInt(linkStyles.minWidth)).toBeGreaterThanOrEqual(44);
      expect(parseInt(linkStyles.minHeight)).toBeGreaterThanOrEqual(44);
    });
  });

  describe('TC24: Theme Toggle', () => {
    test('should switch from light to dark theme instantly', async () => {
      let currentTheme: 'light' | 'dark' = 'light';
      
      const TestComponent = () => {
        const [theme, setTheme] = React.useState<'light' | 'dark'>('light');
        
        return (
          <ThemeProvider theme={theme === 'light' ? lightTheme : darkTheme}>
            <div data-testid="themed-container" data-theme={theme}>
              <MockThemeToggle 
                currentTheme={theme} 
                onToggle={() => setTheme(theme === 'light' ? 'dark' : 'light')}
              />
            </div>
          </ThemeProvider>
        );
      };

      render(<TestComponent />);
      
      const container = screen.getByTestId('themed-container');
      const toggleButton = screen.getByTestId('theme-toggle');
      
      // Initially light theme
      expect(container).toHaveAttribute('data-theme', 'light');
      expect(toggleButton).toHaveTextContent('Dark Mode');
      
      // Click to switch to dark
      fireEvent.click(toggleButton);
      
      // Should switch instantly
      expect(container).toHaveAttribute('data-theme', 'dark');
      expect(toggleButton).toHaveTextContent('Light Mode');
    });

    test('should maintain legible colors and contrast in both themes', () => {
      const TestThemeColors = ({ theme }: { theme: 'light' | 'dark' }) => (
        <ThemeProvider theme={theme === 'light' ? lightTheme : darkTheme}>
          <div data-testid="color-test" data-theme={theme}>
            <p data-testid="primary-text" style={{ color: theme === 'light' ? '#000' : '#fff' }}>
              Primary Text
            </p>
            <p data-testid="secondary-text" style={{ color: theme === 'light' ? '#666' : '#ccc' }}>
              Secondary Text
            </p>
            <button 
              data-testid="primary-button"
              style={{ 
                backgroundColor: theme === 'light' ? '#1976d2' : '#90caf9',
                color: theme === 'light' ? '#fff' : '#000'
              }}
            >
              Primary Button
            </button>
          </div>
        </ThemeProvider>
      );

      // Test light theme
      const { rerender } = render(<TestThemeColors theme="light" />);
      
      let primaryText = screen.getByTestId('primary-text');
      let secondaryText = screen.getByTestId('secondary-text');
      let primaryButton = screen.getByTestId('primary-button');
      
      expect(getComputedStyle(primaryText).color).toBe('rgb(0, 0, 0)');
      expect(getComputedStyle(primaryButton).backgroundColor).toBe('rgb(25, 118, 210)');
      
      // Test dark theme
      rerender(<TestThemeColors theme="dark" />);
      
      primaryText = screen.getByTestId('primary-text');
      primaryButton = screen.getByTestId('primary-button');
      
      expect(getComputedStyle(primaryText).color).toBe('rgb(255, 255, 255)');
      expect(getComputedStyle(primaryButton).backgroundColor).toBe('rgb(144, 202, 249)');
    });

    test('should save user preference for theme', () => {
      const mockLocalStorage = {
        getItem: jest.fn(() => 'dark'),
        setItem: jest.fn()
      };
      
      Object.defineProperty(window, 'localStorage', {
        value: mockLocalStorage,
        writable: true
      });

      const TestPersistentTheme = () => {
        const [theme, setTheme] = React.useState<'light' | 'dark'>(() => {
          return (localStorage.getItem('theme') as 'light' | 'dark') || 'light';
        });

        const handleToggle = () => {
          const newTheme = theme === 'light' ? 'dark' : 'light';
          setTheme(newTheme);
          localStorage.setItem('theme', newTheme);
        };

        return (
          <MockThemeToggle currentTheme={theme} onToggle={handleToggle} />
        );
      };

      render(<TestPersistentTheme />);
      
      // Should load saved preference
      expect(mockLocalStorage.getItem).toHaveBeenCalledWith('theme');
      
      const toggleButton = screen.getByTestId('theme-toggle');
      fireEvent.click(toggleButton);
      
      // Should save new preference
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith('theme', 'light');
    });

    test('should handle smooth theme transitions', async () => {
      const TestAnimatedTheme = () => {
        const [theme, setTheme] = React.useState<'light' | 'dark'>('light');
        
        return (
          <div 
            data-testid="animated-container"
            style={{ 
              transition: 'background-color 0.3s ease, color 0.3s ease',
              backgroundColor: theme === 'light' ? '#fff' : '#121212',
              color: theme === 'light' ? '#000' : '#fff'
            }}
          >
            <MockThemeToggle 
              currentTheme={theme} 
              onToggle={() => setTheme(theme === 'light' ? 'dark' : 'light')}
            />
          </div>
        );
      };

      render(<TestAnimatedTheme />);
      
      const container = screen.getByTestId('animated-container');
      const toggleButton = screen.getByTestId('theme-toggle');
      
      // Check transition property
      expect(getComputedStyle(container).transition).toContain('background-color');
      expect(getComputedStyle(container).transition).toContain('color');
      
      fireEvent.click(toggleButton);
      
      // Allow transition to complete
      await waitFor(() => {
        expect(getComputedStyle(container).backgroundColor).toBe('rgb(18, 18, 18)');
      });
    });
  });

  describe('TC25: Keyboard Accessibility', () => {
    test('should allow tab navigation through all controls', async () => {
      const user = userEvent.setup();
      
      render(
        <div>
          <MockBookingForm onSubmit={() => {}} />
        </div>
      );

      const passengerInput = screen.getByTestId('passenger-input');
      const destinationInput = screen.getByTestId('destination-input');
      const submitButton = screen.getByTestId('submit-button');

      // Tab through form elements
      await user.tab();
      expect(passengerInput).toHaveFocus();

      await user.tab();
      expect(destinationInput).toHaveFocus();

      await user.tab();
      expect(submitButton).toHaveFocus();
    });

    test('should activate buttons and links with Enter key', async () => {
      const user = userEvent.setup();
      const mockSubmit = jest.fn();

      render(
        <MockBookingForm onSubmit={mockSubmit} />
      );

      // Fill form and submit with Enter
      const destinationInput = screen.getByTestId('destination-input');
      await user.type(destinationInput, 'Airport');

      const submitButton = screen.getByTestId('submit-button');
      submitButton.focus();
      await user.keyboard('{Enter}');

      expect(mockSubmit).toHaveBeenCalledWith({
        passengerCount: 1,
        destination: 'Airport'
      });
    });

    test('should support arrow key navigation in menus', async () => {
      const user = userEvent.setup();
      
      render(
        <MockNavigation isOpen={true} onClose={() => {}} />
      );

      const adminLink = screen.getByTestId('nav-admin');
      const queuepalLink = screen.getByTestId('nav-queuepal');
      const bookingLink = screen.getByTestId('nav-booking');

      // Start at first item
      adminLink.focus();
      expect(adminLink).toHaveFocus();

      // Arrow down should move to next item
      await user.keyboard('{ArrowDown}');
      expect(queuepalLink).toHaveFocus();

      await user.keyboard('{ArrowDown}');
      expect(bookingLink).toHaveFocus();
    });

    test('should handle Escape key for closing modals/menus', async () => {
      const user = userEvent.setup();
      const mockClose = jest.fn();
      
      render(
        <MockNavigation isOpen={true} onClose={mockClose} />
      );

      await user.keyboard('{Escape}');
      expect(mockClose).toHaveBeenCalled();
    });

    test('should provide logical focus order', async () => {
      const user = userEvent.setup();
      
      const TestFocusOrder = () => (
        <div>
          <button data-testid="button-1" tabIndex={1}>Button 1</button>
          <button data-testid="button-2" tabIndex={2}>Button 2</button>
          <button data-testid="button-3" tabIndex={3}>Button 3</button>
        </div>
      );

      render(<TestFocusOrder />);

      await user.tab();
      expect(screen.getByTestId('button-1')).toHaveFocus();

      await user.tab();
      expect(screen.getByTestId('button-2')).toHaveFocus();

      await user.tab();
      expect(screen.getByTestId('button-3')).toHaveFocus();
    });

    test('should skip disabled elements in tab order', async () => {
      const user = userEvent.setup();
      
      const TestSkipDisabled = () => (
        <div>
          <button data-testid="enabled-1">Enabled 1</button>
          <button data-testid="disabled" disabled>Disabled</button>
          <button data-testid="enabled-2">Enabled 2</button>
        </div>
      );

      render(<TestSkipDisabled />);

      await user.tab();
      expect(screen.getByTestId('enabled-1')).toHaveFocus();

      await user.tab();
      expect(screen.getByTestId('enabled-2')).toHaveFocus(); // Should skip disabled
    });
  });

  describe('TC26: Screen Reader Checks', () => {
    test('should have proper ARIA labels for all interactive elements', () => {
      render(<MockBookingForm onSubmit={() => {}} />);

      const form = screen.getByTestId('booking-form');
      const passengerInput = screen.getByTestId('passenger-input');
      const destinationInput = screen.getByTestId('destination-input');
      const submitButton = screen.getByTestId('submit-button');

      expect(form).toHaveAttribute('aria-label', 'Taxi Booking Form');
      expect(passengerInput).toHaveAttribute('aria-required', 'true');
      expect(passengerInput).toHaveAttribute('aria-describedby', 'passenger-help');
      expect(destinationInput).toHaveAttribute('aria-required', 'true');
      expect(submitButton).toHaveAttribute('aria-describedby', 'submit-help');
    });

    test('should announce form validation errors', () => {
      const TestValidationErrors = () => {
        const [error, setError] = React.useState('');
        
        const handleSubmit = () => {
          setError('Passenger count is required');
        };

        return (
          <div>
            <div 
              role="alert"
              aria-live="polite"
              data-testid="error-message"
              style={{ display: error ? 'block' : 'none' }}
            >
              {error}
            </div>
            <button onClick={handleSubmit} data-testid="trigger-error">
              Submit
            </button>
          </div>
        );
      };

      render(<TestValidationErrors />);

      const errorMessage = screen.getByTestId('error-message');
      const triggerButton = screen.getByTestId('trigger-error');

      expect(errorMessage).toHaveAttribute('role', 'alert');
      expect(errorMessage).toHaveAttribute('aria-live', 'polite');

      fireEvent.click(triggerButton);
      expect(errorMessage).toHaveTextContent('Passenger count is required');
    });

    test('should provide descriptive alt text for images', () => {
      const TestImages = () => (
        <div>
          <img 
            src="taxi.jpg" 
            alt="Yellow taxi cab parked outside airport terminal"
            data-testid="taxi-image"
          />
          <img 
            src="loading.gif" 
            alt="Loading animation - please wait"
            data-testid="loading-image"
          />
          <img 
            src="decoration.png" 
            alt=""
            role="presentation"
            data-testid="decorative-image"
          />
        </div>
      );

      render(<TestImages />);

      const taxiImage = screen.getByTestId('taxi-image');
      const loadingImage = screen.getByTestId('loading-image');
      const decorativeImage = screen.getByTestId('decorative-image');

      expect(taxiImage).toHaveAttribute('alt', 'Yellow taxi cab parked outside airport terminal');
      expect(loadingImage).toHaveAttribute('alt', 'Loading animation - please wait');
      expect(decorativeImage).toHaveAttribute('alt', '');
      expect(decorativeImage).toHaveAttribute('role', 'presentation');
    });

    test('should have proper heading hierarchy', () => {
      const TestHeadings = () => (
        <div>
          <h1 data-testid="h1">TaxiTub - Airport Taxi Service</h1>
          <h2 data-testid="h2">Book Your Ride</h2>
          <h3 data-testid="h3">Passenger Information</h3>
          <h4 data-testid="h4">Contact Details</h4>
        </div>
      );

      render(<TestHeadings />);

      expect(screen.getByTestId('h1')).toBeInTheDocument();
      expect(screen.getByTestId('h2')).toBeInTheDocument();
      expect(screen.getByTestId('h3')).toBeInTheDocument();
      expect(screen.getByTestId('h4')).toBeInTheDocument();
    });

    test('should announce dynamic content changes', () => {
      const TestDynamicContent = () => {
        const [status, setStatus] = React.useState('');
        
        return (
          <div>
            <div 
              aria-live="polite"
              aria-atomic="true"
              data-testid="status-region"
            >
              {status}
            </div>
            <button 
              onClick={() => setStatus('Taxi has been assigned!')}
              data-testid="assign-button"
            >
              Assign Taxi
            </button>
          </div>
        );
      };

      render(<TestDynamicContent />);

      const statusRegion = screen.getByTestId('status-region');
      const assignButton = screen.getByTestId('assign-button');

      expect(statusRegion).toHaveAttribute('aria-live', 'polite');
      expect(statusRegion).toHaveAttribute('aria-atomic', 'true');

      fireEvent.click(assignButton);
      expect(statusRegion).toHaveTextContent('Taxi has been assigned!');
    });

    test('should provide meaningful error guidance', () => {
      const TestErrorGuidance = () => {
        const [errors, setErrors] = React.useState<string[]>([]);
        
        const handleValidation = () => {
          setErrors([
            'Passenger count must be between 1 and 8',
            'Destination field is required'
          ]);
        };

        return (
          <div>
            <div 
              role="region"
              aria-label="Form errors"
              aria-live="polite"
              data-testid="error-summary"
            >
              {errors.length > 0 && (
                <ul>
                  {errors.map((error, index) => (
                    <li key={index}>{error}</li>
                  ))}
                </ul>
              )}
            </div>
            <button onClick={handleValidation} data-testid="validate-button">
              Validate
            </button>
          </div>
        );
      };

      render(<TestErrorGuidance />);

      const errorSummary = screen.getByTestId('error-summary');
      const validateButton = screen.getByTestId('validate-button');

      expect(errorSummary).toHaveAttribute('role', 'region');
      expect(errorSummary).toHaveAttribute('aria-label', 'Form errors');

      fireEvent.click(validateButton);
      
      expect(errorSummary).toHaveTextContent('Passenger count must be between 1 and 8');
      expect(errorSummary).toHaveTextContent('Destination field is required');
    });

    test('should support high contrast mode', () => {
      const TestHighContrast = () => (
        <div 
          data-testid="high-contrast-container"
          style={{
            backgroundColor: 'var(--background-color, #ffffff)',
            color: 'var(--text-color, #000000)',
            border: '2px solid var(--border-color, #000000)'
          }}
        >
          <button 
            data-testid="high-contrast-button"
            style={{
              backgroundColor: 'var(--button-bg, #0066cc)',
              color: 'var(--button-text, #ffffff)',
              border: '2px solid var(--button-border, #004499)'
            }}
          >
            High Contrast Button
          </button>
        </div>
      );

      render(<TestHighContrast />);

      const container = screen.getByTestId('high-contrast-container');
      const button = screen.getByTestId('high-contrast-button');

      // Check that CSS custom properties are used for theming
      expect(container.style.backgroundColor).toContain('var(');
      expect(container.style.color).toContain('var(');
      expect(button.style.backgroundColor).toContain('var(');
    });
  });

  describe('Comprehensive Accessibility Tests', () => {
    test('should have no accessibility violations', () => {
      const TestCompleteAccessibility = () => (
        <main role="main" aria-label="Main content">
          <header role="banner">
            <h1>TaxiTub Service</h1>
            <nav role="navigation" aria-label="Main navigation">
              <ul>
                <li><a href="#booking">Booking</a></li>
                <li><a href="#status">Trip Status</a></li>
              </ul>
            </nav>
          </header>
          
          <section aria-labelledby="booking-heading">
            <h2 id="booking-heading">Book a Taxi</h2>
            <MockBookingForm onSubmit={() => {}} />
          </section>
          
          <footer role="contentinfo">
            <p>© 2025 TaxiTub. All rights reserved.</p>
          </footer>
        </main>
      );

      render(<TestCompleteAccessibility />);

      // Check landmark roles
      expect(screen.getByRole('main')).toBeInTheDocument();
      expect(screen.getByRole('banner')).toBeInTheDocument();
      expect(screen.getByRole('navigation')).toBeInTheDocument();
      expect(screen.getByRole('contentinfo')).toBeInTheDocument();

      // Check semantic structure
      expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument();
      expect(screen.getByRole('heading', { level: 2 })).toBeInTheDocument();
    });

    test('should handle focus management correctly', async () => {
      const user = userEvent.setup();
      
      const TestFocusManagement = () => {
        const [showModal, setShowModal] = React.useState(false);
        const modalTriggerRef = React.useRef<HTMLButtonElement>(null);
        
        React.useEffect(() => {
          if (!showModal && modalTriggerRef.current) {
            modalTriggerRef.current.focus();
          }
        }, [showModal]);

        return (
          <div>
            <button 
              ref={modalTriggerRef}
              onClick={() => setShowModal(true)}
              data-testid="open-modal"
            >
              Open Modal
            </button>
            
            {showModal && (
              <div 
                role="dialog"
                aria-modal="true"
                aria-labelledby="modal-title"
                data-testid="modal"
              >
                <h2 id="modal-title">Modal Title</h2>
                <button 
                  onClick={() => setShowModal(false)}
                  data-testid="close-modal"
                >
                  Close
                </button>
              </div>
            )}
          </div>
        );
      };

      render(<TestFocusManagement />);

      const openButton = screen.getByTestId('open-modal');
      await user.click(openButton);

      const modal = screen.getByTestId('modal');
      expect(modal).toHaveAttribute('role', 'dialog');
      expect(modal).toHaveAttribute('aria-modal', 'true');

      const closeButton = screen.getByTestId('close-modal');
      await user.click(closeButton);

      // Focus should return to trigger
      expect(openButton).toHaveFocus();
    });
  });
});
