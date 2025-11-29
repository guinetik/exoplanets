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
    showInNav: true,
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
    showInNav: true,
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
    showInNav: true,
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

export const navRoutes = routes.filter((route) => route.showInNav);
