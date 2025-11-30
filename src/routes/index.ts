import { lazy } from 'react';

const Home = lazy(() => import('./Home'));
const Stars = lazy(() => import('./Stars'));
const Star = lazy(() => import('./Star'));
const Planets = lazy(() => import('./Planets'));
const Planet = lazy(() => import('./Planet'));
const Habitability = lazy(() => import('./Habitability'));
const Vote = lazy(() => import('./Vote'));
const Apod = lazy(() => import('./Apod'));
const About = lazy(() => import('./About'));
const Tour = lazy(() => import('./Tour'));

export interface RouteConfig {
  path: string;
  element: React.LazyExoticComponent<React.ComponentType>;
  labelKey: string;
  showInNav: boolean;
}

/** Navigation item - can be a link or a dropdown with children */
export interface NavItem {
  labelKey: string;
  path?: string;
  children?: { labelKey: string; path: string }[];
}

export const routes: RouteConfig[] = [
  {
    path: '/',
    element: Home,
    labelKey: 'nav.home',
    showInNav: true,
  },
  {
    path: '/tour',
    element: Tour,
    labelKey: 'nav.tour',
    showInNav: true,
  },
  {
    path: '/stars',
    element: Stars,
    labelKey: 'nav.stars',
    showInNav: false, // Now part of Explore dropdown
  },
  {
    path: '/stars/:starId',
    element: Star,
    labelKey: 'nav.stars',
    showInNav: false,
  },
  {
    path: '/planets',
    element: Planets,
    labelKey: 'nav.planets',
    showInNav: false, // Now part of Explore dropdown
  },
  {
    path: '/planets/:planetId',
    element: Planet,
    labelKey: 'nav.planets',
    showInNav: false,
  },
  {
    path: '/habitability',
    element: Habitability,
    labelKey: 'nav.habitability',
    showInNav: false, // Now part of Explore dropdown
  },
  {
    path: '/vote',
    element: Vote,
    labelKey: 'nav.vote',
    showInNav: true,
  },
  {
    path: '/apod',
    element: Apod,
    labelKey: 'nav.apod',
    showInNav: true,
  },
  {
    path: '/about',
    element: About,
    labelKey: 'nav.about',
    showInNav: true,
  },
];

/** Navigation structure with dropdowns */
export const navItems: NavItem[] = [
  { labelKey: 'nav.home', path: '/' },
  { labelKey: 'nav.tour', path: '/tour' },
  {
    labelKey: 'nav.explore',
    children: [
      { labelKey: 'nav.stars', path: '/stars' },
      { labelKey: 'nav.planets', path: '/planets' },
      { labelKey: 'nav.habitability', path: '/habitability' },
    ],
  },
  { labelKey: 'nav.vote', path: '/vote' },
  { labelKey: 'nav.apod', path: '/apod' },
  { labelKey: 'nav.about', path: '/about' },
];

export const navRoutes = routes.filter((route) => route.showInNav);
