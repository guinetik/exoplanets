import { useState, useRef, useEffect } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { navItems, type NavItem } from '../routes';
import LanguagePicker from './LanguagePicker';

export default function Navbar() {
  const { t } = useTranslation();
  const location = useLocation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [mobileExpandedDropdown, setMobileExpandedDropdown] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const toggleMenu = () => setIsMenuOpen(!isMenuOpen);
  const closeMenu = () => {
    setIsMenuOpen(false);
    setMobileExpandedDropdown(null);
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setOpenDropdown(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Check if any child route is active (for dropdown highlight)
  const isChildActive = (item: NavItem): boolean => {
    if (!item.children) return false;
    return item.children.some((child) => location.pathname === child.path);
  };

  // Render a single nav item (link or dropdown)
  const renderNavItem = (item: NavItem, index: number) => {
    if (item.children) {
      const isActive = isChildActive(item);
      return (
        <div
          key={item.labelKey}
          className="navbar-dropdown"
          ref={index === 2 ? dropdownRef : undefined}
          onMouseEnter={() => setOpenDropdown(item.labelKey)}
          onMouseLeave={() => setOpenDropdown(null)}
        >
          <button
            className={`navbar-link navbar-dropdown-trigger ${isActive ? 'navbar-link-active' : ''}`}
            onClick={() => setOpenDropdown(openDropdown === item.labelKey ? null : item.labelKey)}
            aria-expanded={openDropdown === item.labelKey}
          >
            {t(item.labelKey)}
            <ChevronIcon isOpen={openDropdown === item.labelKey} />
          </button>
          {openDropdown === item.labelKey && (
            <div className="navbar-dropdown-menu">
              {item.children.map((child) => (
                <NavLink
                  key={child.path}
                  to={child.path}
                  className={({ isActive }) =>
                    isActive ? 'navbar-dropdown-link navbar-link-active' : 'navbar-dropdown-link'
                  }
                  onClick={() => setOpenDropdown(null)}
                >
                  {t(child.labelKey)}
                </NavLink>
              ))}
            </div>
          )}
        </div>
      );
    }

    return (
      <NavLink
        key={item.path}
        to={item.path!}
        className={({ isActive }) =>
          isActive ? 'navbar-link navbar-link-active' : 'navbar-link'
        }
      >
        {t(item.labelKey)}
      </NavLink>
    );
  };

  // Render mobile nav item
  const renderMobileNavItem = (item: NavItem) => {
    if (item.children) {
      const isExpanded = mobileExpandedDropdown === item.labelKey;
      const isActive = isChildActive(item);
      return (
        <div key={item.labelKey} className="mobile-dropdown">
          <button
            className={`mobile-menu-link mobile-dropdown-trigger ${isActive ? 'navbar-link-active' : ''}`}
            onClick={() => setMobileExpandedDropdown(isExpanded ? null : item.labelKey)}
            aria-expanded={isExpanded}
          >
            {t(item.labelKey)}
            <ChevronIcon isOpen={isExpanded} />
          </button>
          {isExpanded && (
            <div className="mobile-dropdown-menu">
              {item.children.map((child) => (
                <NavLink
                  key={child.path}
                  to={child.path}
                  className={({ isActive }) =>
                    isActive ? 'mobile-dropdown-link navbar-link-active' : 'mobile-dropdown-link'
                  }
                  onClick={closeMenu}
                >
                  {t(child.labelKey)}
                </NavLink>
              ))}
            </div>
          )}
        </div>
      );
    }

    return (
      <NavLink
        key={item.path}
        to={item.path!}
        className={({ isActive }) =>
          isActive ? 'mobile-menu-link navbar-link-active' : 'mobile-menu-link'
        }
        onClick={closeMenu}
      >
        {t(item.labelKey)}
      </NavLink>
    );
  };

  return (
    <nav className="navbar">
      <div className="navbar-inner">
        {/* Brand */}
        <NavLink to="/" className="navbar-brand" onClick={closeMenu}>
          Exoplanets
        </NavLink>

        {/* Desktop Menu */}
        <div className="navbar-menu">
          {navItems.map((item, index) => renderNavItem(item, index))}
        </div>

        {/* Actions */}
        <div className="navbar-actions">
          <LanguagePicker />

          {/* Mobile Menu Button */}
          <button
            className="mobile-menu-button"
            onClick={toggleMenu}
            aria-label="Toggle menu"
            aria-expanded={isMenuOpen}
          >
            {isMenuOpen ? (
              <CloseIcon />
            ) : (
              <MenuIcon />
            )}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMenuOpen && (
        <div className="mobile-menu">
          <div className="mobile-menu-inner">
            {navItems.map((item) => renderMobileNavItem(item))}
          </div>
        </div>
      )}
    </nav>
  );
}

function MenuIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <line x1="3" y1="12" x2="21" y2="12" />
      <line x1="3" y1="6" x2="21" y2="6" />
      <line x1="3" y1="18" x2="21" y2="18" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}

function ChevronIcon({ isOpen }: { isOpen: boolean }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={`chevron-icon ${isOpen ? 'chevron-open' : ''}`}
    >
      <polyline points="6 9 12 15 18 9" />
    </svg>
  );
}
